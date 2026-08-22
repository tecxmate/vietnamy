import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Volume2, Blocks, AlertTriangle, RotateCcw, Lightbulb } from 'lucide-react';
import { SLOTS, BY_ROLE, TONES, findBlock } from '../../data/spellingBlocks';
import { compose, validate, placementBlock, slotHasViolation, isSpeakable, applyPick, writtenInitial } from '../../lib/spellingRules';
import { playSequence, stopSpell } from '../../lib/spellAudio';
import { spellInitialKey, spellSlug, spellToneKey } from '../../lib/spellSlug';
import { useT } from '../../lib/i18n';
import './Spell.css';

const EMPTY = { initial: null, glide: null, nucleus: null, final: null, tone: 'ngang' };

// Slot names are shown constantly (rack, palette head, the Next button), so they
// come from i18n rather than spellingBlocks' label_en. The Vietnamese label_vi
// stays as-is — it's the term the learner is here to learn.
const SLOT_LABEL_KEY = {
    initial: 'spell_slot_initial',
    glide: 'spell_slot_glide',
    nucleus: 'spell_slot_vowel',
    final: 'spell_slot_final',
    tone: 'spell_slot_tone',
};

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
    const t = useT();
    const slotLabel = (role) => t(SLOT_LABEL_KEY[role] || '');
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
    const [audioFailed, setAudioFailed] = useState(false); // neither /api/tts nor the device voice could speak

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
        setAudioFailed(false);
        playSequence(segs, {
            accent,
            gap: readMode === 'danhvan' ? 140 : 90,
            onSegment: (seg) => setPlayingParts(new Set(seg.parts || all)),
            onEnd: () => setPlayingParts(null),
            onFail: () => setAudioFailed(true),
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
                setReason(t('spell_slot_na').replace('{slot}', slotLabel(role).toLowerCase()));
            }
        }
    };

    const activeSlot = SLOTS.find((s) => s.role === active) || SLOTS[2];
    const options = BY_ROLE[active] || [];

    return (
        <div className="spell-screen">
            <header className="spell-header">
                <button className="spell-back" onClick={() => navigate('/')} aria-label={t('spell_back')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="spell-title">
                    <h1>{t('spell_title')}</h1>
                </div>
                <button className="spell-back" onClick={reset} aria-label={t('spell_reset')}>
                    <RotateCcw size={18} />
                </button>
            </header>

            {/* the composed syllable */}
            <div className="spell-stage">
                {hasAnyPart ? (
                    <div className="spell-word" aria-live="polite">
                        {state.initial && <span className={partClass('initial')}>{writtenInitial(state.initial, state.nucleus)}</span>}
                        {state.glide && <span className={partClass('glide')}>{state.glide}</span>}
                        {state.nucleus
                            ? <span className={partClass('nucleus')}>{compose({ ...EMPTY, nucleus: state.nucleus, tone: state.tone })}</span>
                            : <span className="r-nucleus spell-ph">◦</span>}
                        {state.final && <span className={partClass('final')}>{state.final}</span>}
                    </div>
                ) : (
                    <div className="spell-empty">{t('spell_empty')}</div>
                )}
                {hasAnyPart && !violations.length && !speakable && !footerTarget && (
                    <div className="spell-note">{t('spell_not_word')}</div>
                )}
                {audioFailed && (
                    <div className="spell-note spell-note-warn">{t('spell_audio_fail')}</div>
                )}
                {/* how to read it, and a replay — paired, since the mode is what
                    the play button does */}
                <div className="spell-actions">
                    <div className="spell-seg" role="tablist" aria-label={t('spell_read_mode')}>
                        <button className={readMode === 'blend' ? 'on' : ''} onClick={() => setReadMode('blend')}>{t('spell_mode_blend')}</button>
                        <button className={readMode === 'danhvan' ? 'on' : ''} onClick={() => setReadMode('danhvan')}>Đánh vần</button>
                    </div>
                    <button
                        className="spell-play primary"
                        disabled={!speakable}
                        onClick={() => say(state)}
                        aria-label={readMode === 'danhvan' ? 'Đánh vần' : t('spell_listen')}
                    >
                        <Volume2 size={18} />
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
                            <span className="slot-label">{slotLabel(slot.role)}</span>
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
                    <strong>{slotLabel(activeSlot.role)}</strong>
                    <span>{activeSlot.label_vi}{activeSlot.optional ? ` · ${t('spell_optional')}` : ''}</span>
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
                    <div className="spell-tonebar-label">Thanh <span>· {t('spell_tone_label')}</span></div>
                    {findBlock('final', state.final)?.stops && (
                        <div className="spell-tonebar-teach">
                            <Lightbulb size={14} />
                            <span>{t('spell_tone_stopped').replace('{final}', state.final)}</span>
                        </div>
                    )}
                    <div className="spell-grid r-tone">
                        {TONES.map((tone) => {
                            const disabled = Boolean(placementBlock(state, 'tone', tone.id));
                            const selected = (state.tone || 'ngang') === tone.id && !disabled;
                            const shaking = shakeId === `tone:${tone.id}`;
                            return (
                                <button
                                    key={tone.id}
                                    className={`spell-block ${selected ? 'sel' : ''} ${disabled ? 'disabled' : ''} ${shaking ? 'shake' : ''}`}
                                    onClick={() => pick('tone', tone.id)}
                                    title={disabled ? t('spell_tone_impossible') : tone.hint}
                                >
                                    <span className="b-glyph">{compose({ ...state, tone: tone.id })}</span>
                                    <span className="b-name">{tone.name}</span>
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
                        {t('spell_next').replace('{slot}', slotLabel(footerTarget))} <ArrowRight size={18} />
                    </button>
                ) : (
                    <button className="spell-next done" disabled={!speakable} onClick={() => say(state)}>
                        <Volume2 size={18} /> {speakable ? t('spell_listen') : t('spell_done')}
                    </button>
                )}
            </div>
        </div>
    );
}
