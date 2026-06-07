import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { X, Heart, Check, Volume2, Frown, Trophy, ChevronRight, Mic, MicOff } from 'lucide-react';
import { lookupWords } from '../lib/dictionaryLookup';
import { getConceptsForLesson } from '../lib/concepts';
import { useProgress } from '../context/ProgressContext';
import { useUser } from '../context/UserContext';
import { getNodeByLessonId, getLessonBlueprint, getExercisesGenerated, getNextNode, getNodeRoute } from '../lib/db';
import speak, { preloadSpeak, scheduleSpeak, clearSpeakQueue } from '../utils/speak';
import { startPCMRecording } from '../utils/recordPCM';
import { addItemsFromLesson, recordReview } from '../lib/srs';
import { recordExerciseResult, extractItemIds } from '../lib/wordGrades';
import { getDB } from '../lib/db';
import { loadSettings } from '../lib/settings';
import { fireNotification } from '../context/NotificationContext';
import { playSuccess, playError } from '../utils/sound';
import SoundButton from './SoundButton';
import { MCQOptions, MatchPairs, FeedbackBanner, ProgressBar, buildFillBlankSentence, getFillBlankCorrectSentence } from './Exercise';
import useQuizSession, { getCompletedSentenceAudio } from '../hooks/useQuizSession';
import { DEFAULT_LEARNER_MODE, getProgressMode } from '../data/learnerModes';
import { useT } from '../lib/i18n';
import './LessonGame.css';

function scoreColor(v) {
    if (v == null) return 'var(--text-muted)';
    if (v >= 80) return 'var(--success-color)';
    if (v >= 60) return 'var(--accent-gold, #FFD166)';
    return 'var(--danger-color)';
}
function scoreBg(v, errorType) {
    if (errorType === 'Omission') return 'rgba(239, 71, 111, 0.15)';
    if (errorType === 'Insertion') return 'rgba(255, 209, 102, 0.15)';
    if (v == null) return 'var(--surface-color-light)';
    if (v >= 80) return 'rgba(6, 214, 160, 0.18)';
    if (v >= 60) return 'rgba(255, 209, 102, 0.18)';
    return 'rgba(239, 71, 111, 0.18)';
}
function scoreFg(v, errorType) {
    if (errorType === 'Omission' || errorType === 'Insertion') return 'var(--text-main)';
    return scoreColor(v);
}

function collectExerciseAudioTexts(exercise) {
    const prompt = exercise?.prompt;
    if (!prompt) return [];

    const texts = [
        prompt.audio_text,
        prompt.source_text_vi,
        prompt.target_vi,
        prompt.answer_vi,
        prompt.answer_tokens?.join(' '),
        prompt.audio_vi,
    ];

    if (Array.isArray(prompt.tokens)) texts.push(...prompt.tokens);
    if (Array.isArray(prompt.choices_vi)) texts.push(...prompt.choices_vi);
    if (Array.isArray(prompt.pairs)) {
        prompt.pairs.forEach(pair => texts.push(pair.vi));
    }

    if (exercise.exercise_type === 'fill_blank' && Array.isArray(prompt.choices_vi)) {
        prompt.choices_vi.forEach(choice => texts.push(buildFillBlankSentence(prompt, choice)));
    }

    return [...new Set(texts.filter(text => typeof text === 'string' && text.trim().length > 0))];
}

const LessonGame = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const t = useT();
    const progressCtx = useProgress();
    const { userProfile } = useUser();
    const currentMode = userProfile?.learnerMode || DEFAULT_LEARNER_MODE;
    const progressMode = getProgressMode(currentMode);

    const [exercises, setExercises] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const testMode = loadSettings().testMode === true;
    const [isFinished, setIsFinished] = useState(false);

    // Score tracking
    const [score, setScore] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);

    // Node tracking
    const [nodeId, setNodeId] = useState(null);
    const [lessonWords, setLessonWords] = useState([]);

    const [showQuitConfirm, setShowQuitConfirm] = useState(false);

    // Hearts disabled (was from DongContext, now simplified)
    const hearts = Infinity;

    // Reorder exercises
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);
    const [dropTargetIndex, setDropTargetIndex] = useState(null);

    // Lesson blueprint (for goal banner + summary)
    const [lessonBlueprint, setLessonBlueprint] = useState(null);

    // Word intro phase
    const [introSteps, setIntroSteps] = useState([]);
    const [currentIntroStep, setCurrentIntroStep] = useState(0);
    const [showWordIntro, setShowWordIntro] = useState(true);
    const [dictInfo, setDictInfo] = useState(new Map());

    // Next node navigation
    const [nextNodeRoute, setNextNodeRoute] = useState(null);
    const [nextNodeLabel, setNextNodeLabel] = useState('');

    // Speak Sentence
    const [isRecording, setIsRecording] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(true);
    const [speechError, setSpeechError] = useState('');
    const recognitionRef = useRef(null);
    const speechStopIntentionalRef = useRef(false);

    // Pronunciation assessment
    const [pronAssessing, setPronAssessing] = useState(false);
    const [pronResult, setPronResult] = useState(null); // { scores, words[], recognized }
    const pcmRecorderRef = useRef(null);

    // TappableText hint tooltip
    const [activeHintIdx, setActiveHintIdx] = useState(null);


    const rewardGivenRef = useRef(false);

    const stopSpeechRecognition = React.useCallback(() => {
        speechStopIntentionalRef.current = true;
        const recognition = recognitionRef.current;
        if (recognition) {
            recognition.onresult = null;
            recognition.onend = null;
            recognition.onerror = null;
            try {
                recognition.abort();
            } catch {
                try { recognition.stop(); } catch { /* already stopped */ }
            }
        }
        recognitionRef.current = null;
        // Also tear down any in-progress PCM recording (no upload).
        const recorder = pcmRecorderRef.current;
        if (recorder) {
            pcmRecorderRef.current = null;
            recorder.stop().catch(() => {});
        }
        setIsRecording(false);
        setPronAssessing(false);
    }, []);

    const stopLessonAudio = React.useCallback(() => {
        clearSpeakQueue({ stopCurrent: true });
    }, []);

    const currentEx = exercises[currentIndex];
    const progress = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0;

    const {
        selectedAnswer,
        setSelectedAnswer,
        isChecking,
        isCorrect,
        orderedTokens,
        setOrderedTokens,
        availableTokens,
        typedAnswer,
        setTypedAnswer,
        speechResult,
        setSpeechResult,
        fuzzyHint,
        imageError,
        setImageError,
        resetSessionState,
        checkCurrentExercise,
        canCheck: canCheckExercise,
        completeMatch,
    } = useQuizSession({
        currentExercise: currentEx,
        resetKey: currentIndex,
        onExerciseReset: React.useCallback((exercise) => {
            if (exercise?.exercise_type !== 'speak_sentence') {
                stopSpeechRecognition();
            }

            stopLessonAudio();
            setActiveHintIdx(null);

            if (exercise && ['reorder_words', 'translation_word_bank'].includes(exercise.exercise_type)) {
                setDraggedItemIndex(null);
                setDropTargetIndex(null);
            }

            preloadSpeak(collectExerciseAudioTexts(exercise));

            if (exercise?.exercise_type === 'speak_sentence') {
                setIsRecording(false);
                setSpeechError('');
                setPronResult(null);
                setPronAssessing(false);
            }
        }, [stopLessonAudio, stopSpeechRecognition]),
    });

    useEffect(() => {
        stopLessonAudio();
        stopSpeechRecognition();
        // Reset all state on every navigation (even same lessonId)
        setCurrentIndex(0);
        setIsFinished(false);
        setScore(0);
        setCurrentStreak(0);
        setBestStreak(0);
        setIsRecording(false);
        resetSessionState();
        rewardGivenRef.current = false;

        // Determine current session number for this lesson's node
        const node = getNodeByLessonId(lessonId);
        const session = node ? progressCtx.getNodeSessionCount(node.id, progressMode) : 0;

        const loaded = getExercisesGenerated(lessonId, session);
        if (loaded.length === 0) {
            console.warn(`No exercises found for ${lessonId}`);
        }
        setExercises(loaded);
        preloadSpeak(loaded.flatMap(collectExerciseAudioTexts));

        // Find the roadmap node for this lesson
        if (node) {
            setNodeId(node.id);
            // Find next node for post-lesson navigation
            const next = getNextNode(node.id);
            if (next) {
                setNextNodeRoute(getNodeRoute(next));
                const label = next.label || (next.lesson_id ? 'Next Lesson' : 'Next');
                setNextNodeLabel(label);
            }
        }

        // Load lesson words for summary + dictionary lookup (session-aware: only this session's new words)
        const blueprint = getLessonBlueprint(lessonId, session);
        if (blueprint) {
            setLessonBlueprint(blueprint);
            setLessonWords(blueprint.words);

            // Build intro steps — teaching concepts first, then vocab cards
            const steps = [];
            getConceptsForLesson(lessonId).forEach(concept => {
                steps.push({ type: 'concept', concept });
            });
            blueprint.words.forEach(word => {
                steps.push({ type: 'vocab', word });
            });
            setIntroSteps(steps);
            setShowWordIntro(steps.length > 0);
            setCurrentIntroStep(0);
            const viTexts = blueprint.words.map(w => w.vietnamese);
            preloadSpeak(viTexts);
            lookupWords(viTexts).then(info => setDictInfo(info));
        } else {
            setShowWordIntro(false);
        }

        // Check speech recognition support
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        setSpeechSupported(!!SR);
        return () => {
            stopSpeechRecognition();
            stopLessonAudio();
        };
    }, [lessonId, location.key, resetSessionState, stopSpeechRecognition, stopLessonAudio]);

    // Auto-play audio for exercises that present Vietnamese text
    useEffect(() => {
        if (!currentEx) return;
        const { exercise_type, prompt } = currentEx;
        if (exercise_type === 'listen_type' || exercise_type === 'listen_choose') {
            if (prompt.audio_text) scheduleSpeak(prompt.audio_text, 100);
        } else if (exercise_type === 'mcq_translate_to_en') {
            if (prompt.source_text_vi) scheduleSpeak(prompt.source_text_vi, 100);
        }
    }, [currentIndex]);

    // Auto-play audio when a new word is introduced
    useEffect(() => {
        if (showWordIntro && introSteps.length > 0) {
            const step = introSteps[currentIntroStep];
            if (step?.type === 'vocab' && step.word?.vietnamese) {
                scheduleSpeak(step.word.vietnamese, 100);
            }
        }
    }, [currentIntroStep, showWordIntro]);

    // Complete node and add words to SRS when lesson finishes
    useEffect(() => {
        if (isFinished && !rewardGivenRef.current) {
            stopLessonAudio();
            rewardGivenRef.current = true;

            if (nodeId) {
                progressCtx.completeNode(nodeId, { mode: progressMode });
            }

            // Add words to SRS for review later
            addItemsFromLesson(lessonId);

            // 🔔 Notify: lesson complete
            setTimeout(() => fireNotification('lesson_complete'), 400);
            setTimeout(() => fireNotification('coins_earned'), 2000);
        }
    }, [isFinished]);

    const handlePlayAudio = (text) => {
        if (text) speak(text);
    };

    // 🔔 Notify on answer streak milestones
    const notifiedStreakRef = useRef(0);
    useEffect(() => {
        if (currentStreak === 3 && notifiedStreakRef.current < 3) {
            notifiedStreakRef.current = 3;
            fireNotification('streak_3');
        } else if (currentStreak === 5 && notifiedStreakRef.current < 5) {
            notifiedStreakRef.current = 5;
            fireNotification('streak_5');
        }
    }, [currentStreak]);

    // 🔔 Notify on best streak achievement
    const notifiedBestRef = useRef(false);
    useEffect(() => {
        if (bestStreak >= 5 && !notifiedBestRef.current) {
            notifiedBestRef.current = true;
            fireNotification('achievement_tonemaster');
        }
    }, [bestStreak]);

    // Reorder: tap word in bank → add to answer line
    const handleWordBankClick = (word) => {
        if (isChecking) return;
        setOrderedTokens([...orderedTokens, word]);
    };

    // Reorder: tap word in answer line → remove it
    const handleRemoveOrderedWord = (index) => {
        if (isChecking) return;
        const newTokens = [...orderedTokens];
        newTokens.splice(index, 1);
        setOrderedTokens(newTokens);
    };

    // Drag-to-reorder within the answer line
    const onDragStart = (e, index) => {
        if (isChecking) { e.preventDefault(); return; }
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };
    const onDragOver = (e, index) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const mid = rect.x + rect.width / 2;
        const newIdx = e.clientX < mid ? index : index + 1;
        if (dropTargetIndex !== newIdx) setDropTargetIndex(newIdx);
    };
    const onDrop = (e) => {
        e.preventDefault();
        if (draggedItemIndex === null || dropTargetIndex === null) return;
        const arr = [...orderedTokens];
        const [item] = arr.splice(draggedItemIndex, 1);
        let finalIdx = dropTargetIndex;
        if (draggedItemIndex < dropTargetIndex) finalIdx -= 1;
        arr.splice(finalIdx, 0, item);
        setOrderedTokens(arr);
        setDraggedItemIndex(null);
        setDropTargetIndex(null);
    };
    const onDragEnd = () => { setDraggedItemIndex(null); setDropTargetIndex(null); };

    // Pronunciation-assessment recorder. PCM is uploaded to /api/pronunciation
    // for tone-aware scoring. Browser STT runs in parallel as a tier-2 fallback
    // — if Azure fails, we still have a transcript to grade against.
    const handleSpeechRecord = async () => {
        if (isRecording && pcmRecorderRef.current) {
            const recorder = pcmRecorderRef.current;
            pcmRecorderRef.current = null;
            // Stop the parallel browser STT (will fire onend; transcript already
            // captured into speechResult via onresult).
            const recognition = recognitionRef.current;
            speechStopIntentionalRef.current = true;
            if (recognition) {
                try { recognition.stop(); } catch { /* already stopped */ }
            }
            setIsRecording(false);
            setPronAssessing(true);
            try {
                const blob = await recorder.stop();
                if (!blob || blob.size < 1024) {
                    setSpeechError('No speech detected. Try again or type below.');
                    setPronAssessing(false);
                    return;
                }
                const refText = currentEx?.prompt?.target_vi || '';
                const r = await fetch(`/api/pronunciation?text=${encodeURIComponent(refText)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'audio/wav' },
                    body: blob,
                });
                if (!r.ok) {
                    let detail = '';
                    try {
                        const errorPayload = await r.json();
                        detail = errorPayload.detail || errorPayload.error || '';
                    } catch {
                        detail = await r.text().catch(() => '');
                    }
                    throw new Error(detail || `HTTP ${r.status}`);
                }
                const data = await r.json();
                setPronResult(data);
                setSpeechResult(prev => data.recognized || prev || '');
                if (data.status !== 'Success') {
                    setSpeechError('Could not score that take. Try again or type below.');
                }
            } catch (err) {
                console.warn('Pronunciation request failed, using browser STT result:', err.message);
                // No setSpeechError — if browser STT got a transcript, the user
                // can still submit. Only show an error if we have nothing.
                setSpeechResult(prev => {
                    if (!prev) {
                        setSpeechError('Scoring failed. Try again or type below.');
                    } else {
                        setSpeechError('Azure scoring failed, so this attempt will use text matching.');
                    }
                    return prev;
                });
            } finally {
                setPronAssessing(false);
            }
            return;
        }

        setSpeechError('');
        setPronResult(null);
        setSpeechResult('');
        try {
            const recorder = await startPCMRecording();
            pcmRecorderRef.current = recorder;
            setIsRecording(true);
            // Start browser STT in parallel as fallback transcript source.
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SR) {
                speechStopIntentionalRef.current = false;
                const recognition = new SR();
                recognition.lang = 'vi-VN';
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;
                recognition.onresult = (event) => {
                    const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
                    setSpeechResult(transcript);
                };
                recognition.onend = () => { recognitionRef.current = null; };
                recognition.onerror = () => { recognitionRef.current = null; };
                try {
                    recognition.start();
                    recognitionRef.current = recognition;
                } catch { /* not critical — Azure is primary */ }
            }
        } catch (err) {
            console.warn('Mic access failed:', err.message);
            if (err.name === 'NotAllowedError') {
                setSpeechSupported(false);
                setSpeechError('Microphone access denied. Please allow mic access or type below.');
            } else {
                setSpeechError('Could not start microphone. Type instead.');
            }
        }
    };


    const handleCheck = () => {
        if (!currentEx) return;
        if (currentEx.exercise_type === 'speak_sentence') {
            stopSpeechRecognition();
        }

        const result = checkCurrentExercise({ pronunciationResult: pronResult });
        if (!result.handled) return;
        const { correct } = result;

        // Record per-word grading + SRS review
        try {
            const db = getDB();
            const testedItemIds = extractItemIds(currentEx, db);
            if (testedItemIds.length > 0) {
                recordExerciseResult(currentEx.exercise_type, testedItemIds, correct);
                for (const itemId of testedItemIds) {
                    recordReview(itemId, correct);
                }
            }
        } catch (e) {
            // Don't let grading errors break the lesson flow
            console.warn('Word grading error:', e);
        }

        if (correct) {
            playSuccess();
            const completedSentence = getCompletedSentenceAudio(currentEx);
            if (completedSentence) scheduleSpeak(completedSentence, 100);
            setScore(s => s + 1);
            const newStreak = currentStreak + 1;
            setCurrentStreak(newStreak);
            if (newStreak > bestStreak) setBestStreak(newStreak);
        } else {
            playError();
            setCurrentStreak(0);
            notifiedStreakRef.current = 0; // reset streak notif gate
            if (!testMode) {
                progressCtx.loseHeart();
                // 🔔 Notify: lost a heart
                setTimeout(() => fireNotification('lost_heart'), 300);
            }
        }
    };

    const handleSkip = () => {
        if (!testMode) return;
        stopSpeechRecognition();
        setScore(s => s + 1);
        if (currentIndex < exercises.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    const handleNext = () => {
        stopSpeechRecognition();
        if (hearts === 0) {
            navigate('/', { state: { tab: 'study' } });
            return;
        }

        if (currentIndex < exercises.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    const canCheck = () => {
        return canCheckExercise({
            speechBlocked: isRecording || pronAssessing,
            pronunciationResult: pronResult,
        });
    };

    // Enter key to trigger Check / Continue / retention screens
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Enter') return;
            if (isFinished || showQuitConfirm) return;
            if (isChecking) { handleNext(); return; }
            if (canCheck()) handleCheck();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (showQuitConfirm) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', position: 'fixed', inset: 0, width: '100%', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', justifyContent: 'center', textAlign: 'center', zIndex: 100 }}>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 'var(--app-edge-top) var(--app-edge-right) var(--app-edge-gap) var(--app-edge-left)',
                }}>
                    <Frown size={100} color="var(--text-muted)" strokeWidth={1.5} style={{ marginBottom: 24 }} />
                    <h2 style={{ fontSize: 22, marginBottom: 8, lineHeight: 1.4 }}>Are you sure?</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>You're almost done with this lesson!</p>
                </div>
                <div style={{
                    padding: '24px var(--app-edge-right) calc(24px + var(--safe-area-bottom-effective)) var(--app-edge-left)',
                    borderTop: '2px solid var(--border-color)',
                    backgroundColor: 'var(--surface-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    minHeight: 'calc(140px + var(--safe-area-bottom-effective))',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <button className="ghost" style={{ color: 'var(--danger-color)', fontWeight: 700, width: '100%' }} onClick={() => navigate('/', { state: { tab: 'study' } })}>
                        QUIT
                    </button>
                    <SoundButton className="primary shadow-lg" style={{ width: '100%', fontSize: 18 }} onClick={() => setShowQuitConfirm(false)}>
                        KEEP LEARNING
                    </SoundButton>
                </div>
            </div>
        );
    }

    if (exercises.length === 0 && !showWordIntro) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', padding: 24 }}>
                <h2>No exercises found for this lesson.</h2>
                <button className="primary mt-4" onClick={() => navigate('/', { state: { tab: 'study' } })}>Return to Roadmap</button>
            </div>
        );
    }

    // --- Word Introduction Phase ---
    if (showWordIntro && introSteps.length > 0) {
        const step = introSteps[currentIntroStep];
        const introProgress = ((currentIntroStep + 1) / introSteps.length) * 100;

        const handleNext = () => {
            if (currentIntroStep < introSteps.length - 1) {
                setCurrentIntroStep(prev => prev + 1);
            } else {
                setShowWordIntro(false);
            }
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
                {/* Top Bar */}
                <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="ghost" onClick={() => setShowWordIntro(false)} style={{ padding: 8 }}>
                        <X size={24} color="var(--text-muted)" />
                    </button>
                    <div style={{ flex: 1, height: 16, backgroundColor: 'var(--surface-color)', borderRadius: 15, overflow: 'hidden' }}>
                        <div style={{ width: `${introProgress}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.3s ease-out', borderRadius: 15 }} />
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>{currentIntroStep + 1}/{introSteps.length}</span>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 24px', overflowY: 'auto' }}>
                    {step.type === 'concept' && (
                        <div style={{ width: '100%', maxWidth: 400, backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', padding: 32, border: '2px solid var(--border-color)' }}>
                            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--primary-color)', fontWeight: 700, marginBottom: 16 }}>Key Idea</div>
                            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, lineHeight: 1.3 }}>{step.concept.title}</div>
                            <div style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.concept.body}</div>
                            {step.concept.examples?.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
                                    {step.concept.examples.map((ex, i) => (
                                        <button
                                            key={i}
                                            className="ghost"
                                            onClick={() => speak(ex.vi)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 14px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: '100%', textAlign: 'left' }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Volume2 size={18} color="var(--secondary-color)" />
                                                <span style={{ fontSize: 18, fontWeight: 700 }}>{ex.vi}</span>
                                            </span>
                                            {ex.en && <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{ex.en}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {step.type === 'vocab' && (
                        <div style={{ width: '100%', maxWidth: 400, backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', padding: 32, textAlign: 'center', border: '2px solid var(--border-color)' }}>
                            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--secondary-color)', fontWeight: 700, marginBottom: 16 }}>New Word</div>
                            <div style={{ fontSize: 40, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>{step.word.vietnamese}</div>
                            <button className="ghost" onClick={() => speak(step.word.vietnamese)} style={{ margin: '0 auto 16px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--secondary-color)', fontSize: 14 }}>
                                <Volume2 size={20} /> Listen
                            </button>
                            <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '0 -16px 16px' }} />
                            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--primary-color)', marginBottom: 8 }}>{step.word.english}</div>
                            {(() => {
                                const dict = dictInfo.get(step.word.vietnamese);
                                return dict && (
                                    <>
                                        {dict.definition && dict.definition !== step.word.english && (
                                            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{dict.definition}</div>
                                        )}
                                        {dict.tags?.length > 0 && (
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
                                                {[...new Set(dict.tags)].slice(0, 3).map((tag, i) => (
                                                    <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(255,209,102,0.15)', color: 'var(--primary-color)', fontWeight: 600 }}>{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Bottom navigation */}
                <div style={{ padding: '24px 16px', borderTop: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)', minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <SoundButton
                        className="primary shadow-lg"
                        style={{ width: '100%', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56 }}
                        onClick={handleNext}
                    >
                        {currentIntroStep < introSteps.length - 1 ? t('continue_upper') : t('start_upper')} <ChevronRight size={20} />
                    </SoundButton>
                </div>
            </div>
        );
    }

    if (isFinished) {
        const ACCENT = '#FFB703';
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'var(--bg-color)', color: 'var(--text-main)',
                padding: '40px 24px', gap: 24,
            }}>
                {/* Trophy */}
                <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    backgroundColor: `${ACCENT}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Trophy size={40} color={ACCENT} fill={ACCENT} />
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, textAlign: 'center' }}>
                    {t('lesson_complete')}
                </h2>

                <div style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                    <strong style={{ color: ACCENT }}>{lessonBlueprint?.title || lessonId}</strong>
                    <br />{t('you_scored').replace('{score}', score).replace('{total}', exercises.length)}
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '12px 20px', borderRadius: 12, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: ACCENT }}>{score}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{t('stat_correct')}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '12px 20px', borderRadius: 12, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>+10</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{t('stat_coins')}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '12px 20px', borderRadius: 12, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#EF4444' }}>{hearts === Infinity ? '∞' : hearts}/{5}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{t('stat_hearts')}</div>
                    </div>
                </div>

                {/* Words learned */}
                {lessonWords.length > 0 && (
                    <div style={{ width: '100%', maxWidth: 360, textAlign: 'left' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 8 }}>{t('words_learned')}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {lessonWords.map((w, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', backgroundColor: 'var(--surface-color)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>{w.vietnamese}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{w.english}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                    {nextNodeRoute && (
                        <SoundButton
                            onClick={() => navigate(nextNodeRoute)}
                            style={{
                                width: '100%', padding: '16px 24px', borderRadius: 14,
                                border: 'none', cursor: 'pointer',
                                backgroundColor: ACCENT, color: '#fff',
                                fontWeight: 800, fontSize: 16,
                                boxShadow: '0 4px 0 #B03E2D',
                            }}
                        >
                            {nextNodeLabel || t('next_lesson_upper')}
                        </SoundButton>
                    )}
                    <SoundButton
                        className="ghost"
                        style={{ width: '100%', fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}
                        onClick={() => navigate('/', { state: { tab: 'study' } })}
                    >
                        {t('back_to_roadmap_upper')}
                    </SoundButton>
                </div>
            </div>
        );
    }

    const getAudioText = () => {
        if (!currentEx) return '';
        const p = currentEx.prompt;
        if (p.target_vi) return p.target_vi;
        if (p.audio_text) return p.audio_text;
        if (p.answer_vi) return p.answer_vi;
        return '';
    };

    // ── TappableText: tap Vietnamese words to see English hints ──
    const tokenizeWithHints = (text, hints) => {
        if (!text || !hints) return [{ text }];
        // Sort hint keys by length descending (match multi-word phrases first)
        const keys = Object.keys(hints).sort((a, b) => b.length - a.length);
        const tokens = [];
        let remaining = text;
        while (remaining.length > 0) {
            let matched = false;
            const lowerRemaining = remaining.toLowerCase();
            for (const key of keys) {
                if (lowerRemaining.startsWith(key)) {
                    tokens.push({ text: remaining.slice(0, key.length), hint: hints[key] });
                    remaining = remaining.slice(key.length);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                // Take one character (or whitespace chunk)
                const ws = remaining.match(/^\s+/);
                if (ws) {
                    tokens.push({ text: ws[0] });
                    remaining = remaining.slice(ws[0].length);
                } else {
                    // Take chars until next space or hint match
                    let end = 1;
                    while (end < remaining.length) {
                        if (/\s/.test(remaining[end])) break;
                        const lr = remaining.toLowerCase().slice(end);
                        if (keys.some(k => lr.startsWith(k))) break;
                        end++;
                    }
                    tokens.push({ text: remaining.slice(0, end) });
                    remaining = remaining.slice(end);
                }
            }
        }
        return tokens;
    };

    const TappableText = ({ text, hints }) => {
        if (!hints || !text) return <span>{text}</span>;
        const tokens = tokenizeWithHints(text, hints);
        return (
            <span style={{ position: 'relative' }}>
                {tokens.map((tok, i) => tok.hint ? (
                    <span key={i}
                        onClick={(e) => { e.stopPropagation(); setActiveHintIdx(activeHintIdx === `${text}-${i}` ? null : `${text}-${i}`); speak(tok.text); }}
                        style={{
                            borderBottom: '1px dashed var(--text-muted)',
                            cursor: 'pointer',
                            position: 'relative',
                        }}>
                        {tok.text}
                        {activeHintIdx === `${text}-${i}` && (
                            <span style={{
                                position: 'absolute', bottom: '100%', left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'var(--surface-color)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 8, padding: '4px 10px',
                                fontSize: 13, color: 'var(--text-muted)',
                                whiteSpace: 'nowrap', zIndex: 10,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            }}>
                                {tok.hint}
                            </span>
                        )}
                    </span>
                ) : <span key={i}>{tok.text}</span>)}
            </span>
        );
    };

    const renderExercise = () => {
        if (!currentEx) return null;

        const { exercise_type, prompt } = currentEx;
        const audioText = getAudioText();
        const hints = currentEx.wordHints || null;

        return (
            <div className="lesson-game__exercise" data-exercise-type={exercise_type}>
                <h2 className="lesson-game__instruction">{prompt.instruction}</h2>

                {/* Question Prompt Area */}
                {exercise_type !== 'picture_choice' && exercise_type !== 'speak_sentence' && exercise_type !== 'match_pairs' && (
                    <div className="lesson-game__prompt-area">
                        {['listen_choose', 'listen_type'].includes(exercise_type) ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'center' }}>
                                <button
                                    className="secondary"
                                    style={{ width: 100, height: 100, borderRadius: 20, color: 'var(--secondary-color)', borderColor: 'var(--secondary-color)', boxShadow: '0 5px 0 var(--secondary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => handlePlayAudio(audioText)}
                                >
                                    <Volume2 size={48} />
                                </button>
                                {exercise_type === 'listen_type' && (
                                    <button
                                        className="secondary"
                                        style={{ width: 56, height: 56, borderRadius: 14, color: 'var(--text-muted)', borderColor: 'var(--border-color)', boxShadow: '0 3px 0 var(--border-color)', fontSize: 24 }}
                                        onClick={() => speak(audioText, 0.7)}
                                    >
                                        🐢
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{ flex: 1, padding: 18, backgroundColor: 'var(--surface-color)', borderRadius: 16, border: '2px solid var(--border-color)' }}>
                                <span style={{ fontSize: 20, fontWeight: 500 }}>
                                    {prompt.source_text_vi ? <TappableText text={prompt.source_text_vi} hints={hints} />
                                        : prompt.source_text_en || prompt.template_vi || "Translate this"}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Response Area */}
                <div
                    className="lesson-game__response-area"
                    data-compact={exercise_type === 'picture_choice' || exercise_type === 'speak_sentence'}
                >

                    {/* Picture Choice — image + MCQ */}
                    {exercise_type === 'picture_choice' && (
                        <>
                            <div style={{ width: '100%', maxWidth: 300, margin: '0 auto 16px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
                                {prompt.image_url && !imageError ? (
                                    <img
                                        src={prompt.image_url}
                                        alt=""
                                        style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
                                        {prompt.emoji_fallback || '?'}
                                    </div>
                                )}
                            </div>
                            {(prompt.choices_vi || []).map((choice, idx) => (
                                <button
                                    key={idx}
                                    className="secondary"
                                    style={{
                                        width: '100%', justifyContent: 'flex-start', padding: '16px 20px', fontSize: 17, borderRadius: 'var(--radius-md)',
                                        borderColor: selectedAnswer === choice ? 'var(--lesson-selected-border)' : 'var(--border-color)',
                                        backgroundColor: selectedAnswer === choice ? 'var(--lesson-selected-fill)' : 'transparent',
                                        color: selectedAnswer === choice ? 'var(--lesson-selected-border)' : 'var(--text-main)',
                                        boxShadow: selectedAnswer === choice ? '0 2px 0 var(--lesson-selected-border)' : '0 2px 0 var(--border-color)'
                                    }}
                                    onClick={() => !isChecking && setSelectedAnswer(choice)}
                                    disabled={isChecking}
                                >
                                    {choice}
                                </button>
                            ))}
                        </>
                    )}

                    {/* Listen & Type — text input */}
                    {exercise_type === 'listen_type' && (
                        <input
                            type="text"
                            value={typedAnswer}
                            onChange={(e) => setTypedAnswer(e.target.value)}
                            placeholder="Type what you hear..."
                            disabled={isChecking}
                            autoFocus
                            style={{
                                width: '100%', padding: 16, fontSize: 18, borderRadius: 'var(--radius-md)',
                                border: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)',
                                color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box'
                            }}
                            onFocus={(e) => { e.target.style.borderColor = 'var(--secondary-color)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                        />
                    )}

                    {/* Speak Sentence — display text + record */}
                    {exercise_type === 'speak_sentence' && (
                        <>
                            <div style={{
                                fontSize: 24, fontWeight: 700, textAlign: 'center', padding: 24,
                                backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                                border: '2px solid var(--border-color)', lineHeight: 1.5
                            }}>
                                <TappableText text={prompt.target_vi} hints={hints} />
                            </div>

                            <button
                                className="ghost"
                                onClick={() => speak(prompt.target_vi)}
                                style={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--secondary-color)', fontSize: 14 }}
                            >
                                <Volume2 size={20} /> Listen first
                            </button>

                            {speechSupported && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                    <button
                                        className={isRecording ? 'primary' : 'secondary'}
                                        style={{
                                            width: 80, height: 80, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            borderColor: isRecording ? 'var(--danger-color)' : 'var(--secondary-color)',
                                            backgroundColor: isRecording ? 'rgba(239, 71, 111, 0.15)' : 'transparent',
                                            boxShadow: isRecording ? '0 4px 0 var(--danger-color)' : '0 4px 0 var(--secondary-color)',
                                            animation: isRecording ? 'voicePulse 1.5s infinite' : 'none'
                                        }}
                                        onClick={handleSpeechRecord}
                                        disabled={isChecking}
                                    >
                                        {isRecording ? <MicOff size={36} color="var(--danger-color)" /> : <Mic size={36} color="var(--secondary-color)" />}
                                    </button>
                                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                                        {pronAssessing ? 'Scoring your pronunciation…' : isRecording ? 'Listening... tap to stop' : 'Tap to speak'}
                                    </span>
                                </div>
                            )}

                            {/* Pronunciation assessment results */}
                            {pronResult && pronResult.scores && (
                                <div style={{
                                    padding: 16, borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)',
                                    display: 'flex', flexDirection: 'column', gap: 10
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                                        {['accuracy', 'fluency', 'completeness', 'pronunciation'].map(k => (
                                            <div key={k}>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(pronResult.scores[k]) }}>
                                                    {pronResult.scores[k] != null ? Math.round(pronResult.scores[k]) : '–'}
                                                </div>
                                                <div style={{ textTransform: 'capitalize' }}>{k}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {pronResult.words?.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', paddingTop: 6, borderTop: '1px solid var(--border-color)' }}>
                                            {pronResult.words.map((w, i) => (
                                                <span key={i} style={{
                                                    padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                                                    fontSize: 16, fontWeight: 600,
                                                    backgroundColor: scoreBg(w.accuracy, w.errorType),
                                                    color: scoreFg(w.accuracy, w.errorType),
                                                    textDecoration: w.errorType === 'Omission' ? 'line-through' : 'none',
                                                }}>{w.word}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Show recognized speech result (if no pron breakdown) */}
                            {speechResult && !pronResult && (
                                <div style={{
                                    textAlign: 'center', padding: 16, borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'rgba(6, 214, 160, 0.1)', border: '2px solid var(--success-color)'
                                }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Recognized:</span>
                                    <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--success-color)' }}>{speechResult}</span>
                                </div>
                            )}

                            {/* Show speech error */}
                            {speechError && !speechResult && (
                                <p style={{ color: 'var(--danger-color)', textAlign: 'center', fontSize: 14, margin: 0 }}>
                                    {speechError}
                                </p>
                            )}

                            {/* Always show text input as fallback */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                                {!speechSupported && (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: 13, margin: 0 }}>
                                        Speech recognition not available in this browser.
                                    </p>
                                )}
                                <input
                                    type="text"
                                    value={speechResult || typedAnswer}
                                    onChange={(e) => { setSpeechResult(''); setTypedAnswer(e.target.value); }}
                                    placeholder={speechSupported ? 'Or type the sentence here...' : 'Type the sentence...'}
                                    disabled={isChecking}
                                    style={{
                                        width: '100%', padding: 14, fontSize: 16, borderRadius: 'var(--radius-md)',
                                        border: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)',
                                        color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = 'var(--secondary-color)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                                />
                            </div>
                        </>
                    )}

                    {/* Multiple Choice */}
                    {['mcq_translate_to_vi', 'mcq_translate_to_en', 'listen_choose'].includes(exercise_type) && (
                        <MCQOptions
                            options={prompt.choices_vi || prompt.choices_en}
                            selectedAnswer={selectedAnswer}
                            correctAnswer={prompt.answer_vi || prompt.answer_en}
                            onSelect={(choice) => { setSelectedAnswer(choice); if (prompt.choices_vi) speak(choice); }}
                            isChecking={isChecking}
                            isCorrect={isCorrect}
                        />
                    )}

                    {/* Word Bank — shared by reorder_words and translation_word_bank */}
                    {['reorder_words', 'translation_word_bank'].includes(exercise_type) && (
                        <>
                            {/* Answer line */}
                            <div
                                className="lesson-game__word-answer-line"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={onDrop}
                            >
                                {orderedTokens.length === 0 && (
                                    <span style={{ color: 'var(--text-muted)', padding: '10px 0', width: '100%' }}>Tap words below to build the sentence</span>
                                )}
                                {orderedTokens.map((token, idx) => {
                                    const showGapBefore = dropTargetIndex === idx && draggedItemIndex !== idx;
                                    return (
                                        <React.Fragment key={idx}>
                                            {showGapBefore && <div style={{ width: 6, height: 40, backgroundColor: 'var(--success-color)', borderRadius: 4, margin: '0 2px', animation: 'dropGapFade 0.2s ease', pointerEvents: 'none' }} />}
                                            <button
                                                style={{
                                                    padding: '10px 14px', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                                                    cursor: isChecking ? 'default' : 'grab', boxShadow: '0 2px 0 var(--border-color)', fontSize: 16, fontWeight: 500,
                                                    userSelect: 'none', transition: 'all 0.1s', opacity: draggedItemIndex === idx ? 0.5 : 1,
                                                    color: 'var(--text-main)'
                                                }}
                                                onClick={() => { handleRemoveOrderedWord(idx); speak(token); }}
                                                draggable={!isChecking}
                                                onDragStart={(e) => onDragStart(e, idx)}
                                                onDragOver={(e) => onDragOver(e, idx)}
                                                onDrop={onDrop}
                                                onDragEnd={onDragEnd}
                                            >
                                                {token}
                                            </button>
                                            {idx === orderedTokens.length - 1 && dropTargetIndex === orderedTokens.length && (
                                                <div style={{ width: 6, height: 40, backgroundColor: 'var(--success-color)', borderRadius: 4, margin: '0 2px', animation: 'dropGapFade 0.2s ease', pointerEvents: 'none' }} />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            {/* Word bank */}
                            <div className="lesson-game__word-bank">
                                {availableTokens.map((word, idx) => {
                                    const usedCount = orderedTokens.filter(w => w === word).length;
                                    const bankBefore = availableTokens.slice(0, idx).filter(w => w === word).length;
                                    const isUsed = bankBefore < usedCount;
                                    return (
                                        <button
                                            key={`bank-${idx}`}
                                            style={{
                                                padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 16, fontWeight: 500, userSelect: 'none',
                                                boxShadow: isUsed ? 'none' : '0 2px 0 var(--border-color)', transition: 'all 0.1s',
                                                backgroundColor: isUsed ? 'var(--bg-color)' : 'var(--surface-color)',
                                                border: isUsed ? '2px solid transparent' : '2px solid var(--border-color)',
                                                color: isUsed ? 'transparent' : 'var(--text-main)',
                                                cursor: isUsed || isChecking ? 'default' : 'pointer',
                                                pointerEvents: isUsed ? 'none' : 'auto',
                                            }}
                                            onClick={() => { if (!isUsed) { handleWordBankClick(word); speak(word); } }}
                                            disabled={isUsed || isChecking}
                                        >
                                            {word}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Fill in the Blank — tap word bank */}
                    {exercise_type === 'fill_blank' && (
                        <>
                            <div style={{ padding: 16, backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '2px solid var(--border-color)', fontSize: 20, lineHeight: 1.6, marginBottom: 12 }}>
                                {(prompt.template_vi || '').split('____').map((part, i, arr) => (
                                    <React.Fragment key={i}>
                                        <TappableText text={part} hints={hints} />
                                        {i < arr.length - 1 && (
                                            <span
                                                style={{
                                                    display: 'inline-block', minWidth: 80, borderBottom: '3px solid var(--lesson-selected-border)',
                                                    textAlign: 'center', fontWeight: 700, color: 'var(--lesson-selected-border)', padding: '2px 8px',
                                                    cursor: selectedAnswer && !isChecking ? 'pointer' : 'default',
                                                    backgroundColor: selectedAnswer ? 'var(--lesson-selected-fill)' : 'transparent',
                                                    borderRadius: selectedAnswer ? 8 : 0,
                                                }}
                                                onClick={() => selectedAnswer && !isChecking && setSelectedAnswer(null)}
                                            >
                                                {selectedAnswer || '\u00A0\u00A0\u00A0\u00A0'}
                                            </span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                                {(prompt.choices_vi || []).map((choice, idx) => {
                                    const isUsed = selectedAnswer === choice;
                                    return (
                                        <button
                                            key={idx}
                                            style={{
                                                padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 16, fontWeight: 500,
                                                backgroundColor: isUsed ? 'var(--bg-color)' : 'var(--surface-color)',
                                                border: isUsed ? '2px solid transparent' : '2px solid var(--border-color)',
                                                color: isUsed ? 'transparent' : 'var(--text-main)',
                                                boxShadow: isUsed ? 'none' : '0 2px 0 var(--border-color)',
                                                cursor: isUsed || isChecking ? 'default' : 'pointer',
                                                pointerEvents: isUsed ? 'none' : 'auto',
                                            }}
                                            onClick={() => {
                                                if (!isChecking) {
                                                    setSelectedAnswer(choice);
                                                    speak(buildFillBlankSentence(prompt, choice));
                                                }
                                            }}
                                            disabled={isUsed || isChecking}
                                        >
                                            {choice}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Match Pairs — interactive matching game */}
                    {exercise_type === 'match_pairs' && (
                        <MatchPairs
                            pairs={prompt.pairs}
                            onComplete={() => {
                                completeMatch();
                                setScore(s => s + 1);
                                const newStreak = currentStreak + 1;
                                setCurrentStreak(newStreak);
                                if (newStreak > bestStreak) setBestStreak(newStreak);
                                try {
                                    const db = getDB();
                                    const testedItemIds = extractItemIds(currentEx, db);
                                    if (testedItemIds.length > 0) {
                                        recordExerciseResult('match_pairs', testedItemIds, true);
                                        for (const itemId of testedItemIds) recordReview(itemId, true);
                                    }
                                } catch (e) { console.warn('Word grading error:', e); }
                            }}
                        />
                    )}

                </div>
            </div>
        );
    };

    return (
        <div className="lesson-game" style={{ '--accent-color': 'var(--primary-color)' }}>

            {/* Top Bar Navigation */}
            <div className="lesson-game__topbar">
                <button className="ghost" onClick={() => setShowQuitConfirm(true)} style={{ padding: 8 }}>
                    <X size={24} color="var(--text-muted)" />
                </button>
                <div style={{ flex: 1 }}>
                    <ProgressBar progress={progress / 100} height={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--lesson-hearts)', fontWeight: 700 }}>
                    <Heart size={24} fill="var(--lesson-hearts)" /> {testMode ? '∞' : hearts}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="lesson-game__scroll">
                <div className="lesson-game__stage">
                    {hearts === 0 ? (
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: 32, color: 'var(--danger-color)' }}>{t('test_not_quite')}</h2>
                            <p style={{ color: 'var(--text-muted)' }}>{t('test_keep_practicing')}</p>
                        </div>
                    ) : (
                        renderExercise()
                    )}
                </div>
            </div>

            {/* Bottom Checking Bar */}
            <div
                className="lesson-game__actionbar"
                style={{
                    '--lesson-action-bar-bg': isChecking
                        ? (isCorrect ? 'var(--lesson-correct-fill)' : 'var(--lesson-error-fill)')
                        : 'var(--surface-color)',
                }}
            >
                <div className="lesson-game__actionbar-content">
                {isChecking ? (
                    <FeedbackBanner
                        isCorrect={isCorrect}
                        correctAnswer={
                            !isCorrect
                                ? (currentEx?.exercise_type === 'fill_blank'
                                    ? getFillBlankCorrectSentence(currentEx.prompt)
                                    : (currentEx?.prompt?.answer_vi || currentEx?.prompt?.answer_en || (currentEx?.prompt?.answer_tokens && currentEx.prompt.answer_tokens.join(' '))))
                                : ''
                        }
                        fuzzyHint={fuzzyHint}
                        alternatives={currentEx?.prompt?.accepted_en}
                        onContinue={handleNext}
                    />
                ) : (
                    <div className="lesson-game__button-row">
                        <SoundButton
                            className={`${canCheck() ? '' : 'disabled'} shadow-lg`}
                            style={{
                                flex: 1, fontSize: 18, fontWeight: 800, borderRadius: 25, border: 'none',
                                textTransform: 'uppercase', letterSpacing: 1,
                                backgroundColor: canCheck() ? 'var(--primary-color)' : 'var(--lesson-check-disabled-bg)',
                                color: canCheck() ? '#1A1A1A' : 'var(--lesson-check-disabled-text)',
                                boxShadow: canCheck() ? '0 4px 0 var(--primary-color-hover)' : 'none',
                                opacity: 1,
                            }}
                            onClick={handleCheck}
                        >
                            {t('check_upper')}
                        </SoundButton>
                        {testMode && (
                            <button
                                className="shadow-lg"
                                style={{ padding: '0 20px', fontSize: 14, fontWeight: 700, backgroundColor: 'var(--primary-color)', color: '#1A1A1A', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: '0 4px 0 var(--primary-color-hover)' }}
                                onClick={handleSkip}
                            >
                                {t('skip_upper')}
                            </button>
                        )}
                        {!testMode && currentEx?.exercise_type === 'speak_sentence' && (
                            <button
                                className="shadow-lg"
                                style={{ padding: '0 20px', fontSize: 14, fontWeight: 700, backgroundColor: 'var(--surface-color)', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-color)', boxShadow: '0 4px 0 var(--border-color)' }}
                                onClick={handleNext}
                                title="Skip — useful when you can't speak out loud right now"
                            >
                                {t('skip_upper')}
                            </button>
                        )}
                    </div>
                )}
                </div>
            </div>

            <style>{`
                @keyframes dropGapFade {
                    from { opacity: 0; transform: scaleY(0); }
                    to { opacity: 1; transform: scaleY(1); }
                }
                @keyframes voicePulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
};

export default LessonGame;
