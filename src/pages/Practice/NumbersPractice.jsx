import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, Check, X, RotateCw, ArrowLeft, Trophy, Flame, Star, ChevronRight, Lightbulb } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { useDong } from '../../context/DongContext';
import { DongCoin } from '../../components/DongCoin';
import './NumbersPractice.css';
import './PracticeShared.css'; // Add shared layout

// ─── Vietnamese Number Engine ──────────────────────────────────────
const BASIC = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

/**
 * Convert a number (0–999) to Vietnamese string.
 * Handles special compound rules for 1, 4, 5 after tens.
 */
function numberToVietnamese(n) {
    if (n < 0 || n > 999) return '';
    if (n <= 10) {
        if (n === 10) return 'mười';
        return BASIC[n];
    }

    // 11–19
    if (n >= 11 && n <= 19) {
        const ones = n % 10;
        if (ones === 0) return 'mười';
        if (ones === 1) return 'mười một';
        if (ones === 5) return 'mười lăm';
        return `mười ${BASIC[ones]}`;
    }

    // 20–99
    if (n >= 20 && n <= 99) {
        const tens = Math.floor(n / 10);
        const ones = n % 10;
        let result = `${BASIC[tens]} mươi`;
        if (ones === 0) return result;
        if (ones === 1) return `${result} mốt`;
        if (ones === 4) return `${result} tư`;
        if (ones === 5) return `${result} lăm`;
        return `${result} ${BASIC[ones]}`;
    }

    // 100–999
    if (n >= 100 && n <= 999) {
        const hundreds = Math.floor(n / 100);
        const remainder = n % 100;
        let result = `${BASIC[hundreds]} trăm`;
        if (remainder === 0) return result;
        if (remainder < 10) return `${result} lẻ ${BASIC[remainder]}`;
        return `${result} ${numberToVietnamese(remainder)}`;
    }

    return '';
}

/**
 * Decompose a number into its Vietnamese parts for the pattern builder.
 * Returns array of { digit, word, isSpecial, rule }
 */
function decomposeNumber(n) {
    if (n <= 10) {
        return [{ digit: String(n), word: numberToVietnamese(n), isSpecial: false }];
    }

    if (n >= 11 && n <= 19) {
        const ones = n % 10;
        const parts = [{ digit: '10', word: 'mười', isSpecial: false }];
        if (ones > 0) {
            let word = BASIC[ones];
            let rule = null;
            let isSpecial = false;
            if (ones === 5) { word = 'lăm'; rule = 'năm → lăm after tens'; isSpecial = true; }
            parts.push({ digit: String(ones), word, isSpecial, rule });
        }
        return parts;
    }

    if (n >= 20 && n <= 99) {
        const tens = Math.floor(n / 10);
        const ones = n % 10;
        const parts = [
            { digit: String(tens), word: BASIC[tens], isSpecial: false },
            { digit: '×10', word: 'mươi', isSpecial: true, rule: 'mười → mươi in compounds' },
        ];
        if (ones > 0) {
            let word = BASIC[ones];
            let rule = null;
            let isSpecial = false;
            if (ones === 1) { word = 'mốt'; rule = 'một → mốt after tens'; isSpecial = true; }
            else if (ones === 4) { word = 'tư'; rule = 'bốn → tư after tens'; isSpecial = true; }
            else if (ones === 5) { word = 'lăm'; rule = 'năm → lăm after tens'; isSpecial = true; }
            parts.push({ digit: String(ones), word, isSpecial, rule });
        }
        return parts;
    }

    return [{ digit: String(n), word: numberToVietnamese(n), isSpecial: false }];
}

// ─── Helpers ───────────────────────────────────────────────────────
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const FOUNDATION_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// ─── Component ─────────────────────────────────────────────────────
export default function NumbersPractice() {
    const { speak } = useTTS();
    const dongCtx = useDong();

    const [stage, setStage] = useState(1); // 1 = Foundation, 2 = Builder, 3 = Challenge
    const [stagesCompleted, setStagesCompleted] = useState(new Set());

    // Stage 2 state
    const [builderIndex, setBuilderIndex] = useState(0);
    const [builtAnswer, setBuiltAnswer] = useState([]);
    const [builderFeedback, setBuilderFeedback] = useState('idle');

    // Stage 3 state
    const [challengeIndex, setChallengeIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [typedAnswer, setTypedAnswer] = useState('');
    const [challengeFeedback, setChallengeFeedback] = useState('idle');
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [earnedReward, setEarnedReward] = useState(null);

    // Award Dong when quiz completes
    useEffect(() => {
        if (showSummary && !earnedReward) {
            const reward = dongCtx.addDong('numbers', { score, total: totalAnswered, bestStreak });
            const breakdown = dongCtx.calcRewardBreakdown(score, totalAnswered, bestStreak);
            const isRepeat = (dongCtx.getCompletionCount('numbers') > 1);
            setEarnedReward({ amount: reward, breakdown, isRepeat });
        }
    }, [showSummary]);

    // ── Stage 2: Builder Numbers ──
    const builderNumbers = useMemo(() => {
        // Pick interesting compound numbers to teach patterns
        return shuffle([12, 15, 21, 24, 25, 30, 31, 44, 55, 67, 73, 89]);
    }, [stage === 2 ? stage : null]);

    const currentBuilderNum = builderNumbers[builderIndex];
    const currentDecomp = currentBuilderNum !== undefined ? decomposeNumber(currentBuilderNum) : [];
    const currentBuilderAnswer = currentBuilderNum !== undefined ? numberToVietnamese(currentBuilderNum) : '';
    const builderWordBank = useMemo(() => {
        if (!currentDecomp.length) return [];
        const correctWords = currentDecomp.map(p => p.word);
        // Add distractors
        const allDistractors = ['một', 'hai', 'ba', 'bốn', 'năm', 'mười', 'mươi', 'mốt', 'lăm', 'tư', 'sáu', 'bảy', 'tám', 'chín'];
        const distractors = allDistractors.filter(w => !correctWords.includes(w));
        const picked = shuffle(distractors).slice(0, 2);
        return shuffle([...correctWords, ...picked]);
    }, [currentBuilderNum]);

    // ── Stage 3: Challenge Questions ──
    const challenges = useMemo(() => {
        if (stage !== 3) return [];
        const qs = [];

        // Type 1: See number → pick Vietnamese (multiple choice) — easy range
        for (let i = 0; i < 5; i++) {
            const n = Math.floor(Math.random() * 11); // 0–10
            const correct = numberToVietnamese(n);
            const distractorNums = shuffle(FOUNDATION_NUMBERS.filter(x => x !== n)).slice(0, 3);
            const options = shuffle([correct, ...distractorNums.map(numberToVietnamese)]);
            qs.push({ type: 'mc-vn', number: n, correctAnswer: correct, options, prompt: 'What is this number in Vietnamese?' });
        }

        // Type 2: See Vietnamese → pick number (multiple choice) — medium range
        for (let i = 0; i < 4; i++) {
            const n = 10 + Math.floor(Math.random() * 90); // 10–99
            const vnWord = numberToVietnamese(n);
            const distractorNums = [];
            while (distractorNums.length < 3) {
                const d = 10 + Math.floor(Math.random() * 90);
                if (d !== n && !distractorNums.includes(d)) distractorNums.push(d);
            }
            const options = shuffle([String(n), ...distractorNums.map(String)]);
            qs.push({ type: 'mc-num', vnWord, number: n, correctAnswer: String(n), options, prompt: 'What number is this?' });
        }

        // Type 3: Listen → type number
        for (let i = 0; i < 3; i++) {
            const n = Math.floor(Math.random() * 100); // 0–99
            qs.push({ type: 'listen-type', number: n, correctAnswer: String(n), vnWord: numberToVietnamese(n), prompt: 'Listen and type the number' });
        }

        return shuffle(qs);
    }, [stage]);

    const totalChallenges = challenges.length;
    const currentChallenge = challenges[challengeIndex];
    const challengeProgress = totalChallenges > 0 ? (challengeIndex / totalChallenges) * 100 : 0;

    // Play TTS
    const playWord = useCallback((text) => {
        speak(text, 0.75);
    }, [speak]);

    // Auto-play audio for listen questions
    useEffect(() => {
        if (stage === 3 && currentChallenge?.type === 'listen-type' && challengeFeedback === 'idle') {
            const t = setTimeout(() => playWord(currentChallenge.vnWord), 400);
            return () => clearTimeout(t);
        }
    }, [stage, challengeIndex, challengeFeedback, currentChallenge, playWord]);

    // ── Stage 2 Handlers ──
    const handleBuilderWordClick = (word) => {
        if (builderFeedback !== 'idle') return;
        playWord(word);
        setBuiltAnswer([...builtAnswer, word]);
    };

    const handleBuilderRemoveWord = (index) => {
        if (builderFeedback !== 'idle') return;
        const removed = builtAnswer[index];
        playWord(removed);
        const newArr = [...builtAnswer];
        newArr.splice(index, 1);
        setBuiltAnswer(newArr);
    };

    const handleBuilderCheck = useCallback(() => {
        const userStr = builtAnswer.join(' ').toLowerCase().trim();
        const correctStr = currentBuilderAnswer.toLowerCase().trim();
        if (userStr === correctStr) {
            setBuilderFeedback('correct');
            playWord(currentBuilderAnswer);
        } else {
            setBuilderFeedback('incorrect');
        }
    }, [builtAnswer, currentBuilderAnswer, playWord]);

    const handleBuilderContinue = useCallback(() => {
        if (builderIndex < builderNumbers.length - 1) {
            setBuilderIndex(i => i + 1);
            setBuiltAnswer([]);
            setBuilderFeedback('idle');
        } else {
            setStagesCompleted(prev => new Set([...prev, 2]));
            setStage(3);
        }
    }, [builderIndex, builderNumbers.length]);

    // ── Stage 3 Handlers ──
    const handleChallengeCheck = useCallback(() => {
        const q = currentChallenge;
        if (!q) return;
        let isCorrect = false;

        if (q.type === 'mc-vn' || q.type === 'mc-num') {
            isCorrect = selectedOption === q.correctAnswer;
        } else if (q.type === 'listen-type') {
            isCorrect = typedAnswer.trim() === q.correctAnswer;
        }

        if (isCorrect) {
            setChallengeFeedback('correct');
            setScore(s => s + 1);
            setStreak(s => { const next = s + 1; setBestStreak(b => Math.max(b, next)); return next; });
            if (q.vnWord) playWord(q.vnWord);
            else playWord(numberToVietnamese(q.number));
        } else {
            setChallengeFeedback('incorrect');
            setStreak(0);
        }
    }, [currentChallenge, selectedOption, typedAnswer, playWord]);

    const handleChallengeContinue = useCallback(() => {
        if (challengeIndex < totalChallenges - 1) {
            setChallengeIndex(i => i + 1);
            setSelectedOption(null);
            setTypedAnswer('');
            setChallengeFeedback('idle');
        } else {
            setTotalAnswered(totalChallenges);
            setShowSummary(true);
        }
    }, [challengeIndex, totalChallenges]);

    const handleRestartChallenge = () => {
        setStage(3); // triggers useMemo refresh
        setChallengeIndex(0);
        setSelectedOption(null);
        setTypedAnswer('');
        setChallengeFeedback('idle');
        setScore(0);
        setStreak(0);
        setBestStreak(0);
        setTotalAnswered(0);
        setShowSummary(false);
    };

    // ── Keyboard: Enter to check/continue ──
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Enter') {
                if (stage === 2) {
                    if (builderFeedback === 'idle' && builtAnswer.length > 0) handleBuilderCheck();
                    else if (builderFeedback !== 'idle') handleBuilderContinue();
                } else if (stage === 3 && !showSummary) {
                    if (challengeFeedback === 'idle') {
                        const q = currentChallenge;
                        const canCheck = q?.type === 'listen-type' ? typedAnswer.trim() !== '' : !!selectedOption;
                        if (canCheck) handleChallengeCheck();
                    } else {
                        handleChallengeContinue();
                    }
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [stage, builderFeedback, builtAnswer, handleBuilderCheck, handleBuilderContinue, challengeFeedback, selectedOption, typedAnswer, handleChallengeCheck, handleChallengeContinue, showSummary, currentChallenge]);

    // ── Get active special rule for builder ──
    const activeRule = currentDecomp.find(p => p.isSpecial && p.rule);

    // ════════════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════════════

    // ── Summary Screen ──
    if (showSummary) {
        const pct = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
        let message = 'Keep practicing!';
        if (pct >= 90) message = 'Perfect! You can count like a native! 🎯';
        else if (pct >= 70) message = 'Great work! Almost fluent with numbers! 💪';
        else if (pct >= 50) message = 'Good progress! Keep going!';

        return (
            <div className="practice-layout">
                <div className="practice-header">
                    <h1 className="practice-header-title">
                        <Link to="/practice" style={{ color: 'var(--text-main)', display: 'flex' }}>
                            <ArrowLeft size={24} />
                        </Link>
                        🧮 Số — Numbers
                    </h1>
                </div>
                <div className="practice-content-centered">
                    <Trophy size={80} style={{ color: 'var(--primary-color)', marginBottom: '24px' }} />
                    <h2 className="practice-title">Challenge Complete!</h2>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)', margin: '16px 0' }}>{score} / {totalAnswered}</div>
                    <p className="practice-subtitle">
                        {message}<br />
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
                    <button className="practice-action-btn" style={{ background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', width: 'auto', flex: 1, boxShadow: '0 4px 0 var(--border-color)' }} onClick={() => setShowSummary(false) || setStage(1)}>
                        Back
                    </button>
                    <button className="practice-action-btn primary" style={{ width: 'auto', flex: 2 }} onClick={handleRestartChallenge}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="practice-layout">
            {/* Header */}
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <Link to="/practice" style={{ color: 'var(--text-main)', display: 'flex' }}>
                        <X size={24} />
                    </Link>
                </h1>
                {stage === 3 && (
                    <div className="practice-stats">
                        <span className="practice-stat-pill" style={{ color: 'var(--text-main)' }}>
                            <Star size={18} style={{ color: 'var(--primary-color)' }} /> {score}
                        </span>
                        <span className="practice-stat-pill" style={{ color: 'var(--text-main)' }}>
                            <Flame size={18} style={{ color: '#FF5722' }} /> {streak}
                        </span>
                    </div>
                )}
            </div>

            {/* Stage Tabs */}
            <div className="stage-tabs">
                <button
                    className={`stage-tab ${stage === 1 ? 'active' : ''} ${stagesCompleted.has(1) ? 'completed' : ''}`}
                    onClick={() => setStage(1)}
                >
                    ① Learn
                </button>
                <button
                    className={`stage-tab ${stage === 2 ? 'active' : ''} ${stagesCompleted.has(2) ? 'completed' : ''}`}
                    onClick={() => { setStage(2); setBuilderIndex(0); setBuiltAnswer([]); setBuilderFeedback('idle'); }}
                >
                    ② Build
                </button>
                <button
                    className={`stage-tab ${stage === 3 ? 'active' : ''}`}
                    onClick={handleRestartChallenge}
                >
                    ③ Test
                </button>
            </div>

            {/* ═══ STAGE 1: Foundation ═══ */}
            {stage === 1 && (
                <>
                    <p className="stage-intro">
                        Tap each tile to hear the pronunciation. Learn these first — they're the building blocks!
                    </p>
                    <div className="number-grid">
                        {FOUNDATION_NUMBERS.map(n => (
                            <div
                                key={n}
                                className="number-tile"
                                onClick={() => playWord(numberToVietnamese(n))}
                            >
                                <Volume2 size={14} className="speaker-icon" />
                                <span className="digit">{n}</span>
                                <span className="vn-word">{numberToVietnamese(n)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="stage-cta">
                        <button onClick={() => { setStagesCompleted(prev => new Set([...prev, 1])); setStage(2); }}>
                            I know these! Next <ChevronRight size={18} style={{ verticalAlign: 'middle' }} />
                        </button>
                    </div>
                </>
            )}

            {/* ═══ STAGE 2: Pattern Builder ═══ */}
            {stage === 2 && (
                <div className="practice-content-centered" style={{ justifyContent: 'flex-start', marginTop: '16px' }}>
                    <div className="builder-target">{currentBuilderNum}</div>
                    <div className="builder-subtitle">Build this number in Vietnamese</div>

                    {/* Decomposition visual */}
                    <div className="decomposition">
                        {currentDecomp.map((part, i) => (
                            <span key={i} style={{ display: 'contents' }}>
                                {i > 0 && <span className="decomp-plus">+</span>}
                                <div className="decomp-part" style={{ borderColor: part.isSpecial ? '#FF9800' : undefined }}>
                                    <span className="part-digit">{part.digit}</span>
                                    <span className="part-word" style={{ color: part.isSpecial ? '#FF9800' : undefined }}>
                                        {builderFeedback !== 'idle' || i === 0 ? part.word : '?'}
                                    </span>
                                </div>
                            </span>
                        ))}
                    </div>

                    {/* Build area */}
                    <div className="build-answer-area">
                        {builtAnswer.length === 0 ? (
                            <span className="placeholder-text">Tap words below...</span>
                        ) : (
                            builtAnswer.map((word, i) => (
                                <button key={i} className="build-block" onClick={() => handleBuilderRemoveWord(i)}>
                                    {word}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Word bank */}
                    <div className="word-bank-builder">
                        {builderWordBank.map((word, i) => {
                            const usedCount = builtAnswer.filter(w => w === word).length;
                            const bankCount = builderWordBank.slice(0, i + 1).filter(w => w === word).length;
                            const isUsed = bankCount <= usedCount;
                            return (
                                <button
                                    key={`bank-${i}`}
                                    className={`bank-block ${isUsed ? 'used' : ''}`}
                                    onClick={() => !isUsed && handleBuilderWordClick(word)}
                                    disabled={isUsed}
                                >
                                    {word}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className={`practice-bottom-bar ${builderFeedback !== 'idle' ? builderFeedback : ''}`}>
                        {builderFeedback !== 'idle' && (
                            <div className="practice-feedback-bar">
                                <div className={`practice-feedback-msg ${builderFeedback}`}>
                                    <div className={`practice-icon-circle ${builderFeedback}`}>
                                        {builderFeedback === 'correct' ? <Check size={20} /> : <X size={20} />}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <span>{builderFeedback === 'correct' ? 'Correct!' : 'Incorrect'}</span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                            {builderFeedback === 'correct'
                                                ? `${currentBuilderNum} = ${currentBuilderAnswer}`
                                                : `Answer: ${currentBuilderAnswer}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {builderFeedback === 'idle' ? (
                            <button
                                className={`practice-action-btn ${builtAnswer.length > 0 ? 'primary' : 'disabled'}`}
                                onClick={handleBuilderCheck}
                                disabled={builtAnswer.length === 0}
                            >
                                Check
                            </button>
                        ) : (
                            <button
                                className={`practice-action-btn primary`}
                                style={builderFeedback === 'incorrect' ? { background: 'var(--danger-color)', color: 'white', boxShadow: '0 4px 0 #b92b49' } : { background: 'var(--success-color)', color: '#1a1a1a', boxShadow: '0 4px 0 #049e75' }}
                                onClick={handleBuilderContinue}
                            >
                                Continue
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ STAGE 3: Challenge ═══ */}
            {stage === 3 && currentChallenge && (
                <div className="practice-content-centered" style={{ justifyContent: 'flex-start' }}>
                    <div className="challenge-progress" style={{ width: '100%', marginBottom: '32px' }}>
                        <div className="challenge-progress-fill" style={{ width: `${challengeProgress}%` }} />
                    </div>

                    <div className="challenge-content" style={{ width: '100%' }}>
                        <span className="challenge-prompt">{currentChallenge.prompt}</span>

                        {/* MC: See Number → Pick Vietnamese */}
                        {currentChallenge.type === 'mc-vn' && (
                            <>
                                <div className="challenge-number">{currentChallenge.number}</div>
                                <div className="challenge-options">
                                    {currentChallenge.options.map((opt, i) => {
                                        let cls = '';
                                        if (challengeFeedback !== 'idle') {
                                            if (opt === currentChallenge.correctAnswer) cls = 'correct-highlight';
                                            else if (opt === selectedOption) cls = 'wrong';
                                            else cls = 'disabled';
                                        } else if (opt === selectedOption) cls = 'selected';
                                        return (
                                            <button key={i}
                                                className={`challenge-option ${cls}`}
                                                onClick={() => challengeFeedback === 'idle' && setSelectedOption(opt)}
                                            >{opt}</button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* MC: See Vietnamese → Pick Number */}
                        {currentChallenge.type === 'mc-num' && (
                            <>
                                <div className="challenge-number" style={{ fontSize: '2rem' }}>
                                    <button
                                        className="practice-audio-btn"
                                        onClick={() => playWord(currentChallenge.vnWord)}
                                        style={{ display: 'inline-flex', width: '48px', height: '48px', marginRight: '12px', verticalAlign: 'middle', margin: 0 }}
                                    >
                                        <Volume2 size={22} />
                                    </button>
                                    {currentChallenge.vnWord}
                                </div>
                                <div className="challenge-options">
                                    {currentChallenge.options.map((opt, i) => {
                                        let cls = '';
                                        if (challengeFeedback !== 'idle') {
                                            if (opt === currentChallenge.correctAnswer) cls = 'correct-highlight';
                                            else if (opt === selectedOption) cls = 'wrong';
                                            else cls = 'disabled';
                                        } else if (opt === selectedOption) cls = 'selected';
                                        return (
                                            <button key={i}
                                                className={`challenge-option ${cls}`}
                                                onClick={() => challengeFeedback === 'idle' && setSelectedOption(opt)}
                                            >{opt}</button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* Listen → Type Number */}
                        {currentChallenge.type === 'listen-type' && (
                            <>
                                <button
                                    className="practice-audio-btn large"
                                    onClick={() => playWord(currentChallenge.vnWord)}
                                >
                                    <Volume2 size={36} />
                                </button>
                                {challengeFeedback !== 'idle' && (
                                    <div style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                                        {currentChallenge.vnWord}
                                    </div>
                                )}
                                <input
                                    className={`challenge-input ${challengeFeedback === 'correct' ? 'correct-input' : challengeFeedback === 'incorrect' ? 'wrong-input' : ''}`}
                                    type="number"
                                    placeholder="Type the number"
                                    value={typedAnswer}
                                    onChange={(e) => challengeFeedback === 'idle' && setTypedAnswer(e.target.value)}
                                    autoFocus
                                />
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`practice-bottom-bar ${challengeFeedback !== 'idle' ? challengeFeedback : ''}`}>
                        {challengeFeedback !== 'idle' && (
                            <div className="practice-feedback-bar">
                                <div className={`practice-feedback-msg ${challengeFeedback}`}>
                                    <div className={`practice-icon-circle ${challengeFeedback}`}>
                                        {challengeFeedback === 'correct' ? <Check size={20} /> : <X size={20} />}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <span>{challengeFeedback === 'correct' ? 'Correct!' : 'Incorrect'}</span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                            {challengeFeedback === 'correct'
                                                ? currentChallenge.correctAnswer
                                                : `Answer: ${currentChallenge.correctAnswer} ${currentChallenge.type === 'listen-type' ? `(${currentChallenge.vnWord})` : ''}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {challengeFeedback === 'idle' ? (
                            <button
                                className={`practice-action-btn ${(currentChallenge.type === 'listen-type' ? typedAnswer.trim() !== '' : !!selectedOption) ? 'primary' : 'disabled'
                                    }`}
                                onClick={handleChallengeCheck}
                                disabled={
                                    currentChallenge.type === 'listen-type'
                                        ? typedAnswer.trim() === ''
                                        : !selectedOption
                                }
                            >
                                Check
                            </button>
                        ) : (
                            <button
                                className={`practice-action-btn primary`}
                                style={challengeFeedback === 'incorrect' ? { background: 'var(--danger-color)', color: 'white', boxShadow: '0 4px 0 #b92b49' } : { background: 'var(--success-color)', color: '#1a1a1a', boxShadow: '0 4px 0 #049e75' }}
                                onClick={handleChallengeContinue}
                            >
                                Continue
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
