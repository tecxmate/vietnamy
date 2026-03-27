import { useState, useEffect, useMemo, useCallback } from 'react';
import { Volume2, Check, X, RotateCw, ArrowLeft, Trophy, Flame, Star } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';
import './TonePractice.css';
import { playSuccess, playError } from '../../utils/sound';
import SoundButton from '../../components/SoundButton';
import './PracticeShared.css'; // Add shared layout

// ─── Vietnamese Tone Definitions ───────────────────────────────────
const ALL_TONES = [
    { id: 'ngang', name: 'Ngang', mark: 'a', label: 'Level', color: '#4CAF50', description: 'No mark – flat, mid-level pitch' },
    { id: 'sac', name: 'Sắc', mark: 'á', label: 'Rising', color: '#2196F3', description: 'Rises sharply from mid to high' },
    { id: 'huyen', name: 'Huyền', mark: 'à', label: 'Falling', color: '#9C27B0', description: 'Falls from mid-low to low' },
    { id: 'hoi', name: 'Hỏi', mark: 'ả', label: 'Dipping', color: '#FF9800', description: 'Dips down then rises slightly' },
    { id: 'nga', name: 'Ngã', mark: 'ã', label: 'Rising-Glottal', color: '#E91E63', description: 'Rises with a glottal break' },
    { id: 'nang', name: 'Nặng', mark: 'ạ', label: 'Heavy', color: '#795548', description: 'Low, short, drops with a stop' },
];

// ─── Word Bank ─────────────────────────────────────────────────────
// Each word is tagged with its tone id.
const WORD_BANK = [
    // Ngang (level / no mark)
    { word: 'ba', tone: 'ngang', meaning: 'three / father' },
    { word: 'ma', tone: 'ngang', meaning: 'ghost' },
    { word: 'ca', tone: 'ngang', meaning: 'to sing' },
    { word: 'ta', tone: 'ngang', meaning: 'we / us' },
    { word: 'la', tone: 'ngang', meaning: 'to shout' },
    { word: 'đi', tone: 'ngang', meaning: 'to go' },

    // Sắc (rising / acute accent)
    { word: 'bá', tone: 'sac', meaning: 'governor' },
    { word: 'má', tone: 'sac', meaning: 'mother / cheek' },
    { word: 'cá', tone: 'sac', meaning: 'fish' },
    { word: 'lá', tone: 'sac', meaning: 'leaf' },
    { word: 'tá', tone: 'sac', meaning: 'dozen' },
    { word: 'bó', tone: 'sac', meaning: 'bundle' },

    // Huyền (falling / grave accent)
    { word: 'bà', tone: 'huyen', meaning: 'grandmother' },
    { word: 'mà', tone: 'huyen', meaning: 'but / which' },
    { word: 'là', tone: 'huyen', meaning: 'to be' },
    { word: 'và', tone: 'huyen', meaning: 'and' },
    { word: 'dù', tone: 'huyen', meaning: 'although' },
    { word: 'rồi', tone: 'huyen', meaning: 'already' },

    // Hỏi (dipping / hook)
    { word: 'bả', tone: 'hoi', meaning: 'poison bait' },
    { word: 'mả', tone: 'hoi', meaning: 'grave / tomb' },
    { word: 'cả', tone: 'hoi', meaning: 'all / eldest' },
    { word: 'hỏi', tone: 'hoi', meaning: 'to ask' },
    { word: 'bảo', tone: 'hoi', meaning: 'to tell' },
    { word: 'chỉ', tone: 'hoi', meaning: 'only / to point' },

    // Ngã (rising-glottal / tilde)
    { word: 'bã', tone: 'nga', meaning: 'residue / dregs' },
    { word: 'mã', tone: 'nga', meaning: 'code / horse (Sino)' },
    { word: 'ngã', tone: 'nga', meaning: 'to fall / tumble' },
    { word: 'lũ', tone: 'nga', meaning: 'flood' },
    { word: 'cũ', tone: 'nga', meaning: 'old (thing)' },
    { word: 'đã', tone: 'nga', meaning: 'already (past)' },

    // Nặng (heavy / dot below)
    { word: 'bạ', tone: 'nang', meaning: 'reckless / record' },
    { word: 'mạ', tone: 'nang', meaning: 'rice seedling' },
    { word: 'nạn', tone: 'nang', meaning: 'disaster' },
    { word: 'họp', tone: 'nang', meaning: 'to meet' },
    { word: 'học', tone: 'nang', meaning: 'to study' },
    { word: 'mặt', tone: 'nang', meaning: 'face' },
];

// Helper: shuffle array
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ─── Component ─────────────────────────────────────────────────────
export default function TonePractice({ tones = ALL_TONES.map(t => t.id), title = '🎵 Tone Mastery' }) {
    // Filter tones and words based on prop
    const TONES = useMemo(() => ALL_TONES.filter(t => tones.includes(t.id)), [tones]);
    const filteredWordBank = useMemo(() => WORD_BANK.filter(w => tones.includes(w.tone)), [tones]);
    const { speak } = useTTS();
    const { session, markComplete, goNext, goBack } = usePracticeCompletion();

    const [gameState, setGameState] = useState('intro'); // intro | playing | summary
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedTone, setSelectedTone] = useState(null);
    const [feedback, setFeedback] = useState('idle'); // idle | correct | incorrect
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [totalAnswered, setTotalAnswered] = useState(0);

    // Generate a shuffled set of questions on start
    const questions = useMemo(() => {
        if (gameState !== 'playing') return [];
        // Scale questions by session: 3 words per tone → up to 5 in later sessions
        const wordsPerTone = Math.min(3 + session, 5);
        const picked = [];
        TONES.forEach(t => {
            const wordsForTone = filteredWordBank.filter(w => w.tone === t.id);
            picked.push(...shuffle(wordsForTone).slice(0, wordsPerTone));
        });
        return shuffle(picked);
    }, [gameState, TONES, filteredWordBank]);

    const questionCount = questions.length;
    const currentQuestion = questions[currentIndex];
    const progress = questionCount > 0 ? (currentIndex / questionCount) * 100 : 0;

    const playWord = useCallback((text) => {
        setIsPlaying(true);
        speak(text, 0.75);
        // Reset playing state after a short delay
        setTimeout(() => setIsPlaying(false), 800);
    }, [speak]);

    // Auto-play audio when a new question appears
    useEffect(() => {
        if (gameState === 'playing' && currentQuestion) {
            const timer = setTimeout(() => playWord(currentQuestion.word), 400);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, gameState, currentQuestion, playWord]);

    const handleSelectTone = (toneId) => {
        if (feedback !== 'idle') return;
        setSelectedTone(toneId);
    };

    const handleCheck = useCallback(() => {
        if (!selectedTone || !currentQuestion) return;
        const isCorrect = selectedTone === currentQuestion.tone;

        if (isCorrect) {
            playSuccess();
            setFeedback('correct');
            setScore(s => s + 1);
            setStreak(s => {
                const next = s + 1;
                setBestStreak(b => Math.max(b, next));
                return next;
            });
            playWord(currentQuestion.word);
        } else {
            playError();
            setFeedback('incorrect');
            setStreak(0);
        }
    }, [selectedTone, currentQuestion, playWord]);

    const handleContinue = useCallback(() => {
        if (currentIndex < questionCount - 1) {
            setCurrentIndex(i => i + 1);
            setSelectedTone(null);
            setFeedback('idle');
        } else {
            setTotalAnswered(questionCount);
            setGameState('summary');
        }
    }, [currentIndex, questionCount]);

    const handleStart = () => {
        setGameState('playing');
        setCurrentIndex(0);
        setScore(0);
        setTotalAnswered(0);
        setStreak(0);
        setBestStreak(0);
        setSelectedTone(null);
        setFeedback('idle');
    };

    // Keyboard: Enter to check/continue
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Enter') {
                if (gameState === 'playing') {
                    if (feedback === 'idle' && selectedTone) {
                        handleCheck();
                    } else if (feedback !== 'idle') {
                        handleContinue();
                    }
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [gameState, feedback, selectedTone, handleCheck, handleContinue]);

    // ── Intro Screen ──
    if (gameState === 'intro') {
        return (
            <div className="practice-layout">
                <div className="practice-header">
                    <h1 className="practice-header-title">
                        <button onClick={goBack} style={{ color: 'var(--text-main)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <ArrowLeft size={24} />
                        </button>
                        {title}
                    </h1>
                </div>
                <div className="practice-content-centered">
                    <div className="practice-intro-icon">🎧</div>
                    <h2 className="practice-title">Train Your Ear</h2>
                    <p className="practice-subtitle">
                        Vietnamese has <strong>6 tones</strong> that change the meaning of words entirely.
                        Listen to a word and identify which tone is being used.
                    </p>
                    <div className="practice-grid-flat">
                        {TONES.map(t => (
                            <button
                                key={t.id}
                                className="practice-grid-item"
                                onClick={() => speak(t.mark, 0.7)}
                            >
                                <span className="tone-mark" style={{ color: t.color }}>{t.mark}</span>
                                <span className="tone-name">{t.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="practice-bottom-bar">
                    <SoundButton className="practice-action-btn primary" onClick={handleStart}>
                        Start Practice
                    </SoundButton>
                </div>
            </div>
        );
    }

    // ── Summary Screen ──
    if (gameState === 'summary') {
        const pct = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
        markComplete();
        let message = 'Keep it up!';
        if (pct >= 90) message = 'Incredible! You have an amazing ear! 🎯';
        else if (pct >= 70) message = 'Great job! Almost there! 💪';
        else if (pct >= 50) message = 'Nice work! Practice makes perfect!';

        return (
            <div className="practice-layout">
                <div className="practice-header">
                    <h1 className="practice-header-title">
                        <button onClick={goBack} style={{ color: 'var(--text-main)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <ArrowLeft size={24} />
                        </button>
                        {title}
                    </h1>
                </div>
                <div className="practice-content-centered">
                    <Trophy size={80} style={{ color: 'var(--primary-color)', marginBottom: '24px' }} />
                    <h2 className="practice-title">Practice Complete!</h2>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)', margin: '16px 0' }}>{score} / {totalAnswered}</div>
                    <p className="practice-subtitle">
                        {message}<br />
                        Best streak: 🔥 {bestStreak}
                    </p>
                </div>
                <div className="practice-bottom-bar" style={{ flexDirection: 'row', gap: '16px', justifyContent: 'center' }}>
                    <SoundButton className="practice-action-btn" sound="button" style={{ background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', width: 'auto', flex: 1, boxShadow: '0 4px 0 var(--border-color)' }} onClick={() => setGameState('intro')}>
                        Back
                    </SoundButton>
                    <SoundButton className="practice-action-btn primary" style={{ width: 'auto', flex: 2 }} onClick={goNext}>
                        Next
                    </SoundButton>
                </div>
            </div>
        );
    }

    // ── Playing Screen ──
    const correctTone = currentQuestion ? TONES.find(t => t.id === currentQuestion.tone) : null;

    return (
        <div className="practice-layout">
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <button onClick={goBack} style={{ color: 'var(--text-main)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <X size={24} />
                    </button>
                </h1>
                <div className="practice-stats">
                    <span className="practice-stat-pill" style={{ color: 'var(--text-main)' }}>
                        <Star size={18} style={{ color: 'var(--primary-color)' }} /> {score}
                    </span>
                    <span className="practice-stat-pill" style={{ color: 'var(--text-main)' }}>
                        <Flame size={18} style={{ color: '#FF5722' }} /> {streak}
                    </span>
                </div>
            </div>

            {/* Progress */}
            <div className="tone-progress-bar">
                <div className="tone-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="practice-content-centered" style={{ justifyContent: 'flex-start', marginTop: '24px' }}>
                <span className="tone-prompt-label" style={{ marginBottom: '32px' }}>
                    Listen and identify the tone
                </span>

                {/* Big Audio Button */}
                <button
                    className={`practice-audio-btn large ${isPlaying ? 'playing' : ''}`}
                    onClick={() => playWord(currentQuestion.word)}
                    title="Play audio"
                >
                    <Volume2 size={40} />
                </button>

                {feedback !== 'idle' ? (
                    <>
                        <div className="tone-word-display">{currentQuestion.word}</div>
                        {currentQuestion.meaning && (
                            <div className="tone-word-hint">"{currentQuestion.meaning}"</div>
                        )}
                    </>
                ) : (
                    <div className="tone-word-display" style={{ color: 'transparent' }}>
                        _
                    </div>
                )}

                {/* Tone Options */}
                <div className="tone-options-grid" style={{ marginTop: 'auto', marginBottom: '40px' }}>
                    {TONES.map(t => {
                        let extraClass = '';
                        if (feedback !== 'idle') {
                            if (t.id === currentQuestion.tone) extraClass = 'correct-highlight';
                            else if (t.id === selectedTone && feedback === 'incorrect') extraClass = 'wrong';
                            else extraClass = 'disabled';
                        } else if (t.id === selectedTone) {
                            extraClass = 'selected';
                        }

                        return (
                            <button
                                key={t.id}
                                className={`tone-option-btn ${extraClass}`}
                                onClick={() => handleSelectTone(t.id)}
                            >
                                <span className="tone-mark" style={{ color: extraClass ? undefined : t.color }}>
                                    {t.mark}
                                </span>
                                <span className="tone-name">{t.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Fixed Footer */}
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
                                        ? `${correctTone?.name} (${correctTone?.label})`
                                        : `Answer: ${correctTone?.name} (${correctTone?.mark})`}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {feedback === 'idle' ? (
                    <SoundButton
                        className={`practice-action-btn ${selectedTone ? 'primary' : 'disabled'}`}
                        onClick={handleCheck}
                    >
                        Check
                    </SoundButton>
                ) : (
                    <SoundButton
                        className={`practice-action-btn primary`}
                        style={feedback === 'incorrect' ? { background: 'var(--danger-color)', color: 'white', boxShadow: '0 4px 0 #b92b49' } : { background: 'var(--success-color)', color: '#1a1a1a', boxShadow: '0 4px 0 #049e75' }}
                        onClick={handleContinue}
                    >
                        Continue
                    </SoundButton>
                )}
            </div>
        </div>
    );
}
