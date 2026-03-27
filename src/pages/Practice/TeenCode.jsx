import React, { useState, useMemo } from 'react';
import { ArrowLeft, RefreshCw, MessageCircle, Trophy, CheckCircle, XCircle, Zap } from 'lucide-react';
import './TeenCode.css';
import { playSuccess, playError } from '../../utils/sound';
import SoundButton from '../../components/SoundButton';
import './PracticeShared.css';
import { generateMixedQuestions, generateDecode } from '../../lib/practiceQuestionGenerator';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';

const ALL_TEENCODE_RULES = [
    // Number-based substitutions
    { code: 'k / ko / hk', meaning: 'không (no / not)', category: 'basics', example: '"Bạn có đi k?" = Bạn có đi không?' },
    { code: 'dc / đc', meaning: 'được (can / OK)', category: 'basics', example: '"Dc rồi" = Được rồi' },
    { code: 'r / rùi', meaning: 'rồi (already / done)', category: 'basics', example: '"Xong r" = Xong rồi' },
    { code: 'mk / mik', meaning: 'mình (I / me)', category: 'pronouns', example: '"Mk đi trước nhé" = Mình đi trước nhé' },
    { code: 'b / bn', meaning: 'bạn (you / friend)', category: 'pronouns', example: '"B ơi!" = Bạn ơi!' },
    { code: 'a', meaning: 'anh (older brother / boyfriend)', category: 'pronouns', example: '"A đang ở đâu?" = Anh đang ở đâu?' },
    { code: 'e', meaning: 'em (younger / girlfriend)', category: 'pronouns', example: '"E nhớ a" = Em nhớ anh' },
    { code: 'ns', meaning: 'nói (to say / to speak)', category: 'verbs', example: '"Ns đi!" = Nói đi!' },
    { code: 'bt', meaning: 'biết (to know)', category: 'verbs', example: '"Ai bt đâu" = Ai biết đâu' },
    { code: 'ik', meaning: 'đi (to go)', category: 'verbs', example: '"Ik thôi!" = Đi thôi!' },
    { code: 'ck', meaning: 'chồng (husband)', category: 'family', example: '"Ck em dễ thương" = Chồng em dễ thương' },
    { code: 'vk', meaning: 'vợ (wife)', category: 'family', example: '"Vk anh nấu ăn ngon" = Vợ anh nấu ăn ngon' },
    { code: 'trc', meaning: 'trước (before)', category: 'time', example: '"Về trc nhé" = Về trước nhé' },
    { code: 'nc', meaning: 'nói chuyện (to chat)', category: 'verbs', example: '"Nc với mk đi" = Nói chuyện với mình đi' },
    { code: 'j / z / gi', meaning: 'gì (what)', category: 'basics', example: '"Làm j vậy?" = Làm gì vậy?' },
    { code: 'v', meaning: 'vậy (so / like that)', category: 'basics', example: '"Sao v?" = Sao vậy?' },
    { code: 'ntn', meaning: 'như thế nào (how)', category: 'basics', example: '"Làm ntn?" = Làm như thế nào?' },
    { code: 'ib', meaning: 'inbox (DM / private message)', category: 'internet', example: '"Ib mk nhé" = Inbox mình nhé' },
    { code: 'fb', meaning: 'Facebook', category: 'internet', example: '"Add fb mk đi" = Add Facebook mình đi' },
    { code: 'cf', meaning: 'cà phê (coffee)', category: 'lifestyle', example: '"Đi cf k?" = Đi cà phê không?' },
    { code: 'tks / thanks', meaning: 'cảm ơn (thank you)', category: 'basics', example: '"Tks b nhìu" = Cảm ơn bạn nhiều' },
    { code: 'nhìu / nhiu', meaning: 'nhiều (a lot / much)', category: 'basics', example: '"Yêu nhìu" = Yêu nhiều' },
    { code: 'wá / quá', meaning: 'quá (too / very)', category: 'basics', example: '"Đẹp wá!" = Đẹp quá!' },
    { code: 'lun / luôn', meaning: 'luôn (always / right away)', category: 'basics', example: '"Làm lun đi" = Làm luôn đi' },
];

// Decode sentence bank — used by the dynamic question generator
const DECODE_SENTENCES = [
    { encoded: 'B ơi, ik cf k?', decoded: 'Bạn ơi, đi cà phê không?', distractors: ['Bố ơi, đi chợ không?', 'Bạn ơi, ăn cơm không?', 'Bé ơi, đi công viên không?'], categories: ['basics', 'verbs', 'lifestyle'] },
    { encoded: 'Mk bt r, tks b nhìu!', decoded: 'Mình biết rồi, cảm ơn bạn nhiều!', distractors: ['Mình buồn rồi, thôi bạn nhé!', 'Mẹ biết rồi, thương bạn nhiều!', 'Mình bận rồi, tạm biệt nhé!'], categories: ['pronouns', 'verbs', 'basics'] },
    { encoded: 'E nhớ a, ns j ik!', decoded: 'Em nhớ anh, nói gì đi!', distractors: ['Em ngủ à, nhanh dậy!', 'Ê nhé ai, nào siêu đi!', 'Em nấu ăn, ngon lắm đi!'], categories: ['pronouns', 'verbs', 'basics'] },
    { encoded: 'Sao v? Nc vs mk ik!', decoded: 'Sao vậy? Nói chuyện với mình đi!', distractors: ['Sao vui? Nấu cơm với mẹ đi!', 'Sao vội? Ngồi chơi với mình đi!', 'Sao vắng? Nhắn cho mình đi!'], categories: ['basics', 'verbs', 'pronouns'] },
    { encoded: 'Ib mk nhé, add fb lun!', decoded: 'Inbox mình nhé, add Facebook luôn!', distractors: ['Internet mình nhé, ai đó Facebook luôn!', 'Ib mẹ nhé, add fb lúc nào!', 'Inbox mọi người nhé, add fb lâu!'], categories: ['internet', 'pronouns', 'basics'] },
    { encoded: 'Ck e dễ thương wá!', decoded: 'Chồng em dễ thương quá!', distractors: ['Con em dễ thương quá!', 'Chị em dễ thương quá!', 'Các em dễ thương quá!'], categories: ['family', 'pronouns', 'basics'] },
    { encoded: 'Về trc nhé, dc k?', decoded: 'Về trước nhé, được không?', distractors: ['Về trường nhé, đi không?', 'Về tiếp nhé, đúng không?', 'Về trễ nhé, đợi không?'], categories: ['time', 'basics'] },
    { encoded: 'Làm j v? Bt hk?', decoded: 'Làm gì vậy? Biết không?', distractors: ['Làm gì vui? Bạn khỏe không?', 'Lên đây vậy? Buồn không?', 'Lại gì vậy? Bao nhiêu không?'], categories: ['basics', 'verbs'] },
];

const CATEGORY_LABELS = {
    basics: 'Basics',
    pronouns: 'Pronouns',
    verbs: 'Verbs',
    family: 'Family',
    time: 'Time',
    internet: 'Internet',
    lifestyle: 'Lifestyle',
};

const CATEGORY_COLORS = {
    basics: '#06D6A0',
    pronouns: '#118AB2',
    verbs: '#FF5722',
    family: '#E91E63',
    time: '#9C27B0',
    internet: '#00BCD4',
    lifestyle: '#FF9800',
};

const TeenCode = ({ categories: allowedCategories = null, title = '💬 Teen Code', questionCount = 8 }) => {
    const TEENCODE_RULES = useMemo(() =>
        allowedCategories
            ? ALL_TEENCODE_RULES.filter(r => allowedCategories.includes(r.category))
            : ALL_TEENCODE_RULES,
        [allowedCategories]
    );

    const { session, markComplete, goNext, goBack } = usePracticeCompletion();
    const scaledQuestionCount = Math.min(questionCount + session * 2, questionCount * 2);

    const [gameState, setGameState] = useState('intro');
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [questions, setQuestions] = useState([]);

    const currentQuestion = questions[currentQIndex];

    const handleStart = () => {
        const qs = generateMixedQuestions(TEENCODE_RULES, {
            count: scaledQuestionCount,
            constructionRatio: 0.25,
            constructionMapper: (rule) => ({
                target: `${rule.meaning} → ?`,
                answers: rule.code.split(' / ').map(c => c.trim()),
                hint: `Shortcut for "${rule.meaning.split('(')[0].trim()}"`,
            }),
            decodeGenerator: (rules) => {
                const catSet = new Set(rules.map(r => r.category));
                return DECODE_SENTENCES
                    .filter(s => s.categories.some(c => catSet.has(c)))
                    .map(s => generateDecode(s.encoded, s.decoded, s.distractors));
            },
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
            setFeedback({ type: 'correct', message: 'Nice!' });
        } else {
            playError();
            setStreak(0);
            setFeedback({ type: 'wrong', message: 'Not quite!' });
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
        const isCorrect = currentQuestion.answers
            ? currentQuestion.answers.some(ans => input === ans.toLowerCase())
            : false;
        handleAnswer(isCorrect);
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                    {/* ─── Intro ─────────────────────────────────────────── */}
                    {gameState === 'intro' && (
                        <div className="practice-content-centered">
                            <MessageCircle size={64} style={{ color: 'var(--primary-color)', marginBottom: '24px' }} />
                            <h2 className="practice-title">Vietnamese Teen Code</h2>
                            <p className="practice-subtitle" style={{ maxWidth: '400px' }}>
                                Learn the shortcuts and slang Vietnamese people use when texting, chatting, and posting on social media.
                            </p>

                            <div className="teencode-rules" style={{ width: '100%', marginTop: '32px', textAlign: 'left', background: 'var(--surface-color)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', maxHeight: '340px', overflowY: 'auto' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)', borderBottom: '2px solid var(--primary-color)', paddingBottom: '8px', display: 'inline-block' }}>Common Teen Codes</h3>
                                <div className="teencode-list">
                                    {TEENCODE_RULES.map((rule, idx) => (
                                        <div key={idx} className="teencode-item">
                                            <div className="teencode-code-cell">
                                                <kbd className="teencode-kbd">{rule.code}</kbd>
                                            </div>
                                            <div className="teencode-meaning-cell">
                                                <span className="teencode-meaning">{rule.meaning}</span>
                                                <span className="teencode-category-tag" style={{ background: `${CATEGORY_COLORS[rule.category]}22`, color: CATEGORY_COLORS[rule.category] }}>
                                                    {CATEGORY_LABELS[rule.category]}
                                                </span>
                                                <code className="teencode-example">{rule.example}</code>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Playing ───────────────────────────────────────── */}
                    {gameState === 'playing' && (
                        <div style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div className="pitch-progress-bar" style={{ borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                                <div
                                    className="pitch-progress-fill"
                                    style={{ width: `${((currentQIndex) / questions.length) * 100}%` }}
                                ></div>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div className="teencode-target">{currentQuestion.target}</div>
                                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'center' }}>{currentQuestion.question}</h3>

                                {feedback && (
                                    <div className="practice-feedback-bar" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, animation: 'slideUpResult 0.3s ease-out' }}>
                                        <div className={`practice-feedback-msg ${feedback.type === 'correct' ? 'correct' : 'incorrect'}`}>
                                            <div className={`practice-icon-circle ${feedback.type === 'correct' ? 'correct' : 'incorrect'}`}>
                                                {feedback.type === 'correct' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                            </div>
                                            <span style={{ fontSize: '1.1rem' }}>{feedback.message}</span>
                                        </div>
                                    </div>
                                )}

                                {!feedback && (
                                    <div style={{ width: '100%', maxWidth: '500px' }}>
                                        {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'decode') && (
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
                                            <form onSubmit={checkConstructionAnswer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                                                <input
                                                    type="text"
                                                    value={userInput}
                                                    onChange={(e) => setUserInput(e.target.value)}
                                                    placeholder="Type shortcut..."
                                                    autoFocus
                                                    className="construction-input"
                                                    style={{ fontSize: '2rem', textAlign: 'center', padding: '16px', width: '220px', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-color)', color: 'var(--text-main)', letterSpacing: '4px', outline: 'none', transition: 'all 0.2s' }}
                                                />
                                                <SoundButton type="submit" className="practice-action-btn primary" style={{ width: '220px' }}>Submit</SoundButton>
                                                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>{currentQuestion.hint}</p>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── Summary ───────────────────────────────────────── */}
                    {gameState === 'summary' && (
                        <div className="practice-content-centered">
                            <Trophy size={80} style={{ color: 'var(--primary-color)', marginBottom: '24px' }} />
                            <h2 className="practice-title">Lesson Complete!</h2>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)', margin: '16px 0' }}>{score}</div>
                            <p className="practice-subtitle">Now you can text like a local!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Bottom Bar ───────────────────────────────────────────── */}
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

export default TeenCode;
