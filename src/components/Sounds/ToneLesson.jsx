import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Volume2, Mic, MicOff, X, ChevronRight, ChevronLeft, Check, RotateCw, Trophy, GraduationCap, Ear, AudioLines, Download } from 'lucide-react';
import { TONE_LIST, PRACTICE_WORDS } from '../../data/toneContours';
import speak from '../../utils/speak';
import { startPCMRecording } from '../../utils/recordPCM';
import { pitchContourFromSamples, classifyContour } from '../../utils/pitch';
import { playSuccess, playError } from '../../utils/sound';
import { saveToneSample, exportToneSamples, getToneSampleCount } from '../../utils/toneData';
import { useUser } from '../../context/UserContext';
import PitchGraph from './PitchGraph';

// Canonical "ma" minimal set — same base syllable, so only the tone varies.
// Ideal for teaching and for letting Azure isolate a tone error.
const SPEAK_WORD = {
    ngang: { word: 'ma', meaning: 'ghost' },
    sac: { word: 'má', meaning: 'mother' },
    huyen: { word: 'mà', meaning: 'but' },
    hoi: { word: 'mả', meaning: 'tomb' },
    nga: { word: 'mã', meaning: 'horse / code' },
    nang: { word: 'mạ', meaning: 'rice seedling' },
};

const IDENTIFY_COUNT = 8;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function scoreColor(v) {
    if (v == null) return 'var(--text-muted)';
    if (v >= 80) return '#06D6A0';
    if (v >= 60) return '#FFD166';
    return '#EF476F';
}

export default function ToneLesson({ tones = TONE_LIST, steps = ['learn', 'identify', 'speak'], title, onExit, onComplete }) {
    const [step, setStep] = useState(steps[0]); // a step id or 'done'
    const [identifyScore, setIdentifyScore] = useState(0);
    const [speakScores, setSpeakScores] = useState([]); // 0-100 per tone

    const advance = (from) => {
        const i = steps.indexOf(from);
        setStep(i < 0 || i + 1 >= steps.length ? 'done' : steps[i + 1]);
    };

    const Header = (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 16px', borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--surface-color)', position: 'sticky', top: 0, zIndex: 20,
        }}>
            <button onClick={onExit} aria-label="Close lesson" style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', display: 'flex', padding: 4,
            }}><X size={22} /></button>
            <StepDots steps={steps} step={step} />
        </div>
    );

    return (
        <div style={{ minHeight: '60vh' }}>
            {Header}
            {title && step === steps[0] && (
                <p style={{ textAlign: 'center', fontSize: 17, fontWeight: 800, margin: '14px 16px 0' }}>{title}</p>
            )}
            {step === 'learn' && <LearnStep tones={tones} onDone={() => advance('learn')} />}
            {step === 'identify' && (
                <IdentifyStep tones={tones} onDone={(score) => { setIdentifyScore(score); advance('identify'); }} />
            )}
            {step === 'speak' && (
                <SpeakStep tones={tones} onDone={(scores) => { setSpeakScores(scores); advance('speak'); }} />
            )}
            {step === 'done' && (
                <DoneStep
                    tones={tones}
                    steps={steps}
                    identifyScore={identifyScore}
                    speakScores={speakScores}
                    onRestart={() => { setIdentifyScore(0); setSpeakScores([]); setStep(steps[0]); }}
                    onExit={onExit}
                    onComplete={onComplete}
                />
            )}
        </div>
    );
}

// ─── Step indicator ────────────────────────────────────────────────
function StepDots({ steps: stepIds, step }) {
    const ALL = [
        { id: 'learn', icon: GraduationCap, label: 'Learn' },
        { id: 'identify', icon: Ear, label: 'Identify' },
        { id: 'speak', icon: AudioLines, label: 'Speak' },
    ];
    const steps = ALL.filter(s => stepIds.includes(s.id));
    const order = [...stepIds, 'done'];
    const activeIdx = order.indexOf(step);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            {steps.map((s, i) => {
                const Icon = s.icon;
                const done = activeIdx > i;
                const active = activeIdx === i;
                const color = active ? '#1CB0F6' : done ? '#06D6A0' : 'var(--text-muted)';
                return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            opacity: active || done ? 1 : 0.5,
                        }}>
                            <Icon size={16} color={color} />
                            <span style={{ fontSize: 12, fontWeight: 700, color }}>{s.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{ width: 14, height: 2, borderRadius: 2, backgroundColor: done ? '#06D6A0' : 'var(--border-color)' }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Step 1: Learn (pitch contours) ────────────────────────────────
function LearnStep({ tones, onDone }) {
    const [idx, setIdx] = useState(0);
    const [playToken, setPlayToken] = useState(0);
    const tone = tones[idx];
    const example = SPEAK_WORD[tone.id];

    const play = useCallback(() => {
        speak(example.word, 0.7);
        setPlayToken(t => t + 1);
    }, [example.word]);

    // Auto-play + animate when the tone changes.
    useEffect(() => {
        const t = setTimeout(play, 300);
        return () => clearTimeout(t);
    }, [play]);

    const next = () => (idx + 1 >= tones.length ? onDone() : setIdx(idx + 1));
    const prev = () => idx > 0 && setIdx(idx - 1);

    return (
        <div style={{ padding: 16, paddingBottom: 120 }}>
            <p style={{ margin: '4px 0 16px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                Watch the pitch move. Each tone has its own shape.
            </p>

            <div style={{
                borderRadius: 18, border: `2px solid ${tone.color}`,
                backgroundColor: 'var(--surface-color)', overflow: 'hidden',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', backgroundColor: `${tone.color}14`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14, backgroundColor: `${tone.color}22`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 30, fontWeight: 800, color: tone.color,
                        }}>{tone.mark}</div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>{tone.name}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: tone.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tone.label}</div>
                        </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{idx + 1}/{tones.length}</div>
                </div>

                <div style={{ padding: '8px 12px 0' }}>
                    <PitchGraph contour={tone.contour} color={tone.color} playToken={playToken} height={130} />
                </div>

                <div style={{ padding: '8px 18px 18px' }}>
                    <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-main)', lineHeight: 1.5 }}>
                        {tone.description}
                    </p>
                    <button onClick={play} style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                        backgroundColor: `${tone.color}1A`, color: tone.color, fontWeight: 700, fontSize: 16, fontFamily: 'inherit',
                    }}>
                        <Volume2 size={20} /> {example.word} · "{example.meaning}"
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={prev} disabled={idx === 0} style={{
                    flex: 1, padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
                    border: '2px solid var(--border-color)', backgroundColor: 'transparent',
                    color: 'var(--text-muted)', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.4 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}><ChevronLeft size={18} /> Back</button>
                <button onClick={next} style={{
                    flex: 2, padding: 14, borderRadius: 12, fontWeight: 800, fontSize: 15, fontFamily: 'inherit',
                    border: 'none', backgroundColor: '#1CB0F6', color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                    {idx + 1 >= tones.length ? 'Start quiz' : 'Next tone'} <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}

// ─── Step 2: Identify (listen & pick) ──────────────────────────────
function buildQuestions(tones) {
    const ids = new Set(tones.map(t => t.id));
    const words = PRACTICE_WORDS.filter(w => ids.has(w.tone));
    const byTone = {};
    words.forEach(w => { (byTone[w.tone] ||= []).push(w); });
    // One guaranteed question per tone, then fill the rest at random.
    const picked = [];
    const seen = new Set();
    tones.forEach(t => {
        const pool = byTone[t.id] || [];
        if (pool.length) {
            const w = pool[Math.floor(Math.random() * pool.length)];
            picked.push(w); seen.add(w.word);
        }
    });
    const rest = shuffle(words.filter(w => !seen.has(w.word)));
    while (picked.length < IDENTIFY_COUNT && rest.length) {
        const w = rest.pop();
        if (!seen.has(w.word)) { picked.push(w); seen.add(w.word); }
    }
    return shuffle(picked).slice(0, IDENTIFY_COUNT);
}

function IdentifyStep({ tones, onDone }) {
    const questions = useMemo(() => buildQuestions(tones), [tones]);
    const [qi, setQi] = useState(0);
    const [selected, setSelected] = useState(null);
    const [feedback, setFeedback] = useState('idle'); // idle | correct | incorrect
    const [score, setScore] = useState(0);
    const q = questions[qi];

    const play = useCallback(() => speak(q.word, 0.7), [q]);
    useEffect(() => {
        const t = setTimeout(play, 350);
        return () => clearTimeout(t);
    }, [play]);

    const check = (toneId) => {
        if (feedback !== 'idle') return;
        setSelected(toneId);
        const correct = toneId === q.tone;
        if (correct) { playSuccess(); setScore(s => s + 1); setFeedback('correct'); speak(q.word, 0.7); }
        else { playError(); setFeedback('incorrect'); }
    };

    const cont = () => {
        if (qi + 1 >= questions.length) { onDone(score); return; }
        setQi(qi + 1); setSelected(null); setFeedback('idle');
    };

    const correctTone = tones.find(t => t.id === q.tone) || TONE_LIST.find(t => t.id === q.tone);
    const cols = Math.min(3, tones.length);

    return (
        <div style={{ padding: 16, paddingBottom: 120 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Question {qi + 1}/{questions.length}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#06D6A0' }}>Score {score}</span>
            </div>
            <div style={{ height: 6, borderRadius: 4, backgroundColor: 'var(--border-color)', marginBottom: 22, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(qi / questions.length) * 100}%`, backgroundColor: '#1CB0F6', borderRadius: 4, transition: 'width 0.3s' }} />
            </div>

            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', margin: '0 0 18px' }}>
                Listen, then tap the tone you hear.
            </p>

            <button onClick={play} aria-label="Replay" style={{
                width: 92, height: 92, borderRadius: '50%', margin: '0 auto 10px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                border: '2px solid #1CB0F6', backgroundColor: 'rgba(28,176,246,0.12)', color: '#1CB0F6',
            }}><Volume2 size={40} /></button>

            <div style={{ textAlign: 'center', minHeight: 40, marginBottom: 12 }}>
                {feedback !== 'idle' ? (
                    <>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)' }}>{q.word}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>"{q.meaning}"</div>
                    </>
                ) : (
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'transparent' }}>·</div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
                {tones.map(t => {
                    let bg = 'var(--surface-color)', border = 'var(--border-color)', op = 1;
                    if (feedback !== 'idle') {
                        if (t.id === q.tone) { bg = '#06D6A01A'; border = '#06D6A0'; }
                        else if (t.id === selected) { bg = '#EF476F1A'; border = '#EF476F'; }
                        else op = 0.45;
                    } else if (t.id === selected) { border = '#1CB0F6'; }
                    return (
                        <button key={t.id} onClick={() => check(t.id)} disabled={feedback !== 'idle'} style={{
                            padding: '14px 6px', borderRadius: 12, cursor: feedback === 'idle' ? 'pointer' : 'default',
                            border: `2px solid ${border}`, backgroundColor: bg, opacity: op, fontFamily: 'inherit',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        }}>
                            <span style={{ fontSize: 26, fontWeight: 800, color: t.color }}>{t.mark}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>{t.name}</span>
                        </button>
                    );
                })}
            </div>

            {feedback !== 'idle' && (
                <div style={{ marginTop: 18 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12,
                        backgroundColor: feedback === 'correct' ? '#06D6A01A' : '#EF476F1A', marginBottom: 12,
                    }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                            backgroundColor: feedback === 'correct' ? '#06D6A0' : '#EF476F', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{feedback === 'correct' ? <Check size={18} /> : <X size={18} />}</div>
                        <div style={{ fontSize: 14, color: 'var(--text-main)', fontWeight: 600 }}>
                            {feedback === 'correct' ? 'Correct!' : 'Answer: '}
                            <span style={{ color: correctTone.color, fontWeight: 800 }}>{correctTone.name} ({correctTone.label})</span>
                        </div>
                    </div>
                    <button onClick={cont} style={{
                        width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer',
                        backgroundColor: '#1CB0F6', color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: 'inherit',
                    }}>{qi + 1 >= questions.length ? 'Continue to Speak' : 'Next'}</button>
                </div>
            )}
        </div>
    );
}

// ─── Step 3: Speak (Azure assessment) ──────────────────────────────
function SpeakStep({ tones, onDone }) {
    const { userProfile } = useUser();
    const [idx, setIdx] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [scoring, setScoring] = useState(false);
    const [result, setResult] = useState(null); // { recognized, userContour, verdict, predictedId, matchScore }
    const [error, setError] = useState('');
    const [scores, setScores] = useState([]);
    const [labeled, setLabeled] = useState(null); // null | 'correct' | 'wrong'
    const recorderRef = useRef(null);

    const tone = tones[idx];
    const example = SPEAK_WORD[tone.id];

    const play = useCallback(() => speak(example.word, 0.7), [example.word]);
    useEffect(() => {
        setResult(null); setError(''); setLabeled(null);
        const t = setTimeout(play, 300);
        return () => clearTimeout(t);
    }, [play]);

    // Record a self-labeled training sample (ground truth for a future model).
    const labelSample = (label) => {
        if (!result) return;
        saveToneSample({
            tone: tone.id,
            word: example.word,
            contour: result.userContour || null,
            dialect: userProfile?.dialect || '',
            label,
            recognized: result.recognized || '',
            predicted: result.predictedId || null,
            matchScore: result.matchScore ?? null,
            ts: Date.now(),
        });
        setLabeled(label);
    };

    const toggleRecord = async () => {
        if (isRecording && recorderRef.current) {
            const r = recorderRef.current;
            recorderRef.current = null;
            setIsRecording(false);
            setScoring(true);
            setError('');
            try {
                const blob = await r.stop();
                if (!blob || blob.size < 1024) {
                    setError('No speech detected — tap and speak again.');
                    setScoring(false);
                    return;
                }
                // Track the learner's own pitch shape (runs locally, no network).
                let userContour = null;
                try { userContour = pitchContourFromSamples(r.samples, r.sampleRate); } catch { /* ignore */ }
                const res = await fetch(`/api/pronunciation?text=${encodeURIComponent(example.word)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'audio/wav' },
                    body: blob,
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const recognized = (data.recognized || '').trim();

                // Verdict comes from the learner's actual PITCH SHAPE, not Azure's
                // speech recognition: vi-VN STT is too lenient about tone (it will
                // "hear" the right word from a wrong tone). We classify the produced
                // pitch contour against the 6 tone templates and check whether it
                // best matches the target. Azure's transcript is kept as a hint only.
                let ranking = null;
                if (userContour) {
                    try { ranking = classifyContour(userContour, TONE_LIST); } catch { /* ignore */ }
                }
                let verdict = 'unclear'; // 'correct' | 'wrong' | 'unclear'
                let predictedId = null;
                let matchScore = null;
                if (ranking) {
                    const top = ranking[0];
                    const rank = ranking.findIndex(r => r.id === tone.id);
                    const tEntry = ranking[rank];
                    predictedId = top.id;
                    matchScore = tEntry.score;
                    // Accept the top match, or a very close 2nd (adjacent tones like
                    // Huyền/Nặng genuinely overlap) so we're strict but not punishing.
                    verdict = (rank === 0 || (rank === 1 && tEntry.dist - top.dist <= 0.4 && tEntry.score >= 65))
                        ? 'correct' : 'wrong';
                } else {
                    // No usable pitch (too quiet / no voicing) — fall back to STT match.
                    const norm = (s) => s.toLowerCase().replace(/[.!?,]/g, '').trim();
                    if (recognized) verdict = norm(recognized) === norm(example.word) ? 'correct' : 'wrong';
                }
                setResult({ recognized, userContour, verdict, predictedId, matchScore });
                if (verdict === 'correct') playSuccess();
                else playError();
            } catch (err) {
                console.warn('Tone scoring failed:', err.message);
                setError('Scoring unavailable. Check your connection and retry.');
            } finally {
                setScoring(false);
            }
            return;
        }
        setResult(null); setError('');
        try {
            const r = await startPCMRecording();
            recorderRef.current = r;
            setIsRecording(true);
        } catch (err) {
            setError(err.name === 'NotAllowedError' ? 'Microphone access denied.' : 'Could not start microphone.');
        }
    };

    const next = () => {
        // Record the spoken-tone score: the pitch-shape match when available,
        // else a pass/fail from the recognition fallback.
        const acc = result?.matchScore != null ? result.matchScore : (result?.verdict === 'correct' ? 100 : 0);
        const nextScores = [...scores, acc];
        setScores(nextScores);
        if (idx + 1 >= tones.length) { onDone(nextScores); return; }
        setIdx(idx + 1);
    };

    return (
        <div style={{ padding: 16, paddingBottom: 120 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tone {idx + 1}/{tones.length}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: tone.color }}>{tone.name} · {tone.label}</span>
            </div>

            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', margin: '0 0 16px' }}>
                Say the word with the <strong style={{ color: tone.color }}>{tone.label.toLowerCase()}</strong> tone.
            </p>

            <div style={{
                borderRadius: 18, border: `2px solid ${tone.color}`, backgroundColor: 'var(--surface-color)',
                padding: '18px 18px 14px', textAlign: 'center', marginBottom: 14,
            }}>
                <PitchGraph contour={tone.contour} color={tone.color} height={100} userContour={result?.userContour || null} />
                {result?.userContour && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 16, height: 3, borderRadius: 2, backgroundColor: tone.color }} /> Target
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 16, height: 0, borderTop: '3px dashed #334155' }} /> You
                        </span>
                    </div>
                )}
                <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, color: 'var(--text-main)', marginTop: 6 }}>{example.word}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>"{example.meaning}"</div>
                <button onClick={play} style={{
                    marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                    borderRadius: 20, border: 'none', backgroundColor: `${tone.color}1A`, color: tone.color,
                    fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                }}><Volume2 size={18} /> Listen</button>
            </div>

            {/* Mic */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <button onClick={toggleRecord} disabled={scoring || Boolean(result)} style={{
                    width: 84, height: 84, borderRadius: '50%', cursor: scoring || result ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${isRecording ? '#EF476F' : '#1CB0F6'}`,
                    backgroundColor: isRecording ? 'rgba(239,71,111,0.15)' : 'rgba(28,176,246,0.12)',
                    opacity: scoring || result ? 0.5 : 1,
                    animation: isRecording ? 'tonePulse 1.4s infinite' : 'none',
                }}>
                    {isRecording ? <MicOff size={36} color="#EF476F" /> : <Mic size={36} color="#1CB0F6" />}
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {scoring ? 'Scoring…' : isRecording ? 'Listening — tap to stop' : result ? ' ' : 'Tap to speak'}
                </span>
            </div>

            {result && (() => {
                // Verdict is driven by the produced pitch SHAPE (see toggleRecord).
                const ok = result.verdict === 'correct';
                const wrong = result.verdict === 'wrong';
                const color = ok ? '#06D6A0' : wrong ? '#EF476F' : 'var(--text-muted)';
                const title = ok ? 'Correct tone!' : wrong ? 'Not quite' : "Didn't catch that";
                const predicted = result.predictedId ? TONE_LIST.find(t => t.id === result.predictedId) : null;
                let sub;
                if (ok) {
                    sub = `Your pitch matched the ${tone.label.toLowerCase()} shape.`;
                } else if (wrong) {
                    sub = predicted && predicted.id !== tone.id
                        ? `Your pitch looked more like ${predicted.name} (${predicted.label.toLowerCase()}). Aim for the ${tone.label.toLowerCase()} shape.`
                        : `Match the ${tone.label.toLowerCase()} shape — compare your dashed line to the target.`;
                } else {
                    sub = 'Speak a little louder and clearer, then retry.';
                }
                return (
                    <div style={{
                        marginTop: 16, padding: 16, borderRadius: 14, textAlign: 'center',
                        backgroundColor: 'var(--surface-color)', border: `2px solid ${color}`,
                    }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: '50%', margin: '0 auto 8px',
                            backgroundColor: ok || wrong ? color : 'var(--border-color)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {wrong ? <X size={26} /> : <Check size={26} />}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color }}>{title}</div>
                        <div style={{ fontSize: 13, marginTop: 6, color: 'var(--text-muted)', lineHeight: 1.5 }}>{sub}</div>
                        {result.matchScore != null && (
                            <div style={{
                                display: 'inline-block', marginTop: 10, padding: '4px 12px', borderRadius: 20,
                                backgroundColor: `${scoreColor(result.matchScore)}1A`, color: scoreColor(result.matchScore),
                                fontSize: 13, fontWeight: 700,
                            }}>
                                Tone match {result.matchScore}%
                            </div>
                        )}
                        {result.recognized && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, opacity: 0.8 }}>
                                Azure heard “{result.recognized}”
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Self-label → ground-truth training data for a future tone model */}
            {result && (
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                    {labeled === null ? (
                        <>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                                Help train the tone model — did you actually say it right?
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <button onClick={() => labelSample('correct')} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20,
                                    border: '2px solid #06D6A0', backgroundColor: '#06D6A01A', color: '#06D6A0',
                                    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                                }}><Check size={15} /> Yes, correct</button>
                                <button onClick={() => labelSample('wrong')} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20,
                                    border: '2px solid #EF476F', backgroundColor: '#EF476F1A', color: '#EF476F',
                                    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                                }}><X size={15} /> No, wrong</button>
                            </div>
                        </>
                    ) : (
                        <div style={{ fontSize: 12, color: '#06D6A0', fontWeight: 600 }}>
                            Saved ✓ — thanks, this trains the model.
                        </div>
                    )}
                </div>
            )}

            {error && !result && (
                <p style={{ textAlign: 'center', color: '#EF476F', marginTop: 14 }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button onClick={() => { setResult(null); setError(''); setLabeled(null); }} disabled={!result} style={{
                    flex: 1, padding: 13, borderRadius: 12, fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
                    border: '2px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)',
                    cursor: result ? 'pointer' : 'default', opacity: result ? 1 : 0.4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}><RotateCw size={16} /> Retry</button>
                <button onClick={next} style={{
                    flex: 2, padding: 13, borderRadius: 12, fontWeight: 800, fontSize: 15, fontFamily: 'inherit',
                    border: 'none', backgroundColor: result ? '#1CB0F6' : 'var(--border-color)',
                    color: result ? '#fff' : 'var(--text-muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                    {result ? (idx + 1 >= tones.length ? 'Finish' : 'Next tone') : 'Skip'} <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}

// ─── Done ──────────────────────────────────────────────────────────
function DoneStep({ tones, steps, identifyScore, speakScores, onRestart, onExit, onComplete }) {
    const speakAvg = speakScores.length
        ? Math.round(speakScores.reduce((a, b) => a + b, 0) / speakScores.length) : 0;
    const sampleCount = getToneSampleCount();
    const hasSpeak = steps.includes('speak');
    const n = tones.length;
    const verb = hasSpeak ? 'learned, identified, and spoke' : 'learned and identified';
    const which = n >= 6 ? 'all 6 Vietnamese tones' : `${n} Vietnamese tone${n === 1 ? '' : 's'}`;
    return (
        <div style={{ padding: '40px 24px 120px', textAlign: 'center' }}>
            <Trophy size={72} color="#FFD166" style={{ marginBottom: 16 }} />
            <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800 }}>Lesson complete!</h2>
            <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-muted)' }}>
                You {verb} {which}.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32 }}>
                <div style={{ flex: 1, maxWidth: 150, padding: 18, borderRadius: 16, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 34, fontWeight: 800, color: '#1CB0F6' }}>{identifyScore}/{IDENTIFY_COUNT}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Identified</div>
                </div>
                {hasSpeak && (
                    <div style={{ flex: 1, maxWidth: 150, padding: 18, borderRadius: 16, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: 34, fontWeight: 800, color: scoreColor(speakAvg) }}>{speakAvg}%</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tones spoken right</div>
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360, margin: '0 auto' }}>
                {onComplete ? (
                    <button onClick={onComplete} style={{
                        padding: 14, borderRadius: 12, border: 'none', backgroundColor: '#06D6A0', color: '#fff',
                        fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}><Check size={18} /> Continue</button>
                ) : (
                    <button onClick={onExit} style={{
                        padding: 14, borderRadius: 12, border: '2px solid var(--border-color)', backgroundColor: 'transparent',
                        color: 'var(--text-muted)', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
                    }}>Back to Sounds</button>
                )}
                <button onClick={onRestart} style={{
                    padding: 14, borderRadius: 12, border: '2px solid var(--border-color)', backgroundColor: 'transparent',
                    color: 'var(--text-muted)', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}><RotateCw size={18} /> Practice again</button>
            </div>

            {sampleCount > 0 && (
                <button onClick={() => exportToneSamples()} style={{
                    marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
                }}>
                    <Download size={14} /> Export {sampleCount} training sample{sampleCount === 1 ? '' : 's'}
                </button>
            )}
        </div>
    );
}
