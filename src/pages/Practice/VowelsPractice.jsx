import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, Check, X, RotateCw, ArrowLeft, Trophy, Flame, Star, ChevronRight } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { useDong } from '../../context/DongContext';
import { DongCoin } from '../../components/DongCoin';
import './VowelsPractice.css';
import './PracticeShared.css'; // Add shared layout

// ─── Data ───────────────────────────────────────────────────────────

const SINGLE_VOWELS = [
    { letter: 'a', name: 'Plain a', sound: '"ah" as in <b>father</b>', example: 'ba', exMeaning: 'father' },
    { letter: 'ă', name: 'Smile a', sound: 'Shorter "ah" as in <b>cut</b> or <b>shut</b>', example: 'ăn', exMeaning: 'eat' },
    { letter: 'â', name: 'Hat a', sound: '"u" as in <b>but</b> (very short)', example: 'cần', exMeaning: 'need' },
    { letter: 'e', name: 'Plain e', sound: '"e" as in <b>get</b> or <b>set</b>', example: 'xe', exMeaning: 'vehicle' },
    { letter: 'ê', name: 'Hat e', sound: '"ay" as in <b>say</b> or <b>day</b>', example: 'bê', exMeaning: 'calf' },
    { letter: 'i / y', name: 'i / y', sound: '"ee" as in <b>see</b>', example: 'bi', exMeaning: 'marble' },
    { letter: 'o', name: 'Plain o', sound: '"o" as in <b>hot</b>', example: 'bò', exMeaning: 'cow' },
    { letter: 'ô', name: 'Hat o', sound: '"o" as in <b>go</b>', example: 'cô', exMeaning: 'miss' },
    { letter: 'ơ', name: 'Hook o', sound: '"u" as in <b>huh</b> or <b>fur</b> (but longer)', example: 'thơ', exMeaning: 'poem' },
    { letter: 'u', name: 'Plain u', sound: '"oo" as in <b>boot</b> or <b>true</b>', example: 'thu', exMeaning: 'autumn' },
    { letter: 'ư', name: 'Hook u', sound: 'Like "ee" but with flat, unrounded lips', example: 'thư', exMeaning: 'letter' },
];

const CENTERING_DIPHTHONGS = [
    {
        group: 'i-ê',
        open: 'ia',
        closed: 'iê / yê',
        examples: [
            { word: 'mía', meaning: 'cane', type: 'open' },
            { word: 'tiền', meaning: 'money', type: 'closed' },
            { word: 'yêu', meaning: 'love', type: 'closed' },
        ],
        approx: 'Like <b>ee-uh</b> (e.g., beer)',
    },
    {
        group: 'u-ô',
        open: 'ua',
        closed: 'uô',
        examples: [
            { word: 'mua', meaning: 'buy', type: 'open' },
            { word: 'muộn', meaning: 'late', type: 'closed' },
        ],
        approx: 'Like <b>oo-uh</b> (e.g., tour)',
    },
    {
        group: 'ư-ơ',
        open: 'ưa',
        closed: 'ươ',
        examples: [
            { word: 'mưa', meaning: 'rain', type: 'open' },
            { word: 'mượn', meaning: 'borrow', type: 'closed' },
        ],
        approx: 'Like <b>ư</b> (unrounded "ee") gliding into a neutral <b>uh</b>',
    },
];

const GLIDING_DIPHTHONGS = [
    { diph: 'ai', approx: 'Like "I" or "eye" (long a)', example: 'tai', meaning: 'ear' },
    { diph: 'ay', approx: 'Like "I" but shorter (short ă)', example: 'tay', meaning: 'hand' },
    { diph: 'ao', approx: 'Like "now" or "how"', example: 'chào', meaning: 'hello' },
    { diph: 'au', approx: 'Like "owl" but much shorter', example: 'sau', meaning: 'after' },
    { diph: 'âu', approx: 'Like "oh" (as in "go")', example: 'câu', meaning: 'sentence' },
    { diph: 'ây', approx: 'Like "ay" (as in "day")', example: 'mấy', meaning: 'how many' },
    { diph: 'eo', approx: 'Like "eh-ao" (meow)', example: 'mèo', meaning: 'cat' },
    { diph: 'êu', approx: 'Like "ay-oo"', example: 'kêu', meaning: 'call' },
    { diph: 'oi', approx: 'Like "oy" (as in "boy")', example: 'hỏi', meaning: 'ask' },
    { diph: 'ôi', approx: 'Like "oh-ee"', example: 'tôi', meaning: 'I / me' },
    { diph: 'ơi', approx: 'Like "uh-ee"', example: 'mới', meaning: 'new' },
    { diph: 'ui', approx: 'Like "oo-ee" (long u)', example: 'tui', meaning: 'me (slang)' },
    { diph: 'uy', approx: 'Like "we" in English', example: 'tuy', meaning: 'although' },
    { diph: 'iu', approx: 'Like "ew" (as in "few")', example: 'chịu', meaning: 'tolerate' },
    { diph: 'ưu', approx: 'Like ư gliding into u', example: 'hưu', meaning: 'retired' },
];

const TRIPHTHONGS = [
    { triph: 'iêu', components: 'iê + u', approx: '"ee-ay-oo" (like a fast "miao")', example: 'tiêu', meaning: 'pepper / spend' },
    { triph: 'yêu', components: 'yê + u', approx: '"ee-ay-oo" (same as iêu, but stands alone)', example: 'yêu', meaning: 'love' },
    { triph: 'oai', components: 'o + ai', approx: '"o-eye" (like "why" with a rounded start)', example: 'khoai', meaning: 'potato' },
    { triph: 'oay', components: 'o + ay', approx: '"o-eye" (shorter and sharper than oai)', example: 'xoay', meaning: 'rotate' },
    { triph: 'uôi', components: 'uô + i', approx: '"oo-oh-ee" (like "buoy")', example: 'chuối', meaning: 'banana' },
    { triph: 'ươi', components: 'ươ + i', approx: '"ư-uh-ee" (no English equivalent)', example: 'tươi', meaning: 'fresh' },
    { triph: 'ươu', components: 'ươ + u', approx: '"ư-uh-oo" (vaguely like "sewer")', example: 'rượu', meaning: 'wine / alcohol' },
    { triph: 'uây', components: 'u + ây', approx: '"w-ay" (like "sway")', example: 'khuấy', meaning: 'to stir' },
];

// Quiz data — all items pooled
const ALL_QUIZ_ITEMS = [
    // Single vowel identification
    ...SINGLE_VOWELS.map(v => ({
        type: 'identify-vowel',
        question: `What vowel sound does "${v.example}" use?`,
        audio: v.example,
        correctAnswer: v.letter,
        hint: `${v.example} (${v.exMeaning})`,
    })),
    // Centering diphthong: open vs closed
    ...CENTERING_DIPHTHONGS.flatMap(d =>
        d.examples.map(ex => ({
            type: 'open-closed',
            question: `"${ex.word}" (${ex.meaning}) — is this an open or closed syllable spelling?`,
            audio: ex.word,
            correctAnswer: ex.type === 'open' ? 'Open' : 'Closed',
            hint: `${d.group}: open = ${d.open}, closed = ${d.closed}`,
        }))
    ),
    // Gliding diphthong identification
    ...GLIDING_DIPHTHONGS.map(g => ({
        type: 'identify-gliding',
        question: `What diphthong does "${g.example}" (${g.meaning}) contain?`,
        audio: g.example,
        correctAnswer: g.diph,
        hint: g.approx,
    })),
    // Triphthong identification
    ...TRIPHTHONGS.map(t => ({
        type: 'identify-triphthong',
        question: `What triphthong does "${t.example}" (${t.meaning}) contain?`,
        audio: t.example,
        correctAnswer: t.triph,
        hint: `${t.components} → ${t.approx}`,
    })),
];

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Generate distractor options for quiz
function makeOptions(correct, type) {
    if (type === 'open-closed') {
        return shuffle(['Open', 'Closed']);
    }
    if (type === 'identify-vowel') {
        const all = SINGLE_VOWELS.map(v => v.letter);
        const distractors = shuffle(all.filter(x => x !== correct)).slice(0, 5);
        return shuffle([correct, ...distractors]);
    }
    if (type === 'identify-gliding') {
        const all = GLIDING_DIPHTHONGS.map(g => g.diph);
        const distractors = shuffle(all.filter(x => x !== correct)).slice(0, 5);
        return shuffle([correct, ...distractors]);
    }
    if (type === 'identify-triphthong') {
        const all = TRIPHTHONGS.map(t => t.triph);
        const distractors = shuffle(all.filter(x => x !== correct)).slice(0, 5);
        return shuffle([correct, ...distractors]);
    }
    return [correct];
}

// ─── Component ──────────────────────────────────────────────────────
export default function VowelsPractice() {
    const { speak } = useTTS();
    const dongCtx = useDong();
    const [section, setSection] = useState(1);
    const [playingWord, setPlayingWord] = useState(null);

    // Quiz state
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [feedback, setFeedback] = useState('idle');
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [earnedReward, setEarnedReward] = useState(null);

    // Award Dong when quiz completes
    useEffect(() => {
        if (showSummary && !earnedReward) {
            const t = questions.length;
            const reward = dongCtx.addDong('vowels', { score, total: t, bestStreak });
            const breakdown = dongCtx.calcRewardBreakdown(score, t, bestStreak);
            const isRepeat = (dongCtx.getCompletionCount('vowels') > 1);
            setEarnedReward({ amount: reward, breakdown, isRepeat });
        }
    }, [showSummary]);

    const playWord = useCallback((word) => {
        setPlayingWord(word);
        speak(word, 0.6);
        setTimeout(() => setPlayingWord(null), 800);
    }, [speak]);

    // Quiz questions
    const questions = useMemo(() => {
        if (section !== 5) return [];
        const picked = shuffle(ALL_QUIZ_ITEMS).slice(0, 15);
        return picked.map(q => ({
            ...q,
            options: makeOptions(q.correctAnswer, q.type),
        }));
    }, [section]);

    const questionCount = questions.length;
    const currentQ = questions[qIndex];
    const progress = questionCount > 0 ? (qIndex / questionCount) * 100 : 0;

    const handleCheck = useCallback(() => {
        if (!currentQ || !selected) return;
        const isCorrect = selected === currentQ.correctAnswer;
        if (isCorrect) {
            setFeedback('correct');
            setScore(s => s + 1);
            setStreak(s => { const n = s + 1; setBestStreak(b => Math.max(b, n)); return n; });
            playWord(currentQ.audio);
        } else {
            setFeedback('incorrect');
            setStreak(0);
        }
    }, [currentQ, selected, playWord]);

    const handleContinue = useCallback(() => {
        if (qIndex < questionCount - 1) {
            setQIndex(i => i + 1);
            setSelected(null);
            setFeedback('idle');
        } else {
            setShowSummary(true);
        }
    }, [qIndex, questionCount]);

    const startSection = (s) => {
        setSection(s);
        setQIndex(0);
        setSelected(null);
        setFeedback('idle');
        setScore(0);
        setStreak(0);
        setBestStreak(0);
        setShowSummary(false);
    };

    const handleRestart = () => {
        setQIndex(0);
        setSelected(null);
        setFeedback('idle');
        setScore(0);
        setStreak(0);
        setBestStreak(0);
        setShowSummary(false);
        setSection(s => {
            setTimeout(() => setSection(5), 0);
            return 0;
        });
    };

    // Enter key
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Enter' || section !== 5 || showSummary) return;
            if (feedback === 'idle' && selected) handleCheck();
            else if (feedback !== 'idle') handleContinue();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [section, feedback, selected, handleCheck, handleContinue, showSummary]);

    // ════════════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════════════

    // Summary
    if (showSummary) {
        const pct = questionCount > 0 ? Math.round((score / questionCount) * 100) : 0;
        let message = 'Keep practicing!';
        if (pct >= 90) message = 'Vowel master! 🎯';
        else if (pct >= 70) message = 'Great ear for vowels! 💪';
        else if (pct >= 50) message = 'Good progress!';

        return (
            <div className="practice-layout">
                <div className="practice-header">
                    <h1 className="practice-header-title">
                        <Link to="/practice" style={{ color: 'var(--text-main)', display: 'flex' }}>
                            <ArrowLeft size={24} />
                        </Link>
                        Vowels
                    </h1>
                </div>
                <div className="practice-content-centered">
                    <Trophy size={80} style={{ color: 'var(--primary-color)', marginBottom: '24px' }} />
                    <h2 className="practice-title">Quiz Complete!</h2>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)', margin: '16px 0' }}>{score} / {questionCount}</div>
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
                    <button className="practice-action-btn" style={{ background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', width: 'auto', flex: 1, boxShadow: '0 4px 0 var(--border-color)' }} onClick={() => setShowSummary(false) || setSection(1)}>
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
        <div className="practice-layout practice-fixed-layout">
            {/* Header */}
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <Link to="/practice" style={{ color: 'var(--text-main)', display: 'flex' }}>
                        <X size={24} />
                    </Link>
                </h1>
                {section === 5 && (
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

            {/* Section Tabs */}
            <div className="vp-tabs">
                {[
                    { id: 1, label: 'Vowels' },
                    { id: 2, label: 'Centering' },
                    { id: 3, label: 'Gliding' },
                    { id: 4, label: 'Triphthongs' },
                    { id: 5, label: 'Quiz' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`vp-tab ${section === tab.id ? 'active' : ''}`}
                        onClick={() => startSection(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Scrollable content area */}
            <div className="practice-scroll-area">

            {/* ═══ SECTION 1: Single Vowels ═══ */}
            {section === 1 && (
                <>
                    <p className="vp-intro">
                        Tap any vowel card to hear it. Vietnamese has 12 single vowels — each mark creates an entirely new letter.
                    </p>
                    <div className="vp-vowel-cards">
                        {SINGLE_VOWELS.map(v => (
                            <button
                                key={v.letter}
                                className={`vp-vowel-card ${playingWord === v.letter ? 'playing' : ''}`}
                                onClick={() => playWord(v.letter)}
                            >
                                <span className="vp-vowel-card-letter">{v.letter}</span>
                                <span className="vp-vowel-card-info">
                                    <span className="vp-vowel-card-name">{v.name}</span>
                                    <span className="vp-vowel-card-sound" dangerouslySetInnerHTML={{ __html: v.sound }} />
                                    <span className="vp-vowel-card-example">
                                        <em>{v.example}</em> — {v.exMeaning}
                                    </span>
                                </span>
                                <Volume2 size={14} className="vp-vowel-card-speaker" />
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* ═══ SECTION 2: Centering Diphthongs ═══ */}
            {section === 2 && (
                <>
                    <p className="vp-intro">
                        The 3 core diphthongs. Spelling changes based on <strong>open</strong> (ends in vowel) vs <strong>closed</strong> (ends in consonant) syllables.
                    </p>
                    <div className="vp-centering-cards">
                        {CENTERING_DIPHTHONGS.map(d => (
                            <div key={d.group} className="vp-centering-card">
                                <div className="vp-centering-card-header">
                                    <span className="vp-centering-card-group">{d.group}</span>
                                </div>
                                <div className="vp-centering-card-badges">
                                    <span className="vp-spelling-badge open">{d.open}</span>
                                    <span className="vp-centering-card-vs">vs</span>
                                    <span className="vp-spelling-badge closed">{d.closed}</span>
                                </div>
                                <p className="vp-centering-card-approx" dangerouslySetInnerHTML={{ __html: d.approx }} />
                                <div className="vp-centering-card-examples">
                                    {d.examples.map(ex => (
                                        <button
                                            key={ex.word}
                                            className={`vp-example-chip ${ex.type} ${playingWord === ex.word ? 'playing' : ''}`}
                                            onClick={() => playWord(ex.word)}
                                        >
                                            <em>{ex.word}</em> ({ex.meaning})
                                            <Volume2 size={12} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="vp-rules-box">
                        <h3>Spelling Rules</h3>
                        <ul>
                            <li>
                                Use <span className="vp-spelling-badge open">ia</span> <span className="vp-spelling-badge open">ua</span> <span className="vp-spelling-badge open">ưa</span> when no consonant follows.
                            </li>
                            <li>
                                Use <span className="vp-spelling-badge closed">iê</span> <span className="vp-spelling-badge closed">uô</span> <span className="vp-spelling-badge closed">ươ</span> when a consonant follows.
                            </li>
                            <li>
                                <span className="vp-spelling-badge closed">yê</span> replaces <span className="vp-spelling-badge closed">iê</span> when there's no initial consonant (e.g., <em>yêu</em>).
                            </li>
                        </ul>
                    </div>
                </>
            )}

            {/* ═══ SECTION 3: Gliding Diphthongs ═══ */}
            {section === 3 && (
                <>
                    <p className="vp-intro">
                        15 diphthongs that glide from one vowel to another. Tap to hear each one.
                    </p>
                    <div className="vp-gliding-cards">
                        {GLIDING_DIPHTHONGS.map(g => (
                            <button
                                key={g.diph}
                                className={`vp-gliding-card ${playingWord === g.diph ? 'playing' : ''}`}
                                onClick={() => playWord(g.diph)}
                            >
                                <span className="vp-gliding-card-diph">{g.diph}</span>
                                <span className="vp-gliding-card-info">
                                    <span className="vp-gliding-card-approx">{g.approx}</span>
                                    <span className="vp-gliding-card-example">
                                        <em>{g.example}</em> — {g.meaning}
                                    </span>
                                </span>
                                <Volume2 size={14} className="vp-gliding-card-speaker" />
                            </button>
                        ))}
                    </div>

                    <div className="vp-rules-box">
                        <h3>Key Points</h3>
                        <ul>
                            <li>
                                Pairs like <strong>ai/ay</strong> and <strong>ao/au</strong> differ by vowel length — the <strong>-y</strong> or <strong>-u</strong> ending is always shorter.
                            </li>
                            <li>
                                Open diphthongs: tone on first vowel. Closed: tone on second vowel.
                            </li>
                        </ul>
                    </div>
                </>
            )}

            {/* ═══ SECTION 4: Triphthongs ═══ */}
            {section === 4 && (
                <>
                    <p className="vp-intro">
                        8 three-vowel clusters. Pronounce them as one fluid, sliding sound.
                    </p>
                    <div className="vp-triph-cards">
                        {TRIPHTHONGS.map(t => (
                            <button
                                key={t.triph}
                                className={`vp-triph-card ${playingWord === t.triph ? 'playing' : ''}`}
                                onClick={() => playWord(t.triph)}
                            >
                                <span className="vp-triph-card-triph">{t.triph}</span>
                                <span className="vp-triph-card-info">
                                    <span className="vp-triph-card-components">{t.components}</span>
                                    <span className="vp-triph-card-example">
                                        <em>{t.example}</em> — {t.meaning}
                                    </span>
                                </span>
                                <Volume2 size={14} className="vp-triph-card-speaker" />
                            </button>
                        ))}
                    </div>

                    <div className="vp-rules-box">
                        <h3>Rules</h3>
                        <ul>
                            <li>
                                Use <strong>iêu</strong> after a consonant, <strong>yêu</strong> when starting a syllable.
                            </li>
                            <li>
                                Endings in <strong>-i/-y</strong> glide to "ee"; endings in <strong>-u/-o</strong> glide to "oo".
                            </li>
                            <li>
                                Tone mark goes on the <em>middle</em> vowel: <em>chuối</em>, <em>rượu</em>.
                            </li>
                        </ul>
                    </div>
                </>
            )}

            {/* ═══ SECTION 5: Quiz ═══ */}
            {section === 5 && currentQ && (
                <div className="practice-content-centered" style={{ justifyContent: 'flex-start' }}>
                    <div className="vp-progress">
                        <div className="vp-progress-fill" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="vp-quiz-content">
                        <div className="vp-quiz-question">{currentQ.question}</div>
                        <button className="practice-audio-btn large" onClick={() => playWord(currentQ.audio)}>
                            <Volume2 size={36} />
                        </button>
                        <div className={`vp-quiz-options ${currentQ.type === 'open-closed' ? 'two-col' : ''}`}>
                            {currentQ.options.map((opt, i) => {
                                let cls = '';
                                if (feedback !== 'idle') {
                                    if (opt === currentQ.correctAnswer) cls = 'correct-highlight';
                                    else if (opt === selected) cls = 'wrong';
                                    else cls = 'disabled';
                                } else if (opt === selected) cls = 'selected';
                                return (
                                    <button
                                        key={i}
                                        className={`vp-quiz-option ${cls}`}
                                        onClick={() => feedback === 'idle' && setSelected(opt)}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                        {feedback !== 'idle' && (
                            <div className="vp-hint">
                                {currentQ.hint.replace(/<[^>]+>/g, '')}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
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
                                                ? currentQ.correctAnswer
                                                : `Answer: ${currentQ.correctAnswer}`}
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
            )}

            </div>{/* end practice-scroll-area */}

            {/* CTA — outside scroll area, anchored at bottom */}
            {section === 1 && (
                <div className="vp-cta">
                    <button onClick={() => startSection(2)}>
                        Next: Diphthongs <ChevronRight size={18} style={{ verticalAlign: 'middle' }} />
                    </button>
                </div>
            )}
            {section === 2 && (
                <div className="vp-cta">
                    <button onClick={() => startSection(3)}>
                        Next: Gliding <ChevronRight size={18} style={{ verticalAlign: 'middle' }} />
                    </button>
                </div>
            )}
            {section === 3 && (
                <div className="vp-cta">
                    <button onClick={() => startSection(4)}>
                        Next: Triphthongs <ChevronRight size={18} style={{ verticalAlign: 'middle' }} />
                    </button>
                </div>
            )}
            {section === 4 && (
                <div className="vp-cta">
                    <button onClick={() => startSection(5)}>
                        Start Quiz <ChevronRight size={18} style={{ verticalAlign: 'middle' }} />
                    </button>
                </div>
            )}
        </div>
    );
}
