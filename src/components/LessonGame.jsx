import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Heart, Check, Volume2, Zap, Frown, Trophy, FlaskConical } from 'lucide-react';
import { useDong } from '../context/DongContext';
import { getNodeByLessonId, getLessonBlueprint } from '../lib/db';
import speak from '../utils/speak';
import { addItemsFromLesson } from '../lib/srs';

const loadExercisesForLesson = (lessonId) => {
    const raw = localStorage.getItem('vnme_mock_db_v6');
    if (!raw) return [];
    const db = JSON.parse(raw);
    return (db.exercises || []).filter(ex => ex.lesson_id === lessonId);
};

const LessonGame = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const dongCtx = useDong();

    const [exercises, setExercises] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hearts, setHearts] = useState(5);
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

    const rewardGivenRef = useRef(false);

    useEffect(() => {
        const loaded = loadExercisesForLesson(lessonId);
        if (loaded.length === 0) {
            console.warn(`No exercises found for ${lessonId}`);
        }
        setExercises(loaded);

        // Find the roadmap node for this lesson
        const node = getNodeByLessonId(lessonId);
        if (node) setNodeId(node.id);

        // Load lesson words for summary
        const blueprint = getLessonBlueprint(lessonId);
        if (blueprint) setLessonWords(blueprint.words);
    }, [lessonId]);

    const currentEx = exercises[currentIndex];
    const progress = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0;

    useEffect(() => {
        setSelectedAnswer(null);
        setIsChecking(false);
        setIsCorrect(null);

        if (currentEx && currentEx.exercise_type === 'reorder_words') {
            setAvailableTokens([...currentEx.prompt.tokens].sort(() => Math.random() - 0.5));
            setOrderedTokens([]);
            setDraggedItemIndex(null);
            setDropTargetIndex(null);
        }
    }, [currentIndex, currentEx]);

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

    const handleCheck = () => {
        if (!currentEx) return;

        let correct = false;

        if (currentEx.exercise_type === 'mcq_translate_to_vi') {
            correct = selectedAnswer === currentEx.prompt.answer_vi;
        } else if (currentEx.exercise_type === 'mcq_translate_to_en') {
            correct = selectedAnswer === currentEx.prompt.answer_en;
        } else if (currentEx.exercise_type === 'listen_choose') {
            correct = selectedAnswer === currentEx.prompt.answer_vi;
        } else if (currentEx.exercise_type === 'diacritics_choice') {
            correct = selectedAnswer === currentEx.prompt.answer_vi;
        } else if (currentEx.exercise_type === 'reorder_words') {
            correct = orderedTokens.join(' ') === currentEx.prompt.answer_tokens.join(' ');
        } else if (currentEx.exercise_type === 'dictation' || currentEx.exercise_type === 'fill_blank') {
            const accepted = currentEx.prompt.accepted_answers_vi || [currentEx.prompt.answer_vi];
            correct = accepted.some(ans => ans.toLowerCase() === (selectedAnswer || '').toLowerCase());
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
            setHearts(prev => Math.max(0, prev - 1));
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
        if (currentEx.exercise_type === 'reorder_words') return orderedTokens.length > 0;
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
                <div style={{ paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <button className="primary shadow-lg" style={{ backgroundColor: '#1CB0F6', color: '#1A1A1A', boxShadow: '0 4px 0 #1899D6', border: 'none' }} onClick={() => setShowQuitConfirm(false)}>
                        KEEP LEARNING
                    </button>
                    <button className="ghost" style={{ color: '#FF4B4B', fontWeight: 700 }} onClick={() => navigate('/')}>
                        QUIT
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
                <div style={{ paddingBottom: 40 }}>
                    <button className="primary shadow-lg" style={{ width: '100%' }} onClick={handleNextRetention}>
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
                <div style={{ paddingBottom: 40 }}>
                    <button className="primary shadow-lg" style={{ backgroundColor: '#1CB0F6', color: '#1A1A1A', boxShadow: '0 4px 0 #1899D6', border: 'none', width: '100%' }} onClick={handleNextRetention}>
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
                <div style={{ paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <button className="primary shadow-lg" style={{ backgroundColor: '#1CB0F6', color: '#1A1A1A', boxShadow: '0 4px 0 #1899D6', border: 'none', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleNextRetention}>
                        <span style={{ fontSize: 14 }}>&#9654;</span> EARN ANOTHER REWARD
                    </button>
                    <button className="ghost" style={{ color: '#1CB0F6', fontWeight: 700 }} onClick={handleNextRetention}>
                        CONTINUE
                    </button>
                </div>
            </div>
        );
    }

    if (exercises.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', padding: 24 }}>
                <h2>No exercises found for this lesson.</h2>
                <button className="primary mt-4" onClick={() => navigate('/')}>Return to Roadmap</button>
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

                <div style={{ padding: 24, borderTop: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
                    <button className="primary w-full shadow-lg" onClick={() => navigate('/')}>CONTINUE</button>
                </div>
            </div>
        );
    }

    const getAudioText = () => {
        if (!currentEx) return '';
        const p = currentEx.prompt;
        // Find the Vietnamese text to speak
        if (p.target_vi) return p.target_vi;
        if (p.audio_item_id) {
            // Look up the item's Vietnamese text
            try {
                const raw = localStorage.getItem('vnme_mock_db_v6');
                if (raw) {
                    const db = JSON.parse(raw);
                    const item = (db.items || []).find(i => i.id === p.audio_item_id);
                    if (item) return item.vi_text;
                }
            } catch { /* ignore */ }
        }
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
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        &#129417;
                    </div>

                    {['listen_choose', 'dictation', 'speaking_repeat'].includes(exercise_type) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, alignSelf: 'center' }}>
                            <button
                                className="secondary"
                                style={{ width: 64, height: 64, borderRadius: 16, color: 'var(--secondary-color)', borderColor: 'var(--secondary-color)', boxShadow: '0 4px 0 var(--secondary-color)' }}
                                onClick={() => handlePlayAudio(audioText)}
                            >
                                <Volume2 size={32} />
                            </button>
                            {audioText && (
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

                {/* Response Area */}
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Multiple Choice */}
                    {['mcq_translate_to_vi', 'mcq_translate_to_en', 'listen_choose', 'diacritics_choice'].includes(exercise_type) &&
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

                    {/* Word Reordering — tap to add/remove, drag to reorder */}
                    {exercise_type === 'reorder_words' && (
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

                    {/* Text Input */}
                    {(exercise_type === 'dictation' || exercise_type === 'fill_blank') && (
                        <input
                            type="text"
                            placeholder="Type in Vietnamese"
                            value={selectedAnswer || ''}
                            onChange={(e) => !isChecking && setSelectedAnswer(e.target.value)}
                            style={{ width: '100%', padding: '20px', fontSize: 20, borderRadius: 16, backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', marginTop: 16 }}
                            disabled={isChecking}
                        />
                    )}

                    {/* Simulation placeholders for complex ones */}
                    {['match_pairs', 'speaking_repeat'].includes(exercise_type) && (
                        <div style={{ textAlign: 'center', padding: 32, backgroundColor: 'var(--surface-color)', borderRadius: 16, border: '2px dashed var(--border-color)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>Simulation: Click proceed to simulate completing this {exercise_type} exercise.</p>
                            <button className="primary mt-4" onClick={() => setSelectedAnswer('simulated_pass')} disabled={isChecking}>
                                SIMULATE PASS
                            </button>
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
                    <Heart size={24} fill="var(--danger-color)" /> {hearts}
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
                                {isCorrect ? 'Nicely done!' : 'Correct solution:'}
                            </h3>
                        </div>

                        {!isCorrect && (
                            <div style={{ fontSize: 18, color: 'var(--danger-color)' }}>
                                {currentEx?.prompt?.answer_vi || currentEx?.prompt?.answer_en || (currentEx?.prompt?.answer_tokens && currentEx.prompt.answer_tokens.join(' '))}
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
                    <button
                        className="primary shadow-lg"
                        style={{ width: '100%', fontSize: 18, opacity: canCheck() ? 1 : 0.5 }}
                        onClick={handleCheck}
                        disabled={!canCheck()}
                    >
                        CHECK
                    </button>
                )}
            </div>

            <style>{`
                @keyframes dropGapFade {
                    from { opacity: 0; transform: scaleY(0); }
                    to { opacity: 1; transform: scaleY(1); }
                }
            `}</style>
        </div>
    );
};

export default LessonGame;
