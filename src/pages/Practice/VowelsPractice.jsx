import { useState, useEffect, useMemo, useCallback } from 'react';
import { Volume2, X, ArrowLeft, Trophy, ChevronRight } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';
import './VowelsPractice.css';
import { playSuccess, playError } from '../../utils/sound';
import SoundButton from '../../components/SoundButton';
import { AudioButton, OptionGrid, FeedbackBar, FeedbackMessage, PrimaryButton, ExerciseColumn } from '../../components/practice/PracticeKit';
import './PracticeShared.css'; // Add shared layout
import { getVowels } from '../../data/vowels';

// ─── Data ───────────────────────────────────────────────────────────

const _v = getVowels();
const SINGLE_VOWELS = _v.single;
const CENTERING_DIPHTHONGS = _v.centering;
const GLIDING_DIPHTHONGS = _v.gliding;
const TRIPHTHONGS = _v.triphthongs;

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
export default function VowelsPractice({
    singleVowels = SINGLE_VOWELS,
    centeringDiphthongs = CENTERING_DIPHTHONGS,
    glidingDiphthongs = GLIDING_DIPHTHONGS,
    triphthongs = TRIPHTHONGS,
    title = 'Vowels',
} = {}) {
    // Build available sections dynamically based on which data is provided
    const availableSections = useMemo(() => {
        const sections = [];
        if (singleVowels?.length) sections.push({ id: 1, label: 'Vowels' });
        if (centeringDiphthongs?.length) sections.push({ id: 2, label: 'Centering' });
        if (glidingDiphthongs?.length) sections.push({ id: 3, label: 'Gliding' });
        if (triphthongs?.length) sections.push({ id: 4, label: 'Triphthongs' });
        sections.push({ id: 5, label: 'Quiz' });
        return sections;
    }, [singleVowels, centeringDiphthongs, glidingDiphthongs, triphthongs]);

    // Build quiz items from provided data only
    const quizItems = useMemo(() => {
        const items = [];
        if (singleVowels?.length) {
            items.push(...singleVowels.map(v => ({
                type: 'identify-vowel',
                question: `What vowel sound does "${v.example}" use?`,
                audio: v.example,
                correctAnswer: v.letter,
                hint: `${v.example} (${v.exMeaning})`,
            })));
        }
        if (centeringDiphthongs?.length) {
            items.push(...centeringDiphthongs.flatMap(d =>
                d.examples.map(ex => ({
                    type: 'open-closed',
                    question: `"${ex.word}" (${ex.meaning}) — is this an open or closed syllable spelling?`,
                    audio: ex.word,
                    correctAnswer: ex.type === 'open' ? 'Open' : 'Closed',
                    hint: `${d.group}: open = ${d.open}, closed = ${d.closed}`,
                }))
            ));
        }
        if (glidingDiphthongs?.length) {
            items.push(...glidingDiphthongs.map(g => ({
                type: 'identify-gliding',
                question: `What diphthong does "${g.example}" (${g.meaning}) contain?`,
                audio: g.example,
                correctAnswer: g.diph,
                hint: g.approx,
            })));
        }
        if (triphthongs?.length) {
            items.push(...triphthongs.map(t => ({
                type: 'identify-triphthong',
                question: `What triphthong does "${t.example}" (${t.meaning}) contain?`,
                audio: t.example,
                correctAnswer: t.triph,
                hint: `${t.components} → ${t.approx}`,
            })));
        }
        return items;
    }, [singleVowels, centeringDiphthongs, glidingDiphthongs, triphthongs]);
    const { speak } = useTTS();
    const { session, markComplete, goNext, goBack } = usePracticeCompletion();
    const firstSection = singleVowels?.length ? 1 : centeringDiphthongs?.length ? 2 : glidingDiphthongs?.length ? 3 : triphthongs?.length ? 4 : 5;
    const [section, setSection] = useState(firstSection);
    const [playingWord, setPlayingWord] = useState(null);

    // Quiz state
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [feedback, setFeedback] = useState('idle');
    const [score, setScore] = useState(0);
    const [, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [playToken, setPlayToken] = useState(0);

    const playWord = useCallback((word) => {
        setPlayingWord(word);
        speak(word, 0.6);
        setPlayToken(t => t + 1);
        setTimeout(() => setPlayingWord(null), 800);
    }, [speak]);

    // Quiz questions
    const questions = useMemo(() => {
        if (section !== 5) return [];
        const count = Math.min(10 + session * 2, 20);
        const picked = shuffle(quizItems).slice(0, count);
        return picked.map(q => ({
            ...q,
            options: makeOptions(q.correctAnswer, q.type),
        }));
    }, [section, quizItems, session]);

    const questionCount = questions.length;
    const currentQ = questions[qIndex];
    const progress = questionCount > 0 ? (qIndex / questionCount) * 100 : 0;

    const handleCheck = useCallback(() => {
        if (!currentQ || !selected) return;
        const isCorrect = selected === currentQ.correctAnswer;
        if (isCorrect) {
            playSuccess();
            setFeedback('correct');
            setScore(s => s + 1);
            setStreak(s => { const n = s + 1; setBestStreak(b => Math.max(b, n)); return n; });
            playWord(currentQ.audio);
        } else {
            playError();
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

    // Auto-play the word when a quiz question appears.
    useEffect(() => {
        if (section !== 5) return;
        const q = questions[qIndex];
        if (!q) return;
        const t = setTimeout(() => playWord(q.audio), 350);
        return () => clearTimeout(t);
    }, [section, qIndex, questions, playWord]);

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
        markComplete();
        let message = 'Keep practicing!';
        if (pct >= 90) message = 'Vowel master! 🎯';
        else if (pct >= 70) message = 'Great ear for vowels! 💪';
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
                    <h2 className="practice-title">Quiz Complete!</h2>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)', margin: '16px 0' }}>{score} / {questionCount}</div>
                    <p className="practice-subtitle">
                        {message}<br />
                        Best streak: 🔥 {bestStreak}
                    </p>
                </div>
                <div className="practice-bottom-bar" style={{ flexDirection: 'row', gap: '16px', justifyContent: 'center' }}>
                    <SoundButton className="practice-action-btn" sound="button" style={{ background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', width: 'auto', flex: 1, boxShadow: '0 4px 0 var(--border-color)' }} onClick={() => { setShowSummary(false); setSection(firstSection); }}>
                        Back
                    </SoundButton>
                    <SoundButton className="practice-action-btn primary" style={{ width: 'auto', flex: 2 }} onClick={goNext}>
                        Next
                    </SoundButton>
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
            </div>

            {/* Section Tabs */}
            <div className="vp-tabs">
                {availableSections.map(tab => (
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
                        {singleVowels.map(v => (
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
                        {centeringDiphthongs.map(d => (
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
                        {glidingDiphthongs.map(g => (
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
                        {triphthongs.map(t => (
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
                <>
                    <ExerciseColumn topOffset={120} top={
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Question {qIndex + 1}/{questionCount}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#06D6A0' }}>Score {score}</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 4, backgroundColor: 'var(--border-color)', marginBottom: 22, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#1CB0F6', borderRadius: 4, transition: 'width 0.3s' }} />
                            </div>
                            <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{currentQ.question}</p>
                        </>
                    }>
                        <div style={{ marginBottom: 20 }}><AudioButton onClick={() => playWord(currentQ.audio)} playToken={playToken} /></div>
                        <OptionGrid
                            options={currentQ.options} cols={2}
                            keyOf={(_, i) => i}
                            isCorrect={(o) => o === currentQ.correctAnswer}
                            isSelected={(o) => o === selected}
                            revealed={feedback !== 'idle'}
                            onPick={(o) => feedback === 'idle' && setSelected(o)}
                        >
                            {(opt) => <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>{opt}</span>}
                        </OptionGrid>
                    </ExerciseColumn>
                    <FeedbackBar>
                        {feedback !== 'idle' && (
                            <FeedbackMessage correct={feedback === 'correct'}>
                                {feedback === 'correct' ? 'Correct! ' : 'Answer: '}<strong>{currentQ.correctAnswer}</strong>{currentQ.hint ? ` — ${currentQ.hint.replace(/<[^>]+>/g, '')}` : ''}
                            </FeedbackMessage>
                        )}
                        {feedback === 'idle'
                            ? <PrimaryButton onClick={handleCheck} disabled={!selected}>Check</PrimaryButton>
                            : <PrimaryButton onClick={handleContinue}>Continue</PrimaryButton>}
                    </FeedbackBar>
                </>
            )}

            </div>{/* end practice-scroll-area */}

            {/* CTA — outside scroll area, anchored at bottom */}
            {section !== 5 && (() => {
                const currentIdx = availableSections.findIndex(s => s.id === section);
                const nextSection = availableSections[currentIdx + 1];
                if (!nextSection) return null;
                const isQuiz = nextSection.id === 5;
                return (
                    <div className="vp-cta">
                        <SoundButton sound="button" onClick={() => startSection(nextSection.id)}>
                            {isQuiz ? 'Start Quiz' : `Next: ${nextSection.label}`} <ChevronRight size={18} style={{ verticalAlign: 'middle' }} />
                        </SoundButton>
                    </div>
                );
            })()}
        </div>
    );
}
