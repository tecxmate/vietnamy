import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Heart, Check, Trophy, Volume2 } from 'lucide-react';
import { getNodeById, getExercisesForUnit, getExercisesForNode } from '../lib/db';
import { useDong } from '../context/DongContext';
import speak from '../utils/speak';

const UNIT_QUIZ_SIZE = 12;
const MODULE_QUIZ_SIZE = 6;

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const UnitTest = () => {
    const { nodeId } = useParams();
    const navigate = useNavigate();
    const dongCtx = useDong();

    const [exercises, setExercises] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hearts, setHearts] = useState(5);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);
    const [unitTitle, setUnitTitle] = useState('');

    // Reorder state
    const [orderedTokens, setOrderedTokens] = useState([]);
    const [availableTokens, setAvailableTokens] = useState([]);

    const rewardGivenRef = useRef(false);

    const [isModuleTest, setIsModuleTest] = useState(false);

    useEffect(() => {
        const node = getNodeById(nodeId);
        if (!node) { navigate('/'); return; }

        setUnitTitle(node.label || 'Unit Test');
        const moduleScoped = node.test_scope === 'module';
        setIsModuleTest(moduleScoped);

        // Module-scoped tests pull from just that module's lesson; unit tests pull from all lessons
        const allExercises = moduleScoped
            ? getExercisesForNode(nodeId)
            : getExercisesForUnit(node.unit_id);
        const quizSize = moduleScoped ? MODULE_QUIZ_SIZE : UNIT_QUIZ_SIZE;
        const picked = shuffle(allExercises).slice(0, quizSize);
        setExercises(picked);
    }, [nodeId, navigate]);

    useEffect(() => {
        if (isFinished && !rewardGivenRef.current) {
            rewardGivenRef.current = true;
            dongCtx.completeNode(nodeId, { immediate: true });
        }
    }, [isFinished]);

    const currentEx = exercises[currentIndex];
    const progress = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0;

    useEffect(() => {
        setSelectedAnswer(null);
        setIsChecking(false);
        setIsCorrect(null);
        if (currentEx && currentEx.exercise_type === 'reorder_words') {
            setAvailableTokens([...currentEx.prompt.tokens].sort(() => Math.random() - 0.5));
            setOrderedTokens([]);
        }
    }, [currentIndex, currentEx]);

    const handleCheck = () => {
        if (!currentEx) return;
        let correct = false;

        if (currentEx.exercise_type === 'mcq_translate_to_vi') correct = selectedAnswer === currentEx.prompt.answer_vi;
        else if (currentEx.exercise_type === 'mcq_translate_to_en') correct = selectedAnswer === currentEx.prompt.answer_en;
        else if (currentEx.exercise_type === 'listen_choose') correct = selectedAnswer === currentEx.prompt.answer_vi;
        else if (currentEx.exercise_type === 'diacritics_choice') correct = selectedAnswer === currentEx.prompt.answer_vi;
        else if (currentEx.exercise_type === 'reorder_words') correct = orderedTokens.join(' ') === currentEx.prompt.answer_tokens.join(' ');
        else if (currentEx.exercise_type === 'dictation' || currentEx.exercise_type === 'fill_blank') {
            const accepted = currentEx.prompt.accepted_answers_vi || [currentEx.prompt.answer_vi];
            correct = accepted.some(a => a.toLowerCase() === (selectedAnswer || '').toLowerCase());
        } else correct = true;

        setIsCorrect(correct);
        setIsChecking(true);
        if (correct) setScore(s => s + 1);
        else setHearts(h => Math.max(0, h - 1));
    };

    const handleNext = () => {
        if (hearts === 0) { navigate('/'); return; }
        if (currentIndex < exercises.length - 1) setCurrentIndex(i => i + 1);
        else setIsFinished(true);
    };

    const canCheck = () => {
        if (!currentEx) return false;
        if (currentEx.exercise_type === 'reorder_words') return orderedTokens.length > 0;
        return selectedAnswer !== null && selectedAnswer !== '';
    };

    const handleWordBankClick = (word) => { if (!isChecking) setOrderedTokens([...orderedTokens, word]); };
    const handleRemoveOrderedWord = (index) => { if (!isChecking) { const t = [...orderedTokens]; t.splice(index, 1); setOrderedTokens(t); } };

    const handlePlayAudio = (text) => { if (text) speak(text); };

    // Enter key shortcut
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Enter') return;
            if (isFinished) return;
            if (isChecking) handleNext();
            else if (canCheck()) handleCheck();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (exercises.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', padding: 24 }}>
                <h2>Loading test...</h2>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
                    <div style={{ width: 120, height: 120, backgroundColor: '#F97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                        <Trophy size={64} color="white" strokeWidth={2} />
                    </div>
                    <h1 style={{ color: '#F97316', fontSize: 28, marginBottom: 8 }}>
                        {isModuleTest ? 'Quiz Complete!' : 'Test Passed!'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 18 }}>{score}/{exercises.length} correct</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
                        {isModuleTest ? 'Next module unlocked!' : 'Next unit unlocked!'}
                    </p>
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
        if (p.target_vi) return p.target_vi;
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

                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(249,115,22,0.2)', border: '2px solid #F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 28 }}>
                        &#127942;
                    </div>

                    {['listen_choose', 'dictation', 'speaking_repeat'].includes(exercise_type) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, alignSelf: 'center' }}>
                            <button
                                className="secondary"
                                style={{ width: 64, height: 64, borderRadius: 16, color: '#F97316', borderColor: '#F97316', boxShadow: '0 4px 0 #C2410C' }}
                                onClick={() => handlePlayAudio(audioText)}
                            >
                                <Volume2 size={32} />
                            </button>
                            {audioText && <span style={{ fontSize: 16, color: 'var(--text-muted)', fontStyle: 'italic' }}>{audioText}</span>}
                        </div>
                    ) : (
                        <div style={{ flex: 1, padding: 16, backgroundColor: 'var(--surface-color)', borderRadius: 16, border: '2px solid var(--border-color)', position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -10, top: 20, width: 20, height: 20, backgroundColor: 'var(--surface-color)', borderLeft: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)', transform: 'rotate(45deg)' }} />
                            <span style={{ fontSize: 18, position: 'relative', zIndex: 2 }}>{prompt.source_text_en || prompt.source_text_vi || prompt.template_vi || "Translate this"}</span>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Multiple Choice */}
                    {['mcq_translate_to_vi', 'mcq_translate_to_en', 'listen_choose', 'diacritics_choice'].includes(exercise_type) &&
                        (prompt.choices_vi || prompt.choices_en).map((choice, idx) => (
                            <button
                                key={idx}
                                className={selectedAnswer === choice ? 'primary' : 'secondary'}
                                style={{
                                    width: '100%', justifyContent: 'flex-start', padding: 20, fontSize: 18,
                                    borderColor: selectedAnswer === choice ? '#F97316' : 'var(--border-color)',
                                    backgroundColor: selectedAnswer === choice ? 'rgba(249,115,22,0.1)' : 'transparent',
                                    color: selectedAnswer === choice ? '#F97316' : 'var(--text-main)'
                                }}
                                onClick={() => !isChecking && setSelectedAnswer(choice)}
                                disabled={isChecking}
                            >
                                {choice}
                            </button>
                        ))}

                    {/* Word Reordering */}
                    {exercise_type === 'reorder_words' && (
                        <>
                            <div style={{ minHeight: 70, padding: '10px 0', borderBottom: '2px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24, alignItems: 'center' }}>
                                {orderedTokens.length === 0 && <span style={{ color: 'var(--text-muted)', padding: '10px 0', width: '100%' }}>Tap words below to build the sentence</span>}
                                {orderedTokens.map((token, idx) => (
                                    <button key={idx} style={{ padding: '10px 16px', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', borderRadius: 12, cursor: isChecking ? 'default' : 'pointer', boxShadow: '0 2px 0 var(--border-color)', fontSize: 17, fontWeight: 500, color: 'var(--text-main)' }} onClick={() => handleRemoveOrderedWord(idx)}>
                                        {token}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                                {availableTokens.map((word, idx) => {
                                    const usedCount = orderedTokens.filter(w => w === word).length;
                                    const bankBefore = availableTokens.slice(0, idx).filter(w => w === word).length;
                                    const isUsed = bankBefore < usedCount;
                                    return (
                                        <button key={`bank-${idx}`} style={{
                                            padding: '10px 16px', borderRadius: 12, fontSize: 17, fontWeight: 500,
                                            boxShadow: isUsed ? 'none' : '0 2px 0 var(--border-color)',
                                            backgroundColor: isUsed ? 'var(--bg-color)' : 'var(--surface-color)',
                                            border: isUsed ? '2px solid transparent' : '2px solid var(--border-color)',
                                            color: isUsed ? 'transparent' : 'var(--text-main)',
                                            cursor: isUsed || isChecking ? 'default' : 'pointer',
                                            pointerEvents: isUsed ? 'none' : 'auto',
                                        }} onClick={() => !isUsed && handleWordBankClick(word)} disabled={isUsed || isChecking}>
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
                            style={{ width: '100%', padding: 20, fontSize: 20, borderRadius: 16, backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', marginTop: 16 }}
                            disabled={isChecking}
                        />
                    )}

                    {/* Simulation placeholders */}
                    {['match_pairs', 'speaking_repeat'].includes(exercise_type) && (
                        <div style={{ textAlign: 'center', padding: 32, backgroundColor: 'var(--surface-color)', borderRadius: 16, border: '2px dashed var(--border-color)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>Simulation: Click proceed to simulate completing this exercise.</p>
                            <button className="primary mt-4" onClick={() => setSelectedAnswer('simulated_pass')} disabled={isChecking}>SIMULATE PASS</button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
            {/* Top bar */}
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <button className="ghost" onClick={() => navigate('/')} style={{ padding: 8 }}>
                    <X size={24} color="var(--text-muted)" />
                </button>
                <div style={{ flex: 1, height: 16, backgroundColor: 'var(--surface-color)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#F97316', transition: 'width 0.3s ease-out', borderRadius: 8 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger-color)', fontWeight: 700 }}>
                    <Heart size={24} fill="var(--danger-color)" /> {hearts}
                </div>
            </div>

            {/* Main content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {hearts === 0 ? (
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: 32, color: 'var(--danger-color)' }}>Out of Hearts!</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Keep practicing to earn more.</p>
                        </div>
                    ) : renderExercise()}
                </div>
            </div>

            {/* Bottom check bar */}
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
                                width: '100%', fontSize: 18,
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
                        style={{ width: '100%', fontSize: 18, opacity: canCheck() ? 1 : 0.5, backgroundColor: '#F97316', boxShadow: '0 4px 0 #C2410C' }}
                        onClick={handleCheck}
                        disabled={!canCheck()}
                    >
                        CHECK
                    </button>
                )}
            </div>
        </div>
    );
};

export default UnitTest;
