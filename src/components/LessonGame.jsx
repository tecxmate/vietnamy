import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Heart, Check, Volume2 } from 'lucide-react';
// We'll parse the exercises from localStorage directly for this component

// We'll add this specific export to db.js if it doesn't exist, but for now we can read raw from localStorage
const loadExercisesForLesson = (lessonId) => {
    const raw = localStorage.getItem('vnme_mock_db_v2');
    if (!raw) return [];
    const db = JSON.parse(raw);
    const exercises = (db.exercises || []).filter(ex => ex.lesson_id === lessonId);
    return exercises;
};

const LessonGame = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    const [exercises, setExercises] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hearts, setHearts] = useState(5);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [isFinished, setIsFinished] = useState(false);

    // Specifically for reorder exercises
    const [orderedTokens, setOrderedTokens] = useState([]);
    const [availableTokens, setAvailableTokens] = useState([]);

    useEffect(() => {
        const loaded = loadExercisesForLesson(lessonId);
        // If there are no exercises, maybe redirect back or show error
        if (loaded.length === 0) {
            console.warn(`No exercises found for ${lessonId}`);
        }
        setExercises(loaded);
    }, [lessonId]);

    const currentEx = exercises[currentIndex];
    const progress = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0;

    useEffect(() => {
        // Reset state per question
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
            // For text input, we check if it matches accepted answers
            const accepted = currentEx.prompt.accepted_answers_vi || [currentEx.prompt.answer_vi];
            correct = accepted.some(ans => ans.toLowerCase() === (selectedAnswer || '').toLowerCase());
        } else {
            // For speaking or match pairs we just auto-pass for this MVP
            correct = true;
        }

        setIsCorrect(correct);
        setIsChecking(true);

        if (!correct) {
            setHearts(prev => Math.max(0, prev - 1));
        }
    };

    const handleNext = () => {
        if (hearts === 0) {
            navigate('/'); // Failed, go back
            return;
        }

        if (currentIndex < exercises.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Finished!
            // In a real app we would mark the node as completed in DB here
            setIsFinished(true);
        }
    };

    if (exercises.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', padding: 24 }}>
                <h2>No exercises found for this lesson.</h2>
                <button className="primary mt-4" onClick={() => navigate('/')}>Return to Roadmap</button>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
                    <div style={{ width: 120, height: 120, backgroundColor: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
                        <Check size={64} color="#1A1A1A" strokeWidth={3} />
                    </div>
                    <h1 style={{ color: 'var(--primary-color)', fontSize: 32, marginBottom: 16 }}>Lesson Complete!</h1>
                    <p style={{ color: 'var(--text-muted)' }}>You did a great job completing {exercises.length} exercises.</p>
                </div>

                <div style={{ padding: 24, borderTop: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
                    <button className="primary w-full shadow-lg" onClick={() => navigate('/')}>CONTINUE</button>
                </div>
            </div>
        );
    }

    const renderExercise = () => {
        if (!currentEx) return null;

        const { exercise_type, prompt } = currentEx;

        return (
            <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <h2 style={{ fontSize: 24, margin: 0 }}>{prompt.instruction}</h2>

                {/* Question Prompt Area */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        🦉
                    </div>

                    {['listen_choose', 'dictation', 'speaking_repeat'].includes(exercise_type) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, alignSelf: 'center' }}>
                            <button className="secondary" style={{ width: 64, height: 64, borderRadius: 16, color: 'var(--secondary-color)', borderColor: 'var(--secondary-color)', boxShadow: '0 4px 0 var(--secondary-color)' }}>
                                <Volume2 size={32} />
                            </button>
                            {(exercise_type === 'speaking_repeat' || exercise_type === 'dictation') && prompt.target_vi && (
                                <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>Audio Simulation Placeholder</span>
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

                    {/* Word Reordering */}
                    {exercise_type === 'reorder_words' && (
                        <>
                            <div style={{ minHeight: 60, padding: 16, borderBottom: '2px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                {orderedTokens.map((token, idx) => (
                                    <div key={idx}
                                        style={{ padding: '8px 16px', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', borderRadius: 12, cursor: 'pointer', boxShadow: '0 2px 0 var(--border-color)' }}
                                        onClick={() => {
                                            if (isChecking) return;
                                            setOrderedTokens(orderedTokens.filter((_, i) => i !== idx));
                                            setAvailableTokens([...availableTokens, token]);
                                        }}
                                    >
                                        {token}
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                                {availableTokens.map((token, idx) => (
                                    <div key={idx}
                                        style={{ padding: '8px 16px', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', borderRadius: 12, cursor: 'pointer', boxShadow: '0 2px 0 var(--border-color)' }}
                                        onClick={() => {
                                            if (isChecking) return;
                                            setAvailableTokens(availableTokens.filter((_, i) => i !== idx));
                                            setOrderedTokens([...orderedTokens, token]);
                                        }}
                                    >
                                        {token}
                                    </div>
                                ))}
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

    // Calculate if we can check (button state)
    const canCheck = () => {
        if (!currentEx) return false;
        if (currentEx.exercise_type === 'reorder_words') return orderedTokens.length > 0;
        return selectedAnswer !== null && selectedAnswer !== '';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>

            {/* Top Bar Navigation */}
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <button className="ghost" onClick={() => navigate('/')} style={{ padding: 8 }}>
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

        </div>
    );
};

export default LessonGame;
