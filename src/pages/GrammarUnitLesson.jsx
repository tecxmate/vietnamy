/**
 * GrammarUnitLesson — Full lesson page for a single grammar unit.
 *
 * Three-phase flow:
 *   1. Tips  — Card carousel showing pattern, explanation, and examples
 *   2. Quiz  — 6 auto-generated exercises with 5-heart system
 *   3. Done  — Score summary, coin reward, completion
 *
 * Route: /grammar-unit/:unitId
 * Data source: grammar_modules.json via grammarModulesDB
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Volume2, Heart, X,
    BookOpenText, Trophy
} from 'lucide-react';
import { getUnit, generateExercisesForUnit, loadGrammarModules } from '../lib/grammarModulesDB';
import { useDong } from '../context/DongContext';
import speak from '../utils/speak';
import { playSuccess, playError } from '../utils/sound';
import SoundButton from '../components/SoundButton';
import {
    MCQOptions, FillBlankInput, ReorderWords, MatchPairs,
    FeedbackBanner, ProgressBar, checkAnswer,
} from '../components/Exercise';

const ACCENT = '#A78BFA'; // purple — matches roadmap node color
const EXERCISES_PER_LESSON = 6;

// ─── Tip card builders ──────────────────────────────────────────

function buildTipCards(unit, module) {
    const cards = [];

    // Card 1: Intro
    cards.push({
        type: 'intro',
        title: unit.title,
        pattern: unit.pattern,
        moduleName: module.title,
        explanation: unit.explanation,
    });

    // Card 2: Examples showcase
    if (unit.examples && unit.examples.length > 0) {
        cards.push({
            type: 'examples',
            title: 'Examples',
            examples: unit.examples.slice(0, 5),
        });
    }

    // Card 3: Note / tip (if available)
    if (unit.note) {
        cards.push({
            type: 'note',
            title: 'Good to Know',
            note: unit.note,
        });
    }

    return cards;
}

// ─── Tip Card Components ────────────────────────────────────────

function IntroCard({ card }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: 1.5, color: ACCENT,
            }}>
                {card.moduleName}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
                {card.title}
            </h2>

            {card.pattern && (
                <div style={{ textAlign: 'center' }}>
                    <span style={{
                        display: 'inline-block', padding: '10px 24px',
                        backgroundColor: 'rgba(167,139,250,0.12)', border: '2px solid rgba(167,139,250,0.3)',
                        borderRadius: 16, fontWeight: 700, fontSize: 17, color: ACCENT,
                    }}>
                        {card.pattern}
                    </span>
                </div>
            )}

            {card.explanation && (
                <p style={{
                    margin: 0, fontSize: 15, lineHeight: 1.65,
                    color: 'var(--text-main)',
                }}>
                    {card.explanation}
                </p>
            )}
        </div>
    );
}

function ExamplesCard({ card }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{
                fontSize: 16, fontWeight: 800, margin: 0,
                textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)',
            }}>
                {card.title}
            </h3>
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
        </div>
    );
}

function NoteCard({ card }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{
                fontSize: 16, fontWeight: 800, margin: 0,
                textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)',
            }}>
                {card.title}
            </h3>
            <div style={{
                padding: '16px 20px', borderRadius: 12,
                backgroundColor: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
            }}>
                <p style={{
                    margin: 0, fontSize: 14, lineHeight: 1.6,
                    color: 'var(--text-main)', fontStyle: 'italic',
                }}>
                    {card.note}
                </p>
            </div>
        </div>
    );
}

function renderTipCard(card) {
    switch (card.type) {
        case 'intro': return <IntroCard card={card} />;
        case 'examples': return <ExamplesCard card={card} />;
        case 'note': return <NoteCard card={card} />;
        default: return null;
    }
}

// ─── Exercise Renderer (uses shared components) ─────────────────

function renderExercise(exercise, selectedAnswer, onSelect, isChecking, isCorrect, reorderWords, setReorderWords) {
    const type = exercise.exercise_type;
    const prompt = exercise.prompt;

    if (['mcq_translate_to_en', 'mcq_translate_to_vi', 'listen_choose'].includes(type)) {
        const isMCQToEn = type === 'mcq_translate_to_en';
        const isMCQToVi = type === 'mcq_translate_to_vi';
        const isListenChoose = type === 'listen_choose';

        const question = isMCQToEn ? prompt.sentence_vi :
            isMCQToVi ? prompt.sentence_en :
                isListenChoose ? prompt.audio_vi : '';
        const options = isMCQToEn ? prompt.options_en :
            isMCQToVi ? prompt.options_vi :
                isListenChoose ? prompt.options_en : [];
        const correctAns = isMCQToEn ? prompt.answer_en :
            isMCQToVi ? prompt.answer_vi :
                isListenChoose ? prompt.answer_en : '';

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 8,
                    }}>
                        {isMCQToEn ? 'Translate to English' :
                            isMCQToVi ? 'Translate to Vietnamese' :
                                'Listen and choose'}
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                        {(isMCQToEn || isListenChoose) && (
                            <button onClick={() => speak(question)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--accent-color)', padding: 4,
                            }}>
                                <Volume2 size={20} />
                            </button>
                        )}
                        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)' }}>
                            {question}
                        </span>
                    </div>
                </div>
                <MCQOptions
                    options={options}
                    selectedAnswer={selectedAnswer}
                    correctAnswer={correctAns}
                    onSelect={onSelect}
                    isChecking={isChecking}
                    isCorrect={isCorrect}
                />
            </div>
        );
    }

    if (type === 'fill_blank') {
        return (
            <FillBlankInput
                sentenceWithBlank={prompt.sentence_with_blank}
                hintText={prompt.hint_en}
                value={selectedAnswer || ''}
                onChange={onSelect}
                isChecking={isChecking}
                isCorrect={isCorrect}
                correctAnswer={prompt.answer_vi}
                mode="input"
            />
        );
    }

    if (type === 'reorder_words') {
        return (
            <ReorderWords
                shuffledWords={prompt.words_shuffled}
                hintText={prompt.hint_en}
                selectedWords={reorderWords}
                onToggleWord={(word, idx) => {
                    if (isChecking) return;
                    // Check if removing from selected or adding from bank
                    const selectedIdx = reorderWords.indexOf(word);
                    if (selectedIdx !== -1 && idx === selectedIdx) {
                        // Remove from selected
                        const newSelected = [...reorderWords];
                        newSelected.splice(idx, 1);
                        setReorderWords(newSelected);
                        onSelect(newSelected.join(' '));
                    } else {
                        // Add to selected
                        const newSelected = [...reorderWords, word];
                        setReorderWords(newSelected);
                        onSelect(newSelected.join(' '));
                    }
                }}
                isChecking={isChecking}
                isCorrect={isCorrect}
                correctAnswer={prompt.answer_vi}
            />
        );
    }

    if (type === 'match_pairs') {
        return (
            <MatchPairs
                pairs={prompt.pairs}
                onComplete={() => onSelect('__match_complete__')}
            />
        );
    }

    // Fallback: render as MCQ
    const options = prompt.options_en || prompt.options_vi || [];
    const correctAns = prompt.answer_en || prompt.answer_vi || '';
    return (
        <MCQOptions
            options={options}
            selectedAnswer={selectedAnswer}
            correctAnswer={correctAns}
            onSelect={onSelect}
            isChecking={isChecking}
            isCorrect={isCorrect}
        />
    );
}

// ─── Main Component ─────────────────────────────────────────────

export default function GrammarUnitLesson() {
    const { unitId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roadmapNodeId = searchParams.get('nodeId'); // path_node ID from roadmap
    const dongCtx = useDong();
    const GRAMMAR_SESSIONS = 2;
    const session = roadmapNodeId ? dongCtx.getNodeSessionCount(roadmapNodeId) : 0;

    const [phase, setPhase] = useState(session >= 1 ? 'quiz' : 'tips');
    const [cardIndex, setCardIndex] = useState(0);
    // Quiz state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hearts, setHearts] = useState(5);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [score, setScore] = useState(0);
    const [reorderWords, setReorderWords] = useState([]);
    const rewardGivenRef = useRef(false);

    // Load unit data (lazy-loaded from grammar_modules.json)
    const [unitData, setUnitData] = useState(() => getUnit(unitId));
    useEffect(() => {
        if (!unitData) {
            loadGrammarModules().then(() => setUnitData(getUnit(unitId)));
        }
    }, [unitId, unitData]);

    // Derive tip cards and exercises from unit data
    const tipCards = useMemo(() => {
        if (!unitData) return [];
        return buildTipCards(unitData.unit, unitData.module);
    }, [unitData]);

    const exercises = useMemo(() => {
        if (!unitData) return [];
        return generateExercisesForUnit(unitId, EXERCISES_PER_LESSON, session);
    }, [unitData, unitId, session]);

    // Redirect if unit not found
    useEffect(() => {
        if (!unitData) navigate('/', { state: { tab: 'study' } });
    }, [unitData, navigate]);

    // Completion reward — mark both grammar unit ID and roadmap node ID
    const markComplete = () => {
        if (roadmapNodeId) dongCtx.completeNode(roadmapNodeId, { sessionsRequired: GRAMMAR_SESSIONS });
        dongCtx.completeNode(unitId, { sessionsRequired: GRAMMAR_SESSIONS });
    };

    useEffect(() => {
        if (phase === 'finished' && !rewardGivenRef.current) {
            rewardGivenRef.current = true;
            markComplete();
        }
    }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

    const currentEx = exercises[currentIndex];
    const progress = exercises.length > 0 ? currentIndex / exercises.length : 0;

    const handleCheck = () => {
        if (!currentEx) return;
        const result = checkAnswer(currentEx.exercise_type, selectedAnswer, currentEx.prompt);
        const correct = result.correct;

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
            setReorderWords([]);
        } else {
            setPhase('finished');
        }
    };

    const canCheck = () => selectedAnswer !== null && selectedAnswer !== '';

    // Keyboard nav
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Enter') {
                if (phase === 'tips') {
                    if (cardIndex < tipCards.length - 1) setCardIndex(i => i + 1);
                    else if (exercises.length > 0) setPhase('quiz');
                    else {
                        markComplete();
                        navigate('/', { state: { tab: 'study' } });
                    }
                } else if (phase === 'quiz') {
                    if (isChecking) handleNext();
                    else if (canCheck()) handleCheck();
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (!unitData) return null;
    const { unit } = unitData;

    // ─── TIPS PHASE ─────────────────────────────────────────
    if (phase === 'tips') {
        const card = tipCards[cardIndex];
        return (
            <div style={{
                '--accent-color': '#A78BFA',
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                backgroundColor: 'var(--bg-color)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '16px 16px 12px',
                    borderBottom: '1px solid var(--border-color)',
                }}>
                    <button onClick={() => navigate(-1)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 4,
                    }}>
                        <ArrowLeft size={22} />
                    </button>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {tipCards.map((_, i) => (
                                <div key={i} style={{
                                    flex: 1, height: 4, borderRadius: 2,
                                    backgroundColor: i <= cardIndex ? ACCENT : 'var(--border-color)',
                                }} />
                            ))}
                        </div>
                    </div>
                    <BookOpenText size={20} color={ACCENT} />
                </div>

                {/* Card content */}
                <div style={{
                    flex: 1, padding: '28px 24px',
                    overflowY: 'auto',
                }}>
                    {card && renderTipCard(card)}
                </div>

                {/* Navigation */}
                <div style={{
                    padding: '16px 24px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                    display: 'flex', gap: 12,
                    borderTop: '1px solid var(--border-color)',
                }}>
                    {cardIndex > 0 && (
                        <SoundButton
                            onClick={() => setCardIndex(i => i - 1)}
                            style={{
                                padding: '14px 20px', borderRadius: 14,
                                border: '2px solid var(--border-color)',
                                backgroundColor: 'var(--surface-color)',
                                cursor: 'pointer', color: 'var(--text-main)',
                                fontWeight: 700, fontSize: 15,
                            }}
                        >
                            <ArrowLeft size={18} />
                        </SoundButton>
                    )}
                    <SoundButton
                        onClick={() => {
                            if (cardIndex < tipCards.length - 1) setCardIndex(i => i + 1);
                            else if (exercises.length > 0) setPhase('quiz');
                            else {
                                markComplete();
                                navigate('/', { state: { tab: 'study' } });
                            }
                        }}
                        style={{
                            flex: 1, padding: '14px 20px', borderRadius: 14,
                            border: 'none', cursor: 'pointer',
                            backgroundColor: ACCENT, color: '#fff',
                            fontWeight: 800, fontSize: 16,
                            boxShadow: `0 4px 0 #7C3AED`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                    >
                        {cardIndex < tipCards.length - 1 ? (
                            <>NEXT <ArrowRight size={18} /></>
                        ) : exercises.length > 0 ? (
                            'START LESSON'
                        ) : (
                            'DONE'
                        )}
                    </SoundButton>
                </div>
            </div>
        );
    }

    // ─── QUIZ PHASE ─────────────────────────────────────────
    if (phase === 'quiz') {
        return (
            <div style={{
                '--accent-color': '#A78BFA',
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                backgroundColor: 'var(--bg-color)',
            }}>
                {/* Header with hearts + progress */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '16px 16px 12px',
                    borderBottom: '1px solid var(--border-color)',
                }}>
                    <button onClick={() => navigate(-1)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 4,
                    }}>
                        <X size={22} />
                    </button>

                    <div style={{ flex: 1 }}>
                        <ProgressBar progress={progress} />
                    </div>

                    {/* Hearts */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        color: '#EF4444', fontWeight: 800, fontSize: 14,
                    }}>
                        <Heart size={18} fill="#EF4444" />
                        {hearts}
                    </div>
                </div>

                {/* Exercise content */}
                <div style={{
                    flex: 1, padding: '24px 20px',
                    overflowY: 'auto',
                }}>
                    {currentEx && renderExercise(currentEx, selectedAnswer, setSelectedAnswer, isChecking, isCorrect, reorderWords, setReorderWords)}
                </div>

                {/* Check / Next button */}
                <div style={{
                    padding: '16px 24px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                    borderTop: '1px solid var(--border-color)',
                }}>
                    {isChecking ? (
                        <FeedbackBanner
                            isCorrect={isCorrect}
                            onContinue={handleNext}
                        />
                    ) : (
                        <SoundButton
                            onClick={handleCheck}
                            disabled={!canCheck()}
                            style={{
                                width: '100%', padding: '14px 20px', borderRadius: 14,
                                border: 'none', cursor: canCheck() ? 'pointer' : 'default',
                                backgroundColor: canCheck() ? ACCENT : 'var(--border-color)',
                                color: canCheck() ? '#fff' : 'var(--text-muted)',
                                fontWeight: 800, fontSize: 16,
                                boxShadow: canCheck() ? `0 4px 0 #7C3AED` : 'none',
                            }}
                        >
                            CHECK
                        </SoundButton>
                    )}
                </div>
            </div>
        );
    }

    // ─── FINISHED PHASE ─────────────────────────────────────
    return (
        <div style={{
            '--accent-color': '#A78BFA',
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'var(--bg-color)',
            padding: '40px 24px',
            gap: 24,
        }}>
            <div style={{
                width: 80, height: 80, borderRadius: '50%',
                backgroundColor: `${ACCENT}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Trophy size={40} color={ACCENT} fill={ACCENT} />
            </div>

            <h2 style={{
                fontSize: 24, fontWeight: 800, margin: 0,
                textAlign: 'center', color: 'var(--text-main)',
            }}>
                Lesson Complete!
            </h2>

            <div style={{
                fontSize: 15, color: 'var(--text-muted)',
                textAlign: 'center', lineHeight: 1.5,
            }}>
                <strong style={{ color: ACCENT }}>{unit.title}</strong>
                <br />
                You scored {score}/{exercises.length}
            </div>

            {/* Stats row */}
            <div style={{
                display: 'flex', gap: 16,
                justifyContent: 'center',
            }}>
                <div style={{
                    textAlign: 'center', padding: '12px 20px',
                    borderRadius: 12, backgroundColor: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: ACCENT }}>{score}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Correct</div>
                </div>
                <div style={{
                    textAlign: 'center', padding: '12px 20px',
                    borderRadius: 12, backgroundColor: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>+10</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Coins</div>
                </div>
                <div style={{
                    textAlign: 'center', padding: '12px 20px',
                    borderRadius: 12, backgroundColor: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#EF4444' }}>
                        {hearts}/{5}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Hearts</div>
                </div>
            </div>

            <SoundButton
                onClick={() => navigate('/', { state: { tab: 'study' } })}
                style={{
                    width: '100%', maxWidth: 320, padding: '16px 24px',
                    borderRadius: 14, border: 'none', cursor: 'pointer',
                    backgroundColor: ACCENT, color: '#fff',
                    fontWeight: 800, fontSize: 16,
                    boxShadow: `0 4px 0 #7C3AED`,
                }}
            >
                CONTINUE
            </SoundButton>
        </div>
    );
}
