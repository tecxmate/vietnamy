import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Volume2, Heart, Check, X } from 'lucide-react';
import { getNodeById, getGrammarTip } from '../lib/db';
import { getGrammarItems } from '../lib/grammarDB';
import { useDong } from '../context/DongContext';
import speak from '../utils/speak';

const GrammarLesson = () => {
    const { nodeId } = useParams();
    const navigate = useNavigate();
    const dongCtx = useDong();

    const [phase, setPhase] = useState('tip'); // 'tip' | 'quiz' | 'finished'
    const [tipData, setTipData] = useState(null);
    const [exercises, setExercises] = useState([]);

    // Quiz state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hearts, setHearts] = useState(5);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [score, setScore] = useState(0);
    const rewardGivenRef = useRef(false);

    useEffect(() => {
        const node = getNodeById(nodeId);
        if (!node) { navigate('/'); return; }

        // New grammar_tip node type
        if (node.node_type === 'grammar_tip' && node.grammar_id) {
            const tip = getGrammarTip(node.grammar_id);
            if (!tip) { navigate('/'); return; }
            setTipData(tip);
            setExercises(tip.exercises || []);
            return;
        }

        // Legacy: skill node with grammar_lesson content
        if (node.skill_content?.type === 'grammar_lesson') {
            const { grammar_level, grammar_index } = node.skill_content;
            const items = getGrammarItems().filter(i => i.level === grammar_level);
            const item = items[grammar_index];
            if (!item) { navigate('/'); return; }
            // Convert legacy grammar item to tip format
            setTipData({
                id: nodeId,
                title: item.title,
                tip_heading: `Here's a ${item.title} tip`,
                tip_body: item.sections?.[0]?.explanation || '',
                pattern: item.pattern,
                table: null,
                examples: item.example ? [item.example] : [],
                exercises: [],
            });
            // Load exercises from DB for legacy nodes
            const raw = localStorage.getItem('vnme_mock_db_v6') || localStorage.getItem('vnme_mock_db_v5');
            if (raw) {
                const db = JSON.parse(raw);
                setExercises((db.exercises || []).filter(ex => ex.lesson_id === nodeId));
            }
            return;
        }

        navigate('/');
    }, [nodeId, navigate]);

    useEffect(() => {
        if (phase === 'finished' && !rewardGivenRef.current) {
            rewardGivenRef.current = true;
            dongCtx.completeNode(nodeId);
        }
    }, [phase]);

    const currentEx = exercises[currentIndex];
    const progress = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0;

    const handleCheck = () => {
        if (!currentEx) return;
        let correct = false;
        if (currentEx.exercise_type === 'mcq_translate_to_vi') correct = selectedAnswer === currentEx.prompt.answer_vi;
        else if (currentEx.exercise_type === 'mcq_translate_to_en') correct = selectedAnswer === currentEx.prompt.answer_en;
        else if (currentEx.exercise_type === 'fill_blank') {
            const accepted = currentEx.prompt.accepted_answers_vi || [currentEx.prompt.answer_vi];
            correct = accepted.some(a => a.toLowerCase() === (selectedAnswer || '').toLowerCase());
        } else if (currentEx.exercise_type === 'diacritics_choice') correct = selectedAnswer === currentEx.prompt.answer_vi;
        else correct = selectedAnswer !== null;

        setIsCorrect(correct);
        setIsChecking(true);
        if (correct) setScore(s => s + 1);
        else setHearts(h => Math.max(0, h - 1));
    };

    const handleNext = () => {
        if (hearts === 0) { navigate('/'); return; }
        if (currentIndex < exercises.length - 1) {
            setCurrentIndex(i => i + 1);
            setSelectedAnswer(null);
            setIsChecking(false);
            setIsCorrect(null);
        } else {
            setPhase('finished');
        }
    };

    const canCheck = () => selectedAnswer !== null && selectedAnswer !== '';

    // Enter key shortcut
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Enter') return;
            if (phase === 'quiz') {
                if (isChecking) handleNext();
                else if (canCheck()) handleCheck();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (!tipData) return null;

    // ─── TIP PHASE (Duolingo-style) ─────────────────────────
    if (phase === 'tip') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#fff', color: '#3C3C3C' }}>
                {/* Header */}
                <header style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #E5E5E5' }}>
                    <X size={24} onClick={() => navigate('/')} style={{ cursor: 'pointer', color: '#AFAFAF' }} />
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#AFAFAF' }}>
                        {tipData.title}
                    </span>
                    <div style={{ width: 24 }} />
                </header>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
                    {/* Tip heading */}
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 12px', color: '#3C3C3C' }}>
                        {tipData.tip_heading || `Here's a ${tipData.title} tip`}
                    </h2>

                    {/* Tip body */}
                    {tipData.tip_body && (
                        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#777', margin: '0 0 24px' }}>
                            {tipData.tip_body}
                        </p>
                    )}

                    {/* Conjugation / Pattern Table */}
                    {tipData.table && (
                        <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E5E5' }}>
                            {/* Table header */}
                            <div style={{ display: 'flex', backgroundColor: '#F7F7F7', borderBottom: '2px dotted #E0E0E0' }}>
                                {tipData.table.headers.map((h, i) => (
                                    <div key={i} style={{
                                        flex: 1, padding: '12px 16px', fontSize: 13, fontWeight: 700,
                                        color: '#AFAFAF', textTransform: 'lowercase',
                                        borderRight: i < tipData.table.headers.length - 1 ? '1px dotted #E0E0E0' : 'none',
                                    }}>
                                        {h}
                                    </div>
                                ))}
                            </div>
                            {/* Table rows */}
                            {tipData.table.rows.map((row, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    borderBottom: i < tipData.table.rows.length - 1 ? '1px solid #F0F0F0' : 'none',
                                }}>
                                    {row.map((cell, j) => (
                                        <div key={j} style={{
                                            flex: 1, padding: '14px 16px', fontSize: 16,
                                            fontWeight: j === tipData.table.highlight_col ? 600 : 400,
                                            color: j === tipData.table.highlight_col
                                                ? (tipData.table.highlight_color || '#1CB0F6')
                                                : '#3C3C3C',
                                            borderRight: j < row.length - 1 ? '1px dotted #E0E0E0' : 'none',
                                        }}>
                                            {cell}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Examples */}
                    {tipData.examples && tipData.examples.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            {tipData.examples.map((ex, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '12px 0',
                                    borderBottom: i < tipData.examples.length - 1 ? '1px solid #F0F0F0' : 'none',
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{ex.vi}</p>
                                        {ex.en && <p style={{ margin: '2px 0 0', color: '#999', fontSize: 13 }}>{ex.en}</p>}
                                    </div>
                                    <button onClick={() => speak(ex.vi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AFAFAF', padding: 6 }}>
                                        <Volume2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Start Lesson CTA */}
                <div style={{ padding: '16px 24px 32px' }}>
                    {exercises.length > 0 ? (
                        <button
                            className="primary w-full shadow-lg"
                            style={{
                                fontSize: 16, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
                                backgroundColor: '#58CC02', boxShadow: '0 5px 0 #58A700',
                                borderRadius: 14, padding: '16px 24px',
                            }}
                            onClick={() => setPhase('quiz')}
                        >
                            START LESSON
                        </button>
                    ) : (
                        <button
                            className="primary w-full shadow-lg"
                            style={{
                                fontSize: 16, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
                                backgroundColor: '#58CC02', boxShadow: '0 5px 0 #58A700',
                                borderRadius: 14, padding: '16px 24px',
                            }}
                            onClick={() => { dongCtx.completeNode(nodeId); navigate('/'); }}
                        >
                            MARK AS READ
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ─── FINISHED PHASE ─────────────────────────────────────
    if (phase === 'finished') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
                    <div style={{ width: 120, height: 120, backgroundColor: '#58CC02', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                        <Check size={64} color="white" strokeWidth={3} />
                    </div>
                    <h1 style={{ color: '#58CC02', fontSize: 28, marginBottom: 8 }}>Lesson Complete!</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{score}/{exercises.length} correct</p>
                </div>
                <div style={{ padding: '16px 24px 32px' }}>
                    <button
                        className="primary w-full shadow-lg"
                        style={{ fontSize: 16, fontWeight: 800, backgroundColor: '#58CC02', boxShadow: '0 5px 0 #58A700', borderRadius: 14, padding: '16px 24px' }}
                        onClick={() => navigate('/')}
                    >
                        CONTINUE
                    </button>
                </div>
            </div>
        );
    }

    // ─── QUIZ PHASE ─────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
            {/* Top bar */}
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <button className="ghost" onClick={() => navigate('/')} style={{ padding: 8 }}>
                    <X size={24} color="var(--text-muted)" />
                </button>
                <div style={{ flex: 1, height: 16, backgroundColor: 'var(--surface-color)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#58CC02', transition: 'width 0.3s ease-out', borderRadius: 8 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger-color)', fontWeight: 700 }}>
                    <Heart size={24} fill="var(--danger-color)" /> {hearts}
                </div>
            </div>

            {/* Exercise content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {hearts === 0 ? (
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: 32, color: 'var(--danger-color)' }}>Out of Hearts!</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Keep practicing to earn more.</p>
                        </div>
                    ) : currentEx ? (
                        <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <h2 style={{ fontSize: 24, margin: 0 }}>{currentEx.prompt.instruction}</h2>

                            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(88,204,2,0.15)', border: '2px solid #58CC02', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 28 }}>
                                    &#128218;
                                </div>
                                <div style={{ flex: 1, padding: 16, backgroundColor: 'var(--surface-color)', borderRadius: 16, border: '2px solid var(--border-color)', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: -10, top: 20, width: 20, height: 20, backgroundColor: 'var(--surface-color)', borderLeft: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)', transform: 'rotate(45deg)' }} />
                                    <span style={{ fontSize: 18, position: 'relative', zIndex: 2 }}>{currentEx.prompt.source_text_en || currentEx.prompt.source_text_vi || currentEx.prompt.template_vi || "Translate this"}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {['mcq_translate_to_vi', 'mcq_translate_to_en', 'diacritics_choice'].includes(currentEx.exercise_type) &&
                                    (currentEx.prompt.choices_vi || currentEx.prompt.choices_en).map((choice, idx) => (
                                        <button
                                            key={idx}
                                            className={selectedAnswer === choice ? 'primary' : 'secondary'}
                                            style={{
                                                width: '100%', justifyContent: 'flex-start', padding: 20, fontSize: 18,
                                                borderColor: selectedAnswer === choice ? '#58CC02' : 'var(--border-color)',
                                                backgroundColor: selectedAnswer === choice ? 'rgba(88,204,2,0.1)' : 'transparent',
                                                color: selectedAnswer === choice ? '#58CC02' : 'var(--text-main)'
                                            }}
                                            onClick={() => !isChecking && setSelectedAnswer(choice)}
                                            disabled={isChecking}
                                        >
                                            {choice}
                                        </button>
                                    ))}

                                {currentEx.exercise_type === 'fill_blank' && (
                                    <input
                                        type="text"
                                        placeholder="Type in Vietnamese"
                                        value={selectedAnswer || ''}
                                        onChange={(e) => !isChecking && setSelectedAnswer(e.target.value)}
                                        style={{ width: '100%', padding: 20, fontSize: 20, borderRadius: 16, backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', marginTop: 16 }}
                                        disabled={isChecking}
                                    />
                                )}
                            </div>
                        </div>
                    ) : null}
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
                                {currentEx?.prompt?.answer_vi || currentEx?.prompt?.answer_en}
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
                        style={{ width: '100%', fontSize: 18, opacity: canCheck() ? 1 : 0.5, backgroundColor: '#58CC02', boxShadow: '0 5px 0 #58A700' }}
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

export default GrammarLesson;
