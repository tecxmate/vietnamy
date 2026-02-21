import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Mic, MicOff, Volume2, ArrowLeft, RotateCw, Trophy,
    Activity, Radio, ChevronRight, X, Star, Flame, Check
} from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { calibrateBaseline, startPitchTracking } from '../../utils/pitchDetector';
import { dtwScore, diagnose, resampleContour } from '../../utils/dtw';
import { TONE_CONTOURS, TONE_LIST, PRACTICE_WORDS } from '../../data/toneContours';
import './TonePitchTraining.css';
import './PracticeShared.css'; // Add shared layout

// Shuffle helper
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Canvas drawing constants
const CANVAS_PAD_LEFT = 50;
const CANVAS_PAD_RIGHT = 20;
const CANVAS_PAD_TOP = 30;
const CANVAS_PAD_BOTTOM = 30;
const Y_RANGE = [-6, 6]; // semitones
const MAX_DURATION = 2.0; // seconds

function drawGrid(ctx, width, height) {
    const plotW = width - CANVAS_PAD_LEFT - CANVAS_PAD_RIGHT;
    const plotH = height - CANVAS_PAD_TOP - CANVAS_PAD_BOTTOM;

    // Background
    ctx.fillStyle = '#0f1923';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;

    // Horizontal grid (semitones)
    for (let st = Y_RANGE[0]; st <= Y_RANGE[1]; st += 2) {
        const y = CANVAS_PAD_TOP + plotH * (1 - (st - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0]));
        ctx.beginPath();
        ctx.moveTo(CANVAS_PAD_LEFT, y);
        ctx.lineTo(width - CANVAS_PAD_RIGHT, y);
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${st > 0 ? '+' : ''}${st}`, CANVAS_PAD_LEFT - 8, y + 4);
    }

    // Vertical grid (time)
    for (let t = 0; t <= MAX_DURATION; t += 0.5) {
        const x = CANVAS_PAD_LEFT + plotW * (t / MAX_DURATION);
        ctx.beginPath();
        ctx.moveTo(x, CANVAS_PAD_TOP);
        ctx.lineTo(x, height - CANVAS_PAD_BOTTOM);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.toFixed(1)}s`, x, height - 10);
    }

    // Zero line (baseline)
    const zeroY = CANVAS_PAD_TOP + plotH * (1 - (0 - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0]));
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_PAD_LEFT, zeroY);
    ctx.lineTo(width - CANVAS_PAD_RIGHT, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axis labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(12, CANVAS_PAD_TOP + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Semitones', 0, 0);
    ctx.restore();
}

function drawContour(ctx, width, height, points, color, lineWidth = 3, glow = false) {
    if (points.length < 2) return;

    const plotW = width - CANVAS_PAD_LEFT - CANVAS_PAD_RIGHT;
    const plotH = height - CANVAS_PAD_TOP - CANVAS_PAD_BOTTOM;

    if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    points.forEach((pt, i) => {
        const x = CANVAS_PAD_LEFT + plotW * (pt.time / MAX_DURATION);
        const y = CANVAS_PAD_TOP + plotH * (1 - (pt.value - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0]));

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

function drawReferenceContour(ctx, width, height, contourData, color) {
    const points = contourData.map((val, i) => ({
        time: (i / (contourData.length - 1)) * MAX_DURATION * 0.8 + MAX_DURATION * 0.1,
        value: val,
    }));
    drawContour(ctx, width, height, points, color + '40', 4); // translucent
    // Dashed guide
    ctx.setLineDash([6, 4]);
    drawContour(ctx, width, height, points, color + '80', 2);
    ctx.setLineDash([]);
}


// ─── Main Component ────────────────────────────────────────────────

export default function TonePitchTraining() {
    const { speak } = useTTS();

    // State machine: intro → calibrate → practice → summary
    const [stage, setStage] = useState('intro');
    const [micAllowed, setMicAllowed] = useState(false);
    const [calibrating, setCalibrating] = useState(false);
    const [calibProgress, setCalibProgress] = useState(0);
    const [baselineHz, setBaselineHz] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Practice state
    const [selectedTone, setSelectedTone] = useState(null); // filter by tone, null = all
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [recording, setRecording] = useState(false);
    const [userContour, setUserContour] = useState([]);
    const [result, setResult] = useState(null); // { score, message, detail }
    const [sessionScores, setSessionScores] = useState([]);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);

    // Refs
    const canvasRef = useRef(null);
    const audioCtxRef = useRef(null);
    const streamRef = useRef(null);
    const trackerRef = useRef(null);
    const contourRef = useRef([]);

    const currentQuestion = questions[currentIdx];
    const currentToneData = currentQuestion ? TONE_CONTOURS[currentQuestion.tone] : null;
    const progress = questions.length > 0 ? (currentIdx / questions.length) * 100 : 0;

    // ─── Canvas Rendering ──────────────────────────────────────────
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = rect.height;

        drawGrid(ctx, w, h);

        // Draw reference contour
        if (currentToneData) {
            drawReferenceContour(ctx, w, h, currentToneData.contour, currentToneData.color);
        }

        // Draw user contour
        if (contourRef.current.length > 0) {
            const pts = contourRef.current.map(p => ({ time: p.time, value: p.semitone }));

            // Color based on scoring
            let lineColor = '#38bdf8'; // cyan default
            if (result) {
                lineColor = result.score >= 70 ? '#4ade80' : result.score >= 40 ? '#facc15' : '#f87171';
            }
            drawContour(ctx, w, h, pts, lineColor, 3, true);
        }
    }, [currentToneData, result]);

    useEffect(() => {
        renderCanvas();
    }, [renderCanvas, userContour, recording]);

    // Resize observer for canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const obs = new ResizeObserver(() => renderCanvas());
        obs.observe(canvas);
        return () => obs.disconnect();
    }, [renderCanvas]);


    // ─── Microphone Setup ──────────────────────────────────────────
    const requestMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            setMicAllowed(true);
            setErrorMsg('');
            setStage('calibrate');
        } catch {
            setErrorMsg('Microphone access is required for pitch training. Please allow microphone access.');
        }
    };


    // ─── Calibration ───────────────────────────────────────────────
    const doCalibrate = async () => {
        if (!audioCtxRef.current || !streamRef.current) return;
        setCalibrating(true);
        setCalibProgress(0);
        setErrorMsg('');

        try {
            const baseline = await calibrateBaseline(
                audioCtxRef.current,
                streamRef.current,
                (p) => setCalibProgress(p)
            );
            setBaselineHz(baseline);
            setCalibrating(false);
            startPractice(null);
        } catch (err) {
            setErrorMsg(err.message || 'Calibration failed. Please try again.');
            setCalibrating(false);
        }
    };


    // ─── Practice Setup ────────────────────────────────────────────
    const startPractice = (toneFilter) => {
        setSelectedTone(toneFilter);
        let words;
        if (toneFilter) {
            words = shuffle(PRACTICE_WORDS.filter(w => w.tone === toneFilter)).slice(0, 6);
        } else {
            // 2 words per tone = 12 total
            const picked = [];
            TONE_LIST.forEach(t => {
                const forTone = PRACTICE_WORDS.filter(w => w.tone === t.id);
                picked.push(...shuffle(forTone).slice(0, 2));
            });
            words = shuffle(picked);
        }
        setQuestions(words);
        setCurrentIdx(0);
        setResult(null);
        setUserContour([]);
        setSessionScores([]);
        setStreak(0);
        setBestStreak(0);
        contourRef.current = [];
        setStage('practice');
    };


    // ─── Recording ─────────────────────────────────────────────────
    const startRecording = () => {
        if (!audioCtxRef.current || !streamRef.current || !baselineHz) return;

        contourRef.current = [];
        setUserContour([]);
        setResult(null);
        setRecording(true);

        const tracker = startPitchTracking(
            audioCtxRef.current,
            streamRef.current,
            baselineHz,
            ({ semitone, time }) => {
                contourRef.current.push({ time, semitone });
                // Trigger re-render periodically
                setUserContour([...contourRef.current]);
            }
        );
        trackerRef.current = tracker;

        // Auto-stop after MAX_DURATION
        setTimeout(() => {
            stopRecording();
        }, MAX_DURATION * 1000);
    };

    const stopRecording = () => {
        if (trackerRef.current) {
            trackerRef.current.stop();
            trackerRef.current = null;
        }
        setRecording(false);

        // Evaluate
        if (contourRef.current.length >= 3 && currentToneData) {
            const userSemitones = contourRef.current.map(p => p.semitone);
            const score = dtwScore(userSemitones, currentToneData.contour);
            const { message, detail } = diagnose(userSemitones, currentToneData.contour);
            setResult({ score, message, detail });
            setSessionScores(prev => [...prev, { tone: currentQuestion.tone, word: currentQuestion.word, score }]);

            if (score >= 70) {
                setStreak(s => {
                    const next = s + 1;
                    setBestStreak(b => Math.max(b, next));
                    return next;
                });
            } else {
                setStreak(0);
            }
        } else {
            setResult({ score: 0, message: 'Too short', detail: 'Hold the sound longer for an accurate reading.' });
            setStreak(0);
        }
    };

    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(i => i + 1);
            setResult(null);
            setUserContour([]);
            contourRef.current = [];
        } else {
            setStage('summary');
        }
    };

    const handleRetry = () => {
        setResult(null);
        setUserContour([]);
        contourRef.current = [];
    };


    // ─── Cleanup ───────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (trackerRef.current) trackerRef.current.stop();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);


    // ═══════════════════════════════════════════════════════════════
    // INTRO SCREEN
    // ═══════════════════════════════════════════════════════════════
    if (stage === 'intro') {
        return (
            <div className="practice-layout">
                <div className="practice-header">
                    <h1 className="practice-header-title">
                        <Link to="/practice" style={{ color: 'var(--text-main)', display: 'flex' }}>
                            <ArrowLeft size={24} />
                        </Link>
                        Pitch Training
                    </h1>
                </div>

                <div className="practice-content-centered">
                    <div className="pitch-intro-visual">
                        <Activity size={48} className="pitch-hero-icon" />
                        <div className="pitch-wave-bars">
                            {[3, 5, 2, 6, 4, 7, 3, 5, 2].map((h, i) => (
                                <div key={i} className="pitch-wave-bar" style={{ height: `${h * 8}px`, animationDelay: `${i * 0.1}s` }} />
                            ))}
                        </div>
                    </div>

                    <h2 className="practice-title">Visualize Your Tones</h2>
                    <p className="practice-subtitle" style={{ maxWidth: '460px' }}>
                        Speak into your microphone and see your <strong>pitch contour</strong> in real-time.
                        Compare it against the native tone shapes to perfect your pronunciation.
                    </p>

                    <div className="pitch-tone-preview">
                        {TONE_LIST.map(t => (
                            <div key={t.id} className="pitch-tone-chip" style={{ '--chip-color': t.color }}>
                                <span className="pitch-tone-mark">{t.mark}</span>
                                <span className="pitch-tone-label">{t.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pitch-requirements">
                        <Radio size={16} /> Requires microphone access • Works best with headphones
                    </div>
                </div>

                <div className="practice-bottom-bar" style={{ justifyContent: 'center' }}>
                    {errorMsg && <p className="pitch-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{errorMsg}</p>}
                    <button className="practice-action-btn primary" onClick={requestMic}>
                        Grant Mic & Start
                    </button>
                </div>
            </div>
        );
    }


    // ═══════════════════════════════════════════════════════════════
    // CALIBRATION SCREEN
    // ═══════════════════════════════════════════════════════════════
    if (stage === 'calibrate') {
        return (
            <div className="practice-layout">
                <div className="practice-header">
                    <h1 className="practice-header-title">
                        <Link to="/practice" style={{ color: 'var(--text-main)', display: 'flex' }}>
                            <ArrowLeft size={24} />
                        </Link>
                        Calibration
                    </h1>
                </div>

                <div className="practice-content-centered">
                    <div className={`pitch-calibrate-icon ${calibrating ? 'active' : ''}`}>
                        <Mic size={48} />
                    </div>

                    <h2 className="practice-title">Find Your Baseline</h2>
                    <p className="practice-subtitle" style={{ maxWidth: '460px' }}>
                        Say <strong>"aaa"</strong> at your natural, comfortable pitch for about 5 seconds.
                        This calibrates the system to your voice range.
                    </p>

                    {calibrating && (
                        <div className="pitch-calibrate-progress">
                            <div className="pitch-calibrate-bar">
                                <div
                                    className="pitch-calibrate-fill"
                                    style={{ width: `${calibProgress * 100}%` }}
                                />
                            </div>
                            <span className="pitch-calibrate-label">Listening... {Math.round(calibProgress * 100)}%</span>
                        </div>
                    )}

                    {baselineHz && (
                        <p className="pitch-baseline-info" style={{ marginTop: '24px' }}>
                            ✅ Baseline detected: <strong>{Math.round(baselineHz)} Hz</strong>
                        </p>
                    )}
                </div>

                <div className="practice-bottom-bar" style={{ justifyContent: 'center' }}>
                    {errorMsg && <p className="pitch-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{errorMsg}</p>}
                    {!calibrating && (
                        <button className="practice-action-btn primary" onClick={doCalibrate}>
                            Start Calibration
                        </button>
                    )}
                </div>
            </div>
        );
    }


    // ═══════════════════════════════════════════════════════════════
    // SUMMARY SCREEN
    // ═══════════════════════════════════════════════════════════════
    if (stage === 'summary') {
        const avgScore = sessionScores.length > 0
            ? Math.round(sessionScores.reduce((s, x) => s + x.score, 0) / sessionScores.length)
            : 0;

        let message = 'Keep practicing! 🔄';
        if (avgScore >= 85) message = 'Outstanding! Your tones are spot-on! 🎯';
        else if (avgScore >= 70) message = 'Great job! Almost there! 💪';
        else if (avgScore >= 50) message = 'Good progress! Keep at it! 📈';

        // Per-tone averages
        const toneAvgs = TONE_LIST.map(t => {
            const scores = sessionScores.filter(s => s.tone === t.id);
            return {
                ...t,
                avg: scores.length > 0 ? Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length) : null,
            };
        }).filter(t => t.avg !== null);

        return (
            <div className="practice-layout">
                <div className="practice-header">
                    <h1 className="practice-header-title">Pitch Training</h1>
                </div>

                <div className="practice-content-centered">
                    <Trophy size={80} style={{ color: 'var(--primary-color)', marginBottom: '24px' }} />
                    <h2 className="practice-title">Session Complete!</h2>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)', margin: '16px 0' }}>{avgScore}%</div>
                    <p className="practice-subtitle">
                        {message}<br />
                        Best streak: 🔥 {bestStreak}
                    </p>

                    {toneAvgs.length > 0 && (
                        <div className="pitch-tone-breakdown" style={{ marginTop: '24px' }}>
                            {toneAvgs.map(t => (
                                <div key={t.id} className="pitch-tone-score">
                                    <span className="pitch-tone-mark" style={{ color: t.color }}>{t.mark}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.name}</span>
                                    <span style={{ fontWeight: 700, marginLeft: '4px', color: t.avg >= 70 ? 'var(--success-color)' : t.avg >= 40 ? '#facc15' : 'var(--danger-color)' }}>
                                        {t.avg}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="practice-bottom-bar" style={{ flexDirection: 'row', gap: '16px', justifyContent: 'center' }}>
                    <button className="practice-action-btn" style={{ background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', width: 'auto', flex: 1, boxShadow: '0 4px 0 var(--border-color)' }} onClick={() => setStage('intro')}>
                        Back
                    </button>
                    <button className="practice-action-btn primary" style={{ width: 'auto', flex: 2 }} onClick={() => startPractice(selectedTone)}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }


    // ═══════════════════════════════════════════════════════════════
    // PRACTICE SCREEN
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="practice-layout" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <Link to="/practice" style={{ color: 'var(--text-main)', display: 'flex' }}>
                        <X size={24} />
                    </Link>
                </h1>
                <div className="practice-stats">
                    <span className="practice-stat-pill" style={{ color: 'var(--text-main)' }}>
                        <Star size={18} style={{ color: 'var(--primary-color)' }} /> {sessionScores.filter(s => s.score >= 70).length}
                    </span>
                    <span className="practice-stat-pill" style={{ color: 'var(--text-main)' }}>
                        <Flame size={18} style={{ color: '#FF5722' }} /> {streak}
                    </span>
                </div>
            </div>

            {/* Progress */}
            <div className="pitch-progress-bar" style={{ marginBottom: '24px', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="pitch-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            {/* Word display */}
            {currentQuestion && (
                <div className="pitch-word-area" style={{ padding: '0 0 24px' }}>
                    <div className="pitch-word-row">
                        <span className="pitch-target-word">{currentQuestion.word}</span>
                        <button
                            className="pitch-listen-btn"
                            onClick={() => speak(currentQuestion.word, 0.75)}
                            title="Listen to pronunciation"
                        >
                            <Volume2 size={24} />
                        </button>
                    </div>
                    <div className="pitch-word-meta">
                        <span className="pitch-word-meaning">"{currentQuestion.meaning}"</span>
                        <span className="pitch-tone-badge" style={{ background: currentToneData?.color + '22', color: currentToneData?.color }}>
                            {currentToneData?.mark} {currentToneData?.name} — {currentToneData?.label}
                        </span>
                    </div>
                </div>
            )}

            {/* Canvas */}
            <div className="pitch-canvas-wrapper" style={{ flex: '0 0 auto', padding: '0 0 24px', minHeight: 'auto' }}>
                <canvas ref={canvasRef} className="pitch-canvas" style={{ minHeight: '260px', borderRadius: 'var(--radius-lg)' }} />
                <div className="pitch-canvas-legend">
                    {currentToneData && (
                        <>
                            <span className="pitch-legend-item">
                                <span className="pitch-legend-swatch" style={{ background: currentToneData.color + '80' }} />
                                Target
                            </span>
                            <span className="pitch-legend-item">
                                <span className="pitch-legend-swatch live" />
                                Your voice
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Record button */}
            <div className="practice-bottom-bar" style={{ padding: 0 }}>
                {!result ? (
                    <button
                        className={`practice-action-btn primary ${recording ? 'recording' : ''}`}
                        style={recording ? { background: 'var(--danger-color)', color: 'white', boxShadow: '0 4px 0 #b92b49', animation: 'recordPulse 1s ease-in-out infinite' } : {}}
                        onMouseDown={startRecording}
                        onMouseUp={() => recording && stopRecording()}
                        onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                        onTouchEnd={(e) => { e.preventDefault(); recording && stopRecording(); }}
                        disabled={recording && false}
                    >
                        {recording ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <MicOff size={24} /> Release to stop
                            </span>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Mic size={24} /> Hold to record
                            </span>
                        )}
                    </button>
                ) : (
                    <div className="pitch-result-panel" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface-color)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', width: '100%' }}>
                            <div className="pitch-score-ring">
                                <svg viewBox="0 0 100 100" className="pitch-score-svg">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                                    <circle
                                        cx="50" cy="50" r="42" fill="none"
                                        stroke={result.score >= 70 ? 'var(--success-color)' : result.score >= 40 ? '#facc15' : 'var(--danger-color)'}
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={`${result.score * 2.64} 264`}
                                        transform="rotate(-90 50 50)"
                                    />
                                </svg>
                                <span className="pitch-score-number" style={{ color: 'var(--text-main)' }}>{result.score}%</span>
                            </div>
                            <div className="pitch-result-text" style={{ textAlign: 'left' }}>
                                <div className="pitch-result-message" style={{ color: result.score >= 70 ? 'var(--success-color)' : result.score >= 40 ? '#facc15' : 'var(--danger-color)' }}>{result.message}</div>
                                <div className="pitch-result-detail">{result.detail}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button className="practice-action-btn" style={{ flex: 1, background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', boxShadow: '0 4px 0 var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={handleRetry}>
                                <RotateCw size={20} /> Retry
                            </button>
                            <button className="practice-action-btn primary" style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={handleNext}>
                                {currentIdx < questions.length - 1 ? 'Next' : 'Finish'} <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
