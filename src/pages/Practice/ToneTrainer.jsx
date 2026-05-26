import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, ArrowLeft, RotateCw, Trophy, ChevronRight } from 'lucide-react';
import speak from '../../utils/speak';
import { apiUrl } from '../../utils/apiUrl';
import { startPCMRecording } from '../../utils/recordPCM';
import { playSuccess, playError } from '../../utils/sound';
import { TONE_TRAINER_PAIRS as MINIMAL_PAIRS } from '../../data/toneTrainerData';
import './PracticeShared.css';

const TONES = {
    ngang: { name: 'Ngang', mark: 'a', label: 'Level', color: '#4CAF50' },
    sac:   { name: 'Sắc',   mark: 'á', label: 'Rising', color: '#2196F3' },
    huyen: { name: 'Huyền', mark: 'à', label: 'Falling', color: '#9C27B0' },
    hoi:   { name: 'Hỏi',   mark: 'ả', label: 'Dipping', color: '#FF9800' },
    nga:   { name: 'Ngã',   mark: 'ã', label: 'Rising-Glottal', color: '#E91E63' },
    nang:  { name: 'Nặng',  mark: 'ạ', label: 'Heavy', color: '#795548' },
};


const ROUND_COUNT = 10;

function scoreColor(v) {
    if (v == null) return 'var(--text-muted)';
    if (v >= 80) return 'var(--success-color)';
    if (v >= 60) return '#FFD166';
    return 'var(--danger-color)';
}

function isRealWord(entry) {
    // Filter out placeholder / rare / misreading entries so the trainer
    // never asks the user to pronounce something that isn't a real word.
    return !/^\(rare\)|^\(misreading\)|^\(missing tone\)|^\(wrong tone\)|^\(particle\)$/i.test(entry.meaning);
}

function pickRounds(n) {
    const out = [];
    const seenTargets = new Set();
    for (let i = 0; i < n; i++) {
        let attempt = 0;
        while (attempt++ < 20) {
            const cluster = MINIMAL_PAIRS[Math.floor(Math.random() * MINIMAL_PAIRS.length)];
            const candidates = cluster.set.filter(isRealWord);
            if (candidates.length === 0) continue;
            const target = candidates[Math.floor(Math.random() * candidates.length)];
            const key = target.word;
            if (seenTargets.has(key)) continue;
            seenTargets.add(key);
            out.push({ cluster, target });
            break;
        }
    }
    return out;
}

export default function ToneTrainer() {
    const navigate = useNavigate();
    const [rounds] = useState(() => pickRounds(ROUND_COUNT));
    const [idx, setIdx] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [scoring, setScoring] = useState(false);
    const [result, setResult] = useState(null); // { accuracy, errorType, recognized }
    const [error, setError] = useState('');
    const [scores, setScores] = useState([]); // per-round accuracy 0-100
    const [done, setDone] = useState(false);
    const recorderRef = useRef(null);

    const current = rounds[idx];

    // Auto-play the target word so the user hears the model first.
    useEffect(() => {
        if (!current) return;
        const t = setTimeout(() => speak(current.target.word), 250);
        return () => clearTimeout(t);
    }, [current]);

    const handleRecord = async () => {
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
                const res = await fetch(apiUrl(`/api/pronunciation?text=${encodeURIComponent(current.target.word)}`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'audio/wav' },
                    body: blob,
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const word = data.words?.[0];
                const accuracy = data.scores?.accuracy ?? word?.accuracy ?? null;
                setResult({
                    accuracy,
                    errorType: word?.errorType || 'None',
                    recognized: data.recognized || '',
                });
                if (accuracy != null && accuracy >= 70) playSuccess();
                else playError();
            } catch (err) {
                console.warn('Tone scoring failed:', err.message);
                setError('Scoring unavailable. Try again.');
            } finally {
                setScoring(false);
            }
            return;
        }

        setResult(null);
        setError('');
        try {
            const r = await startPCMRecording();
            recorderRef.current = r;
            setIsRecording(true);
        } catch (err) {
            console.warn('Mic failed:', err.message);
            setError(err.name === 'NotAllowedError' ? 'Microphone access denied.' : 'Could not start microphone.');
        }
    };

    const handleNext = useCallback(() => {
        const score = result?.accuracy ?? 0;
        setScores(prev => [...prev, score]);
        setResult(null);
        setError('');
        if (idx + 1 >= rounds.length) {
            setDone(true);
        } else {
            setIdx(idx + 1);
        }
    }, [idx, rounds.length, result]);

    const handleRetry = () => {
        setResult(null);
        setError('');
    };

    const handleRestart = () => {
        setIdx(0);
        setScores([]);
        setResult(null);
        setError('');
        setDone(false);
    };

    if (done) {
        const total = scores.length;
        const avg = total > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;
        const passed = scores.filter(s => s >= 70).length;
        return (
            <div className="practice-shell">
                <div className="practice-header">
                    <button className="ghost" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                    <h2>Tone Trainer</h2>
                    <span />
                </div>
                <div className="practice-body" style={{ alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 }}>
                    <Trophy size={64} color="var(--accent-gold, #FFD166)" />
                    <h1 style={{ margin: 0 }}>Session done</h1>
                    <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
                        <Stat label="Average" value={avg} color={scoreColor(avg)} />
                        <Stat label="Passed" value={`${passed}/${total}`} color="var(--text-main)" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16, width: '100%', maxWidth: 360 }}>
                        <button className="primary" onClick={handleRestart} style={{ width: '100%', padding: 14 }}>
                            <RotateCw size={18} style={{ marginRight: 8, verticalAlign: -3 }} />Another round
                        </button>
                        <button className="ghost" onClick={() => navigate('/')} style={{ width: '100%', padding: 14 }}>
                            Back home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!current) return null;
    const tone = TONES[current.target.tone];

    return (
        <div className="practice-shell">
            <div className="practice-header">
                <button className="ghost" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
                <h2>Tone Trainer · {idx + 1}/{rounds.length}</h2>
                <span />
            </div>
            <div className="practice-body" style={{ padding: 20, gap: 18 }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Say this word with the correct tone
                </div>

                {/* Target card */}
                <div style={{
                    padding: 24, borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--surface-color)', border: `2px solid ${tone.color}`,
                    textAlign: 'center',
                }}>
                    <div style={{
                        fontSize: 12, fontWeight: 700, color: tone.color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6,
                    }}>{tone.name} · {tone.label}</div>
                    <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, color: 'var(--text-main)' }}>{current.target.word}</div>
                    <div style={{ marginTop: 8, fontSize: 16, color: 'var(--text-muted)' }}>{current.target.meaning}</div>
                    <button className="ghost" onClick={() => speak(current.target.word)} style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--secondary-color)', fontSize: 14 }}>
                        <Volume2 size={18} /> Listen
                    </button>
                </div>

                {/* Same-base alternatives for context */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
                    padding: '8px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-color-light)',
                }}>
                    {current.cluster.set.filter(isRealWord).map((w) => {
                        const isTarget = w.word === current.target.word;
                        return (
                            <span key={w.word} style={{
                                padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 14,
                                fontWeight: isTarget ? 700 : 400,
                                backgroundColor: isTarget ? TONES[w.tone].color + '22' : 'transparent',
                                color: isTarget ? TONES[w.tone].color : 'var(--text-muted)',
                                border: isTarget ? `1px solid ${TONES[w.tone].color}` : '1px solid transparent',
                            }}>{w.word}</span>
                        );
                    })}
                </div>

                {/* Mic */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <button
                        onClick={handleRecord}
                        disabled={scoring || Boolean(result)}
                        style={{
                            width: 88, height: 88, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: isRecording ? 'rgba(239, 71, 111, 0.15)' : 'transparent',
                            borderColor: isRecording ? 'var(--danger-color)' : 'var(--secondary-color)',
                            boxShadow: isRecording ? '0 4px 0 var(--danger-color)' : '0 4px 0 var(--secondary-color)',
                            animation: isRecording ? 'voicePulse 1.5s infinite' : 'none',
                            opacity: scoring || result ? 0.5 : 1, cursor: scoring || result ? 'default' : 'pointer',
                        }}
                    >
                        {isRecording ? <MicOff size={40} color="var(--danger-color)" /> : <Mic size={40} color="var(--secondary-color)" />}
                    </button>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {scoring ? 'Scoring…' : isRecording ? 'Listening — tap to stop' : result ? ' ' : 'Tap to speak'}
                    </span>
                </div>

                {/* Result */}
                {result && (
                    <div style={{
                        padding: 18, borderRadius: 'var(--radius-md)', textAlign: 'center',
                        backgroundColor: 'var(--surface-color)', border: `2px solid ${scoreColor(result.accuracy)}`,
                    }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Accuracy</div>
                        <div style={{ fontSize: 48, fontWeight: 800, color: scoreColor(result.accuracy) }}>
                            {result.accuracy != null ? Math.round(result.accuracy) : '–'}
                        </div>
                        {result.recognized && (
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                                Azure heard: <strong style={{ color: 'var(--text-main)' }}>{result.recognized}</strong>
                            </div>
                        )}
                        {result.errorType === 'Mispronunciation' && (
                            <div style={{ marginTop: 6, fontSize: 13, color: scoreColor(result.accuracy) }}>
                                Tone or vowel off — listen again and retry.
                            </div>
                        )}
                    </div>
                )}

                {error && !result && (
                    <p style={{ textAlign: 'center', color: 'var(--danger-color)', margin: 0 }}>{error}</p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="ghost" onClick={handleRetry} disabled={!result} style={{ flex: 1, padding: 12 }}>
                        <RotateCw size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Retry
                    </button>
                    <button className="primary" onClick={handleNext} disabled={!result} style={{ flex: 2, padding: 12 }}>
                        Next <ChevronRight size={16} style={{ verticalAlign: -3 }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value, color }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
        </div>
    );
}
