import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
    Volume2, Check, X, RotateCw, ArrowLeft, ArrowRight,
    Trophy, Flame, Star, Eye, EyeOff, Image as ImageIcon,
} from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { useDong } from '../../context/DongContext';
import { DongCoin } from '../../components/DongCoin';
import VocabImage from '../../components/VocabImage';
import VOCAB_WORDS, { CATEGORIES } from '../../data/vocabWords';
import { getDueItems, recordReview, getTotalItems } from '../../lib/srs';
import speak from '../../utils/speak';
import './VocabPractice.css';
import './PracticeShared.css';

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ─── Browse Tab ──────────────────────────────────────────────────
function BrowseTab({ speak }) {
    const [filter, setFilter] = useState('all');
    const [playingId, setPlayingId] = useState(null);

    const filtered = filter === 'all'
        ? VOCAB_WORDS
        : VOCAB_WORDS.filter(w => w.category === filter);

    const play = (word) => {
        setPlayingId(word.id);
        speak(word.vietnamese, 0.6);
        setTimeout(() => setPlayingId(null), 900);
    };

    return (
        <>
            <div className="voc-category-pills">
                {CATEGORIES.map(c => (
                    <button
                        key={c.key}
                        className={`voc-pill ${filter === c.key ? 'active' : ''}`}
                        onClick={() => setFilter(c.key)}
                    >
                        {c.emoji} {c.label}
                    </button>
                ))}
            </div>

            <div className="voc-browse-list">
                {filtered.map(word => (
                    <button
                        key={word.id}
                        className={`voc-browse-card ${playingId === word.id ? 'playing' : ''}`}
                        onClick={() => play(word)}
                    >
                        <div className="voc-card-thumb">
                            <VocabImage word={word} alt={word.english} />
                        </div>
                        <div className="voc-card-info">
                            <span className="voc-vn">{word.vietnamese}</span>
                            <span className="voc-en">{word.english}</span>
                            <span className="voc-example">{word.example}</span>
                        </div>
                        <Volume2 size={14} className="voc-card-speaker" />
                    </button>
                ))}
            </div>
        </>
    );
}

// ─── Flashcard Tab ───────────────────────────────────────────────
function FlashcardTab({ speak }) {
    const [deck] = useState(() => shuffle(VOCAB_WORDS));
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [showHint, setShowHint] = useState(false);

    const card = deck[index];
    const total = deck.length;

    const next = () => { setIndex(i => Math.min(i + 1, total - 1)); setFlipped(false); setShowHint(false); };
    const prev = () => { setIndex(i => Math.max(i - 1, 0)); setFlipped(false); setShowHint(false); };

    const flip = () => {
        setFlipped(f => !f);
        if (!flipped) speak(card.vietnamese, 0.6);
    };

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowRight') next();
            else if (e.key === 'ArrowLeft') prev();
            else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    return (
        <>
            <div className="voc-flashcard-progress">
                <span>{index + 1} / {total}</span>
                <div className="voc-progress-bar">
                    <div className="voc-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
                </div>
            </div>

            <div className="voc-flashcard-area">
                <button className="voc-nav-btn" onClick={prev} disabled={index === 0}>
                    <ArrowLeft size={20} />
                </button>

                <div className={`voc-flashcard ${flipped ? 'flipped' : ''}`} onClick={flip}>
                    <div className="voc-flashcard-face voc-front">
                        <VocabImage word={card} alt="guess this word" />
                        <div className="voc-flash-overlay">
                            <span className="voc-flash-prompt">Tap to reveal</span>
                            {showHint && <span className="voc-flash-hint">Hint: {card.english}</span>}
                        </div>
                    </div>
                    <div className="voc-flashcard-face voc-back">
                        <VocabImage word={card} alt={card.english} className="voc-back-img" />
                        <div className="voc-back-content">
                            <span className="voc-back-vn">{card.vietnamese}</span>
                            <span className="voc-back-en">{card.english}</span>
                            <span className="voc-back-example">"{card.example}"</span>
                            <button className="voc-speak-btn" onClick={(e) => { e.stopPropagation(); speak(card.vietnamese, 0.6); }}>
                                <Volume2 size={16} /> Listen
                            </button>
                        </div>
                    </div>
                </div>

                <button className="voc-nav-btn" onClick={next} disabled={index === total - 1}>
                    <ArrowRight size={20} />
                </button>
            </div>

            <div className="voc-flash-actions">
                <button className="voc-hint-btn" onClick={() => setShowHint(h => !h)}>
                    {showHint ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
            </div>
        </>
    );
}

// ─── Quiz Tab ────────────────────────────────────────────────────
function QuizTab({ speak, bottomBarContainer }) {
    const dongCtx = useDong();

    const [questions] = useState(() => {
        const shuffled = shuffle(VOCAB_WORDS).slice(0, 15);
        return shuffled.map(word => {
            const correct = word.vietnamese;
            const pool = VOCAB_WORDS.map(w => w.vietnamese);
            const distractors = shuffle(pool.filter(x => x !== correct)).slice(0, 3);
            return {
                word,
                question: 'What is this in Vietnamese?',
                correct,
                options: shuffle([correct, ...distractors]),
            };
        });
    });

    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [feedback, setFeedback] = useState('idle');
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [earnedReward, setEarnedReward] = useState(null);

    useEffect(() => {
        if (showSummary && !earnedReward) {
            const t = questions.length;
            const reward = dongCtx.addDong('vocab', { score, total: t, bestStreak });
            const breakdown = dongCtx.calcRewardBreakdown(score, t, bestStreak);
            const isRepeat = (dongCtx.getCompletionCount('vocab') > 1);
            setEarnedReward({ amount: reward, breakdown, isRepeat });
        }
    }, [showSummary]);

    const total = questions.length;
    const currentQ = questions[qIndex];
    const progress = (qIndex / total) * 100;

    const handleCheck = useCallback(() => {
        if (!selected) return;
        const isCorrect = selected === currentQ.correct;
        if (isCorrect) {
            setFeedback('correct');
            setScore(s => s + 1);
            setStreak(s => { const n = s + 1; setBestStreak(b => Math.max(b, n)); return n; });
            speak(currentQ.word.vietnamese, 0.6);
        } else {
            setFeedback('incorrect');
            setStreak(0);
        }
    }, [selected, currentQ, speak]);

    const handleContinue = useCallback(() => {
        if (qIndex < total - 1) {
            setQIndex(i => i + 1);
            setSelected(null);
            setFeedback('idle');
        } else {
            setShowSummary(true);
        }
    }, [qIndex, total]);

    const handleRestart = () => {
        window.location.reload();
    };

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Enter' || showSummary) return;
            if (feedback === 'idle' && selected) handleCheck();
            else if (feedback !== 'idle') handleContinue();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [feedback, selected, handleCheck, handleContinue, showSummary]);

    if (showSummary) {
        const pct = Math.round((score / total) * 100);
        let msg = 'Keep practicing!';
        if (pct >= 90) msg = 'Vocabulary master!';
        else if (pct >= 70) msg = 'Great memory!';
        else if (pct >= 50) msg = 'Good progress!';

        const summaryBottomBar = (
            <div className="practice-bottom-bar" style={{ flexDirection: 'row', gap: '12px', justifyContent: 'center' }}>
                <button className="practice-action-btn" style={{ background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', width: 'auto', flex: 1, boxShadow: '0 4px 0 var(--border-color)' }} onClick={() => setShowSummary(false) || setQIndex(0)}>
                    Back
                </button>
                <button className="practice-action-btn primary" style={{ width: 'auto', flex: 2 }} onClick={handleRestart}>
                    Try Again
                </button>
            </div>
        );

        return (
            <>
                <div className="practice-content-centered">
                    <Trophy size={64} style={{ color: 'var(--primary-color)', marginBottom: '16px' }} />
                    <h2 className="practice-title">Quiz Complete!</h2>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)', margin: '12px 0' }}>{score} / {total}</div>
                    <p className="practice-subtitle">
                        {msg}<br />
                        Best streak: {bestStreak}
                    </p>
                    {earnedReward && (
                        <div className="dong-reward-banner">
                            <DongCoin size="sm" animate />
                            <span className="dong-reward-banner__text">
                                +{earnedReward.amount.toLocaleString()} earned!
                                {earnedReward.isRepeat && <span className="dong-reward-repeat-tag">x0.5 replay</span>}
                            </span>
                            <div className="dong-reward-breakdown">
                                <span className="dong-reward-breakdown__item">Base {earnedReward.breakdown.base}</span>
                                <span className={`dong-reward-breakdown__item ${earnedReward.breakdown.accuracy === 0 ? 'dong-reward-breakdown__item--zero' : ''}`}>Accuracy +{earnedReward.breakdown.accuracy}</span>
                                {earnedReward.breakdown.perfect > 0 && <span className="dong-reward-breakdown__item">Perfect +{earnedReward.breakdown.perfect}</span>}
                                {earnedReward.breakdown.streakBonus > 0 && <span className="dong-reward-breakdown__item">Streak +{earnedReward.breakdown.streakBonus}</span>}
                            </div>
                        </div>
                    )}
                </div>
                {bottomBarContainer && createPortal(summaryBottomBar, bottomBarContainer)}
            </>
        );
    }

    const bottomBarJSX = (
        <div className={`practice-bottom-bar ${feedback !== 'idle' ? feedback : ''}`}>
            {feedback !== 'idle' && (
                <div className="practice-feedback-bar">
                    <div className={`practice-feedback-msg ${feedback}`}>
                        <div className={`practice-icon-circle ${feedback}`}>
                            {feedback === 'correct' ? <Check size={20} /> : <X size={20} />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span>{feedback === 'correct' ? 'Correct!' : 'Incorrect'}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                {feedback === 'correct'
                                    ? currentQ.word.vietnamese
                                    : `Answer: ${currentQ.correct}`}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {feedback === 'idle' ? (
                <button
                    className={`practice-action-btn ${selected ? 'primary' : 'disabled'}`}
                    onClick={handleCheck}
                    disabled={!selected}
                >
                    Check
                </button>
            ) : (
                <button
                    className={`practice-action-btn primary`}
                    style={feedback === 'incorrect' ? { background: 'var(--danger-color)', color: 'white', boxShadow: '0 4px 0 #b92b49' } : { background: 'var(--success-color)', color: '#1a1a1a', boxShadow: '0 4px 0 #049e75' }}
                    onClick={handleContinue}
                >
                    Continue
                </button>
            )}
        </div>
    );

    return (
        <>
            <div className="practice-content-centered" style={{ justifyContent: 'flex-start', maxWidth: '600px' }}>
                <div className="voc-progress" style={{ width: '100%', marginBottom: '16px' }}>
                    <div className="voc-progress-fill" style={{ width: `${progress}%` }} />
                </div>

                <div className="voc-quiz-content" style={{ width: '100%' }}>
                    <div className="voc-quiz-image-wrap">
                        <VocabImage word={currentQ.word} alt="quiz" />
                        <div className="voc-quiz-english-hint">{currentQ.word.english}</div>
                    </div>
                    <div className="voc-quiz-question">{currentQ.question}</div>

                    <div className="voc-quiz-options">
                        {currentQ.options.map((opt, i) => {
                            let cls = '';
                            if (feedback !== 'idle') {
                                if (opt === currentQ.correct) cls = 'correct-highlight';
                                else if (opt === selected) cls = 'wrong';
                                else cls = 'disabled';
                            } else if (opt === selected) cls = 'selected';
                            return (
                                <button
                                    key={i}
                                    className={`voc-quiz-option ${cls}`}
                                    onClick={() => feedback === 'idle' && setSelected(opt)}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            {bottomBarContainer && createPortal(bottomBarJSX, bottomBarContainer)}
        </>
    );
}

// ─── Review Tab (SRS) ───────────────────────────────────────────
function ReviewTab({ bottomBarContainer }) {
    const dongCtx = useDong();
    const [dueItems, setDueItems] = useState(() => getDueItems());
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [feedback, setFeedback] = useState('idle');
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [earnedReward, setEarnedReward] = useState(null);

    const totalSRS = getTotalItems();

    // Generate quiz questions from due items
    const questions = useMemo(() => {
        if (dueItems.length === 0) return [];
        const items = shuffle(dueItems).slice(0, 15);
        return items.map(item => {
            const allItems = getDueItems().length > 3 ? getDueItems() : dueItems;
            const distractors = shuffle(
                allItems.filter(x => x.itemId !== item.itemId).map(x => x.vietnamese)
            ).slice(0, 3);
            // If not enough distractors from SRS, pad with vocab words
            while (distractors.length < 3) {
                const extra = VOCAB_WORDS.find(w => w.vietnamese !== item.vietnamese && !distractors.includes(w.vietnamese));
                if (extra) distractors.push(extra.vietnamese);
                else break;
            }
            return {
                item,
                question: `What is "${item.english}" in Vietnamese?`,
                correct: item.vietnamese,
                options: shuffle([item.vietnamese, ...distractors.slice(0, 3)]),
            };
        });
    }, [dueItems]);

    useEffect(() => {
        if (showSummary && !earnedReward && questions.length > 0) {
            const t = questions.length;
            const reward = dongCtx.addDong('review', { score, total: t, bestStreak });
            const breakdown = dongCtx.calcRewardBreakdown(score, t, bestStreak);
            setEarnedReward({ amount: reward, breakdown });
        }
    }, [showSummary]);

    if (dueItems.length === 0) {
        return (
            <div className="practice-content-centered">
                <Check size={64} style={{ color: 'var(--success-color)', marginBottom: '16px' }} />
                <h2 className="practice-title">All caught up!</h2>
                <p className="practice-subtitle">
                    {totalSRS > 0
                        ? `You have ${totalSRS} words in your review deck. Complete more lessons to add new words.`
                        : 'Complete lessons to add words to your review deck.'}
                </p>
            </div>
        );
    }

    if (showSummary) {
        const summaryBottomBar = (
            <div className="practice-bottom-bar" style={{ flexDirection: 'row', gap: '12px', justifyContent: 'center' }}>
                <Link to="/practice" className="practice-action-btn" style={{ background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', width: 'auto', flex: 1, boxShadow: '0 4px 0 var(--border-color)', textDecoration: 'none', textAlign: 'center' }}>
                    Done
                </Link>
            </div>
        );

        return (
            <>
                <div className="practice-content-centered">
                    <Trophy size={64} style={{ color: 'var(--primary-color)', marginBottom: '16px' }} />
                    <h2 className="practice-title">Review Complete!</h2>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)', margin: '12px 0' }}>{score} / {questions.length}</div>
                    {earnedReward && (
                        <div className="dong-reward-banner">
                            <DongCoin size="sm" animate />
                            <span className="dong-reward-banner__text">+{earnedReward.amount.toLocaleString()} earned!</span>
                        </div>
                    )}
                </div>
                {bottomBarContainer && createPortal(summaryBottomBar, bottomBarContainer)}
            </>
        );
    }

    const currentQ = questions[qIndex];
    if (!currentQ) return null;

    const progress = (qIndex / questions.length) * 100;

    const handleCheck = () => {
        if (!selected) return;
        const isCorrect = selected === currentQ.correct;
        recordReview(currentQ.item.itemId, isCorrect);
        if (isCorrect) {
            setFeedback('correct');
            setScore(s => s + 1);
            setStreak(s => { const n = s + 1; setBestStreak(b => Math.max(b, n)); return n; });
            speak(currentQ.item.vietnamese);
        } else {
            setFeedback('incorrect');
            setStreak(0);
        }
    };

    const handleContinue = () => {
        if (qIndex < questions.length - 1) {
            setQIndex(i => i + 1);
            setSelected(null);
            setFeedback('idle');
        } else {
            setShowSummary(true);
        }
    };

    const bottomBarJSX = (
        <div className={`practice-bottom-bar ${feedback !== 'idle' ? feedback : ''}`}>
            {feedback !== 'idle' && (
                <div className="practice-feedback-bar">
                    <div className={`practice-feedback-msg ${feedback}`}>
                        <div className={`practice-icon-circle ${feedback}`}>
                            {feedback === 'correct' ? <Check size={20} /> : <X size={20} />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span>{feedback === 'correct' ? 'Correct!' : 'Incorrect'}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                {feedback === 'correct' ? currentQ.item.vietnamese : `Answer: ${currentQ.correct}`}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            {feedback === 'idle' ? (
                <button className={`practice-action-btn ${selected ? 'primary' : 'disabled'}`} onClick={handleCheck} disabled={!selected}>Check</button>
            ) : (
                <button
                    className="practice-action-btn primary"
                    style={feedback === 'incorrect' ? { background: 'var(--danger-color)', color: 'white', boxShadow: '0 4px 0 #b92b49' } : { background: 'var(--success-color)', color: '#1a1a1a', boxShadow: '0 4px 0 #049e75' }}
                    onClick={handleContinue}
                >Continue</button>
            )}
        </div>
    );

    return (
        <>
            <div className="practice-content-centered" style={{ justifyContent: 'flex-start', maxWidth: '600px' }}>
                <div className="voc-progress" style={{ width: '100%', marginBottom: '16px' }}>
                    <div className="voc-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="voc-quiz-content" style={{ width: '100%' }}>
                    <div className="voc-quiz-question">{currentQ.question}</div>
                    <div className="voc-quiz-options">
                        {currentQ.options.map((opt, i) => {
                            let cls = '';
                            if (feedback !== 'idle') {
                                if (opt === currentQ.correct) cls = 'correct-highlight';
                                else if (opt === selected) cls = 'wrong';
                                else cls = 'disabled';
                            } else if (opt === selected) cls = 'selected';
                            return (
                                <button key={i} className={`voc-quiz-option ${cls}`} onClick={() => feedback === 'idle' && setSelected(opt)}>
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            {bottomBarContainer && createPortal(bottomBarJSX, bottomBarContainer)}
        </>
    );
}

// ─── Main Component ──────────────────────────────────────────────
export default function VocabPractice() {
    const { speak: speakTTS } = useTTS();
    const [tab, setTab] = useState(0);
    const [bottomBarEl, setBottomBarEl] = useState(null);
    const [dueCount] = useState(() => getDueItems().length);

    return (
        <div className="practice-layout practice-fixed-layout">
            {/* Header */}
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <Link to="/practice" style={{ color: 'var(--text-main)', display: 'flex' }}>
                        <X size={24} />
                    </Link>
                </h1>
                {(tab === 0 || tab === 3) && (
                    <div className="practice-stats">
                        <span className="practice-stat-pill" style={{ color: 'var(--text-main)' }}>
                            <Star size={18} style={{ color: 'var(--primary-color)' }} />
                        </span>
                        <span className="practice-stat-pill" style={{ color: 'var(--text-main)' }}>
                            <Flame size={18} style={{ color: '#FF5722' }} />
                        </span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="voc-tabs">
                <button className={`voc-tab ${tab === 0 ? 'active' : ''}`} onClick={() => setTab(0)}>
                    Review {dueCount > 0 && <span style={{ backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 11, marginLeft: 4 }}>{dueCount}</span>}
                </button>
                <button className={`voc-tab ${tab === 1 ? 'active' : ''}`} onClick={() => setTab(1)}>
                    Browse
                </button>
                <button className={`voc-tab ${tab === 2 ? 'active' : ''}`} onClick={() => setTab(2)}>
                    Flashcard
                </button>
                <button className={`voc-tab ${tab === 3 ? 'active' : ''}`} onClick={() => setTab(3)}>
                    Quiz
                </button>
            </div>

            {/* Scrollable content */}
            <div className="practice-scroll-area">
                {tab === 0 && <ReviewTab bottomBarContainer={bottomBarEl} />}
                {tab === 1 && <BrowseTab speak={speakTTS} />}
                {tab === 2 && <FlashcardTab speak={speakTTS} />}
                {tab === 3 && <QuizTab speak={speakTTS} bottomBarContainer={bottomBarEl} />}
            </div>

            {/* Quiz/Review bottom bar — outside scroll area, anchored at bottom */}
            {(tab === 0 || tab === 3) && <div ref={setBottomBarEl} />}
        </div>
    );
}
