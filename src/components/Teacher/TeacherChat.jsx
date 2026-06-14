import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Volume2, Check, X, ChevronRight, RotateCcw, Sparkles, Mic, Square } from 'lucide-react';
import speak, { subscribeSpeakingState, getSpeakingState } from '../../utils/speak';
import { startPCMRecording } from '../../utils/recordPCM';
import { useT } from '../../lib/i18n';
import BeKhe from '../BeKhe/BeKhe';
import { buildTonesLesson } from './tonesLesson';
import { buildGreetingsLesson } from './greetingsLesson';
import './TeacherChat.css';

// Tiny inline formatter for the authored scripts: **bold** and *italic*.
function formatText(text) {
    const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>;
        return <React.Fragment key={i}>{p}</React.Fragment>;
    });
}

// Visual "audio is playing" feedback (driven by the real TTS playback state) so
// a volume-off learner still sees that something is happening.
function useSpeakingState(text) {
    const [state, setState] = useState(() => getSpeakingState(text));
    useEffect(() => {
        const update = () => setState(getSpeakingState(text));
        const unsub = subscribeSpeakingState(update);
        update();
        return unsub;
    }, [text]);
    return state; // 'idle' | 'loading' | 'playing'
}
const isAudible = (s) => s === 'playing' || s === 'loading';

// Animated equalizer bars — shown while the matching audio plays.
function SoundBars({ className = '' }) {
    return (
        <span className={`tc-sound ${className}`} aria-label="playing audio">
            <span /><span /><span /><span />
        </span>
    );
}

// Lessons are keyed by id. Add a builder here + an authored script file to
// ship a new teacher lesson — the shell, director and widgets are shared.
const LESSONS = { tones: buildTonesLesson, greetings: buildGreetingsLesson };

// Vietnamese tone marks (combining): huyền/sắc/ngã/hỏi/nặng — NOT the vowel-
// quality marks (circumflex/breve/horn), which we keep. Used to score
// pronunciation by ASR match when phoneme assessment is unavailable (vi-VN).
const VI_TONE_MARKS = /[\u0300\u0301\u0303\u0309\u0323]/g;
const normVi = (x) => (x || '').toLowerCase().normalize('NFC').replace(/[.,!?"'’]/g, '').trim();
const stripViTone = (x) => normVi(x).normalize('NFD').replace(VI_TONE_MARKS, '').normalize('NFC');

const TeacherChat = ({ lessonId: lessonIdProp }) => {
    const navigate = useNavigate();
    const params = useParams();
    const t = useT();
    const lessonId = lessonIdProp || params.lessonId || 'tones';
    const lesson = useMemo(() => (LESSONS[lessonId] || buildTonesLesson)(), [lessonId]);
    const beats = lesson.beats;

    const [messages, setMessages] = useState([]);
    const [beatIndex, setBeatIndex] = useState(0);
    const [awaiting, setAwaiting] = useState(null); // current interactive beat, or null
    const scrollRef = useRef(null);

    const pushTeacher = useCallback((text) => {
        setMessages(m => [...m, { id: `m${m.length}`, from: 'teacher', text }]);
    }, []);
    const pushStudent = useCallback((text) => {
        setMessages(m => [...m, { id: `m${m.length}`, from: 'student', text }]);
    }, []);
    const advance = useCallback(() => {
        setAwaiting(null);
        setBeatIndex(i => i + 1);
    }, []);

    const objectives = useMemo(() => lesson.objectives || [], [lesson]);

    // Suggested follow-up questions shown at the end of the lesson.
    const lessonHelps = useMemo(() => {
        if (lesson.helps?.length) return lesson.helps;
        const authored = beats.flatMap(b => b.helps || []);
        return authored.length ? authored : DEFAULT_HELPS;
    }, [lesson, beats]);

    // ── Free-text → /api/tutor (the LLM layer; degrades to a server fallback) ──
    const [busy, setBusy] = useState(false);
    const messagesRef = useRef([]);
    useEffect(() => { messagesRef.current = messages; }, [messages]);

    // Predefined help only (no open free text yet — we control the input).
    // `message` is one of our authored prompts; help taps never advance the lesson.
    const handleAsk = useCallback(async (message, displayText, help) => {
        if (busy || !message) return;
        pushStudent(displayText || message);
        setBusy(true);
        try {
            const recentTurns = messagesRef.current.slice(-6).map(m => ({ role: m.from, text: m.text }));
            const res = await fetch('/api/tutor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    message,
                    context: {
                        lessonTitle: lesson.title,
                        facts: lesson.facts || null,
                        objectives,
                        currentBeat: awaiting ? { type: awaiting.type, text: awaiting.text } : { type: 'chat' },
                        recentTurns,
                        help: help || null,
                    },
                }),
            });
            const data = await res.json();
            if (data.say) pushTeacher(data.say);
        } catch {
            pushTeacher('Hmm, let me try that again in a moment.');
        } finally {
            setBusy(false);
        }
    }, [busy, lessonId, lesson, objectives, awaiting, pushStudent, pushTeacher]);

    // Director: reveal each beat after a short pause so it lands like a text
    // message; auto-advance plain messages, pause on interactive ones.
    useEffect(() => {
        if (beatIndex >= beats.length) return undefined;
        const beat = beats[beatIndex];
        const timers = [];
        // Effect body only schedules timers; all setState happens in callbacks.
        timers.push(setTimeout(() => {
            setMessages(m => [...m, { id: `m${m.length}`, from: 'teacher', text: beat.text }]);
            if (beat.type === 'say') {
                timers.push(setTimeout(() => setBeatIndex(i => i + 1), 600));
            } else {
                setAwaiting(beat);
            }
        }, 700));
        return () => timers.forEach(clearTimeout);
    }, [beatIndex, beats]);

    // Keep the latest message in view.
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, awaiting]);

    return (
        <div className="teacher-chat">
            <header className="teacher-chat__header">
                <button className="teacher-chat__back" onClick={() => navigate(-1)} aria-label="Back">
                    <ArrowLeft size={22} />
                </button>
                <span className="teacher-chat__avatar" aria-hidden><BeKhe expression="idle" size={38} /></span>
                <div className="teacher-chat__who">
                    <span className="teacher-chat__name">{lesson.teacher.name}</span>
                    <span className="teacher-chat__sub">{lesson.title}</span>
                </div>
            </header>

            <div className="teacher-chat__scroll" ref={scrollRef}>
                {messages.map(msg => (
                    <div key={msg.id} className={`tc-row tc-row--${msg.from}`}>
                        <div className={`tc-bubble tc-bubble--${msg.from}`}>{formatText(msg.text)}</div>
                    </div>
                ))}
            </div>

            <div className="teacher-chat__dock">
                {awaiting?.type === 'done' ? (
                    <LessonEnd
                        helps={lessonHelps}
                        busy={busy}
                        onAsk={handleAsk}
                        next={lesson.next}
                        onNext={() => lesson.next && navigate(`/teach/${lesson.next.id}`)}
                        t={t}
                        onFinish={() => navigate(-1)}
                    />
                ) : (
                    awaiting && (
                        <Widget
                            beat={awaiting}
                            t={t}
                            onStudent={pushStudent}
                            onTeacher={pushTeacher}
                            onDone={advance}
                        />
                    )
                )}
            </div>
        </div>
    );
};

// ── Widgets ──────────────────────────────────────────────────────────────
function Widget({ beat, t, onStudent, onTeacher, onDone }) {
    if (beat.type === 'tone_explore') return <ToneExplore beat={beat} t={t} onDone={onDone} />;
    if (beat.type === 'tone_listen') return <ToneListen beat={beat} t={t} onStudent={onStudent} onTeacher={onTeacher} onDone={onDone} />;
    if (beat.type === 'cards') return <CardsExplore beat={beat} t={t} onDone={onDone} />;
    if (beat.type === 'listen_pick') return <ListenPick beat={beat} t={t} onStudent={onStudent} onTeacher={onTeacher} onDone={onDone} />;
    if (beat.type === 'mcq') return <Mcq beat={beat} t={t} onStudent={onStudent} onTeacher={onTeacher} onDone={onDone} />;
    if (beat.type === 'pronounce') return <PronounceCard beat={beat} t={t} onStudent={onStudent} onTeacher={onTeacher} onDone={onDone} />;
    return null;
}

// Pronunciation practice — record, score via Azure (/api/pronunciation), and
// turn the % into deterministic mastery evidence. Degrades gracefully if the
// mic or Azure is unavailable (never blocks progress).
function PronounceCard({ beat, t, onStudent, onTeacher, onEvidence, onDone }) {
    const target = beat.target;
    const listenSpeaking = useSpeakingState(target);
    const [isRecording, setIsRecording] = useState(false);
    const [isScoring, setIsScoring] = useState(false);
    const [score, setScore] = useState(null);
    const [attempted, setAttempted] = useState(false);
    const recorderRef = useRef(null);
    const scoringRef = useRef(false);

    // Score one recording — used by both manual stop and silence auto-stop.
    const scoreBlob = useCallback(async (blob) => {
        if (scoringRef.current) return;
        scoringRef.current = true;
        recorderRef.current = null;
        setIsRecording(false);
        setIsScoring(true);
        try {
            if (!blob || blob.size < 2000) {
                setAttempted(true);
                onStudent?.(`🎤 ${target}`);
                onTeacher?.('I didn’t catch any sound — check your mic is on, then try again.');
                return;
            }
            const res = await fetch(`/api/pronunciation?text=${encodeURIComponent(target)}`, {
                method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: blob,
            });
            const data = await res.json();
            setAttempted(true);
            onStudent?.(`🎤 ${target}`);
            const s = data.scores ? (data.scores.pronunciation ?? data.scores.accuracy ?? null) : null;
            if (s != null) {
                // Phoneme assessment (Azure-supported locales).
                const r = Math.round(s);
                setScore(r);
                onEvidence?.(beat.objective, s >= 80 ? 'strong' : s >= 60 ? 'partial' : 'none');
                onTeacher?.(s >= 80 ? `Tuyệt! ${r}% — spot on.` : s >= 60 ? `Good — ${r}%, a little crisper and it's perfect.` : `${r}% — listen again and copy the melody.`);
            } else if (data.status === 'Success' && data.recognized) {
                // Azure has no phoneme assessment for Vietnamese, but its ASR IS
                // tone-aware — so score by recognition match (right word + tone).
                const heard = normVi(data.recognized);
                const want = normVi(target);
                let ev; let pct; let msg;
                if (heard === want) {
                    ev = 'strong'; pct = 90; msg = `Tuyệt! I heard “${data.recognized}” — spot on.`;
                } else if (stripViTone(heard) === stripViTone(want)) {
                    ev = 'partial'; pct = 55; msg = `So close — the tone slid to “${data.recognized}”. Aim for “${target}”.`;
                } else {
                    ev = 'none'; pct = 30; msg = `Hmm, I heard “${data.recognized}”. Listen once more and try “${target}”.`;
                }
                onEvidence?.(beat.objective, ev);
                setScore(pct);
                onTeacher?.(msg);
            } else {
                onTeacher?.('Không sao — I couldn\'t quite catch that. Try once more, or tap continue.');
            }
        } catch (err) {
            console.warn('pronounce error', err.message);
            setAttempted(true);
            onTeacher?.('Mic trouble — try again or just tap continue.');
        } finally {
            setIsScoring(false);
            scoringRef.current = false;
        }
    }, [target, beat.objective, onStudent, onTeacher, onEvidence]);

    const handleMicTap = async () => {
        if (isScoring) return;
        if (isRecording) {
            const rec = recorderRef.current; // manual stop (early)
            if (rec) { const blob = await rec.stop(); if (blob) scoreBlob(blob); }
        } else {
            try {
                setScore(null);
                const rec = await startPCMRecording({
                    silenceMs: 2000,   // auto-stop ~2s after the learner stops speaking
                    maxMs: 8000,       // hard cap
                    onAutoStop: (blob) => scoreBlob(blob),
                });
                recorderRef.current = rec;
                setIsRecording(true);
            } catch (err) {
                console.warn('mic unavailable', err.message);
                setAttempted(true);
                onTeacher?.('Can’t reach your mic — tap continue to move on.');
            }
        }
    };

    return (
        <div className="tc-widget">
            <div className="tc-pronounce">
                <div className="tc-pronounce__target">
                    {target}{beat.en && <span className="tc-pronounce__en">{beat.en}</span>}
                </div>
                <div className="tc-pronounce__controls">
                    <button className="tc-replay" onClick={() => speak(target)}>
                        {isAudible(listenSpeaking) ? <SoundBars /> : <Volume2 size={18} />} Listen
                    </button>
                    <button className={`tc-mic ${isRecording ? 'tc-mic--rec' : ''}`} onClick={handleMicTap} disabled={isScoring}>
                        {isRecording ? <Square size={20} /> : <Mic size={22} />}
                        <span>{isScoring ? t('scene_scoring') : isRecording ? t('scene_recording_listening') : t('scene_speak_record')}</span>
                    </button>
                    {score != null && (
                        <div className="tc-pronounce__score" style={{ color: score >= 70 ? 'var(--success-color, #58cc02)' : 'var(--secondary-color, #1cb0f6)' }}>
                            {Math.round(score)}%
                        </div>
                    )}
                </div>
            </div>
            {attempted && (
                <button className="tc-primary-btn" onClick={onDone}>
                    {t('continue_upper')} <ChevronRight size={18} />
                </button>
            )}
        </div>
    );
}

// Predefined help options — controlled prompts only (no open free text yet).
// A beat may add its own deeper-dive questions via `beat.helps`.
const DEFAULT_HELPS = [
    { mode: 'explain', label: 'Explain more 💡', prompt: 'Explain the current step again, more simply.' },
    { mode: 'why', label: 'Why does this matter? 🤔', prompt: 'Why does this matter for speaking Vietnamese?' },
    { mode: 'example', label: 'Give an example ✍️', prompt: 'Give me one simple example for the current step.' },
];

function HelpChips({ helps, busy, onAsk }) {
    if (!helps?.length) return null;
    return (
        <div className="tc-helps" aria-label="Ask for help">
            {helps.slice(0, 4).map((h, i) => (
                <button key={i} className="tc-help" disabled={busy} onClick={() => onAsk(h.prompt, h.label, h.mode)}>
                    {h.label}
                </button>
            ))}
        </div>
    );
}

// End-of-lesson (Q&A mode): just the suggested follow-up questions + the CTA.
function LessonEnd({ helps, busy, onAsk, next, onNext, t, onFinish }) {
    return (
        <div className="tc-summary">
            {helps?.length > 0 && (
                <div className="tc-summary__ask">
                    <span className="tc-summary__ask-label">Curious about anything? Ask Bé Khế:</span>
                    <HelpChips helps={helps} busy={busy} onAsk={onAsk} />
                </div>
            )}
            {next ? (
                <>
                    <button className="tc-primary-btn" onClick={onNext}>
                        Next: {next.label} <ChevronRight size={18} />
                    </button>
                    <button className="tc-text-btn" onClick={onFinish}>Back to Study</button>
                </>
            ) : (
                <button className="tc-primary-btn" onClick={onFinish}>
                    <Sparkles size={18} /> {t('done')}
                </button>
            )}
        </div>
    );
}

function ToneChip({ tone, onTap, state, withSound }) {
    const speaking = useSpeakingState(tone.word?.vi);
    const active = withSound && isAudible(speaking);
    return (
        <button
            className={`tc-chip ${state ? `tc-chip--${state}` : ''}`}
            style={{ '--chip-color': tone.color }}
            onClick={onTap}
        >
            <span className="tc-chip__mark">{tone.mark}</span>
            <span className="tc-chip__name">{tone.name}</span>
            <span className="tc-chip__label">{tone.label}</span>
            {active && <SoundBars className="tc-chip__sound" />}
        </button>
    );
}

function ToneExplore({ beat, t, onDone }) {
    const [explored, setExplored] = useState(() => new Set());
    const tap = (tone) => {
        if (tone.word?.vi) speak(tone.word.vi);
        setExplored(prev => new Set(prev).add(tone.id));
    };
    return (
        <div className="tc-widget">
            <div className="tc-chip-grid">
                {beat.tones.map(tone => (
                    <ToneChip key={tone.id} tone={tone} onTap={() => tap(tone)} state={explored.has(tone.id) ? 'done' : ''} withSound />
                ))}
            </div>
            <button className="tc-primary-btn" disabled={explored.size < 1} onClick={onDone}>
                {t('continue_upper')} <ChevronRight size={18} />
            </button>
        </div>
    );
}

function Mcq({ beat, t, onStudent, onTeacher, onDone }) {
    const [picked, setPicked] = useState(null);
    const choose = (opt, idx) => {
        if (picked !== null) return;
        setPicked(idx);
        onStudent(opt.label);
        onTeacher(opt.correct ? beat.correctNote : beat.wrongNote);
    };
    return (
        <div className="tc-widget">
            <div className="tc-options">
                {beat.options.map((opt, idx) => {
                    let state = '';
                    if (picked !== null) {
                        if (opt.correct) state = 'correct';
                        else if (idx === picked) state = 'wrong';
                    }
                    return (
                        <button key={idx} className={`tc-option ${state ? `tc-option--${state}` : ''}`} onClick={() => choose(opt, idx)} disabled={picked !== null}>
                            <span>{opt.label}</span>
                            {state === 'correct' && <Check size={18} />}
                            {state === 'wrong' && <X size={18} />}
                        </button>
                    );
                })}
            </div>
            {picked !== null && (
                <button className="tc-primary-btn" onClick={onDone}>
                    {t('continue_upper')} <ChevronRight size={18} />
                </button>
            )}
        </div>
    );
}

function ToneListen({ beat, t, onStudent, onTeacher, onDone }) {
    const target = beat.tones.find(x => x.id === beat.targetToneId) || beat.tones[0];
    const [picked, setPicked] = useState(null);
    const speaking = useSpeakingState(target.word?.vi);
    const play = useCallback(() => { if (target.word?.vi) speak(target.word.vi); }, [target]);

    useEffect(() => { const id = setTimeout(play, 350); return () => clearTimeout(id); }, [play]);

    const choose = (tone) => {
        if (picked !== null) return;
        setPicked(tone.id);
        onStudent(tone.name);
        const ok = tone.id === target.id;
        onTeacher(ok
            ? `Chính xác! ✅ That was ${target.name} — “${target.word?.vi}” (${target.word?.en}).`
            : `Close! That one was ${target.name} — “${target.word?.vi}”. Keep listening, your ear is training. 💪`);
    };

    return (
        <div className="tc-widget">
            <button className="tc-replay" onClick={play}>
                {isAudible(speaking) ? <SoundBars /> : <Volume2 size={18} />} Play again <RotateCcw size={15} />
            </button>
            <div className="tc-chip-grid">
                {beat.tones.map(tone => {
                    let state = '';
                    if (picked !== null) {
                        if (tone.id === target.id) state = 'correct';
                        else if (tone.id === picked) state = 'wrong';
                    }
                    return <ToneChip key={tone.id} tone={tone} onTap={() => choose(tone)} state={state} />;
                })}
            </div>
            {picked !== null && (
                <button className="tc-primary-btn" onClick={onDone}>
                    {t('continue_upper')} <ChevronRight size={18} />
                </button>
            )}
        </div>
    );
}

// ── Generic vocab widgets (reused across non-tone lessons) ────────────────
function VocabCard({ item, onTap, state, withSound }) {
    const speaking = useSpeakingState(item.vi);
    const active = withSound && isAudible(speaking);
    return (
        <button className={`tc-card ${state ? `tc-card--${state}` : ''}`} onClick={onTap}>
            <span className="tc-card__emoji" aria-hidden>{item.emoji || '💬'}</span>
            <span className="tc-card__vi">{item.vi}</span>
            <span className="tc-card__en">{item.en}</span>
            {active && <SoundBars className="tc-card__sound" />}
        </button>
    );
}

function CardsExplore({ beat, t, onDone }) {
    const [explored, setExplored] = useState(() => new Set());
    const tap = (item, i) => {
        if (item.vi) speak(item.vi);
        setExplored(prev => new Set(prev).add(i));
    };
    return (
        <div className="tc-widget">
            <div className="tc-card-grid">
                {beat.items.map((item, i) => (
                    <VocabCard key={i} item={item} state={explored.has(i) ? 'done' : ''} onTap={() => tap(item, i)} withSound />
                ))}
            </div>
            <button className="tc-primary-btn" disabled={explored.size < 1} onClick={onDone}>
                {t('continue_upper')} <ChevronRight size={18} />
            </button>
        </div>
    );
}

function ListenPick({ beat, t, onStudent, onTeacher, onDone }) {
    const targetIndex = beat.targetIndex ?? 0;
    const target = beat.items[targetIndex] || beat.items[0];
    const [picked, setPicked] = useState(null);
    const speaking = useSpeakingState(target.vi);
    const play = useCallback(() => { if (target.vi) speak(target.vi); }, [target]);

    useEffect(() => { const id = setTimeout(play, 350); return () => clearTimeout(id); }, [play]);

    const choose = (item, i) => {
        if (picked !== null) return;
        setPicked(i);
        onStudent(item.vi);
        onTeacher(i === targetIndex
            ? `Chính xác! ✅ “${target.vi}” means ${target.en}.`
            : `Not quite — that was “${target.vi}” (${target.en}). Your ear is training. 💪`);
    };

    return (
        <div className="tc-widget">
            <button className="tc-replay" onClick={play}>
                {isAudible(speaking) ? <SoundBars /> : <Volume2 size={18} />} Play again <RotateCcw size={15} />
            </button>
            <div className="tc-card-grid">
                {beat.items.map((item, i) => {
                    let state = '';
                    if (picked !== null) {
                        if (i === targetIndex) state = 'correct';
                        else if (i === picked) state = 'wrong';
                    }
                    return <VocabCard key={i} item={item} state={state} onTap={() => choose(item, i)} />;
                })}
            </div>
            {picked !== null && (
                <button className="tc-primary-btn" onClick={onDone}>
                    {t('continue_upper')} <ChevronRight size={18} />
                </button>
            )}
        </div>
    );
}

export default TeacherChat;
