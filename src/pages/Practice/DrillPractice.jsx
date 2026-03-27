import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Volume2, Check, X, Trophy, Star, RotateCw } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';
import { playSuccess, playError } from '../../utils/sound';
import SoundButton from '../../components/SoundButton';
import './PracticeShared.css';
import './DrillPractice.css';

const CMS_KEY_PREFIX = 'vnme_cms_drill_';

// Shuffle helper
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

/**
 * Generic drill practice engine.
 *
 * Props:
 *  - data: drill JSON object (id, title, description, questions[])
 *  - questionCount: how many questions per session (default: 10)
 *
 * Supports question types: mcq, fill_blank, listen_pick
 * All data comes from JSON — editable via admin CMS.
 */
export default function DrillPractice({ data, questionCount = 10 }) {
    const { speak } = useTTS();
    const { session, markComplete, goNext, goBack } = usePracticeCompletion();

    // Load CMS overrides from localStorage (if teacher edited the content)
    const drillData = useMemo(() => {
        const stored = localStorage.getItem(CMS_KEY_PREFIX + data.id);
        return stored ? JSON.parse(stored) : data;
    }, [data]);

    const [phase, setPhase] = useState('intro'); // intro | drill | summary
    const [questions, setQuestions] = useState([]);
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const [mistakes, setMistakes] = useState([]);

    const startDrill = useCallback(() => {
        const shuffled = shuffle(drillData.questions);
        // Scale question count by session: +25% per session
        const scaledCount = Math.round(questionCount * (1 + session * 0.25));
        const count = Math.min(scaledCount, shuffled.length);
        // Shuffle options within each question too
        const prepared = shuffled.slice(0, count).map(q => ({
            ...q,
            options: shuffle(q.options)
        }));
        setQuestions(prepared);
        setQIndex(0);
        setSelected(null);
        setShowFeedback(false);
        setScore(0);
        setMistakes([]);
        setPhase('drill');
    }, [drillData, questionCount]);

    const currentQ = questions[qIndex] || null;

    const handleSelect = useCallback((option) => {
        if (showFeedback) return;
        setSelected(option);
    }, [showFeedback]);

    const handleCheck = useCallback(() => {
        if (!selected || !currentQ) return;
        const isCorrect = selected === currentQ.correct;
        if (isCorrect) {
            playSuccess();
            setScore(s => s + 1);
        } else {
            playError();
            setMistakes(m => [...m, { ...currentQ, userAnswer: selected }]);
        }
        setShowFeedback(true);
    }, [selected, currentQ]);

    const handleNext = useCallback(() => {
        if (qIndex + 1 >= questions.length) {
            markComplete();
            setPhase('summary');
        } else {
            setQIndex(i => i + 1);
            setSelected(null);
            setShowFeedback(false);
        }
    }, [qIndex, questions.length, markComplete]);

    const handlePlayAudio = useCallback((text) => {
        if (text) speak(text);
    }, [speak]);

    // ─── Intro Screen ──────────────────────────────────────────────
    if (phase === 'intro') {
        return (
            <div className="practice-layout">
                <div className="practice-header">
                    <button onClick={goBack} className="practice-back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><ArrowLeft size={24} /></button>
                </div>
                <div className="practice-content-centered">
                    <div className="practice-intro-icon">📝</div>
                    <h1 className="practice-title">{drillData.title}</h1>
                    <p className="practice-subtitle">{drillData.intro || drillData.description}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 8 }}>
                        {Math.min(questionCount, drillData.questions.length)} questions per session
                    </p>
                </div>
                <div className="practice-bottom-bar">
                    <SoundButton className="practice-action-btn primary" onClick={startDrill}>
                        Start Practice
                    </SoundButton>
                </div>
            </div>
        );
    }

    // ─── Summary Screen ────────────────────────────────────────────
    if (phase === 'summary') {
        const pct = Math.round((score / questions.length) * 100);
        return (
            <div className="practice-layout">
                <div className="practice-header">
                    <button onClick={goBack} className="practice-back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><ArrowLeft size={24} /></button>
                </div>
                <div className="practice-content-centered">
                    <Trophy size={64} color="var(--primary-color)" style={{ marginBottom: 16 }} />
                    <h1 className="practice-title">Practice Complete!</h1>
                    <div className="drill-score-display">
                        <div className="drill-score-circle" data-pct={pct}>
                            <span className="drill-score-number">{pct}%</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                            {score} / {questions.length} correct
                        </p>
                    </div>

                    {mistakes.length > 0 && (
                        <div className="drill-mistakes-review">
                            <h3 style={{ marginBottom: 12, color: 'var(--text-main)' }}>Review Mistakes</h3>
                            {mistakes.map((m, i) => (
                                <div key={i} className="drill-mistake-card">
                                    <p className="drill-mistake-q">{m.prompt}</p>
                                    <p className="drill-mistake-wrong">
                                        <X size={14} /> Your answer: {m.userAnswer}
                                    </p>
                                    <p className="drill-mistake-correct">
                                        <Check size={14} /> Correct: {m.correct}
                                    </p>
                                    {m.explanation && (
                                        <p className="drill-mistake-explain">{m.explanation}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="practice-bottom-bar" style={{ gap: 8 }}>
                    <SoundButton className="practice-action-btn primary" onClick={goNext}>
                        Next
                    </SoundButton>
                    <SoundButton
                        className="practice-action-btn"
                        style={{ background: 'transparent', color: 'var(--text-muted)', boxShadow: 'none' }}
                        onClick={startDrill}
                    >
                        <RotateCw size={16} style={{ marginRight: 6 }} /> Try Again
                    </SoundButton>
                </div>
            </div>
        );
    }

    // ─── Drill Screen ──────────────────────────────────────────────
    const progress = ((qIndex + 1) / questions.length) * 100;
    const isCorrect = selected === currentQ?.correct;

    return (
        <div className="practice-layout practice-fixed-layout">
            {/* Header */}
            <div className="practice-header">
                <button onClick={goBack} className="practice-back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><ArrowLeft size={24} /></button>
                <div className="practice-stats">
                    <span className="practice-stat-pill">
                        <Star size={16} color="var(--primary-color)" /> {score}
                    </span>
                    <span className="practice-stat-pill" style={{ color: 'var(--text-muted)' }}>
                        {qIndex + 1}/{questions.length}
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="drill-progress-bar">
                <div className="drill-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            {/* Question area */}
            <div className="practice-scroll-area">
                <div className="drill-question-area">
                    {/* Audio button for listen_pick */}
                    {currentQ?.type === 'listen_pick' && currentQ.audio && (
                        <button
                            className="practice-audio-btn large"
                            onClick={() => handlePlayAudio(currentQ.audio)}
                        >
                            <Volume2 size={36} />
                        </button>
                    )}

                    <p className="drill-prompt">{currentQ?.prompt}</p>

                    {/* Options */}
                    <div className="drill-options">
                        {currentQ?.options.map((opt, i) => {
                            let cls = 'drill-option';
                            if (showFeedback) {
                                if (opt === currentQ.correct) cls += ' correct';
                                else if (opt === selected) cls += ' incorrect';
                            } else if (opt === selected) {
                                cls += ' selected';
                            }
                            return (
                                <button
                                    key={i}
                                    className={cls}
                                    onClick={() => handleSelect(opt)}
                                    disabled={showFeedback}
                                >
                                    <span className="drill-option-letter">{String.fromCharCode(65 + i)}</span>
                                    <span className="drill-option-text">{opt}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Explanation after answer */}
                    {showFeedback && currentQ?.explanation && (
                        <div className={`drill-explanation ${isCorrect ? 'correct' : 'incorrect'}`}>
                            <p>{currentQ.explanation}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom bar */}
            <div className="practice-bottom-bar">
                {showFeedback && (
                    <div className="practice-feedback-bar">
                        <div className={`practice-feedback-msg ${isCorrect ? 'correct' : 'incorrect'}`}>
                            <div className={`practice-icon-circle ${isCorrect ? 'correct' : 'incorrect'}`}>
                                {isCorrect ? <Check size={18} /> : <X size={18} />}
                            </div>
                            {isCorrect ? 'Correct!' : 'Not quite'}
                        </div>
                    </div>
                )}
                {!showFeedback ? (
                    <SoundButton
                        className={`practice-action-btn ${selected ? 'primary' : 'disabled'}`}
                        onClick={handleCheck}
                        disabled={!selected}
                    >
                        Check
                    </SoundButton>
                ) : (
                    <SoundButton className="practice-action-btn primary" onClick={handleNext}>
                        {qIndex + 1 >= questions.length ? 'See Results' : 'Continue'}
                    </SoundButton>
                )}
            </div>
        </div>
    );
}
