import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Volume2, Blocks, AlertTriangle, RotateCcw, Lightbulb } from 'lucide-react';
import { SLOTS, BY_ROLE, TONES, findBlock } from '../../data/spellingBlocks';
import { compose, validate, placementBlock, slotHasViolation, isSpeakable, applyPick } from '../../lib/spellingRules';
import { playSequence, stopSpell } from '../../lib/spellAudio';
import { spellInitialKey, spellSlug, spellToneKey } from '../../lib/spellSlug';
import './Spell.css';

const EMPTY = { initial: null, glide: null, nucleus: null, final: null, tone: 'ngang' };

const STRUCTURAL = ['initial', 'glide', 'nucleus', 'final'];
const presentParts = (state) => STRUCTURAL.filter((r) => state[r]);

// Build the đánh-vần spell-out chain. Each segment carries `parts` — the word
// pieces it voices — so the display can karaoke-highlight along with the audio.
function danhVanSegments(state) {
    const base = compose({ ...state, tone: 'ngang' });
    const full = compose(state);
    if (!full) return [];
    const all = presentParts(state);
    const rhyme = `${state.glide || ''}${state.nucleus || ''}${state.final || ''}`;
    const rhymeParts = ['glide', 'nucleus', 'final'].filter((r) => state[r]);
    const tone = findBlock('tone', state.tone);
    const segs = [];
    if (state.initial) segs.push({ key: spellInitialKey(state.initial), text: findBlock('initial', state.initial)?.name || state.initial, parts: ['initial'] });
    segs.push({ key: spellSlug(rhyme), text: rhyme, parts: rhymeParts });
    segs.push({ key: spellSlug(base), text: base, parts: all });
    if (state.tone && state.tone !== 'ngang') segs.push({ key: spellToneKey(state.tone), text: tone?.name || '', parts: ['nucleus'] });
    segs.push({ key: spellSlug(full), text: full, parts: all });
    // drop empties, dedupe consecutive identical text
    return segs
        .filter((s) => s.text)
        .filter((s, i, a) => s.text !== a[i - 1]?.text)
        .map((s) => ({ key: s.key, text: s.text, parts: s.parts }));
}

// A slot is "usable" if it can take at least one legal piece right now
// (nucleus/tone always can).
const slotUsableFor = (st, role) =>
    role === 'nucleus' || role === 'tone'
        ? true
        : (BY_ROLE[role] || []).some((b) => !placementBlock(st, role, b.id));

// The build order the flow follows: initial → vowel → coda (âm đầu → âm chính →
// âm cuối). GLIDE (âm đệm) and TONE are excluded from the walk — the glide is an
// opt-in chip, and the tone lives in an always-visible bar so you can tone the
// syllable at any point. Returns the next slot AFTER `from`, or null when done.
const BUILD_SEQUENCE = ['initial', 'nucleus', 'final'];
// …but they still have a place in the order, so focusing one doesn't send the
// walk back to the start: the glide sits after the initial, the tone last.
const OFF_SEQUENCE_AT = { glide: 0, tone: BUILD_SEQUENCE.length - 1 };
const nextAfter = (from, st) => {
    const i = BUILD_SEQUENCE.indexOf(from) >= 0 ? BUILD_SEQUENCE.indexOf(from) : (OFF_SEQUENCE_AT[from] ?? -1);
    for (let j = i + 1; j < BUILD_SEQUENCE.length; j++) {
        if (slotUsableFor(st, BUILD_SEQUENCE[j])) return BUILD_SEQUENCE[j];
    }
    return null;
};

export default function SpellPlayground() {
    const navigate = useNavigate();
    const [state, setState] = useState(EMPTY);
    const [active, setActive] = useState('initial');
    const [readMode, setReadMode] = useState('blend'); // 'blend' | 'danhvan'
    // Southern (azure-south) is disabled for now — it's slow and it's globally
    // off anyway; re-enable accents once the local HF voices are wired.
    const accent = 'north';
    const [shakeId, setShakeId] = useState(null);
    const [reason, setReason] = useState(null);
    const [coach, setCoach] = useState(null); // teaching note after an auto-correction
    const [playingParts, setPlayingParts] = useState(null); // Set of parts being voiced, or null when idle

    const violations = useMemo(() => validate(state), [state]);
    const speakable = isSpeakable(state);
    const usable = useMemo(() => {
        const u = {};
        for (const s of SLOTS) u[s.role] = slotUsableFor(state, s.role);
        return u;
    }, [state]);
    const footerTarget = nextAfter(active, state);

    // Highlight the part of the word for the active slot; fade the rest. The tone
    // mark lives on the nucleus, so the tone step highlights the vowel.
    const activePart = active === 'tone' ? 'nucleus' : active;
    const activePresent = Boolean(state[activePart]);
    const partClass = (role) => {
        const base = `r-${role}`;
        // 1) audio pronouncing → karaoke: underline the spoken part, fade the rest
        if (playingParts) return `${base} ${playingParts.has(role) ? 'part-on' : 'part-off'}`;
        // 2) complete real word → whole word highlighted, nothing faded
        if (speakable) return base;
        // 3) still building → spotlight the slot you're on
        return `${base}${activePresent ? (role === activePart ? ' part-on' : ' part-off') : ''}`;
    };
    const hasAnyPart = Boolean(state.initial || state.glide || state.nucleus || state.final);

    const say = (s) => {
        if (!isSpeakable(s)) { setPlayingParts(null); return; } // never voice a non-word
        const all = presentParts(s);
        const segs = readMode === 'danhvan'
            ? danhVanSegments(s)
            : [{ key: spellSlug(compose(s)), text: compose(s), parts: all }];
        playSequence(segs, {
            accent,
            gap: readMode === 'danhvan' ? 140 : 90,
            onSegment: (seg) => setPlayingParts(new Set(seg.parts || all)),
            onEnd: () => setPlayingParts(null),
        });
    };

    const pick = (role, id) => {
        const block = placementBlock(state, role, id);
        if (block) {
            // illegal — refuse to snap, explain why
            setShakeId(`${role}:${id}`);
            setReason(block);
            setTimeout(() => setShakeId(null), 340);
            return;
        }
        setReason(null);
        setCoach(null);
        // toggle off if re-tapping the same non-tone block; taking q back out
        // takes its u with it
        let next;
        if (role !== 'tone' && state[role] === id) {
            next = { ...state, [role]: null };
            if (role === 'initial' && id === 'q') next.glide = null;
        } else {
            // applyPick carries the auto-corrections — the c/k · g/gh · ng/ngh
            // initial, the o/u glide, q's u, and a tone a stopping final can't
            // hold — plus the note that teaches each one.
            const picked = applyPick(state, role, id);
            next = picked.state;
            if (picked.note) setCoach(picked.note);
        }
        setState(next);
        // advance along the structural build order; tone/glide don't move focus
        if (next[role] && BUILD_SEQUENCE.includes(role)) {
            const n = nextAfter(role, next);
            if (n) setActive(n);
        }
        say(next);
    };

    const reset = () => {
        stopSpell();
        setPlayingParts(null);
        setState(EMPTY);
        setActive('initial');
        setReason(null);
        setCoach(null);
    };

    // Tap a slot to focus it; tap the already-focused, filled slot to clear it.
    const handleSlot = (role) => {
        setReason(null);
        setCoach(null);
        // the tone has its own bar; only structural slots reach here
        if (active === role && state[role]) {
            setState((s) => ({ ...s, [role]: null }));
        } else {
            setActive(role);
            if (!slotUsableFor(state, role)) {
                const label = (SLOTS.find((s) => s.role === role)?.label_en || '').toLowerCase();
                setReason(`This syllable has no ${label} — skip it.`);
            }
        }
    };

    const activeSlot = SLOTS.find((s) => s.role === active) || SLOTS[2];
    const options = BY_ROLE[active] || [];

    return (
        <div className="spell-screen">
            <header className="spell-header">
                <button className="spell-back" onClick={() => navigate('/')} aria-label="Back">
                    <ArrowLeft size={20} />
                </button>
                <div className="spell-title">
                    <h1>Ghép vần · Spell it</h1>
                    <p>Snap the pieces. Some fit, some refuse — that’s the rule.</p>
                </div>
                <button className="spell-back" onClick={reset} aria-label="Reset">
                    <RotateCcw size={18} />
                </button>
            </header>

            <div className="spell-header" style={{ paddingTop: 0, gap: 8 }}>
                <div className="spell-seg" role="tablist" aria-label="Read mode">
                    <button className={readMode === 'blend' ? 'on' : ''} onClick={() => setReadMode('blend')}>Blend</button>
                    <button className={readMode === 'danhvan' ? 'on' : ''} onClick={() => setReadMode('danhvan')}>Đánh vần</button>
                </div>
            </div>

            {/* the composed syllable */}
            <div className="spell-stage">
                {hasAnyPart ? (
                    <div className="spell-word" aria-live="polite">
                        {state.initial && <span className={partClass('initial')}>{state.initial}</span>}
                        {state.glide && <span className={partClass('glide')}>{state.glide}</span>}
                        {state.nucleus
                            ? <span className={partClass('nucleus')}>{compose({ ...EMPTY, nucleus: state.nucleus, tone: state.tone })}</span>
                            : <span className="r-nucleus spell-ph">◦</span>}
                        {state.final && <span className={partClass('final')}>{state.final}</span>}
                    </div>
                ) : (
                    <div className="spell-empty">Tap the first sound below to begin →</div>
                )}
                {hasAnyPart && !violations.length && !speakable && !footerTarget && (
                    <div className="spell-note">chưa phải từ có thật · not a real Vietnamese word</div>
                )}
                <div className="spell-actions">
                    <button className="spell-play primary" disabled={!speakable} onClick={() => say(state)}>
                        <Volume2 size={16} /> {readMode === 'danhvan' ? 'Đánh vần' : 'Nghe'}
                    </button>
                </div>
            </div>

            {/* slot rack — tone lives in the wheel below, not here */}
            <div className="spell-rack">
                {SLOTS.filter((slot) => slot.role !== 'tone').map((slot) => {
                    const val = state[slot.role];
                    const filled = Boolean(val);
                    const bad = slotHasViolation(violations, slot.role);
                    const na = !filled && !usable[slot.role]; // optional slot with nothing legal to place
                    const glyph = na ? '·' : (val || '—');
                    return (
                        <div
                            key={slot.role}
                            className={`spell-slot r-${slot.role} ${active === slot.role ? 'active' : ''} ${filled ? 'filled' : ''} ${bad ? 'bad' : ''} ${na ? 'na' : ''}`}
                            onClick={() => handleSlot(slot.role)}
                        >
                            <span className="slot-label">{slot.label_en}</span>
                            <span className={`slot-val ${filled ? '' : 'empty'}`}>{glyph}</span>
                        </div>
                    );
                })}
            </div>

            {reason && (
                <div className="spell-reason">
                    <AlertTriangle size={16} />
                    <span>{reason}</span>
                </div>
            )}

            {coach && (
                <div className="spell-coach">
                    <Lightbulb size={16} />
                    <span>{coach}</span>
                </div>
            )}

            {/* palette for the active slot */}
            <div className="spell-palette-wrap">
                <div className="spell-palette-head">
                    <strong>{activeSlot.label_en}</strong>
                    <span>{activeSlot.label_vi}{activeSlot.optional ? ' · optional' : ''}</span>
                </div>
                <div className={`spell-grid r-${active}`}>
                    {options.map((b) => {
                        const id = b.id;
                        const selected = state[active] === id;
                        const block = placementBlock(state, active, id);
                        const disabled = Boolean(block);
                        const shaking = shakeId === `${active}:${id}`;
                        const glyph = id;
                        return (
                            <button
                                key={id}
                                className={`spell-block ${selected ? 'sel' : ''} ${disabled ? 'disabled' : ''} ${shaking ? 'shake' : ''}`}
                                onClick={() => pick(active, id)}
                                title={disabled ? block : b.hint}
                            >
                                <span className="b-glyph">{glyph}</span>
                                <span className="b-name">{b.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* tone — always visible once there's a vowel, so you can tone the
                syllable at any point without touching the (optional) final */}
            {state.nucleus && (
                <div className="spell-tonebar">
                    <div className="spell-tonebar-label">Thanh <span>· tone — tap anytime</span></div>
                    {findBlock('final', state.final)?.stops && (
                        <div className="spell-tonebar-teach">
                            <Lightbulb size={14} />
                            <span>Ends in “{state.final}” — a stopped syllable takes only sắc (´) or nặng (.).</span>
                        </div>
                    )}
                    <div className="spell-grid r-tone">
                        {TONES.map((t) => {
                            const disabled = Boolean(placementBlock(state, 'tone', t.id));
                            const selected = (state.tone || 'ngang') === t.id && !disabled;
                            const shaking = shakeId === `tone:${t.id}`;
                            return (
                                <button
                                    key={t.id}
                                    className={`spell-block ${selected ? 'sel' : ''} ${disabled ? 'disabled' : ''} ${shaking ? 'shake' : ''}`}
                                    onClick={() => pick('tone', t.id)}
                                    title={disabled ? 'No real word has this tone' : t.hint}
                                >
                                    <span className="b-glyph">{compose({ ...state, tone: t.id })}</span>
                                    <span className="b-name">{t.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* guided next-step button — walks the machine, skips slots that don't apply */}
            <div className="spell-footer">
                {footerTarget ? (
                    <button className="spell-next" onClick={() => { setActive(footerTarget); setReason(null); }}>
                        Next: {SLOTS.find((s) => s.role === footerTarget)?.label_en} <ArrowRight size={18} />
                    </button>
                ) : (
                    <button className="spell-next done" disabled={!speakable} onClick={() => say(state)}>
                        <Volume2 size={18} /> {speakable ? 'Nghe' : 'Done'}
                    </button>
                )}
            </div>
        </div>
    );
}
