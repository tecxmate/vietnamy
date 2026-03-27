import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { X, Heart, Check, Volume2, Frown, Trophy, ChevronRight, Mic, MicOff } from 'lucide-react';
import { lookupWords } from '../lib/dictionaryLookup';
import { useDong } from '../context/DongContext';
import { getNodeByLessonId, getLessonBlueprint, getExercisesGenerated, getNextNode, getNodeRoute } from '../lib/db';
import speak from '../utils/speak';
import { addItemsFromLesson, recordReview } from '../lib/srs';
import { recordExerciseResult, extractItemIds } from '../lib/wordGrades';
import { getDB } from '../lib/db';
import { checkVietnameseInput } from '../utils/fuzzyVietnamese';
import { loadSettings } from './TopBar';
import { fireNotification } from '../context/NotificationContext';
import { playSuccess, playError } from '../utils/sound';
import SoundButton from './SoundButton';
import { MCQOptions, MatchPairs, FeedbackBanner, ProgressBar } from './Exercise';

const LessonGame = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dongCtx = useDong();

    const [exercises, setExercises] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const testMode = loadSettings().testMode === true;
    const hearts = testMode ? Infinity : dongCtx.hearts;
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [isFinished, setIsFinished] = useState(false);

    // Score tracking
    const [score, setScore] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);

    // Node tracking
    const [nodeId, setNodeId] = useState(null);
    const [lessonWords, setLessonWords] = useState([]);

    const [showQuitConfirm, setShowQuitConfirm] = useState(false);

    // Reorder exercises
    const [orderedTokens, setOrderedTokens] = useState([]);
    const [availableTokens, setAvailableTokens] = useState([]);
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

    // Listen & Type
    const [typedAnswer, setTypedAnswer] = useState('');
    const [fuzzyHint, setFuzzyHint] = useState(null);

    // Speak Sentence
    const [isRecording, setIsRecording] = useState(false);
    const [speechResult, setSpeechResult] = useState('');
    const [speechSupported, setSpeechSupported] = useState(true);
    const [speechError, setSpeechError] = useState('');
    const recognitionRef = useRef(null);

    // Image error fallback
    const [imageError, setImageError] = useState(false);

    // TappableText hint tooltip
    const [activeHintIdx, setActiveHintIdx] = useState(null);


    const rewardGivenRef = useRef(false);

    useEffect(() => {
        // Reset all state on every navigation (even same lessonId)
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setIsChecking(false);
        setIsCorrect(null);
        setIsFinished(false);
        setScore(0);
        setCurrentStreak(0);
        setBestStreak(0);
        setTypedAnswer('');
        setFuzzyHint(null);
        setSpeechResult('');
        setIsRecording(false);
        setImageError(false);
        rewardGivenRef.current = false;

        // Determine current session number for this lesson's node
        const node = getNodeByLessonId(lessonId);
        const session = node ? dongCtx.getNodeSessionCount(node.id) : 0;

        const loaded = getExercisesGenerated(lessonId, session);
        if (loaded.length === 0) {
            console.warn(`No exercises found for ${lessonId}`);
        }
        setExercises(loaded);

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

            // Build intro steps — vocab cards only
            const steps = [];
            blueprint.words.forEach(word => {
                steps.push({ type: 'vocab', word });
            });
            setIntroSteps(steps);
            setShowWordIntro(steps.length > 0);
            setCurrentIntroStep(0);
            // Auto-play audio for the first intro word
            if (steps.length > 0 && steps[0].word?.vietnamese) {
                setTimeout(() => speak(steps[0].word.vietnamese), 300);
            }

            const viTexts = blueprint.words.map(w => w.vietnamese);
            lookupWords(viTexts).then(info => setDictInfo(info));
        } else {
            setShowWordIntro(false);
        }

        // Check speech recognition support
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        setSpeechSupported(!!SR);
    }, [lessonId, location.key]);

    const currentEx = exercises[currentIndex];
    const progress = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0;

    useEffect(() => {
        setSelectedAnswer(null);
        setIsChecking(false);
        setIsCorrect(null);
        setFuzzyHint(null);
        setImageError(false);
        setActiveHintIdx(null);

        if (currentEx && ['reorder_words', 'translation_word_bank'].includes(currentEx.exercise_type)) {
            setAvailableTokens([...currentEx.prompt.tokens].sort(() => Math.random() - 0.5));
            setOrderedTokens([]);
            setDraggedItemIndex(null);
            setDropTargetIndex(null);
        }

        if (currentEx && currentEx.exercise_type === 'listen_type') {
            setTypedAnswer('');
        }

        if (currentEx && currentEx.exercise_type === 'speak_sentence') {
            setSpeechResult('');
            setTypedAnswer('');
            setIsRecording(false);
            setSpeechError('');
        }

        // match_pairs: MatchPairs component handles its own state initialization
    }, [currentIndex, currentEx]);

    // Auto-play audio for exercises that present Vietnamese text
    useEffect(() => {
        if (!currentEx) return;
        const { exercise_type, prompt } = currentEx;
        if (exercise_type === 'listen_type' || exercise_type === 'listen_choose') {
            if (prompt.audio_text) setTimeout(() => speak(prompt.audio_text), 300);
        } else if (exercise_type === 'mcq_translate_to_en') {
            if (prompt.source_text_vi) setTimeout(() => speak(prompt.source_text_vi), 300);
        }
    }, [currentIndex]);

    // Auto-play audio when a new word is introduced
    useEffect(() => {
        if (showWordIntro && introSteps.length > 0) {
            const step = introSteps[currentIntroStep];
            if (step?.type === 'vocab' && step.word?.vietnamese) {
                setTimeout(() => speak(step.word.vietnamese), 300);
            }
        }
    }, [currentIntroStep, showWordIntro]);

    // Complete node and add words to SRS when lesson finishes
    useEffect(() => {
        if (isFinished && !rewardGivenRef.current) {
            rewardGivenRef.current = true;

            if (nodeId) {
                dongCtx.completeNode(nodeId);
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

    // Speech recognition handler
    const handleSpeechRecord = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            setSpeechSupported(false);
            return;
        }

        if (isRecording && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
            return;
        }

        setSpeechError('');
        const recognition = new SR();
        recognition.lang = 'vi-VN';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;

        let gotResult = false;

        recognition.onresult = (event) => {
            gotResult = true;
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript)
                .join('');
            setSpeechResult(transcript);
        };

        recognition.onend = () => {
            setIsRecording(false);
            if (!gotResult) {
                setSpeechError('No speech detected. Try again or type below.');
            }
        };

        recognition.onerror = (event) => {
            setIsRecording(false);
            console.warn('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setSpeechSupported(false);
                setSpeechError('Microphone access denied. Please allow mic access or type below.');
            } else if (event.error === 'no-speech') {
                setSpeechError('No speech detected. Try again or type below.');
            } else if (event.error === 'network') {
                setSpeechError('Network error. Check your connection or type below.');
            } else if (event.error === 'aborted') {
                // User aborted, no error to show
            } else {
                setSpeechError(`Error: ${event.error}. You can type instead.`);
            }
        };

        try {
            recognition.start();
            setIsRecording(true);
        } catch (e) {
            console.warn('Failed to start speech recognition:', e);
            setSpeechError('Could not start microphone. Type instead.');
            setIsRecording(false);
        }
    };


    const handleCheck = () => {
        if (!currentEx) return;

        let correct = false;

        if (currentEx.exercise_type === 'mcq_translate_to_vi') {
            correct = selectedAnswer === currentEx.prompt.answer_vi;
        } else if (currentEx.exercise_type === 'mcq_translate_to_en') {
            correct = selectedAnswer === currentEx.prompt.answer_en;
        } else if (currentEx.exercise_type === 'listen_choose') {
            correct = selectedAnswer === currentEx.prompt.answer_vi;
        } else if (currentEx.exercise_type === 'reorder_words' || currentEx.exercise_type === 'translation_word_bank') {
            const userStr = orderedTokens.join(' ');
            const ansStr = currentEx.prompt.answer_tokens.join(' ');
            // Accept with or without trailing punctuation (., !, ?)
            correct = userStr === ansStr ||
                userStr.replace(/\s*[.!?]+$/g, '') === ansStr.replace(/\s*[.!?]+$/g, '');
        } else if (currentEx.exercise_type === 'fill_blank') {
            correct = selectedAnswer === currentEx.prompt.answer_vi;
        } else if (currentEx.exercise_type === 'match_pairs') {
            // MatchPairs component auto-completes via onComplete callback
            correct = true;
        } else if (currentEx.exercise_type === 'picture_choice') {
            correct = selectedAnswer === currentEx.prompt.answer_vi;
        } else if (currentEx.exercise_type === 'listen_type') {
            const result = checkVietnameseInput(
                typedAnswer,
                currentEx.prompt.answer_vi,
                currentEx.prompt.answer_vi_no_diacritics
            );
            correct = result.exact || result.fuzzy;
            if (result.fuzzy && !result.exact) {
                setFuzzyHint(currentEx.prompt.answer_vi);
            }
        } else if (currentEx.exercise_type === 'speak_sentence') {
            const input = speechResult || typedAnswer;
            const result = checkVietnameseInput(
                input,
                currentEx.prompt.answer_vi,
                currentEx.prompt.answer_vi_no_diacritics
            );
            correct = result.exact || result.fuzzy;
            if (result.fuzzy && !result.exact) {
                setFuzzyHint(currentEx.prompt.answer_vi);
            }
        } else {
            correct = true;
        }

        setIsCorrect(correct);
        setIsChecking(true);

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
            setScore(s => s + 1);
            const newStreak = currentStreak + 1;
            setCurrentStreak(newStreak);
            if (newStreak > bestStreak) setBestStreak(newStreak);
        } else {
            playError();
            setCurrentStreak(0);
            notifiedStreakRef.current = 0; // reset streak notif gate
            if (!testMode) {
                dongCtx.loseHeart();
                // 🔔 Notify: lost a heart
                setTimeout(() => fireNotification('lost_heart'), 300);
            }
        }
    };

    const handleSkip = () => {
        if (!testMode) return;
        setScore(s => s + 1);
        if (currentIndex < exercises.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    const handleNext = () => {
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
        if (!currentEx) return false;
        if (currentEx.exercise_type === 'match_pairs') return false; // auto-checks
        if (currentEx.exercise_type === 'reorder_words' || currentEx.exercise_type === 'translation_word_bank') return orderedTokens.length > 0;
        if (currentEx.exercise_type === 'listen_type') return typedAnswer.trim().length > 0;
        if (currentEx.exercise_type === 'speak_sentence') return (speechResult || typedAnswer).trim().length > 0;
        if (currentEx.exercise_type === 'picture_choice') return selectedAnswer !== null;
        return selectedAnswer !== null && selectedAnswer !== '';
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
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Frown size={100} color="var(--text-muted)" strokeWidth={1.5} style={{ marginBottom: 24 }} />
                    <h2 style={{ fontSize: 22, marginBottom: 8, lineHeight: 1.4 }}>Are you sure?</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 15, margin: 0 }}>You're almost done with this lesson!</p>
                </div>
                <div style={{ padding: '24px 16px', borderTop: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 140, justifyContent: 'center' }}>
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
                        {currentIntroStep < introSteps.length - 1 ? 'CONTINUE' : 'START'} <ChevronRight size={20} />
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
                    Lesson Complete!
                </h2>

                <div style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                    <strong style={{ color: ACCENT }}>{lessonBlueprint?.title || lessonId}</strong>
                    <br />You scored {score}/{exercises.length}
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '12px 20px', borderRadius: 12, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: ACCENT }}>{score}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Correct</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '12px 20px', borderRadius: 12, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>+10</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Coins</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '12px 20px', borderRadius: 12, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#EF4444' }}>{hearts === Infinity ? '∞' : hearts}/{5}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Hearts</div>
                    </div>
                </div>

                {/* Words learned */}
                {lessonWords.length > 0 && (
                    <div style={{ width: '100%', maxWidth: 360, textAlign: 'left' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 8 }}>Words learned</div>
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
                                boxShadow: '0 4px 0 #CC9202',
                            }}
                        >
                            {nextNodeLabel || 'NEXT LESSON'}
                        </SoundButton>
                    )}
                    <SoundButton
                        className="ghost"
                        style={{ width: '100%', fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}
                        onClick={() => navigate('/', { state: { tab: 'study' } })}
                    >
                        BACK TO ROADMAP
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
            <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <h2 style={{ fontSize: 24, margin: 0 }}>{prompt.instruction}</h2>

                {/* Question Prompt Area */}
                {exercise_type !== 'picture_choice' && exercise_type !== 'speak_sentence' && exercise_type !== 'match_pairs' && (
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-full)', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 28 }}>
                            &#129417;
                        </div>

                        {['listen_choose', 'listen_type'].includes(exercise_type) ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, alignSelf: 'center' }}>
                                <button
                                    className="secondary"
                                    style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', color: 'var(--secondary-color)', borderColor: 'var(--secondary-color)', boxShadow: '0 4px 0 var(--secondary-color)' }}
                                    onClick={() => handlePlayAudio(audioText)}
                                >
                                    <Volume2 size={32} />
                                </button>
                                {exercise_type === 'listen_type' && (
                                    <button
                                        className="secondary"
                                        style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', borderColor: 'var(--border-color)', boxShadow: '0 3px 0 var(--border-color)', fontSize: 20 }}
                                        onClick={() => speak(audioText, 0.7)}
                                    >
                                        🐢
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{ flex: 1, padding: 16, backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '2px solid var(--border-color)', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: -10, top: 20, width: 20, height: 20, backgroundColor: 'var(--surface-color)', borderLeft: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)', transform: 'rotate(45deg)' }} />
                                <span style={{ fontSize: 18, position: 'relative', zIndex: 2 }}>
                                    {prompt.source_text_vi ? <TappableText text={prompt.source_text_vi} hints={hints} />
                                        : prompt.source_text_en || prompt.template_vi || "Translate this"}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Response Area */}
                <div style={{ marginTop: exercise_type === 'picture_choice' || exercise_type === 'speak_sentence' ? 0 : 24, display: 'flex', flexDirection: 'column', gap: 12 }}>

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
                                        {isRecording ? 'Listening... tap to stop' : 'Tap to speak'}
                                    </span>
                                </div>
                            )}

                            {/* Show recognized speech result */}
                            {speechResult && (
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
                                style={{ minHeight: 70, padding: '10px 0', borderBottom: '2px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24, alignItems: 'center' }}
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
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
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
                                            onClick={() => { if (!isChecking) { setSelectedAnswer(choice); speak(choice); } }}
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
                                setIsCorrect(true);
                                setIsChecking(true);
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', '--accent-color': 'var(--primary-color)' }}>

            {/* Top Bar Navigation */}
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
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
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {hearts === 0 ? (
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: 32, color: 'var(--danger-color)' }}>Out of Hearts!</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Keep practicing to earn more.</p>
                        </div>
                    ) : (
                        renderExercise()
                    )}
                </div>
            </div>

            {/* Bottom Checking Bar */}
            <div style={{
                padding: '24px 16px',
                borderTop: '2px solid var(--border-color)',
                backgroundColor: isChecking ? (isCorrect ? 'var(--lesson-correct-fill)' : 'var(--lesson-error-fill)') : 'var(--surface-color)',
                transition: 'background-color 0.2s',
                minHeight: 140,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                {isChecking ? (
                    <FeedbackBanner
                        isCorrect={isCorrect}
                        correctAnswer={
                            !isCorrect
                                ? (currentEx?.prompt?.answer_vi || currentEx?.prompt?.answer_en || (currentEx?.prompt?.answer_tokens && currentEx.prompt.answer_tokens.join(' ')))
                                : ''
                        }
                        fuzzyHint={fuzzyHint}
                        onContinue={handleNext}
                    />
                ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                        <SoundButton
                            className="shadow-lg"
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
                            CHECK
                        </SoundButton>
                        {testMode && (
                            <button
                                className="shadow-lg"
                                style={{ padding: '0 20px', fontSize: 14, fontWeight: 700, backgroundColor: 'var(--primary-color)', color: '#1A1A1A', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: '0 4px 0 var(--primary-color-hover)' }}
                                onClick={handleSkip}
                            >
                                SKIP
                            </button>
                        )}
                    </div>
                )}
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
