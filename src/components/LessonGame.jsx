import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { X, Heart, Check, Volume2, Zap, Frown, Trophy, FlaskConical, ChevronRight, Mic, MicOff } from 'lucide-react';
import { useDong } from '../context/DongContext';
import { getNodeByLessonId, getLessonBlueprint, getExercisesGenerated, getNextNode, getNodeRoute } from '../lib/db';
import speak from '../utils/speak';
import { addItemsFromLesson } from '../lib/srs';
import { lookupWords } from '../lib/dictionaryLookup';
import { checkVietnameseInput } from '../utils/fuzzyVietnamese';
import { loadSettings } from './TopBar';

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

    // Retention Mockup States
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [retentionQueue, setRetentionQueue] = useState([]);
    const [activeRetentionScreen, setActiveRetentionScreen] = useState(null);

    // Reorder exercises
    const [orderedTokens, setOrderedTokens] = useState([]);
    const [availableTokens, setAvailableTokens] = useState([]);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);
    const [dropTargetIndex, setDropTargetIndex] = useState(null);

    // Word intro phase
    const [showWordIntro, setShowWordIntro] = useState(true);
    const [wordIntroIndex, setWordIntroIndex] = useState(0);
    const [dictInfo, setDictInfo] = useState(new Map());

    // Next node navigation
    const [nextNodeRoute, setNextNodeRoute] = useState(null);
    const [nextNodeLabel, setNextNodeLabel] = useState('');

    // Match pairs
    const [matchPairs, setMatchPairs] = useState([]);
    const [shuffledLeft, setShuffledLeft] = useState([]);
    const [shuffledRight, setShuffledRight] = useState([]);
    const [matchSelectedLeft, setMatchSelectedLeft] = useState(null);
    const [matchSelectedRight, setMatchSelectedRight] = useState(null);
    const [matchedSet, setMatchedSet] = useState(new Set());
    const [matchFlashWrong, setMatchFlashWrong] = useState(false);

    // Listen & Type
    const [typedAnswer, setTypedAnswer] = useState('');
    const [fuzzyHint, setFuzzyHint] = useState(null);

    // Speak Sentence
    const [isRecording, setIsRecording] = useState(false);
    const [speechResult, setSpeechResult] = useState('');
    const [speechSupported, setSpeechSupported] = useState(true);
    const recognitionRef = useRef(null);

    // Image error fallback
    const [imageError, setImageError] = useState(false);

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

        // Load lesson words for summary + dictionary lookup
        const blueprint = getLessonBlueprint(lessonId);
        if (blueprint) {
            setLessonWords(blueprint.words);
            // Show intro only if there are words
            setShowWordIntro(blueprint.words.length > 0);
            setWordIntroIndex(0);
            // Look up dictionary info
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
            setIsRecording(false);
        }

        if (currentEx && currentEx.exercise_type === 'match_pairs') {
            const pairs = currentEx.prompt.pairs || [];
            setMatchPairs(pairs);
            setShuffledLeft([...pairs].sort(() => Math.random() - 0.5));
            setShuffledRight([...pairs].sort(() => Math.random() - 0.5));
            setMatchSelectedLeft(null);
            setMatchSelectedRight(null);
            setMatchedSet(new Set());
            setMatchFlashWrong(false);
        }
    }, [currentIndex, currentEx]);

    // Auto-play audio for listen_type exercises
    useEffect(() => {
        if (currentEx?.exercise_type === 'listen_type' && currentEx.prompt.audio_text) {
            setTimeout(() => speak(currentEx.prompt.audio_text), 300);
        }
    }, [currentIndex]);

    // Complete node and add words to SRS when lesson finishes
    useEffect(() => {
        if (isFinished && !rewardGivenRef.current) {
            rewardGivenRef.current = true;

            if (nodeId) {
                dongCtx.completeNode(nodeId);
            }

            // Add words to SRS for review later
            addItemsFromLesson(lessonId);
        }
    }, [isFinished]);

    const handlePlayAudio = (text) => {
        if (text) speak(text);
    };

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

        const recognition = new SR();
        recognition.lang = 'vi-VN';
        recognition.continuous = false;
        recognition.interimResults = true;
        recognitionRef.current = recognition;

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript)
                .join('');
            setSpeechResult(transcript);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.onerror = (event) => {
            setIsRecording(false);
            if (event.error === 'not-allowed') {
                setSpeechSupported(false);
            }
        };

        recognition.start();
        setIsRecording(true);
    };

    // Match pairs: tap left then right to match
    const handleMatchTap = (side, index) => {
        if (isChecking) return;
        const pair = side === 'left' ? shuffledLeft[index] : shuffledRight[index];
        const pairKey = `${pair.vi_text}::${pair.en_text}`;
        if (matchedSet.has(pairKey)) return;

        if (side === 'left') {
            setMatchSelectedLeft(index);
            // If right already selected, check match
            if (matchSelectedRight !== null) {
                const leftPair = shuffledLeft[index];
                const rightPair = shuffledRight[matchSelectedRight];
                if (leftPair.vi_text === rightPair.vi_text && leftPair.en_text === rightPair.en_text) {
                    const newMatched = new Set(matchedSet);
                    newMatched.add(pairKey);
                    setMatchedSet(newMatched);
                    setMatchSelectedLeft(null);
                    setMatchSelectedRight(null);
                    // Check if all matched → auto-advance
                    if (newMatched.size === matchPairs.length) {
                        setTimeout(() => {
                            setIsCorrect(true);
                            setIsChecking(true);
                            setScore(s => s + 1);
                            const newStreak = currentStreak + 1;
                            setCurrentStreak(newStreak);
                            if (newStreak > bestStreak) setBestStreak(newStreak);
                        }, 400);
                    }
                } else {
                    setMatchFlashWrong(true);
                    setTimeout(() => {
                        setMatchFlashWrong(false);
                        setMatchSelectedLeft(null);
                        setMatchSelectedRight(null);
                    }, 500);
                }
            }
        } else {
            setMatchSelectedRight(index);
            // If left already selected, check match
            if (matchSelectedLeft !== null) {
                const leftPair = shuffledLeft[matchSelectedLeft];
                const rightPair = shuffledRight[index];
                const rightKey = `${rightPair.vi_text}::${rightPair.en_text}`;
                if (leftPair.vi_text === rightPair.vi_text && leftPair.en_text === rightPair.en_text) {
                    const newMatched = new Set(matchedSet);
                    newMatched.add(rightKey);
                    setMatchedSet(newMatched);
                    setMatchSelectedLeft(null);
                    setMatchSelectedRight(null);
                    if (newMatched.size === matchPairs.length) {
                        setTimeout(() => {
                            setIsCorrect(true);
                            setIsChecking(true);
                            setScore(s => s + 1);
                            const newStreak = currentStreak + 1;
                            setCurrentStreak(newStreak);
                            if (newStreak > bestStreak) setBestStreak(newStreak);
                        }, 400);
                    }
                } else {
                    setMatchFlashWrong(true);
                    setTimeout(() => {
                        setMatchFlashWrong(false);
                        setMatchSelectedLeft(null);
                        setMatchSelectedRight(null);
                    }, 500);
                }
            }
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
            correct = orderedTokens.join(' ') === currentEx.prompt.answer_tokens.join(' ');
        } else if (currentEx.exercise_type === 'fill_blank') {
            correct = selectedAnswer === currentEx.prompt.answer_vi;
        } else if (currentEx.exercise_type === 'match_pairs') {
            correct = matchedSet.size === matchPairs.length;
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
            const result = checkVietnameseInput(
                speechResult,
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

        if (correct) {
            setScore(s => s + 1);
            const newStreak = currentStreak + 1;
            setCurrentStreak(newStreak);
            if (newStreak > bestStreak) setBestStreak(newStreak);
        } else {
            setCurrentStreak(0);
            if (!testMode) dongCtx.loseHeart();
        }
    };

    const handleSkip = () => {
        if (!testMode) return;
        setScore(s => s + 1);
        if (currentIndex < exercises.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setRetentionQueue(['energy', 'quest', 'xp']);
            setActiveRetentionScreen('energy');
        }
    };

    const handleNext = () => {
        if (hearts === 0) {
            navigate('/');
            return;
        }

        if (currentIndex < exercises.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setRetentionQueue(['energy', 'quest', 'xp']);
            setActiveRetentionScreen('energy');
        }
    };

    const handleNextRetention = () => {
        const nextQueue = [...retentionQueue];
        nextQueue.shift();
        setRetentionQueue(nextQueue);

        if (nextQueue.length > 0) {
            setActiveRetentionScreen(nextQueue[0]);
        } else {
            setActiveRetentionScreen(null);
            setIsFinished(true);
        }
    };

    const canCheck = () => {
        if (!currentEx) return false;
        if (currentEx.exercise_type === 'match_pairs') return false; // auto-checks
        if (currentEx.exercise_type === 'reorder_words' || currentEx.exercise_type === 'translation_word_bank') return orderedTokens.length > 0;
        if (currentEx.exercise_type === 'listen_type') return typedAnswer.trim().length > 0;
        if (currentEx.exercise_type === 'speak_sentence') return speechResult.trim().length > 0;
        if (currentEx.exercise_type === 'picture_choice') return selectedAnswer !== null;
        return selectedAnswer !== null && selectedAnswer !== '';
    };

    // Enter key to trigger Check / Continue / retention screens
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Enter') return;
            if (activeRetentionScreen) { handleNextRetention(); return; }
            if (isFinished || showQuitConfirm) return;
            if (isChecking) { handleNext(); return; }
            if (canCheck()) handleCheck();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (showQuitConfirm) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#131F24', color: 'white', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Frown size={120} color="#58CC02" strokeWidth={1.5} style={{ marginBottom: 32 }} />
                    <h2 style={{ fontSize: 24, marginBottom: 32, lineHeight: 1.4 }}>Wait, you only have 1 minute to go in this lesson!</h2>
                </div>
                <div style={{ padding: '24px 16px', borderTop: '2px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button className="ghost" style={{ color: '#FF4B4B', fontWeight: 700, width: '100%' }} onClick={() => navigate('/')}>
                        QUIT
                    </button>
                    <button className="primary shadow-lg" style={{ backgroundColor: '#1CB0F6', color: '#1A1A1A', boxShadow: '0 4px 0 #1899D6', border: 'none', width: '100%', fontSize: 18 }} onClick={() => setShowQuitConfirm(false)}>
                        KEEP LEARNING
                    </button>
                </div>
            </div>
        );
    }

    if (activeRetentionScreen === 'energy') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#131F24', color: 'white', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Zap size={64} color="#FFD166" style={{ marginBottom: -10, zIndex: 2 }} />
                    <div style={{ backgroundColor: '#FF8BC1', border: '4px solid #FFD166', borderRadius: 24, padding: '20px 40px', fontSize: 48, fontWeight: 800, color: 'white' }}>
                        +1
                    </div>
                </div>
                <div style={{ padding: '24px 16px', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                    <button className="primary shadow-lg" style={{ width: '100%', fontSize: 18 }} onClick={handleNextRetention}>
                        CONTINUE
                    </button>
                </div>
            </div>
        );
    }

    if (activeRetentionScreen === 'quest') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#131F24', color: 'white', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: 160, height: 160, backgroundColor: '#58CC02', borderRadius: 16, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative', borderBottom: '16px solid #46A302' }}>
                        <Trophy size={80} color="#FFD166" fill="#FFD166" style={{ position: 'absolute', top: -30 }} />
                        <div style={{ width: '90%', height: 16, backgroundColor: '#FF4B4B', borderRadius: 8, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                            <span style={{ position: 'absolute', width: '100%', textAlign: 'center', fontSize: 12, fontWeight: 800, lineHeight: '16px' }}>3 / 3</span>
                        </div>
                    </div>
                    <h2 style={{ fontSize: 24, marginTop: 40, lineHeight: 1.4 }}>You finished this Weekend Quest.<br />Exquisite work!</h2>
                </div>
                <div style={{ padding: '24px 16px', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                    <button className="primary shadow-lg" style={{ backgroundColor: '#1CB0F6', color: '#1A1A1A', boxShadow: '0 4px 0 #1899D6', border: 'none', width: '100%', fontSize: 18 }} onClick={handleNextRetention}>
                        I DID IT
                    </button>
                </div>
            </div>
        );
    }

    if (activeRetentionScreen === 'xp') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#131F24', color: 'white', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ position: 'relative', marginBottom: 32 }}>
                        <FlaskConical size={140} color="#CE82FF" fill="#CE82FF" strokeWidth={1} />
                        <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#E5E5E5', color: '#1A1A1A', padding: '4px 12px', borderRadius: 12, fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12 }}>&#128274;</span> 5H
                        </div>
                    </div>
                    <h2 style={{ fontSize: 24, lineHeight: 1.4 }}>Come back <span style={{ color: '#CE82FF' }}>tomorrow</span> for this<br />triple XP Boost</h2>
                </div>
                <div style={{ padding: '24px 16px', borderTop: '2px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button className="ghost" style={{ color: '#1CB0F6', fontWeight: 700, width: '100%' }} onClick={handleNextRetention}>
                        CONTINUE
                    </button>
                    <button className="primary shadow-lg" style={{ backgroundColor: '#1CB0F6', color: '#1A1A1A', boxShadow: '0 4px 0 #1899D6', border: 'none', width: '100%', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleNextRetention}>
                        <span style={{ fontSize: 14 }}>&#9654;</span> EARN ANOTHER REWARD
                    </button>
                </div>
            </div>
        );
    }

    if (exercises.length === 0 && !showWordIntro) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', padding: 24 }}>
                <h2>No exercises found for this lesson.</h2>
                <button className="primary mt-4" onClick={() => navigate('/')}>Return to Roadmap</button>
            </div>
        );
    }

    // --- Word Introduction Phase ---
    if (showWordIntro && lessonWords.length > 0) {
        const word = lessonWords[wordIntroIndex];
        const dict = word ? dictInfo.get(word.vietnamese) : null;
        const introProgress = lessonWords.length > 1 ? ((wordIntroIndex) / lessonWords.length) * 100 : 0;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
                {/* Top Bar */}
                <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="ghost" onClick={() => setShowWordIntro(false)} style={{ padding: 8 }}>
                        <X size={24} color="var(--text-muted)" />
                    </button>
                    <div style={{ flex: 1, height: 16, backgroundColor: 'var(--surface-color)', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${introProgress}%`, height: '100%', backgroundColor: 'var(--secondary-color)', transition: 'width 0.3s ease-out', borderRadius: 8 }} />
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>{wordIntroIndex + 1}/{lessonWords.length}</span>
                </div>

                {/* Word Card */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 24px' }}>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--secondary-color)', fontWeight: 700, marginBottom: 16 }}>
                        New Word
                    </div>

                    <div style={{ width: '100%', maxWidth: 400, backgroundColor: 'var(--surface-color)', borderRadius: 20, padding: 32, textAlign: 'center', border: '2px solid var(--border-color)' }}>
                        {/* Vietnamese word */}
                        <div style={{ fontSize: 40, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
                            {word.vietnamese}
                        </div>

                        {/* Play audio button */}
                        <button
                            className="ghost"
                            onClick={() => speak(word.vietnamese)}
                            style={{ margin: '0 auto 16px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--secondary-color)', fontSize: 14 }}
                        >
                            <Volume2 size={20} /> Listen
                        </button>

                        {/* Divider */}
                        <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '0 -16px 16px' }} />

                        {/* English translation */}
                        <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--primary-color)', marginBottom: 8 }}>
                            {word.english}
                        </div>

                        {/* Dictionary definition */}
                        {dict?.definition && dict.definition !== word.english && (
                            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                {dict.definition}
                            </div>
                        )}

                        {/* Part of speech tags */}
                        {dict?.tags?.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
                                {[...new Set(dict.tags)].slice(0, 3).map((tag, i) => (
                                    <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, backgroundColor: 'rgba(255,209,102,0.15)', color: 'var(--primary-color)', fontWeight: 600 }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom navigation */}
                <div style={{ padding: '24px 16px', borderTop: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)', minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <button
                        className="primary shadow-lg"
                        style={{ width: '100%', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        onClick={() => {
                            if (wordIntroIndex < lessonWords.length - 1) {
                                setWordIntroIndex(i => i + 1);
                            } else {
                                setShowWordIntro(false);
                            }
                        }}
                    >
                        {wordIntroIndex < lessonWords.length - 1 ? 'NEXT WORD' : 'START EXERCISES'} <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: 32, textAlign: 'center' }}>
                    <div style={{ width: 120, height: 120, backgroundColor: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <Check size={64} color="#1A1A1A" strokeWidth={3} />
                    </div>
                    <h1 style={{ color: 'var(--primary-color)', fontSize: 32, marginBottom: 8 }}>Lesson Complete!</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{score}/{exercises.length} correct</p>

                    {/* Words learned */}
                    {lessonWords.length > 0 && (
                        <div style={{ textAlign: 'left' }}>
                            <h3 style={{ fontSize: 16, marginBottom: 12, color: 'var(--text-muted)' }}>Words learned</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {lessonWords.map((w, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--surface-color)', borderRadius: 12 }}>
                                        <span style={{ fontWeight: 700 }}>{w.vietnamese}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{w.english}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: '24px 16px', borderTop: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 140, justifyContent: 'center' }}>
                    {nextNodeRoute && (
                        <button className="ghost" style={{ color: 'var(--text-muted)', fontWeight: 600, width: '100%' }} onClick={() => navigate('/')}>
                            Back to Roadmap
                        </button>
                    )}
                    <button
                        className="primary w-full shadow-lg"
                        style={{ fontSize: 18 }}
                        onClick={() => navigate(nextNodeRoute || '/')}
                    >
                        CONTINUE
                    </button>
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

    const renderExercise = () => {
        if (!currentEx) return null;

        const { exercise_type, prompt } = currentEx;
        const audioText = getAudioText();

        return (
            <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <h2 style={{ fontSize: 24, margin: 0 }}>{prompt.instruction}</h2>

                {/* Question Prompt Area */}
                {exercise_type !== 'picture_choice' && exercise_type !== 'speak_sentence' && (
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            &#129417;
                        </div>

                        {['listen_choose', 'listen_type'].includes(exercise_type) ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, alignSelf: 'center' }}>
                                <button
                                    className="secondary"
                                    style={{ width: 64, height: 64, borderRadius: 16, color: 'var(--secondary-color)', borderColor: 'var(--secondary-color)', boxShadow: '0 4px 0 var(--secondary-color)' }}
                                    onClick={() => handlePlayAudio(audioText)}
                                >
                                    <Volume2 size={32} />
                                </button>
                                {exercise_type === 'listen_type' && (
                                    <button
                                        className="secondary"
                                        style={{ width: 48, height: 48, borderRadius: 12, color: 'var(--text-muted)', borderColor: 'var(--border-color)', boxShadow: '0 3px 0 var(--border-color)', fontSize: 20 }}
                                        onClick={() => speak(audioText, 0.7)}
                                    >
                                        🐢
                                    </button>
                                )}
                                {exercise_type === 'listen_choose' && audioText && (
                                    <span style={{ fontSize: 16, color: 'var(--text-muted)', fontStyle: 'italic' }}>{audioText}</span>
                                )}
                            </div>
                        ) : (
                            <div style={{ flex: 1, padding: 16, backgroundColor: 'var(--surface-color)', borderRadius: 16, border: '2px solid var(--border-color)', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: -10, top: 20, width: 20, height: 20, backgroundColor: 'var(--surface-color)', borderLeft: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)', transform: 'rotate(45deg)' }} />
                                <span style={{ fontSize: 18, position: 'relative', zIndex: 2 }}>{prompt.source_text_en || prompt.source_text_vi || prompt.template_vi || "Translate this"}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Response Area */}
                <div style={{ marginTop: exercise_type === 'picture_choice' || exercise_type === 'speak_sentence' ? 0 : 24, display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Picture Choice — image + MCQ */}
                    {exercise_type === 'picture_choice' && (
                        <>
                            <div style={{ width: '100%', maxWidth: 300, margin: '0 auto 16px', borderRadius: 16, overflow: 'hidden', border: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
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
                                    className={selectedAnswer === choice ? 'primary' : 'secondary'}
                                    style={{
                                        width: '100%', justifyContent: 'flex-start', padding: 20, fontSize: 18,
                                        borderColor: selectedAnswer === choice ? 'var(--primary-color)' : 'var(--border-color)',
                                        backgroundColor: selectedAnswer === choice ? 'rgba(255, 209, 102, 0.1)' : 'transparent',
                                        color: selectedAnswer === choice ? 'var(--primary-color)' : 'var(--text-main)'
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
                                width: '100%', padding: 16, fontSize: 18, borderRadius: 12,
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
                                backgroundColor: 'var(--surface-color)', borderRadius: 16,
                                border: '2px solid var(--border-color)', lineHeight: 1.5
                            }}>
                                {prompt.target_vi}
                            </div>

                            <button
                                className="ghost"
                                onClick={() => speak(prompt.target_vi)}
                                style={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--secondary-color)', fontSize: 14 }}
                            >
                                <Volume2 size={20} /> Listen first
                            </button>

                            {speechSupported ? (
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
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: 14, margin: 0 }}>
                                        Speech recognition not available. Type instead:
                                    </p>
                                    <input
                                        type="text"
                                        value={speechResult}
                                        onChange={(e) => setSpeechResult(e.target.value)}
                                        placeholder="Type the sentence..."
                                        disabled={isChecking}
                                        autoFocus
                                        style={{
                                            width: '100%', padding: 16, fontSize: 18, borderRadius: 12,
                                            border: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)',
                                            color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            )}

                            {speechResult && (
                                <div style={{ textAlign: 'center', fontSize: 16, color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                                    You said: &ldquo;{speechResult}&rdquo;
                                </div>
                            )}
                        </>
                    )}

                    {/* Multiple Choice */}
                    {['mcq_translate_to_vi', 'mcq_translate_to_en', 'listen_choose'].includes(exercise_type) &&
                        (prompt.choices_vi || prompt.choices_en).map((choice, idx) => (
                            <button
                                key={idx}
                                className={selectedAnswer === choice ? 'primary' : 'secondary'}
                                style={{
                                    width: '100%', justifyContent: 'flex-start', padding: 20, fontSize: 18,
                                    borderColor: selectedAnswer === choice ? 'var(--primary-color)' : 'var(--border-color)',
                                    backgroundColor: selectedAnswer === choice ? 'rgba(255, 209, 102, 0.1)' : 'transparent',
                                    color: selectedAnswer === choice ? 'var(--primary-color)' : 'var(--text-main)'
                                }}
                                onClick={() => !isChecking && setSelectedAnswer(choice)}
                                disabled={isChecking}
                            >
                                {choice}
                            </button>
                        ))}

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
                                                    padding: '10px 16px', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', borderRadius: 12,
                                                    cursor: isChecking ? 'default' : 'grab', boxShadow: '0 2px 0 var(--border-color)', fontSize: 17, fontWeight: 500,
                                                    userSelect: 'none', transition: 'all 0.1s', opacity: draggedItemIndex === idx ? 0.5 : 1,
                                                    color: 'var(--text-main)'
                                                }}
                                                onClick={() => handleRemoveOrderedWord(idx)}
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
                                                padding: '10px 16px', borderRadius: 12, fontSize: 17, fontWeight: 500, userSelect: 'none',
                                                boxShadow: isUsed ? 'none' : '0 2px 0 var(--border-color)', transition: 'all 0.1s',
                                                backgroundColor: isUsed ? 'var(--bg-color)' : 'var(--surface-color)',
                                                border: isUsed ? '2px solid transparent' : '2px solid var(--border-color)',
                                                color: isUsed ? 'transparent' : 'var(--text-main)',
                                                cursor: isUsed || isChecking ? 'default' : 'pointer',
                                                pointerEvents: isUsed ? 'none' : 'auto',
                                            }}
                                            onClick={() => !isUsed && handleWordBankClick(word)}
                                            disabled={isUsed || isChecking}
                                        >
                                            {word}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Fill in the Blank — MCQ choices */}
                    {exercise_type === 'fill_blank' && (
                        <>
                            <div style={{ padding: 16, backgroundColor: 'var(--surface-color)', borderRadius: 16, border: '2px solid var(--border-color)', fontSize: 20, lineHeight: 1.6, marginBottom: 12 }}>
                                {(prompt.template_vi || '').split('____').map((part, i, arr) => (
                                    <React.Fragment key={i}>
                                        <span>{part}</span>
                                        {i < arr.length - 1 && (
                                            <span style={{
                                                display: 'inline-block', minWidth: 80, borderBottom: '3px solid var(--primary-color)',
                                                textAlign: 'center', fontWeight: 700, color: 'var(--primary-color)', padding: '0 4px'
                                            }}>
                                                {selectedAnswer || '\u00A0\u00A0\u00A0\u00A0'}
                                            </span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                                {(prompt.choices_vi || []).map((choice, idx) => (
                                    <button
                                        key={idx}
                                        style={{
                                            padding: '12px 20px', borderRadius: 12, fontSize: 17, fontWeight: 500,
                                            backgroundColor: selectedAnswer === choice ? 'rgba(255, 209, 102, 0.15)' : 'var(--surface-color)',
                                            border: selectedAnswer === choice ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                                            color: selectedAnswer === choice ? 'var(--primary-color)' : 'var(--text-main)',
                                            boxShadow: '0 2px 0 var(--border-color)', cursor: isChecking ? 'default' : 'pointer'
                                        }}
                                        onClick={() => !isChecking && setSelectedAnswer(choice)}
                                        disabled={isChecking}
                                    >
                                        {choice}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Match Pairs — interactive matching game */}
                    {exercise_type === 'match_pairs' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {/* Left column: Vietnamese */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {shuffledLeft.map((pair, idx) => {
                                    const pairKey = `${pair.vi_text}::${pair.en_text}`;
                                    const isMatched = matchedSet.has(pairKey);
                                    const isSelected = matchSelectedLeft === idx;
                                    const isWrong = matchFlashWrong && isSelected;
                                    return (
                                        <button
                                            key={`l-${idx}`}
                                            onClick={() => handleMatchTap('left', idx)}
                                            disabled={isMatched || isChecking}
                                            style={{
                                                padding: '14px 12px', borderRadius: 12, fontSize: 17, fontWeight: 600,
                                                textAlign: 'center', transition: 'all 0.2s', cursor: isMatched ? 'default' : 'pointer',
                                                backgroundColor: isMatched ? 'rgba(6, 214, 160, 0.15)' :
                                                    isWrong ? 'rgba(239, 71, 111, 0.15)' :
                                                        isSelected ? 'rgba(255, 209, 102, 0.15)' : 'var(--surface-color)',
                                                border: isMatched ? '2px solid var(--success-color)' :
                                                    isWrong ? '2px solid var(--danger-color)' :
                                                        isSelected ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                                                color: isMatched ? 'var(--success-color)' :
                                                    isWrong ? 'var(--danger-color)' :
                                                        isSelected ? 'var(--primary-color)' : 'var(--text-main)',
                                                opacity: isMatched ? 0.6 : 1,
                                                boxShadow: isMatched ? 'none' : '0 2px 0 var(--border-color)'
                                            }}
                                        >
                                            {pair.vi_text}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Right column: English */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {shuffledRight.map((pair, idx) => {
                                    const pairKey = `${pair.vi_text}::${pair.en_text}`;
                                    const isMatched = matchedSet.has(pairKey);
                                    const isSelected = matchSelectedRight === idx;
                                    const isWrong = matchFlashWrong && isSelected;
                                    return (
                                        <button
                                            key={`r-${idx}`}
                                            onClick={() => handleMatchTap('right', idx)}
                                            disabled={isMatched || isChecking}
                                            style={{
                                                padding: '14px 12px', borderRadius: 12, fontSize: 17, fontWeight: 600,
                                                textAlign: 'center', transition: 'all 0.2s', cursor: isMatched ? 'default' : 'pointer',
                                                backgroundColor: isMatched ? 'rgba(6, 214, 160, 0.15)' :
                                                    isWrong ? 'rgba(239, 71, 111, 0.15)' :
                                                        isSelected ? 'rgba(255, 209, 102, 0.15)' : 'var(--surface-color)',
                                                border: isMatched ? '2px solid var(--success-color)' :
                                                    isWrong ? '2px solid var(--danger-color)' :
                                                        isSelected ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                                                color: isMatched ? 'var(--success-color)' :
                                                    isWrong ? 'var(--danger-color)' :
                                                        isSelected ? 'var(--primary-color)' : 'var(--text-main)',
                                                opacity: isMatched ? 0.6 : 1,
                                                boxShadow: isMatched ? 'none' : '0 2px 0 var(--border-color)'
                                            }}
                                        >
                                            {pair.en_text}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>

            {/* Top Bar Navigation */}
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <button className="ghost" onClick={() => setShowQuitConfirm(true)} style={{ padding: 8 }}>
                    <X size={24} color="var(--text-muted)" />
                </button>
                <div style={{ flex: 1, height: 16, backgroundColor: 'var(--surface-color)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--success-color)', transition: 'width 0.3s ease-out', borderRadius: 8 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger-color)', fontWeight: 700 }}>
                    <Heart size={24} fill="var(--danger-color)" /> {testMode ? '∞' : hearts}
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
                backgroundColor: isChecking ? (isCorrect ? 'rgba(6, 214, 160, 0.1)' : 'rgba(239, 71, 111, 0.1)') : 'var(--surface-color)',
                transition: 'background-color 0.2s',
                minHeight: 140,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                {isChecking ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: isCorrect ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isCorrect ? <Check size={20} color="#1A1A1A" strokeWidth={3} /> : <X size={20} color="white" strokeWidth={3} />}
                            </div>
                            <h3 style={{ margin: 0, fontSize: 24, color: isCorrect ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                {isCorrect ? (fuzzyHint ? 'Good! Try with diacritics:' : 'Nicely done!') : 'Correct solution:'}
                            </h3>
                        </div>

                        {!isCorrect && (
                            <div style={{ fontSize: 18, color: 'var(--danger-color)' }}>
                                {currentEx?.prompt?.answer_vi || currentEx?.prompt?.answer_en || (currentEx?.prompt?.answer_tokens && currentEx.prompt.answer_tokens.join(' '))}
                            </div>
                        )}

                        {isCorrect && fuzzyHint && (
                            <div style={{ fontSize: 18, color: 'var(--success-color)', fontWeight: 600 }}>
                                {fuzzyHint}
                            </div>
                        )}

                        <button
                            className="primary shadow-lg"
                            style={{
                                width: '100%',
                                fontSize: 18,
                                backgroundColor: isCorrect ? 'var(--success-color)' : 'var(--danger-color)',
                                color: isCorrect ? '#1A1A1A' : 'white',
                                boxShadow: isCorrect ? '0 4px 0 #05A67D' : '0 4px 0 #B52F4E'
                            }}
                            onClick={handleNext}
                        >
                            CONTINUE
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            className="primary shadow-lg"
                            style={{ flex: 1, fontSize: 18, opacity: canCheck() ? 1 : 0.5 }}
                            onClick={handleCheck}
                            disabled={!canCheck()}
                        >
                            CHECK
                        </button>
                        {testMode && (
                            <button
                                className="shadow-lg"
                                style={{ padding: '0 20px', fontSize: 14, fontWeight: 700, backgroundColor: 'var(--warning-color)', color: '#1A1A1A', borderRadius: 12, border: 'none', boxShadow: '0 4px 0 #c77b00' }}
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
