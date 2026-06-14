import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Volume2, Check, X, ChevronRight, RotateCcw, Sparkles, Send } from 'lucide-react';
import speak from '../../utils/speak';
import { useT } from '../../lib/i18n';
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

// Lessons are keyed by id. Add a builder here + an authored script file to
// ship a new teacher lesson — the shell, director and widgets are shared.
const LESSONS = { tones: buildTonesLesson, greetings: buildGreetingsLesson };

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
    const [revealedUpTo, setRevealedUpTo] = useState(-1);
    const scrollRef = useRef(null);

    // Typing indicator is derived, not stored — avoids setState in the effect.
    const isTyping = beatIndex < beats.length && revealedUpTo < beatIndex && !awaiting;

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

    // ── Mastery (deterministic) ──
    const objectives = useMemo(() => lesson.objectives || [], [lesson]);
    const [mastery, setMastery] = useState({}); // objId -> evidence scores []
    const recordEvidence = useCallback((objId, evidence) => {
        if (!objId) return;
        const val = evidence === 'strong' ? 1 : evidence === 'partial' ? 0.6 : 0;
        setMastery(prev => ({ ...prev, [objId]: [...(prev[objId] || []), val] }));
    }, []);
    const scores = useMemo(() => {
        const out = {};
        objectives.forEach(o => {
            const arr = mastery[o.id] || [];
            out[o.id] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        });
        return out;
    }, [mastery, objectives]);
    const overall = objectives.length
        ? Math.round(100 * objectives.reduce((s, o) => s + (scores[o.id] || 0), 0) / objectives.length)
        : 0;

    // ── Free-text → /api/tutor (the LLM layer; degrades to a server fallback) ──
    const [busy, setBusy] = useState(false);
    const messagesRef = useRef([]);
    useEffect(() => { messagesRef.current = messages; }, [messages]);

    const handleTutorMessage = useCallback(async (text) => {
        const trimmed = (text || '').trim();
        if (!trimmed || busy) return;
        pushStudent(trimmed);
        setBusy(true);
        try {
            const recentTurns = messagesRef.current.slice(-6).map(m => ({ role: m.from, text: m.text }));
            const res = await fetch('/api/tutor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    message: trimmed,
                    context: {
                        lessonTitle: lesson.title,
                        objectives,
                        objectiveStates: scores,
                        currentBeat: awaiting ? { type: awaiting.type, text: awaiting.text } : { type: 'chat' },
                        recentTurns,
                    },
                }),
            });
            const data = await res.json();
            if (data.say) pushTeacher(data.say);
            if (data.action === 'advance' && awaiting && awaiting.type !== 'done') advance();
        } catch {
            pushTeacher('Hmm, I had trouble hearing you — try again? 🙂');
        } finally {
            setBusy(false);
        }
    }, [busy, lessonId, lesson, objectives, scores, awaiting, advance, pushStudent, pushTeacher]);

    // Director: reveal each beat with a "typing" pause; auto-advance plain
    // messages, pause on interactive ones until the widget reports back.
    useEffect(() => {
        if (beatIndex >= beats.length) return undefined;
        const beat = beats[beatIndex];
        const timers = [];
        // Effect body only schedules timers; all setState happens in callbacks.
        // Deps are [beatIndex, beats] only — revealedUpTo must NOT re-run this
        // effect, or its update would clear the pending auto-advance timer.
        timers.push(setTimeout(() => {
            setMessages(m => [...m, { id: `m${m.length}`, from: 'teacher', text: beat.text }]);
            setRevealedUpTo(beatIndex);
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
    }, [messages, isTyping, awaiting]);

    return (
        <div className="teacher-chat">
            <header className="teacher-chat__header">
                <button className="teacher-chat__back" onClick={() => navigate(-1)} aria-label="Back">
                    <ArrowLeft size={22} />
                </button>
                <span className="teacher-chat__avatar" aria-hidden>{lesson.teacher.emoji}</span>
                <div className="teacher-chat__who">
                    <span className="teacher-chat__name">{lesson.teacher.name}</span>
                    <span className="teacher-chat__sub">{lesson.title}</span>
                </div>
            </header>

            <div className="teacher-chat__scroll" ref={scrollRef}>
                {messages.map(msg => (
                    <div key={msg.id} className={`tc-row tc-row--${msg.from}`}>
                        {msg.from === 'teacher' && <span className="tc-row__avatar" aria-hidden>{lesson.teacher.emoji}</span>}
                        <div className={`tc-bubble tc-bubble--${msg.from}`}>{formatText(msg.text)}</div>
                    </div>
                ))}
                {(isTyping || busy) && (
                    <div className="tc-row tc-row--teacher">
                        <span className="tc-row__avatar" aria-hidden>{lesson.teacher.emoji}</span>
                        <div className="tc-bubble tc-bubble--teacher tc-typing"><span /><span /><span /></div>
                    </div>
                )}
            </div>

            <div className="teacher-chat__dock">
                {awaiting?.type === 'done' ? (
                    <ScoreSummary objectives={objectives} scores={scores} overall={overall} t={t} onFinish={() => navigate(-1)} />
                ) : (
                    <>
                        {awaiting && (
                            <Widget
                                beat={awaiting}
                                t={t}
                                onStudent={pushStudent}
                                onTeacher={pushTeacher}
                                onEvidence={recordEvidence}
                                onDone={advance}
                            />
                        )}
                        <TutorInput onSend={handleTutorMessage} busy={busy} />
                    </>
                )}
            </div>
        </div>
    );
};

// ── Widgets ──────────────────────────────────────────────────────────────
function Widget({ beat, t, onStudent, onTeacher, onEvidence, onDone }) {
    if (beat.type === 'tone_explore') return <ToneExplore beat={beat} t={t} onDone={onDone} />;
    if (beat.type === 'tone_listen') return <ToneListen beat={beat} t={t} onStudent={onStudent} onTeacher={onTeacher} onEvidence={onEvidence} onDone={onDone} />;
    if (beat.type === 'cards') return <CardsExplore beat={beat} t={t} onDone={onDone} />;
    if (beat.type === 'listen_pick') return <ListenPick beat={beat} t={t} onStudent={onStudent} onTeacher={onTeacher} onEvidence={onEvidence} onDone={onDone} />;
    if (beat.type === 'mcq') return <Mcq beat={beat} t={t} onStudent={onStudent} onTeacher={onTeacher} onEvidence={onEvidence} onDone={onDone} />;
    return null;
}

// Free-text input → the AI tutor. Always available except on the score screen.
function TutorInput({ onSend, busy }) {
    const [val, setVal] = useState('');
    const submit = (e) => {
        e.preventDefault();
        if (!val.trim() || busy) return;
        onSend(val);
        setVal('');
    };
    return (
        <form className="tc-input" onSubmit={submit}>
            <input
                value={val}
                onChange={e => setVal(e.target.value)}
                placeholder="Ask Cô Mai anything…"
                disabled={busy}
                aria-label="Message the teacher"
            />
            <button type="submit" disabled={busy || !val.trim()} aria-label="Send">
                <Send size={18} />
            </button>
        </form>
    );
}

// Deterministic score screen — the LLM never sets this.
function ScoreSummary({ objectives, scores, overall, t, onFinish }) {
    return (
        <div className="tc-summary">
            <div className="tc-score" style={{ '--pct': overall }}>
                <span className="tc-score__num">{overall}</span><span className="tc-score__pct">%</span>
            </div>
            <ul className="tc-obj-list">
                {objectives.map(o => {
                    const got = (scores[o.id] || 0) >= o.threshold;
                    return (
                        <li key={o.id} className={got ? 'got' : 'review'}>
                            {got ? <Check size={16} /> : <RotateCcw size={16} />} {o.text}
                        </li>
                    );
                })}
            </ul>
            <button className="tc-primary-btn" onClick={onFinish}>
                <Sparkles size={18} /> {t('done')}
            </button>
        </div>
    );
}

function ToneChip({ tone, onTap, state }) {
    return (
        <button
            className={`tc-chip ${state ? `tc-chip--${state}` : ''}`}
            style={{ '--chip-color': tone.color }}
            onClick={onTap}
        >
            <span className="tc-chip__mark">{tone.mark}</span>
            <span className="tc-chip__name">{tone.name}</span>
            <span className="tc-chip__label">{tone.label}</span>
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
                    <ToneChip key={tone.id} tone={tone} onTap={() => tap(tone)} state={explored.has(tone.id) ? 'done' : ''} />
                ))}
            </div>
            <button className="tc-primary-btn" disabled={explored.size < 1} onClick={onDone}>
                {t('continue_upper')} <ChevronRight size={18} />
            </button>
        </div>
    );
}

function Mcq({ beat, t, onStudent, onTeacher, onEvidence, onDone }) {
    const [picked, setPicked] = useState(null);
    const choose = (opt, idx) => {
        if (picked !== null) return;
        setPicked(idx);
        onStudent(opt.label);
        onTeacher(opt.correct ? beat.correctNote : beat.wrongNote);
        onEvidence?.(beat.objective, opt.correct ? 'strong' : 'none');
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

function ToneListen({ beat, t, onStudent, onTeacher, onEvidence, onDone }) {
    const target = beat.tones.find(x => x.id === beat.targetToneId) || beat.tones[0];
    const [picked, setPicked] = useState(null);
    const play = useCallback(() => { if (target.word?.vi) speak(target.word.vi); }, [target]);

    useEffect(() => { const id = setTimeout(play, 350); return () => clearTimeout(id); }, [play]);

    const choose = (tone) => {
        if (picked !== null) return;
        setPicked(tone.id);
        onStudent(tone.name);
        const ok = tone.id === target.id;
        onEvidence?.(beat.objective, ok ? 'strong' : 'none');
        onTeacher(ok
            ? `Chính xác! ✅ That was ${target.name} — “${target.word?.vi}” (${target.word?.en}).`
            : `Close! That one was ${target.name} — “${target.word?.vi}”. Keep listening, your ear is training. 💪`);
    };

    return (
        <div className="tc-widget">
            <button className="tc-replay" onClick={play}>
                <Volume2 size={18} /> Play again <RotateCcw size={15} />
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
function VocabCard({ item, onTap, state }) {
    return (
        <button className={`tc-card ${state ? `tc-card--${state}` : ''}`} onClick={onTap}>
            <span className="tc-card__emoji" aria-hidden>{item.emoji || '💬'}</span>
            <span className="tc-card__vi">{item.vi}</span>
            <span className="tc-card__en">{item.en}</span>
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
                    <VocabCard key={i} item={item} state={explored.has(i) ? 'done' : ''} onTap={() => tap(item, i)} />
                ))}
            </div>
            <button className="tc-primary-btn" disabled={explored.size < 1} onClick={onDone}>
                {t('continue_upper')} <ChevronRight size={18} />
            </button>
        </div>
    );
}

function ListenPick({ beat, t, onStudent, onTeacher, onEvidence, onDone }) {
    const targetIndex = beat.targetIndex ?? 0;
    const target = beat.items[targetIndex] || beat.items[0];
    const [picked, setPicked] = useState(null);
    const play = useCallback(() => { if (target.vi) speak(target.vi); }, [target]);

    useEffect(() => { const id = setTimeout(play, 350); return () => clearTimeout(id); }, [play]);

    const choose = (item, i) => {
        if (picked !== null) return;
        setPicked(i);
        onStudent(item.vi);
        onEvidence?.(beat.objective, i === targetIndex ? 'strong' : 'none');
        onTeacher(i === targetIndex
            ? `Chính xác! ✅ “${target.vi}” means ${target.en}.`
            : `Not quite — that was “${target.vi}” (${target.en}). Your ear is training. 💪`);
    };

    return (
        <div className="tc-widget">
            <button className="tc-replay" onClick={play}>
                <Volume2 size={18} /> Play again <RotateCcw size={15} />
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
