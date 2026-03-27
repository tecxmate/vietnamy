import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Volume2, Heart, Check, X, BookOpenText, Trophy } from 'lucide-react';
import { getNodeById } from '../lib/db';
import { getGrammarItems } from '../lib/grammarDB';
import { useDong } from '../context/DongContext';
import speak from '../utils/speak';
import { playSuccess, playError } from '../utils/sound';
import SoundButton from '../components/SoundButton';

// Build tip cards from a grammar item's data
function buildTipCards(item) {
    const cards = [];
    const { title, pattern, example, sections, extracted_patterns } = item;

    // Card 1: Intro — title + pattern + main example
    cards.push({
        type: 'intro',
        title: `Here's a ${title} tip`,
        pattern,
        example,
    });

    // One card per section — cap examples at 3
    if (sections && sections.length > 0) {
        for (const sec of sections) {
            // Skip sections with no real content
            if (!sec.heading && !sec.explanation && (!sec.examples || sec.examples.length === 0)) continue;

            cards.push({
                type: 'section',
                heading: sec.heading || null,
                explanation: sec.explanation || null,
                pattern: sec.pattern || null,
                examples: (sec.examples || []).slice(0, 3),
                note: sec.note || null,
            });
        }
    }

    // If there are extracted patterns, add a summary card
    if (extracted_patterns && extracted_patterns.length > 0) {
        cards.push({
            type: 'patterns',
            title: 'Key Patterns',
            patterns: extracted_patterns.slice(0, 4),
        });
    }

    return cards;
}

// --- Tip Card Components ---

const IntroCard = ({ card }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
            {card.title}
        </h2>

        {card.pattern && (
            <div style={{ textAlign: 'center' }}>
                <span style={{
                    display: 'inline-block', padding: '10px 24px',
                    backgroundColor: 'rgba(6,214,160,0.12)', border: '2px solid rgba(6,214,160,0.3)',
                    borderRadius: 16, fontWeight: 700, fontSize: 17, color: '#06D6A0',
                }}>
                    {card.pattern}
                </span>
            </div>
        )}

        {card.example?.vi && (
            <div style={{
                backgroundColor: 'var(--surface-color)', borderRadius: 16, padding: 20,
                display: 'flex', alignItems: 'center', gap: 12,
                border: '1px solid var(--border-color)',
            }}>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>{card.example.vi}</p>
                    {card.example.en && (
                        <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 15 }}>{card.example.en}</p>
                    )}
                </div>
                <button onClick={() => speak(card.example.vi)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#06D6A0', padding: 8, borderRadius: 8,
                }}>
                    <Volume2 size={22} />
                </button>
            </div>
        )}
    </div>
);

const SectionCard = ({ card }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {card.heading && (
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                {card.heading}
            </h3>
        )}

        {card.explanation && (
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--text-main)' }}>
                {card.explanation}
            </p>
        )}

        {card.pattern && (
            <div style={{ textAlign: 'center' }}>
                <span style={{
                    display: 'inline-block', padding: '8px 20px',
                    backgroundColor: 'rgba(6,214,160,0.1)', borderRadius: 12,
                    fontSize: 15, fontWeight: 700, color: '#06D6A0',
                }}>
                    {card.pattern}
                </span>
            </div>
        )}

        {card.examples.length > 0 && (
            <div style={{
                backgroundColor: 'var(--surface-color)', borderRadius: 12,
                border: '1px solid var(--border-color)', overflow: 'hidden',
            }}>
                {card.examples.map((ex, j) => (
                    <div key={j} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 16px',
                        borderTop: j > 0 ? '1px solid var(--border-color)' : 'none',
                    }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: 15 }}>{ex.vi}</span>
                            {ex.en && <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>— {ex.en}</span>}
                        </div>
                        {ex.vi && (
                            <button onClick={() => speak(ex.vi)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', padding: 4,
                            }}>
                                <Volume2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}

        {card.note && (
            <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: 'var(--text-muted)' }}>
                {card.note}
            </p>
        )}
    </div>
);

const PatternsCard = ({ card }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {card.title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {card.patterns.map((p, i) => (
                <div key={i} style={{
                    padding: '12px 16px', backgroundColor: 'var(--surface-color)',
                    borderRadius: 12, border: '1px solid var(--border-color)',
                    fontWeight: 600, fontSize: 15, color: '#06D6A0',
                }}>
                    {p}
                </div>
            ))}
        </div>
    </div>
);

function renderCard(card) {
    switch (card.type) {
        case 'intro': return <IntroCard card={card} />;
        case 'section': return <SectionCard card={card} />;
        case 'patterns': return <PatternsCard card={card} />;
        default: return null;
    }
}

// --- Main Component ---

const GrammarLesson = () => {
    const { nodeId } = useParams();
    const navigate = useNavigate();
    const dongCtx = useDong();

    const [phase, setPhase] = useState('tips'); // 'tips' | 'quiz' | 'finished'
    const [grammarItem, setGrammarItem] = useState(null);
    const [tipCards, setTipCards] = useState([]);
    const [cardIndex, setCardIndex] = useState(0);
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
        if (!node || !node.skill_content) { navigate('/', { state: { tab: 'study' } }); return; }

        const { grammar_level, grammar_index } = node.skill_content;
        const items = getGrammarItems().filter(i => i.level === grammar_level);
        const item = items[grammar_index];
        if (!item) { navigate('/', { state: { tab: 'study' } }); return; }
        setGrammarItem(item);
        setTipCards(buildTipCards(item));

        // Load exercises for this grammar node from the DB
        const raw = localStorage.getItem('vnme_mock_db_v7');
        if (raw) {
            const db = JSON.parse(raw);
            const nodeExercises = (db.exercises || []).filter(ex => ex.lesson_id === nodeId);
            setExercises(nodeExercises);
        }
    }, [nodeId, navigate]);

    useEffect(() => {
        if (phase === 'finished' && !rewardGivenRef.current) {
            rewardGivenRef.current = true;
            dongCtx.completeNode(nodeId, { immediate: true });
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
        if (correct) { playSuccess(); setScore(s => s + 1); }
        else { playError(); setHearts(h => Math.max(0, h - 1)); }
    };

    const handleNext = () => {
        if (hearts === 0) { navigate('/', { state: { tab: 'study' } }); return; }
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

    // Keyboard navigation
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Enter') {
                if (phase === 'tips') {
                    if (cardIndex < tipCards.length - 1) setCardIndex(i => i + 1);
                    else if (exercises.length > 0) setPhase('quiz');
                    else { dongCtx.completeNode(nodeId, { immediate: true }); navigate('/', { state: { tab: 'study' } }); }
                } else if (phase === 'quiz') {
                    if (isChecking) handleNext();
                    else if (canCheck()) handleCheck();
                }
            }
            if (phase === 'tips') {
                if (e.key === 'ArrowRight' && cardIndex < tipCards.length - 1) setCardIndex(i => i + 1);
                if (e.key === 'ArrowLeft' && cardIndex > 0) setCardIndex(i => i - 1);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (!grammarItem) return null;

    const isLastCard = cardIndex === tipCards.length - 1;

    // --- TIPS PHASE (card-based) ---
    if (phase === 'tips') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
                {/* Header */}
                <header style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate('/', { state: { tab: 'study' } })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                        <X size={24} />
                    </button>
                    <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 15, color: 'var(--text-muted)' }}>
                        {grammarItem.title}
                    </span>
                    <div style={{ width: 24 }} /> {/* spacer for centering */}
                </header>

                {/* Progress dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '0 24px 16px' }}>
                    {tipCards.map((_, i) => (
                        <div key={i} style={{
                            width: i === cardIndex ? 24 : 8, height: 8, borderRadius: 4,
                            backgroundColor: i <= cardIndex ? '#06D6A0' : 'var(--border-color)',
                            transition: 'all 0.3s ease',
                        }} />
                    ))}
                </div>

                {/* Card content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
                    <div style={{ maxWidth: 480, margin: '0 auto' }}>
                        {renderCard(tipCards[cardIndex])}
                    </div>
                </div>

                {/* Bottom navigation */}
                <div style={{ padding: '16px 24px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
                    <div style={{ display: 'flex', gap: 12, maxWidth: 480, margin: '0 auto' }}>
                        {cardIndex > 0 && (
                            <button
                                className="secondary"
                                style={{ padding: '16px 20px', borderRadius: 14, fontSize: 16, fontWeight: 700 }}
                                onClick={() => setCardIndex(i => i - 1)}
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <SoundButton
                            className="primary shadow-lg"
                            style={{
                                flex: 1, fontSize: 17, padding: '16px 24px', borderRadius: 14,
                                backgroundColor: '#06D6A0', boxShadow: '0 4px 0 #05A67D',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                            onClick={() => {
                                if (!isLastCard) {
                                    setCardIndex(i => i + 1);
                                } else if (exercises.length > 0) {
                                    setPhase('quiz');
                                } else {
                                    dongCtx.completeNode(nodeId, { immediate: true });
                                    navigate('/', { state: { tab: 'study' } });
                                }
                            }}
                        >
                            {isLastCard
                                ? (exercises.length > 0 ? 'START LESSON' : 'DONE')
                                : <>CONTINUE <ArrowRight size={18} /></>
                            }
                        </SoundButton>
                    </div>
                </div>
            </div>
        );
    }

    // --- FINISHED PHASE ---
    const ACCENT = '#06D6A0';
    if (phase === 'finished') {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'var(--bg-color)', color: 'var(--text-main)',
                padding: '40px 24px', gap: 24,
            }}>
                <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    backgroundColor: `${ACCENT}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Trophy size={40} color={ACCENT} fill={ACCENT} />
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, textAlign: 'center' }}>
                    Grammar Complete!
                </h2>

                <div style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                    You scored <strong style={{ color: ACCENT }}>{score}/{exercises.length}</strong>
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
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#EF4444' }}>{hearts}/{5}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Hearts</div>
                    </div>
                </div>

                <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <SoundButton
                        style={{
                            width: '100%', padding: '16px 24px', borderRadius: 14,
                            border: 'none', cursor: 'pointer',
                            backgroundColor: ACCENT, color: '#fff',
                            fontWeight: 800, fontSize: 16,
                            boxShadow: '0 4px 0 #05A67D',
                        }}
                        onClick={() => navigate('/', { state: { tab: 'study' } })}
                    >
                        CONTINUE
                    </SoundButton>
                </div>
            </div>
        );
    }

    // --- QUIZ PHASE ---
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
            {/* Top bar */}
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <button className="ghost" onClick={() => navigate('/', { state: { tab: 'study' } })} style={{ padding: 8 }}>
                    <X size={24} color="var(--text-muted)" />
                </button>
                <div style={{ flex: 1, height: 16, backgroundColor: 'var(--surface-color)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#06D6A0', transition: 'width 0.3s ease-out', borderRadius: 8 }} />
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
                                <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(6,214,160,0.2)', border: '2px solid #06D6A0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <BookOpenText size={28} color="#06D6A0" />
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
                                                borderColor: selectedAnswer === choice ? '#06D6A0' : 'var(--border-color)',
                                                backgroundColor: selectedAnswer === choice ? 'rgba(6,214,160,0.1)' : 'transparent',
                                                color: selectedAnswer === choice ? '#06D6A0' : 'var(--text-main)'
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
                        <SoundButton
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
                        </SoundButton>
                    </div>
                ) : (
                    <SoundButton
                        className={`${canCheck() ? 'primary' : 'disabled'} shadow-lg`}
                        style={{ width: '100%', fontSize: 18, opacity: canCheck() ? 1 : 0.5, backgroundColor: '#06D6A0', boxShadow: '0 4px 0 #05A67D' }}
                        onClick={handleCheck}
                    >
                        CHECK
                    </SoundButton>
                )}
            </div>
        </div>
    );
};

export default GrammarLesson;
