import { Volume2, X, Check } from 'lucide-react';
import SoundButton from '../SoundButton';

// Shared UI primitives for pronunciation lessons — the "modern" look (step-dots
// header, circular audio button, option grid, fixed bottom feedback bar). All
// Foundations lessons render through these so they look and behave identically.

export const BLUE = '#1CB0F6';
export const GREEN = '#06D6A0';
export const RED = '#EF476F';

// Sticky header (close button + header content) wrapping a full-screen lesson.
export function PracticeShell({ onClose, header, children }) {
    return (
        <div style={{ minHeight: '60vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', position: 'sticky', top: 0, zIndex: 20 }}>
                <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}><X size={22} /></button>
                {header}
            </div>
            {children}
        </div>
    );
}

// Step progress indicator (Learn — Identify — Speak …). `steps` is
// [{ id, icon, label }]; `current` is a step id or 'done'.
export function StepDots({ steps, current }) {
    const order = [...steps.map(s => s.id), 'done'];
    const activeIdx = order.indexOf(current);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            {steps.map((s, i) => {
                const Icon = s.icon;
                const done = activeIdx > i, active = activeIdx === i;
                const color = active ? BLUE : done ? GREEN : 'var(--text-muted)';
                return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: active || done ? 1 : 0.5 }}>
                            <Icon size={16} color={color} /><span style={{ fontSize: 12, fontWeight: 700, color }}>{s.label}</span>
                        </div>
                        {i < steps.length - 1 && <div style={{ width: 14, height: 2, borderRadius: 2, backgroundColor: done ? GREEN : 'var(--border-color)' }} />}
                    </div>
                );
            })}
        </div>
    );
}

// Big circular audio button that emits a sound-wave ripple on each play
// (bump `playToken` to retrigger the ripple). Ripple keyframe: tonePing (index.css).
export function AudioButton({ onClick, playToken = 0, size = 92, color = BLUE }) {
    return (
        <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
            {playToken > 0 && [0, 1].map(i => (
                <span key={`${playToken}-${i}`} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${color}`, animation: `tonePing 0.9s ease-out ${i * 0.25}s`, pointerEvents: 'none' }} />
            ))}
            <button onClick={onClick} aria-label="Play audio" style={{ position: 'relative', width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `2px solid ${color}`, backgroundColor: 'rgba(28,176,246,0.12)', color }}>
                <Volume2 size={Math.round(size * 0.43)} />
            </button>
        </div>
    );
}

// A grid of answer options with the shared selected / correct / incorrect
// styling. `children(opt)` renders each option's inner content.
export function OptionGrid({ options, cols = 2, keyOf = (_, i) => i, isCorrect, isSelected, revealed, onPick, children }) {
    // Adaptive layout: short options (letters/words) → compact grid; long text
    // options (phrases/sentences) → single column of full-width horizontal rows
    // so the text never gets cramped or clipped.
    const longest = options.reduce((m, o) => (typeof o === 'string' ? Math.max(m, o.length) : m), 0);
    const single = longest > 14;
    const effectiveCols = single ? 1 : cols;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${effectiveCols}, 1fr)`, gap: 8 }}>
            {options.map((opt, idx) => {
                const correct = isCorrect(opt), selected = isSelected(opt);
                let bg = 'var(--surface-color)', border = 'var(--border-color)', op = 1;
                if (revealed) {
                    if (correct) { bg = GREEN + '1A'; border = GREEN; }
                    else if (selected) { bg = RED + '1A'; border = RED; }
                    else op = 0.45;
                } else if (selected) { border = 'var(--lesson-selected-border)'; bg = 'var(--lesson-selected-fill)'; }
                return (
                    <button key={keyOf(opt, idx)} onClick={() => !revealed && onPick(opt)} disabled={revealed} style={{ minHeight: single ? 52 : 64, padding: single ? '14px 18px' : '12px 10px', borderRadius: 14, border: `2px solid ${border}`, boxShadow: `0 2px 0 ${border}`, backgroundColor: bg, opacity: op, cursor: revealed ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: single ? 'row' : 'column', alignItems: 'center', justifyContent: single ? 'flex-start' : 'center', textAlign: single ? 'left' : 'center', gap: single ? 10 : 4 }}>
                        {children(opt)}
                    </button>
                );
            })}
        </div>
    );
}

// Fixed bottom action bar — feedback message + primary button live here, so the
// button stays pinned regardless of the content above it.
export function FeedbackBar({ children }) {
    return (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, padding: '12px 16px calc(14px + var(--safe-area-bottom-effective, 0px))', backgroundColor: 'var(--surface-color)', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ maxWidth: 480, margin: '0 auto' }}>{children}</div>
        </div>
    );
}

// Mid-low exercise layout (Duolingo reachability): the prompt/question pins to
// the top, the answer tiles sit in the lower, thumb-reachable zone just above
// the fixed action bar. `top` renders up top; children (the answer tiles) are
// bottom-anchored via a flex spacer. Keeps tiles in the same place everywhere.
export function ExerciseColumn({ top, children, topOffset = 56 }) {
    return (
        // paddingBottom reserves room for the fixed action bar (which is taller
        // in its feedback state) so the bottom tile row never clips. The 2:1
        // spacers seat the tiles in the lower-middle (thumb zone) rather than
        // flush against the bar. topOffset = chrome above this column (header +
        // any tabs) so the column fills the visible area without overflowing.
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: `calc(100dvh - ${topOffset}px)`, padding: '12px 16px 168px', maxWidth: 480, margin: '0 auto', boxSizing: 'border-box' }}>
            <div>{top}</div>
            <div style={{ flex: 2, minHeight: 24 }} />
            <div>{children}</div>
            <div style={{ flex: 1, minHeight: 24 }} />
        </div>
    );
}

// The correct / incorrect feedback pill (icon + message).
export function FeedbackMessage({ correct, children }) {
    const color = correct ? GREEN : RED;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, marginBottom: 12, backgroundColor: color + '1A' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, backgroundColor: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{correct ? <Check size={18} /> : <X size={18} />}</div>
            <div style={{ fontSize: 14, color: 'var(--text-main)', fontWeight: 600 }}>{children}</div>
        </div>
    );
}

// Primary action button (Check / Continue / Next) — the canonical lesson feel:
// coral fill, white text, chunky 3D bottom edge that presses down on tap, plus
// the click sound (via SoundButton + the `primary` class from index.css).
export function PrimaryButton({ onClick, children, disabled = false }) {
    return (
        <SoundButton
            className="primary"
            onClick={onClick}
            disabled={disabled}
            style={{ width: '100%', padding: 14, borderRadius: 12, fontWeight: 800, fontSize: 15, fontFamily: 'inherit' }}
        >
            {children}
        </SoundButton>
    );
}
