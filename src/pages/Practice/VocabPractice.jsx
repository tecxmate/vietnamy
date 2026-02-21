import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Volume2, Check, X, RotateCw, ArrowLeft, ArrowRight,
    Trophy, Flame, Star, Eye, EyeOff, Image as ImageIcon,
} from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { useDong } from '../../context/DongContext';
import { DongCoin } from '../../components/DongCoin';
import VOCAB_WORDS, { CATEGORIES } from '../../data/vocabWords';
import './VocabPractice.css';
import './PracticeShared.css'; // Add shared layout

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ─── Fallback Image Component ────────────────────────────────────
function VocabImage({ word, alt, className, ...props }) {
    const [failed, setFailed] = useState(false);

    // Reset on word change
    useEffect(() => { setFailed(false); }, [word.id]);

    if (failed) {
        return (
            <div className={`voc-img-fallback ${className || ''}`} {...props}>
                <span className="voc-img-fallback-emoji">{word.emoji}</span>
                <span className="voc-img-fallback-label">{word.english}</span>
            </div>
        );
    }

    return (
        <img
            src={word.image}
            alt={alt || word.english}
            className={className}
            loading="lazy"
            onError={() => setFailed(true)}
            {...props}
        />
    );
}

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
            <div className="voc-section-header">
                <h2>Browse Vocabulary</h2>
                <p className="voc-subtitle">
                    Tap any card to hear the pronunciation. Use filters to focus on a category.
                </p>
            </div>

            {/* Category pills */}
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

            {/* Card grid */}
            <div className="voc-browse-grid">
                {filtered.map(word => (
                    <div
                        key={word.id}
                        className={`voc-browse-card ${playingId === word.id ? 'playing' : ''}`}
                        onClick={() => play(word)}
                    >
                        <div className="voc-card-img-wrap">
                            <VocabImage word={word} alt={word.english} />
                            <span className="voc-img-badge">
                                <ImageIcon size={10} /> Google Images
                            </span>
                        </div>
                        <div className="voc-card-body">
                            <span className="voc-vn">{word.vietnamese}</span>
                            <span className="voc-en">{word.english}</span>
                        </div>
                        <div className="voc-card-footer">
                            <Volume2 size={14} className="voc-speaker" />
                            <span className="voc-example">{word.example}</span>
                        </div>
                    </div>
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
            <div className="voc-section-header">
                <h2>Flashcards</h2>
                <p className="voc-subtitle">
                    Click the card to flip. Use arrows or swipe to navigate. Press Space to flip.
                </p>
            </div>

            <div className="voc-flashcard-progress">
                <span>{index + 1} / {total}</span>
                <div className="voc-progress-bar">
                    <div className="voc-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
                </div>
            </div>

            <div className="voc-flashcard-area">
                <button className="voc-nav-btn" onClick={prev} disabled={index === 0}>
                    <ArrowLeft size={24} />
                </button>

                <div className={`voc-flashcard ${flipped ? 'flipped' : ''}`} onClick={flip}>
                    {/* Front: image only */}
                    <div className="voc-flashcard-face voc-front">
                        <VocabImage word={card} alt="guess this word" />
                        <div className="voc-flash-overlay">
                            <span className="voc-flash-prompt">Tap to reveal</span>
                            {showHint && <span className="voc-flash-hint">Hint: {card.english}</span>}
                        </div>
                    </div>
                    {/* Back: word + meaning */}
                    <div className="voc-flashcard-face voc-back">
                        <VocabImage word={card} alt={card.english} className="voc-back-img" />
                        <div className="voc-back-content">
                            <span className="voc-back-vn">{card.vietnamese}</span>
                            <span className="voc-back-en">{card.english}</span>
                            <span className="voc-back-example">"{card.example}"</span>
                            <button className="voc-speak-btn" onClick={(e) => { e.stopPropagation(); speak(card.vietnamese, 0.6); }}>
                                <Volume2 size={18} /> Listen
                            </button>
                        </div>
                    </div>
                </div>

                <button className="voc-nav-btn" onClick={next} disabled={index === total - 1}>
                    <ArrowRight size={24} />
                </button>
            </div>

            <div className="voc-flash-actions">
                <button className="voc-hint-btn" onClick={() => setShowHint(h => !h)}>
                    {showHint ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
            </div>
        </>
    );
}

// ─── Quiz Tab ────────────────────────────────────────────────────
// Always shows image + English → pick the correct Vietnamese word
function QuizTab({ speak }) {
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
    const [earnedReward, setEarnedReward] = useState(null); // { amount, breakdown, isRepeat }

    // Award Dong when quiz completes
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
        window.location.reload(); // simple restart for demo
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
        let msg = 'Keep practicing! 📖';
        if (pct >= 90) msg = 'Vocabulary master! 🏆';
        else if (pct >= 70) msg = 'Great memory! 💪';
        else if (pct >= 50) msg = 'Good progress! 👍';

        const { addDong, calcRewardBreakdown, getCompletionCount, REPEAT_MULTIPLIER } = dongCtx;

        return (
            <div className="practice-layout">
                <div className="practice-header">
                    <h1 className="practice-header-title">
                        <Link to="/practice" style={{ color: 'var(--text-main)', display: 'flex' }}>
                            <ArrowLeft size={24} />
                        </Link>
                        Từ Vựng — Vocabulary
                    </h1>
                </div>
                <div className="practice-content-centered">
                    <Trophy size={80} style={{ color: 'var(--primary-color)', marginBottom: '24px' }} />
                    <h2 className="practice-title">Quiz Complete!</h2>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)', margin: '16px 0' }}>{score} / {total}</div>
                    <p className="practice-subtitle">
                        {msg}<br />
                        Best streak: 🔥 {bestStreak}
                    </p>
                    {earnedReward && (
                        <div className="dong-reward-banner">
                            <DongCoin size="sm" animate />
                            <span className="dong-reward-banner__text">
                                +{earnedReward.amount.toLocaleString()}₫ earned!
                                {earnedReward.isRepeat && <span className="dong-reward-repeat-tag">×0.5 replay</span>}
                            </span>
                            <div className="dong-reward-breakdown">
                                <span className="dong-reward-breakdown__item">Base {earnedReward.breakdown.base}₫</span>
                                <span className={`dong-reward-breakdown__item ${earnedReward.breakdown.accuracy === 0 ? 'dong-reward-breakdown__item--zero' : ''}`}>Accuracy +{earnedReward.breakdown.accuracy}₫</span>
                                {earnedReward.breakdown.perfect > 0 && <span className="dong-reward-breakdown__item">🎯 Perfect +{earnedReward.breakdown.perfect}₫</span>}
                                {earnedReward.breakdown.streakBonus > 0 && <span className="dong-reward-breakdown__item">🔥 Streak +{earnedReward.breakdown.streakBonus}₫</span>}
                            </div>
                        </div>
                    )}
                </div>
                <div className="practice-bottom-bar" style={{ flexDirection: 'row', gap: '16px', justifyContent: 'center' }}>
                    <button className="practice-action-btn" style={{ background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', width: 'auto', flex: 1, boxShadow: '0 4px 0 var(--border-color)' }} onClick={() => setShowSummary(false) || setQIndex(0)}>
                        Back
                    </button>
                    <button className="practice-action-btn primary" style={{ width: 'auto', flex: 2 }} onClick={handleRestart}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="practice-content-centered" style={{ justifyContent: 'flex-start', maxWidth: '600px' }}>
            <div className="voc-progress" style={{ width: '100%', marginBottom: '24px' }}>
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

            <div className={`practice-bottom-bar ${feedback !== 'idle' ? feedback : ''}`}>
                {feedback !== 'idle' && (
                    <div className="practice-feedback-bar">
                        <div className={`practice-feedback-msg ${feedback}`}>
                            <div className={`practice-icon-circle ${feedback}`}>
                                {feedback === 'correct' ? <Check size={20} /> : <X size={20} />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span>{feedback === 'correct' ? 'Correct!' : 'Incorrect'}</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
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
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────
export default function VocabPractice() {
    const { speak } = useTTS();
    const [tab, setTab] = useState(1);

    return (
        <div className="practice-layout" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <Link to="/practice" style={{ color: 'var(--text-main)', display: 'flex' }}>
                        <X size={24} />
                    </Link>
                </h1>
                {tab === 3 && (
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
                <button className={`voc-tab ${tab === 1 ? 'active' : ''}`} onClick={() => setTab(1)}>
                    ① Browse
                </button>
                <button className={`voc-tab ${tab === 2 ? 'active' : ''}`} onClick={() => setTab(2)}>
                    ② Flashcard
                </button>
                <button className={`voc-tab ${tab === 3 ? 'active' : ''}`} onClick={() => setTab(3)}>
                    ③ Quiz
                </button>
            </div>

            {tab === 1 && <BrowseTab speak={speak} />}
            {tab === 2 && <FlashcardTab speak={speak} />}
            {tab === 3 && <QuizTab speak={speak} />}
        </div>
    );
}
