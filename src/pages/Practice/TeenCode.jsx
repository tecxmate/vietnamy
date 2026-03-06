import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, MessageCircle, Trophy, CheckCircle, XCircle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import './TeenCode.css';
import { playSuccess, playError } from '../../utils/sound';
import SoundButton from '../../components/SoundButton';
import './PracticeShared.css';

// ─── Vietnamese Teen Code / Texting Shortcuts ───────────────────
// Common abbreviations used in Vietnamese texting, social media, and chat.
// Categories: number-based, letter shortcuts, slang contractions, emoji-like

const TEENCODE_RULES = [
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

const QUESTIONS = [
    {
        id: 1,
        type: 'multiple-choice',
        question: 'What does "k" mean in a Vietnamese text?',
        target: 'k',
        options: [
            { label: 'không (no)', value: 'không', isCorrect: true },
            { label: 'khi (when)', value: 'khi', isCorrect: false },
            { label: 'OK', value: 'ok', isCorrect: false },
            { label: 'khó (difficult)', value: 'khó', isCorrect: false },
        ]
    },
    {
        id: 2,
        type: 'multiple-choice',
        question: 'Your friend texts "Đi cf k?" — What are they asking?',
        target: 'Đi cf k?',
        options: [
            { label: 'Want to go get coffee?', value: 'coffee', isCorrect: true },
            { label: 'Want to go to class?', value: 'class', isCorrect: false },
            { label: 'Are you going home?', value: 'home', isCorrect: false },
            { label: 'Do you like cats?', value: 'cats', isCorrect: false },
        ]
    },
    {
        id: 3,
        type: 'construction',
        question: 'How would you shorten "được" in a text?',
        target: 'được → ?',
        hint: 'Two letters, starts with d',
        answers: ['dc', 'đc'],
    },
    {
        id: 4,
        type: 'multiple-choice',
        question: 'What does "ib" mean?',
        target: 'ib',
        options: [
            { label: 'inbox (private message)', value: 'inbox', isCorrect: true },
            { label: 'internet banking', value: 'bank', isCorrect: false },
            { label: 'I\'m busy', value: 'busy', isCorrect: false },
            { label: 'ice cream (kem)', value: 'ice', isCorrect: false },
        ]
    },
    {
        id: 5,
        type: 'decode',
        question: 'Decode this text message:',
        target: 'B ơi, ik cf k?',
        answer: 'Bạn ơi, đi cà phê không?',
        options: [
            { label: 'Bạn ơi, đi cà phê không?', isCorrect: true },
            { label: 'Bố ơi, đi chợ không?', isCorrect: false },
            { label: 'Bạn ơi, ăn cơm không?', isCorrect: false },
            { label: 'Bé ơi, đi công viên không?', isCorrect: false },
        ]
    },
    {
        id: 6,
        type: 'construction',
        question: 'How do Vietnamese teens write "gì" (what)?',
        target: 'gì → ?',
        hint: 'A single letter',
        answers: ['j', 'z', 'gi'],
    },
    {
        id: 7,
        type: 'decode',
        question: 'Decode this text message:',
        target: 'Mk bt r, tks b nhìu!',
        answer: 'Mình biết rồi, cảm ơn bạn nhiều!',
        options: [
            { label: 'Mình biết rồi, cảm ơn bạn nhiều!', isCorrect: true },
            { label: 'Mình buồn rồi, thôi bạn nhé!', isCorrect: false },
            { label: 'Mẹ biết rồi, thương bạn nhiều!', isCorrect: false },
            { label: 'Mình bận rồi, tạm biệt nhé!', isCorrect: false },
        ]
    },
    {
        id: 8,
        type: 'multiple-choice',
        question: '"Ck" and "vk" are short for…?',
        target: 'ck / vk',
        options: [
            { label: 'chồng / vợ (husband / wife)', value: 'spouse', isCorrect: true },
            { label: 'con khỉ / vui khỏe', value: 'monkey', isCorrect: false },
            { label: 'check / verify', value: 'check', isCorrect: false },
            { label: 'các bạn / vài người', value: 'people', isCorrect: false },
        ]
    },
    {
        id: 9,
        type: 'construction',
        question: 'Shorten "nói chuyện" (to chat) into teen code:',
        target: 'nói chuyện → ?',
        hint: 'Take the first letters of each word',
        answers: ['nc'],
    },
    {
        id: 10,
        type: 'decode',
        question: 'Decode this text message:',
        target: 'E nhớ a, ns j ik!',
        answer: 'Em nhớ anh, nói gì đi!',
        options: [
            { label: 'Em nhớ anh, nói gì đi!', isCorrect: true },
            { label: 'Em ngủ à, nhanh dậy!', isCorrect: false },
            { label: 'Ê nhé ai, nào siêu đi!', isCorrect: false },
            { label: 'Em nấu ăn, ngon lắm đi!', isCorrect: false },
        ]
    },
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

const TeenCode = () => {
    const [gameState, setGameState] = useState('intro');
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState(null);

    const currentQuestion = QUESTIONS[currentQIndex];

    const handleStart = () => {
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
            if (currentQIndex < QUESTIONS.length - 1) {
                setCurrentQIndex(prev => prev + 1);
                setUserInput('');
                setFeedback(null);
            } else {
                setGameState('summary');
            }
        }, 1200);
    };

    const checkConstructionAnswer = (e) => {
        e.preventDefault();
        const input = userInput.trim().toLowerCase();
        const isCorrect = currentQuestion.answers.some(
            ans => input === ans.toLowerCase()
        );
        handleAnswer(isCorrect);
    };

    return (
        <div className="practice-layout" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <Link to="/practice" style={{ color: 'var(--text-main)', display: 'flex' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    Teen Code
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
                                    style={{ width: `${((currentQIndex) / QUESTIONS.length) * 100}%` }}
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
                        <Link to="/practice" className="practice-action-btn primary" style={{ flex: 1, textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            Finish
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeenCode;
