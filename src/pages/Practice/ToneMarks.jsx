import { useState, useEffect, useMemo, useCallback } from 'react';

import { Volume2, Check, X, RotateCw, ArrowLeft, Trophy, Flame, Star, ChevronRight } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';
import './ToneMarks.css';
import { playSuccess, playError } from '../../utils/sound';
import SoundButton from '../../components/SoundButton';
import './PracticeShared.css'; // Add shared layout

// ─── Vietnamese Vowel × Tone Data ──────────────────────────────────
const ALL_VOWELS = ['a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y'];

const TONES = [
    { id: 'ngang', name: 'Ngang', label: 'Level', mark: '(none)' },
    { id: 'sac', name: 'Sắc', label: 'Rising', mark: '´' },
    { id: 'huyen', name: 'Huyền', label: 'Falling', mark: '`' },
    { id: 'hoi', name: 'Hỏi', label: 'Dipping', mark: '̉' },
    { id: 'nga', name: 'Ngã', label: 'Rising-broken', mark: '~' },
    { id: 'nang', name: 'Nặng', label: 'Heavy', mark: '.' },
];

// Complete vowel × tone mapping
const TONE_MAP = {
    a: ['a', 'á', 'à', 'ả', 'ã', 'ạ'],
    ă: ['ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'],
    â: ['â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ'],
    e: ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'],
    ê: ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'],
    i: ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
    o: ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'],
    ô: ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'],
    ơ: ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
    u: ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'],
    ư: ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'],
    y: ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'],
};

// Reverse lookup: accented char → { vowel, toneIndex }
const REVERSE_MAP = {};
for (const [vowel, forms] of Object.entries(TONE_MAP)) {
    forms.forEach((char, ti) => {
        REVERSE_MAP[char] = { vowel, toneIndex: ti };
    });
}

// Single-vowel Vietnamese words with meanings
const WORD_MEANINGS = {
    // a
    a: 'ah! (exclamation)', á: 'ouch! / surprise', à: 'oh, I see',
    ả: 'young woman (literary)', ã: '(particle)', ạ: 'yes (polite)',
    // e
    e: 'shy, timid', é: 'shrill cry', è: 'to force, push',
    ẻ: 'slender', ẽ: '(rare)', ẹ: 'mom (Southern)',
    // ê
    ê: 'hey! (calling out)', ế: 'sluggish (business)', ề: '(rare)',
    ể: '(rare)', ễ: '(rare)', ệ: '(rare)',
    // i
    i: '(letter)', í: 'squeal', ì: 'stubborn, sluggish',
    ỉ: '(rare)', ĩ: '(rare)', ị: 'plump, chubby',
    // o
    o: 'to court/woo', ó: 'to crow (rooster)', ò: '(exclamation)',
    ỏ: 'to whisper', õ: '(rare)', ọ: '(rare)',
    // ô
    ô: 'oh! / umbrella', ố: 'oh! (surprise)', ồ: 'wow!',
    ổ: 'loaf (of bread)', ỗ: '(rare)', ộ: '(rare)',
    // ơ
    ơ: 'hey (informal)', ớ: 'chili pepper', ờ: 'uh-huh, yeah',
    ở: 'to live, reside', ỡ: '(rare)', ợ: 'to belch',
    // u
    u: 'dark, gloomy', ú: 'muffled', ù: 'to buzz, hum',
    ủ: 'to brew, ferment', ũ: '(rare)', ụ: 'bump, mound',
    // ư
    ư: 'hmm (thinking)', ứ: '(rare)', ừ: 'uh-huh, yes',
    ử: '(rare)', ữ: '(rare)', ự: '(rare)',
    // y
    y: 'medicine, doctor', ý: 'idea, meaning', ỳ: '(rare)',
    ỷ: 'to rely on', ỹ: '(rare)', ỵ: '(rare)',
};

const getMeaning = (char) => WORD_MEANINGS[char] || 'no meaning';

// Characters not pronounceable in isolation (valid but need context)
// All ă and â variants
const NO_AUDIO = new Set([
    'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ',
    'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ',
]);

const isNoAudio = (char) => NO_AUDIO.has(char);

// No cells are fully disabled (all are valid combinations)
const isDisabled = () => false;

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ─── Component ─────────────────────────────────────────────────────
export default function ToneMarks({ vowels = ALL_VOWELS, title = '🔤 Dấu — Tone Marks', quizOnly = false }) {
    const { speak } = useTTS();
    const { session, markComplete, goNext, goBack } = usePracticeCompletion();
    const [stage, setStage] = useState(quizOnly ? 4 : 1);
    const [playingCell, setPlayingCell] = useState(null);
    const [selectedVowel, setSelectedVowel] = useState(vowels[0]);

    // Quiz state
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [feedback, setFeedback] = useState('idle');
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [totalAnswered, setTotalAnswered] = useState(0);
    const [showSummary, setShowSummary] = useState(false);

    // ── Generate questions (skip disabled cells) ──
    const validPairs = useMemo(() => {
        const pairs = [];
        vowels.forEach(v => {
            [1, 2, 3, 4, 5].forEach(ti => {
                if (!isDisabled(v, ti)) pairs.push({ vowel: v, toneIndex: ti });
            });
        });
        return pairs;
    }, [vowels]);

    const questions = useMemo(() => {
        if (stage < 2 || stage > 4) return [];
        const qs = [];

        if (stage === 2) {
            // Combine: vowel + tone → pick the accented char
            const stageCount = Math.min(10 + session * 2, 20);
            const picked = shuffle(validPairs).slice(0, stageCount);
            picked.forEach(({ vowel, toneIndex }) => {
                const correct = TONE_MAP[vowel][toneIndex];
                // Distractors: same vowel diff tones + diff vowels same tone (only valid ones)
                const sameVowel = TONE_MAP[vowel].filter((_, i) => i !== toneIndex && i !== 0 && !isDisabled(vowel, i));
                const sameTone = vowels.filter(v => v !== vowel && !isDisabled(v, toneIndex)).map(v => TONE_MAP[v][toneIndex]);
                const distractors = shuffle([...sameVowel, ...sameTone]).filter(d => d !== correct).slice(0, 5);
                qs.push({
                    type: 'combine',
                    vowel,
                    tone: TONES[toneIndex],
                    correctAnswer: correct,
                    options: shuffle([correct, ...distractors]).slice(0, 6),
                });
            });
        }

        if (stage === 3) {
            // Decompose: see accented char → identify vowel + tone
            const stageCount = Math.min(10 + session * 2, 20);
            const picked = shuffle(validPairs).slice(0, stageCount);
            picked.forEach(({ vowel, toneIndex }) => {
                const char = TONE_MAP[vowel][toneIndex];
                const correctTone = TONES[toneIndex].name;
                const toneOptions = shuffle(TONES.filter(t => t.id !== 'ngang').map(t => t.name));
                qs.push({
                    type: 'decompose',
                    char,
                    vowel,
                    toneIndex,
                    correctAnswer: correctTone,
                    options: toneOptions,
                });
            });
        }

        if (stage === 4) {
            // Mixed speed round
            const mixedCount = Math.min(10 + session * 2, 20);
            const picked = shuffle(validPairs).slice(0, mixedCount);
            picked.forEach(({ vowel, toneIndex }, i) => {
                if (i % 2 === 0) {
                    // Combine
                    const correct = TONE_MAP[vowel][toneIndex];
                    const sameVowel = TONE_MAP[vowel].filter((_, idx) => idx !== toneIndex && idx !== 0 && !isDisabled(vowel, idx));
                    const sameTone = vowels.filter(v2 => v2 !== vowel && !isDisabled(v2, toneIndex)).map(v2 => TONE_MAP[v2][toneIndex]);
                    const distractors = shuffle([...sameVowel, ...sameTone]).filter(d => d !== correct).slice(0, 5);
                    qs.push({
                        type: 'combine',
                        vowel,
                        tone: TONES[toneIndex],
                        correctAnswer: correct,
                        options: shuffle([correct, ...distractors]).slice(0, 6),
                    });
                } else {
                    // Decompose
                    const char = TONE_MAP[vowel][toneIndex];
                    const correctTone = TONES[toneIndex].name;
                    const toneOptions = shuffle(TONES.filter(t => t.id !== 'ngang').map(t => t.name));
                    qs.push({
                        type: 'decompose',
                        char,
                        vowel,
                        toneIndex,
                        correctAnswer: correctTone,
                        options: toneOptions,
                    });
                }
            });
        }

        return qs;
    }, [stage, validPairs, vowels, session]);

    const questionCount = questions.length;
    const currentQ = questions[qIndex];
    const progress = questionCount > 0 ? (qIndex / questionCount) * 100 : 0;

    // Play cell audio — speaks "base vowel + tone name + result"
    // e.g. "a sắc á", for ngang just says the vowel
    // Skips TTS for ă/â variants (not pronounceable standalone)
    const playCell = useCallback((char) => {
        const info = REVERSE_MAP[char];
        if (!info || isNoAudio(char)) return;
        setPlayingCell(char);
        const { vowel, toneIndex } = info;
        if (toneIndex === 0) {
            // Ngang — just say the vowel
            speak(char, 0.6);
        } else {
            // Say: "a ... sắc ... á"
            const toneName = TONES[toneIndex].name;
            const phrase = `${vowel}. ${toneName}. ${char}`;
            speak(phrase, 0.6);
        }
        setTimeout(() => setPlayingCell(null), 1200);
    }, [speak]);

    // ── Handlers ──
    const handleCheck = useCallback(() => {
        if (!currentQ || !selected) return;
        const isCorrect = selected === currentQ.correctAnswer;
        if (isCorrect) {
            playSuccess();
            setFeedback('correct');
            setScore(s => s + 1);
            setStreak(s => { const n = s + 1; setBestStreak(b => Math.max(b, n)); return n; });
            // Play the accented char
            if (currentQ.type === 'combine') playCell(currentQ.correctAnswer);
            else playCell(currentQ.char);
        } else {
            playError();
            setFeedback('incorrect');
            setStreak(0);
        }
    }, [currentQ, selected, playCell]);

    const handleContinue = useCallback(() => {
        if (qIndex < questionCount - 1) {
            setQIndex(i => i + 1);
            setSelected(null);
            setFeedback('idle');
        } else {
            setTotalAnswered(questionCount);
            setShowSummary(true);
        }
    }, [qIndex, questionCount]);

    const handleRestart = () => {
        setStage(prev => prev); // keep same stage
        setQIndex(0);
        setSelected(null);
        setFeedback('idle');
        setScore(0);
        setStreak(0);
        setBestStreak(0);
        setTotalAnswered(0);
        setShowSummary(false);
        // Force re-generate questions
        setStage(s => {
            setTimeout(() => setStage(s), 0);
            return 0;
        });
    };

    const startStage = (s) => {
        setStage(s);
        setQIndex(0);
        setSelected(null);
        setFeedback('idle');
        setScore(0);
        setStreak(0);
        setBestStreak(0);
        setTotalAnswered(0);
        setShowSummary(false);
    };

    // Enter key
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Enter' || stage < 2 || showSummary) return;
            if (feedback === 'idle' && selected) handleCheck();
            else if (feedback !== 'idle') handleContinue();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [stage, feedback, selected, handleCheck, handleContinue, showSummary]);

    // ════════════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════════════

    // Summary
    if (showSummary) {
        const pct = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
        markComplete();
        let message = 'Keep practicing!';
        if (pct >= 90) message = 'Master of diacritics! 🎯';
        else if (pct >= 70) message = 'Great work! You\'re getting fluent! 💪';
        else if (pct >= 50) message = 'Good progress!';

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
                    <h2 className="practice-title">Stage Complete!</h2>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)', margin: '16px 0' }}>{score} / {totalAnswered}</div>
                    <p className="practice-subtitle">
                        {message}<br />
                        Best streak: 🔥 {bestStreak}
                    </p>
                    <div className="practice-bottom-bar" style={{ gap: '16px', justifyContent: 'center' }}>
                        <SoundButton className="practice-action-btn" sound="button" style={{ background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', width: 'auto', flex: 1, boxShadow: '0 4px 0 var(--border-color)' }} onClick={handleRestart}>
                            <RotateCw size={18} /> Try Again
                        </SoundButton>
                        <SoundButton className="practice-action-btn primary" style={{ width: 'auto', flex: 2 }} onClick={goNext}>
                            Next
                        </SoundButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="practice-layout practice-fixed-layout">
            {/* Header */}
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <button onClick={goBack} style={{ color: 'var(--text-main)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <X size={24} />
                    </button>
                </h1>
                {stage >= 2 && (
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

            {/* Tabs */}
            <div className="tm-stage-tabs">
                {[
                    ...(!quizOnly ? [{ id: 1, label: 'Explore' }] : []),
                    { id: 2, label: 'Combine' },
                    { id: 3, label: 'Decompose' },
                    { id: 4, label: 'Quiz' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`tm-stage-tab ${stage === tab.id ? 'active' : ''}`}
                        onClick={() => startStage(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Scrollable content area */}
            <div className="practice-scroll-area">

            {/* ═══ STAGE 1: Explore ═══ */}
            {stage === 1 && (
                <>
                    <p className="tm-intro">
                        Pick a vowel, then tap each tone to hear it.
                    </p>

                    {/* Vowel picker — horizontally scrollable pills */}
                    <div className="tm-vowel-picker">
                        {vowels.map(v => (
                            <button
                                key={v}
                                className={`tm-vowel-pill ${selectedVowel === v ? 'active' : ''}`}
                                onClick={() => setSelectedVowel(v)}
                            >
                                {v}
                            </button>
                        ))}
                    </div>

                    {/* Tone cards for the selected vowel */}
                    <div className="tm-tone-cards">
                        {TONE_MAP[selectedVowel].map((char, ti) => {
                            const noAudio = isNoAudio(char);
                            return (
                                <button
                                    key={ti}
                                    className={`tm-tone-card ${playingCell === char ? 'playing' : ''} ${noAudio ? 'no-audio' : ''}`}
                                    onClick={() => !noAudio && playCell(char)}
                                >
                                    <span className="tm-tone-card-char">{char}</span>
                                    <span className="tm-tone-card-name">{TONES[ti].name}</span>
                                    <span className="tm-tone-card-label">{TONES[ti].label}</span>
                                    {getMeaning(char) !== 'no meaning' && (
                                        <span className="tm-tone-card-meaning">{getMeaning(char)}</span>
                                    )}
                                    {!noAudio && <Volume2 size={16} className="tm-tone-card-speaker" />}
                                    {noAudio && <span className="tm-tone-card-no-audio">no standalone sound</span>}
                                </button>
                            );
                        })}
                    </div>

                </>
            )}

            {/* ═══ STAGES 2–4: Quiz ═══ */}
            {stage >= 2 && currentQ && (
                <div className="practice-content-centered" style={{ justifyContent: 'flex-start' }}>
                    <div className="challenge-progress" style={{ width: '100%', marginBottom: '16px' }}>
                        <div className="challenge-progress-fill" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="challenge-content" style={{ width: '100%' }}>
                        {/* Combine prompt */}
                        {currentQ.type === 'combine' && (
                            <>
                                <div className="tm-equation">
                                    <span className="tm-base-vowel">{currentQ.vowel}</span>
                                    <span className="tm-plus">+</span>
                                    <span className="tm-tone-name">{currentQ.tone.name}</span>
                                    <span className="tm-equals">=</span>
                                    <span className="tm-question-mark">
                                        {feedback !== 'idle' ? currentQ.correctAnswer : '?'}
                                    </span>
                                </div>
                                {feedback !== 'idle' && getMeaning(currentQ.correctAnswer) && (
                                    <div className="tm-meaning">
                                        <strong>{currentQ.correctAnswer}</strong> — {getMeaning(currentQ.correctAnswer)}
                                    </div>
                                )}
                                <div className="tm-options">
                                    {currentQ.options.map((opt, i) => {
                                        let cls = '';
                                        if (feedback !== 'idle') {
                                            if (opt === currentQ.correctAnswer) cls = 'correct-highlight';
                                            else if (opt === selected) cls = 'wrong';
                                            else cls = 'disabled';
                                        } else if (opt === selected) cls = 'selected';
                                        return (
                                            <button key={i}
                                                className={`tm-option ${cls}`}
                                                onClick={() => feedback === 'idle' && setSelected(opt)}
                                            >{opt}</button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* Decompose prompt */}
                        {currentQ.type === 'decompose' && (
                            <>
                                <div className="tm-target-char">{currentQ.char}</div>
                                {feedback !== 'idle' && getMeaning(currentQ.char) && (
                                    <div className="tm-meaning">
                                        <strong>{currentQ.char}</strong> — {getMeaning(currentQ.char)}
                                    </div>
                                )}
                                <div className="tm-decompose-prompt">
                                    <button
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
                                        onClick={() => playCell(currentQ.char)}
                                    >
                                        <Volume2 size={20} style={{ verticalAlign: 'middle' }} />
                                    </button>
                                    &nbsp;Base vowel: <strong>{feedback !== 'idle' ? currentQ.vowel : '?'}</strong> — What tone is this?
                                </div>
                                <div className="tm-options">
                                    {currentQ.options.map((opt, i) => {
                                        let cls = 'text-option';
                                        if (feedback !== 'idle') {
                                            if (opt === currentQ.correctAnswer) cls += ' correct-highlight';
                                            else if (opt === selected) cls += ' wrong';
                                            else cls += ' disabled';
                                        } else if (opt === selected) cls += ' selected';
                                        return (
                                            <button key={i}
                                                className={`tm-option ${cls}`}
                                                onClick={() => feedback === 'idle' && setSelected(opt)}
                                            >{opt}</button>
                                        );
                                    })}
                                </div>
                            </>
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
                                                ? (currentQ.type === 'combine' ? `${currentQ.vowel} + ${currentQ.tone.name} = ${currentQ.correctAnswer}` : `${currentQ.char} = ${currentQ.vowel} + ${currentQ.correctAnswer}`)
                                                : `Answer: ${currentQ.correctAnswer}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {feedback === 'idle' ? (
                            <SoundButton
                                className={`practice-action-btn ${selected ? 'primary' : 'disabled'}`}
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
            )}

            </div>{/* end practice-scroll-area */}

            {/* CTA — outside scroll area, anchored at bottom */}
            {stage === 1 && (
                <div className="tm-stage-cta">
                    <SoundButton sound="button" onClick={() => startStage(2)}>
                        Start Practicing <ChevronRight size={18} style={{ verticalAlign: 'middle' }} />
                    </SoundButton>
                </div>
            )}
        </div>
    );
}
