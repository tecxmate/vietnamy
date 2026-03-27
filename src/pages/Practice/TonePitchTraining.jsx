import { useState, useEffect, useRef, useCallback } from 'react';

import {
    Mic, MicOff, Volume2, ArrowLeft, RotateCw, Trophy,
    Activity, Radio, ChevronRight, X, Star, Flame, Check, Settings
} from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { calibrateBaseline, startPitchTracking } from '../../utils/pitchDetector';
import { dtwScore, diagnose, resampleContour, combinedScore } from '../../utils/dtw';
import { TONE_CONTOURS, TONE_LIST, PRACTICE_WORDS } from '../../data/toneContours';
import {
    processContour, saveToneSample, loadCalibration,
    clearCalibration, getCalibratedContour, getCalibrationStatus
} from '../../utils/toneCalibration';
import './TonePitchTraining.css';
import './PracticeShared.css';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';

// Shuffle helper
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Canvas drawing constants
const CANVAS_PAD_LEFT = 50;
const CANVAS_PAD_RIGHT = 20;
const CANVAS_PAD_TOP = 30;
const CANVAS_PAD_BOTTOM = 30;
const Y_RANGE = [-6, 6]; // semitones
const MAX_DURATION = 2.0; // seconds
const SAMPLES_PER_TONE = 3;

function drawGrid(ctx, width, height) {
    const plotW = width - CANVAS_PAD_LEFT - CANVAS_PAD_RIGHT;
    const plotH = height - CANVAS_PAD_TOP - CANVAS_PAD_BOTTOM;

    ctx.fillStyle = '#0f1923';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;

    for (let st = Y_RANGE[0]; st <= Y_RANGE[1]; st += 2) {
        const y = CANVAS_PAD_TOP + plotH * (1 - (st - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0]));
        ctx.beginPath();
        ctx.moveTo(CANVAS_PAD_LEFT, y);
        ctx.lineTo(width - CANVAS_PAD_RIGHT, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${st > 0 ? '+' : ''}${st}`, CANVAS_PAD_LEFT - 8, y + 4);
    }

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

    const zeroY = CANVAS_PAD_TOP + plotH * (1 - (0 - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0]));
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_PAD_LEFT, zeroY);
    ctx.lineTo(width - CANVAS_PAD_RIGHT, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

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
    drawContour(ctx, width, height, points, color + '40', 4);
    ctx.setLineDash([6, 4]);
    drawContour(ctx, width, height, points, color + '80', 2);
    ctx.setLineDash([]);
}


// ─── Main Component ────────────────────────────────────────────────

export default function TonePitchTraining({ tones: toneIds = null, title = '🎤 Pitch Training' }) {
    // Filter TONE_LIST if specific tones are requested
    const FILTERED_TONES = toneIds ? TONE_LIST.filter(t => toneIds.includes(t.id)) : TONE_LIST;
    const FILTERED_WORDS = toneIds ? PRACTICE_WORDS.filter(w => toneIds.includes(w.tone)) : PRACTICE_WORDS;
    const { speak } = useTTS();
    const { session, markComplete, goNext, goBack } = usePracticeCompletion();

    // State machine: intro → calibrate → tone-calibrate → practice → summary
    const [stage, setStage] = useState('intro');
    const [micAllowed, setMicAllowed] = useState(false);
    const [calibrating, setCalibrating] = useState(false);
    const [calibProgress, setCalibProgress] = useState(0);
    const [baselineHz, setBaselineHz] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Tone calibration state
    const [calibToneIdx, setCalibToneIdx] = useState(0);
    const [calibSampleNum, setCalibSampleNum] = useState(0);
    const [calibRecording, setCalibRecording] = useState(false);
    const [calibContour, setCalibContour] = useState([]);
    const [calibStatus, setCalibStatus] = useState(() => getCalibrationStatus());
    const [calibPreviewScore, setCalibPreviewScore] = useState(null);

    // Practice state
    const [selectedTone, setSelectedTone] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [recording, setRecording] = useState(false);
    const [userContour, setUserContour] = useState([]);
    const [result, setResult] = useState(null);
    const [sessionScores, setSessionScores] = useState([]);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);

    // Refs
    const canvasRef = useRef(null);
    const calibCanvasRef = useRef(null);
    const audioCtxRef = useRef(null);
    const streamRef = useRef(null);
    const trackerRef = useRef(null);
    const contourRef = useRef([]);

    const currentQuestion = questions[currentIdx];
    const currentToneData = currentQuestion ? TONE_CONTOURS[currentQuestion.tone] : null;
    const progress = questions.length > 0 ? (currentIdx / questions.length) * 100 : 0;
    const calibTone = FILTERED_TONES[calibToneIdx];

    // ─── Get effective reference for scoring ────────────────────────
    const getEffectiveRef = useCallback((toneId) => {
        const cal = getCalibratedContour(toneId);
        if (cal) return { contour: cal.contour, samples: loadCalibration()[toneId]?.samples || null };
        return { contour: TONE_CONTOURS[toneId].contour, samples: null };
    }, []);


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

        if (currentToneData) {
            // Draw calibrated contour if available, else default
            const cal = getCalibratedContour(currentQuestion.tone);
            if (cal) {
                drawReferenceContour(ctx, w, h, cal.contour, currentToneData.color);
            } else {
                drawReferenceContour(ctx, w, h, currentToneData.contour, currentToneData.color);
            }
        }

        if (contourRef.current.length > 0) {
            const pts = contourRef.current.map(p => ({ time: p.time, value: p.semitone }));
            let lineColor = '#38bdf8';
            if (result) {
                lineColor = result.score >= 70 ? '#4ade80' : result.score >= 40 ? '#facc15' : '#f87171';
            }
            drawContour(ctx, w, h, pts, lineColor, 3, true);
        }
    }, [currentToneData, currentQuestion, result]);

    useEffect(() => {
        renderCanvas();
    }, [renderCanvas, userContour, recording]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const obs = new ResizeObserver(() => renderCanvas());
        obs.observe(canvas);
        return () => obs.disconnect();
    }, [renderCanvas]);


    // ─── Calibration Canvas Rendering ──────────────────────────────
    const renderCalibCanvas = useCallback(() => {
        const canvas = calibCanvasRef.current;
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

        // Draw the default reference as a faint guide
        if (calibTone) {
            drawReferenceContour(ctx, w, h, TONE_CONTOURS[calibTone.id].contour, calibTone.color);
        }

        // Draw previously recorded samples for this tone (faint)
        const cal = loadCalibration();
        if (calibTone && cal[calibTone.id]?.samples) {
            cal[calibTone.id].samples.forEach(sample => {
                const pts = sample.map((val, i) => ({
                    time: (i / (sample.length - 1)) * MAX_DURATION * 0.8 + MAX_DURATION * 0.1,
                    value: val,
                }));
                drawContour(ctx, w, h, pts, '#4ade8050', 2);
            });
        }

        // Draw current recording
        if (contourRef.current.length > 0) {
            const pts = contourRef.current.map(p => ({ time: p.time, value: p.semitone }));
            drawContour(ctx, w, h, pts, '#38bdf8', 3, true);
        }
    }, [calibTone]);

    useEffect(() => {
        if (stage === 'tone-calibrate') renderCalibCanvas();
    }, [renderCalibCanvas, calibContour, calibRecording, stage]);

    useEffect(() => {
        const canvas = calibCanvasRef.current;
        if (!canvas) return;
        const obs = new ResizeObserver(() => renderCalibCanvas());
        obs.observe(canvas);
        return () => obs.disconnect();
    }, [renderCalibCanvas]);


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


    // ─── Baseline Calibration ──────────────────────────────────────
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

            // Check if we have calibrated tones already
            const status = getCalibrationStatus();
            const calibratedCount = Object.values(status).filter(n => n >= 1).length;
            if (calibratedCount >= 6) {
                // All tones calibrated, go straight to practice
                startPractice(null);
            } else {
                // Offer tone calibration
                setStage('tone-calibrate-intro');
            }
        } catch (err) {
            setErrorMsg(err.message || 'Calibration failed. Please try again.');
            setCalibrating(false);
        }
    };


    // ─── Tone Calibration Recording ────────────────────────────────
    const startCalibRecording = () => {
        if (!audioCtxRef.current || !streamRef.current || !baselineHz) return;

        contourRef.current = [];
        setCalibContour([]);
        setCalibPreviewScore(null);
        setCalibRecording(true);

        const tracker = startPitchTracking(
            audioCtxRef.current,
            streamRef.current,
            baselineHz,
            ({ semitone, time }) => {
                contourRef.current.push({ time, semitone });
                setCalibContour([...contourRef.current]);
            }
        );
        trackerRef.current = tracker;

        setTimeout(() => stopCalibRecording(), MAX_DURATION * 1000);
    };

    const stopCalibRecording = () => {
        if (trackerRef.current) {
            trackerRef.current.stop();
            trackerRef.current = null;
        }
        setCalibRecording(false);

        if (contourRef.current.length >= 3 && calibTone) {
            const rawSemitones = contourRef.current.map(p => p.semitone);
            const processed = processContour(rawSemitones);

            // Save the sample
            saveToneSample(calibTone.id, processed);
            setCalibStatus(getCalibrationStatus());
            setCalibSampleNum(prev => prev + 1);

            // Show a quick preview score against default
            const score = combinedScore(rawSemitones, TONE_CONTOURS[calibTone.id].contour);
            setCalibPreviewScore(score);
        }
    };

    const advanceCalibTone = () => {
        contourRef.current = [];
        setCalibContour([]);
        setCalibPreviewScore(null);

        if (calibToneIdx < FILTERED_TONES.length - 1) {
            setCalibToneIdx(calibToneIdx + 1);
            setCalibSampleNum(0);
        } else {
            // Done calibrating all tones
            startPractice(null);
        }
    };

    const recordAnotherSample = () => {
        contourRef.current = [];
        setCalibContour([]);
        setCalibPreviewScore(null);
    };

    const skipToneCalib = () => {
        startPractice(null);
    };


    // ─── Practice Setup ────────────────────────────────────────────
    const startPractice = (toneFilter) => {
        setSelectedTone(toneFilter);
        let words;
        if (toneFilter) {
            words = shuffle(FILTERED_WORDS.filter(w => w.tone === toneFilter)).slice(0, Math.min(4 + session, 8));
        } else {
            const picked = [];
            FILTERED_TONES.forEach(t => {
                const forTone = FILTERED_WORDS.filter(w => w.tone === t.id);
                picked.push(...shuffle(forTone).slice(0, Math.min(1 + session, 3)));
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


    // ─── Practice Recording ─────────────────────────────────────────
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
                setUserContour([...contourRef.current]);
            }
        );
        trackerRef.current = tracker;

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

        if (contourRef.current.length >= 3 && currentToneData) {
            const userSemitones = contourRef.current.map(p => p.semitone);
            const { contour: refContour, samples } = getEffectiveRef(currentQuestion.tone);
            const score = dtwScore(userSemitones, refContour, samples);
            const { message, detail } = diagnose(userSemitones, refContour);
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
            markComplete();
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
        const status = getCalibrationStatus();
        const calibratedCount = Object.values(status).filter(n => n >= 1).length;

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
                        {FILTERED_TONES.map(t => (
                            <div key={t.id} className="pitch-tone-chip" style={{ '--chip-color': t.color }}>
                                <span className="pitch-tone-mark">{t.mark}</span>
                                <span className="pitch-tone-label">{t.name}</span>
                                {status[t.id] >= 1 && (
                                    <Check size={14} style={{ color: 'var(--success-color)' }} />
                                )}
                            </div>
                        ))}
                    </div>

                    {calibratedCount > 0 && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                            {calibratedCount}/6 tones calibrated with native samples
                        </p>
                    )}

                    <div className="pitch-requirements">
                        <Radio size={16} /> Requires microphone access
                    </div>
                </div>

                <div className="practice-bottom-bar" style={{ justifyContent: 'center', gap: '12px', flexDirection: 'column', alignItems: 'center' }}>
                    {errorMsg && <p className="pitch-error" style={{ marginBottom: '16px', textAlign: 'center' }}>{errorMsg}</p>}
                    <button className="practice-action-btn primary" onClick={requestMic}>
                        Grant Mic & Start
                    </button>
                    {calibratedCount > 0 && (
                        <button
                            className="practice-action-btn"
                            style={{ background: 'transparent', color: 'var(--danger-color)', boxShadow: 'none', fontSize: '0.85rem', padding: '8px 16px' }}
                            onClick={() => { clearCalibration(); setCalibStatus({}); }}
                        >
                            Reset all calibration data
                        </button>
                    )}
                </div>
            </div>
        );
    }


    // ═══════════════════════════════════════════════════════════════
    // BASELINE CALIBRATION SCREEN
    // ═══════════════════════════════════════════════════════════════
    if (stage === 'calibrate') {
        return (
            <div className="practice-layout">
                <div className="practice-header">
                    <h1 className="practice-header-title">
                        <button onClick={goBack} style={{ color: 'var(--text-main)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <ArrowLeft size={24} />
                        </button>
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
                                <div className="pitch-calibrate-fill" style={{ width: `${calibProgress * 100}%` }} />
                            </div>
                            <span className="pitch-calibrate-label">Listening... {Math.round(calibProgress * 100)}%</span>
                        </div>
                    )}

                    {baselineHz && (
                        <p className="pitch-baseline-info" style={{ marginTop: '24px' }}>
                            Baseline detected: <strong>{Math.round(baselineHz)} Hz</strong>
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
    // TONE CALIBRATION INTRO
    // ═══════════════════════════════════════════════════════════════
    if (stage === 'tone-calibrate-intro') {
        const status = getCalibrationStatus();
        const calibratedCount = Object.values(status).filter(n => n >= 1).length;

        return (
            <div className="practice-layout">
                <div className="practice-header">
                    <h1 className="practice-header-title">
                        <button onClick={() => setStage('intro')} style={{ color: 'var(--text-main)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <ArrowLeft size={24} />
                        </button>
                        Tone Calibration
                    </h1>
                </div>

                <div className="practice-content-centered">
                    <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-full)', background: 'rgba(4, 158, 117, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', marginBottom: 'var(--spacing-lg)' }}>
                        <Settings size={40} />
                    </div>

                    <h2 className="practice-title">Calibrate with Your Voice</h2>
                    <p className="practice-subtitle" style={{ maxWidth: '460px' }}>
                        Record yourself (or a native speaker) saying each of the 6 tones.
                        This creates <strong>personalized reference contours</strong> that match
                        how tones are actually produced — much more accurate than textbook shapes.
                    </p>

                    <div className="pitch-tone-preview" style={{ marginTop: 'var(--spacing-lg)' }}>
                        {FILTERED_TONES.map(t => {
                            const count = status[t.id] || 0;
                            return (
                                <div key={t.id} className="pitch-tone-chip" style={{ '--chip-color': t.color }}>
                                    <span className="pitch-tone-mark">{t.mark}</span>
                                    <span className="pitch-tone-label">{t.name}</span>
                                    {count > 0 ? (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: 600 }}>
                                            {count}x
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-md)' }}>
                        Record {SAMPLES_PER_TONE} samples per tone for best results. Takes about 2 minutes.
                    </p>
                </div>

                <div className="practice-bottom-bar" style={{ flexDirection: 'row', gap: '12px', justifyContent: 'center' }}>
                    <button
                        className="practice-action-btn"
                        style={{ background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', width: 'auto', flex: 1, boxShadow: '0 4px 0 var(--border-color)' }}
                        onClick={skipToneCalib}
                    >
                        {calibratedCount >= 6 ? 'Use existing' : 'Skip'}
                    </button>
                    <button
                        className="practice-action-btn primary"
                        style={{ width: 'auto', flex: 2 }}
                        onClick={() => {
                            setCalibToneIdx(0);
                            setCalibSampleNum(0);
                            setCalibContour([]);
                            contourRef.current = [];
                            setCalibPreviewScore(null);
                            setStage('tone-calibrate');
                        }}
                    >
                        {calibratedCount > 0 ? 'Re-calibrate' : 'Start Calibrating'}
                    </button>
                </div>
            </div>
        );
    }


    // ═══════════════════════════════════════════════════════════════
    // TONE CALIBRATION RECORDING SCREEN
    // ═══════════════════════════════════════════════════════════════
    if (stage === 'tone-calibrate') {
        const samplesForThisTone = calibStatus[calibTone?.id] || 0;
        const sampleWord = FILTERED_WORDS.find(w => w.tone === calibTone?.id);

        return (
            <div className="practice-layout" style={{ width: '100%' }}>
                <div className="practice-header">
                    <h1 className="practice-header-title">
                        <button onClick={() => setStage('tone-calibrate-intro')} style={{ color: 'var(--text-main)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    </h1>
                    <div className="practice-stats">
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Tone {calibToneIdx + 1} / {FILTERED_TONES.length}
                        </span>
                    </div>
                </div>

                {/* Progress */}
                <div className="pitch-progress-bar" style={{ marginBottom: '24px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="pitch-progress-fill" style={{ width: `${((calibToneIdx) / FILTERED_TONES.length) * 100}%` }} />
                </div>

                {/* Tone info */}
                {calibTone && (
                    <div className="pitch-word-area">
                        <div className="pitch-word-row">
                            <span className="pitch-target-word" style={{ color: calibTone.color }}>
                                {calibTone.mark}
                            </span>
                            <button
                                className="pitch-listen-btn"
                                onClick={() => sampleWord && speak(sampleWord.word, 0.75)}
                                title="Listen to example"
                            >
                                <Volume2 size={24} />
                            </button>
                        </div>
                        <div className="pitch-word-meta">
                            <span style={{ fontWeight: 600, color: calibTone.color }}>{calibTone.name}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>— {calibTone.label}</span>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                            Say <strong>"{sampleWord?.word}"</strong> ({sampleWord?.meaning}) with the {calibTone.name} tone
                        </p>
                    </div>
                )}

                {/* Canvas */}
                <div className="pitch-canvas-wrapper">
                    <canvas ref={calibCanvasRef} className="pitch-canvas" />
                    <div className="pitch-canvas-legend">
                        <span className="pitch-legend-item">
                            <span className="pitch-legend-swatch" style={{ background: (calibTone?.color || '#666') + '80' }} />
                            Default shape
                        </span>
                        {samplesForThisTone > 0 && (
                            <span className="pitch-legend-item">
                                <span className="pitch-legend-swatch" style={{ background: '#4ade8050' }} />
                                Your samples ({samplesForThisTone})
                            </span>
                        )}
                        <span className="pitch-legend-item">
                            <span className="pitch-legend-swatch live" />
                            Recording
                        </span>
                    </div>
                </div>

                {/* Sample counter + score preview */}
                {calibPreviewScore !== null && (
                    <div style={{
                        textAlign: 'center', padding: '12px', marginBottom: '12px',
                        background: 'var(--surface-color)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Sample {samplesForThisTone} recorded
                        </span>
                    </div>
                )}

                {/* Bottom actions */}
                <div className="practice-bottom-bar pitch-bottom-inline">
                    {calibPreviewScore === null ? (
                        <div style={{ display: 'flex', gap: '12px', width: '100%', flexDirection: 'column', alignItems: 'center' }}>
                            <button
                                className={`practice-action-btn primary ${calibRecording ? 'recording' : ''}`}
                                style={calibRecording ? { background: 'var(--danger-color)', color: 'white', boxShadow: '0 4px 0 #b92b49', animation: 'recordPulse 1s ease-in-out infinite' } : {}}
                                onMouseDown={startCalibRecording}
                                onMouseUp={() => calibRecording && stopCalibRecording()}
                                onTouchStart={(e) => { e.preventDefault(); startCalibRecording(); }}
                                onTouchEnd={(e) => { e.preventDefault(); calibRecording && stopCalibRecording(); }}
                            >
                                {calibRecording ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <MicOff size={24} /> Release to stop
                                    </span>
                                ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <Mic size={24} /> Hold to record sample
                                    </span>
                                )}
                            </button>
                            {!calibRecording && (
                                <button
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.88rem', cursor: 'pointer', padding: '8px 16px' }}
                                    onClick={advanceCalibTone}
                                >
                                    {calibToneIdx < FILTERED_TONES.length - 1 ? 'Skip this tone' : 'Skip & start practice'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            {samplesForThisTone < SAMPLES_PER_TONE && (
                                <button
                                    className="practice-action-btn"
                                    style={{ flex: 1, background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', boxShadow: '0 4px 0 var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                    onClick={recordAnotherSample}
                                >
                                    <Mic size={20} /> Record more
                                </button>
                            )}
                            <button
                                className="practice-action-btn primary"
                                style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                onClick={advanceCalibTone}
                            >
                                {calibToneIdx < FILTERED_TONES.length - 1 ? (
                                    <>Next tone <ChevronRight size={20} /></>
                                ) : (
                                    <>Start practice <ChevronRight size={20} /></>
                                )}
                            </button>
                        </div>
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

        const toneAvgs = FILTERED_TONES.map(t => {
            const scores = sessionScores.filter(s => s.tone === t.id);
            return {
                ...t,
                avg: scores.length > 0 ? Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length) : null,
            };
        }).filter(t => t.avg !== null);

        return (
            <div className="practice-layout">
                <div className="practice-header">
                    <h1 className="practice-header-title">{title}</h1>
                </div>

                <div className="practice-content-centered">
                    <Trophy size={80} style={{ color: 'var(--primary-color)', marginBottom: '24px' }} />
                    <h2 className="practice-title">Session Complete!</h2>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)', margin: '16px 0' }}>{avgScore}%</div>
                    <p className="practice-subtitle">
                        {message}<br />
                        Best streak: {bestStreak}
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
                    <button className="practice-action-btn primary" style={{ width: 'auto', flex: 2 }} onClick={goNext}>
                        Next
                    </button>
                </div>
            </div>
        );
    }


    // ═══════════════════════════════════════════════════════════════
    // PRACTICE SCREEN
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="practice-layout" style={{ width: '100%' }}>
            {/* Header */}
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <button onClick={goBack} style={{ color: 'var(--text-main)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <X size={24} />
                    </button>
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
                <div className="pitch-word-area">
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
            <div className="pitch-canvas-wrapper">
                <canvas ref={canvasRef} className="pitch-canvas" />
                <div className="pitch-canvas-legend">
                    {currentToneData && (
                        <>
                            <span className="pitch-legend-item">
                                <span className="pitch-legend-swatch" style={{ background: currentToneData.color + '80' }} />
                                {getCalibratedContour(currentQuestion.tone) ? 'Calibrated' : 'Target'}
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
            <div className="practice-bottom-bar pitch-bottom-inline">
                {!result ? (
                    <button
                        className={`practice-action-btn primary ${recording ? 'recording' : ''}`}
                        style={recording ? { background: 'var(--danger-color)', color: 'white', boxShadow: '0 4px 0 #b92b49', animation: 'recordPulse 1s ease-in-out infinite' } : {}}
                        onMouseDown={startRecording}
                        onMouseUp={() => recording && stopRecording()}
                        onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                        onTouchEnd={(e) => { e.preventDefault(); recording && stopRecording(); }}
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
