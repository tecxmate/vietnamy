import React, { useState, useMemo } from 'react';
import './TelexTyping.css';
import { ArrowLeft, RefreshCw, Keyboard, Trophy, CheckCircle, XCircle, Zap } from 'lucide-react';
import { playSuccess, playError } from '../../utils/sound';
import SoundButton from '../../components/SoundButton';
import './PracticeShared.css';
import { generateMixedQuestions } from '../../lib/practiceQuestionGenerator';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';

const ALL_TELEX_RULES = [
    { key: 's', effect: 'Acute accent (Dấu sắc)', example: 'a + s = á', target: 'á' },
    { key: 'f', effect: 'Grave accent (Dấu huyền)', example: 'a + f = à', target: 'à' },
    { key: 'r', effect: 'Hook above (Dấu hỏi)', example: 'a + r = ả', target: 'ả' },
    { key: 'x', effect: 'Tilde (Dấu ngã)', example: 'a + x = ã', target: 'ã' },
    { key: 'j', effect: 'Dot below (Dấu nặng)', example: 'a + j = ạ', target: 'ạ' },
    { key: 'aa', effect: 'Circumflex (â)', example: 'a + a = â', target: 'â' },
    { key: 'aw', effect: 'Breve (ă)', example: 'a + w = ă', target: 'ă' },
    { key: 'ee', effect: 'Circumflex (ê)', example: 'e + e = ê', target: 'ê' },
    { key: 'oo', effect: 'Circumflex (ô)', example: 'o + o = ô', target: 'ô' },
    { key: 'ow', effect: 'Horn (ơ)', example: 'o + w = ơ', target: 'ơ' },
    { key: 'uw', effect: 'Horn (ư)', example: 'u + w = ư', target: 'ư' },
    { key: 'dd', effect: 'D with stroke (đ)', example: 'd + d = đ', target: 'đ' },
];

const TelexTyping = ({ rules: ruleKeys = null, title = '⌨️ TELEX Master', questionCount = 8 }) => {
    const TELEX_RULES = useMemo(() =>
        ruleKeys ? ALL_TELEX_RULES.filter(r => ruleKeys.includes(r.key)) : ALL_TELEX_RULES,
        [ruleKeys]
    );

    const { session, markComplete, goNext, goBack } = usePracticeCompletion();
    const scaledQuestionCount = Math.min(questionCount + session * 2, questionCount * 2);

    const [gameState, setGameState] = useState('intro'); // intro, playing, summary
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [questions, setQuestions] = useState([]);

    const currentQuestion = questions[currentQIndex];

    const handleStart = () => {
        const qs = generateMixedQuestions(TELEX_RULES, {
            count: scaledQuestionCount,
            constructionRatio: 0.35,
            constructionMapper: (rule) => ({
                target: rule.target,
                answers: [rule.key],
                hint: rule.key.length > 1 ? 'Double tap or add modifier key' : `Single key after the vowel`,
            }),
        });
        setQuestions(qs);
        setGameState('playing');
        setCurrentQIndex(0);
        setScore(0);
        setStreak(0);
        setUserInput('');
        setFeedback(null);
    };

    const handleAnswer = (isCorrect) => {
        if (isCorrect) {
            playSuccess();
            setScore(s => s + 10 + (streak * 2));
            setStreak(s => s + 1);
            setFeedback({ type: 'correct', message: 'Excellent!' });
        } else {
            playError();
            setStreak(0);
            setFeedback({ type: 'wrong', message: 'Not quite. Try again!' });
        }

        setTimeout(() => {
            if (currentQIndex < questions.length - 1) {
                setCurrentQIndex(prev => prev + 1);
                setUserInput('');
                setFeedback(null);
            } else {
                markComplete();
                setGameState('summary');
            }
        }, 1200);
    };

    const checkConstructionAnswer = (e) => {
        e.preventDefault();
        const input = userInput.trim().toLowerCase();
        const correctChar = currentQuestion.target.toLowerCase();
        // Allow both the Telex code (e.g. "aa") and the resulting character (e.g. "â")
        const isCorrect = currentQuestion.answers
            ? currentQuestion.answers.some(a => input === a.toLowerCase())
            : input === (currentQuestion.answer || '').toLowerCase();

        handleAnswer(isCorrect || input === correctChar);
    };

    return (
        <div className="practice-layout" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <button onClick={goBack} style={{ color: 'var(--text-main)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <ArrowLeft size={24} />
                    </button>
                    {title}
                </h1>
                {gameState === 'playing' && (
                    <div className="practice-stats">
                        <span className="practice-stat-pill" style={{ color: 'var(--text-main)' }}>
                            <Trophy size={18} style={{ color: 'var(--primary-color)' }} /> {score}
                        </span>
                        <span className="practice-stat-pill" style={{ color: 'var(--text-main)' }}>
                            <Zap size={18} style={{ color: '#FF5722' }} /> {streak}
                        </span>
                    </div>
                )}
            </div>

            <div className="telex-grid" style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>

                {/* Game Area */}
                <div className="telex-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {gameState === 'intro' && (
                        <div className="practice-content-centered">
                            <Keyboard size={64} style={{ color: 'var(--primary-color)', marginBottom: '24px' }} />
                            <h2 className="practice-title">Master Vietnamese Typing</h2>
                            <p className="practice-subtitle" style={{ maxWidth: '400px' }}>
                                Use the reference rules below to learn, then verify your skills in the challenge mode.
                            </p>

                            {/* Rules Reference embedded in intro for mobile layout */}
                            <div className="telex-rules" style={{ width: '100%', marginTop: '32px', textAlign: 'left', background: 'var(--surface-color)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', maxHeight: '300px', overflowY: 'auto' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)', borderBottom: '2px solid var(--primary-color)', paddingBottom: '8px', display: 'inline-block' }}>Rules Reference</h3>
                                <div className="rules-list">
                                    {TELEX_RULES.map((rule) => (
                                        <div key={rule.key} className="rule-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                                            <div className="rule-key"><kbd style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-color)' }}>{rule.key}</kbd></div>
                                            <div className="rule-effect" style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span className="effect-name" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{rule.effect}</span>
                                                <code className="effect-example" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rule.example}</code>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {gameState === 'playing' && (
                        <div className="pitch-game-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1, background: 'transparent', border: 'none', boxShadow: 'none' }}>
                            <div className="pitch-progress-bar" style={{ borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
                                <div
                                    className="pitch-progress-fill"
                                    style={{ width: `${((currentQIndex) / questions.length) * 100}%` }}
                                ></div>
                            </div>

                            <div className="question-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div className="target-char" style={{ fontSize: '4.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', lineHeight: 1 }}>{currentQuestion.target}</div>
                                <h3 className="question-text" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '32px', textAlign: 'center' }}>{currentQuestion.question}</h3>

                                {feedback && (
                                    <div className={`practice-feedback-bar`} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, animation: 'slideUpResult 0.3s ease-out' }}>
                                        <div className={`practice-feedback-msg ${feedback.type === 'correct' ? 'correct' : 'incorrect'}`}>
                                            <div className={`practice-icon-circle ${feedback.type === 'correct' ? 'correct' : 'incorrect'}`}>
                                                {feedback.type === 'correct' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                <span style={{ fontSize: '1.1rem' }}>{feedback.message}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!feedback && (
                                    <div className="interaction-area" style={{ width: '100%', maxWidth: '500px' }}>
                                        {currentQuestion.type === 'multiple-choice' && (
                                            <div className="voc-quiz-options">
                                                {currentQuestion.options.map((opt, idx) => (
                                                    <button
                                                        key={idx}
                                                        className="voc-quiz-option"
                                                        onClick={() => handleAnswer(opt.isCorrect)}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {currentQuestion.type === 'construction' && (
                                            <form onSubmit={checkConstructionAnswer} className="construction-form" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                                                <input
                                                    type="text"
                                                    value={userInput}
                                                    onChange={(e) => setUserInput(e.target.value)}
                                                    placeholder="Type TELEX..."
                                                    autoFocus
                                                    className="construction-input"
                                                    style={{ fontSize: '2rem', textAlign: 'center', padding: '16px', width: '220px', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-color)', color: 'var(--text-main)', letterSpacing: '4px', outline: 'none', transition: 'all 0.2s' }}
                                                />
                                                <SoundButton type="submit" className="practice-action-btn primary" style={{ width: '220px' }}>Submit</SoundButton>
                                                <p className="hint-text" style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>{currentQuestion.hint}</p>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {gameState === 'summary' && (
                        <div className="practice-content-centered">
                            <Trophy size={80} style={{ color: 'var(--primary-color)', marginBottom: '24px' }} />
                            <h2 className="practice-title">Lesson Complete!</h2>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)', margin: '16px 0' }}>{score}</div>
                            <p className="practice-subtitle">Ready for the real world?</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Bar for navigation actions */}
            <div className="practice-bottom-bar" style={{ justifyContent: 'center' }}>
                {gameState === 'intro' && (
                    <SoundButton className="practice-action-btn primary" onClick={handleStart}>
                        Start Challenge
                    </SoundButton>
                )}
                {gameState === 'summary' && (
                    <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '400px' }}>
                        <SoundButton className="practice-action-btn" sound="button" style={{ flex: 1, background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', boxShadow: '0 4px 0 var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={handleStart}>
                            <RefreshCw size={20} /> Play Again
                        </SoundButton>
                        <SoundButton className="practice-action-btn primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={goNext}>
                            Next
                        </SoundButton>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TelexTyping;
