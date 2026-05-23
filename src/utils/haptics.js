const STORAGE_KEY = 'vnme_haptics_enabled';

const PATTERNS = {
    tap: 8,
    select: 12,
    success: [12, 35, 18],
    error: [25, 40, 25],
    notification: [15, 30, 15],
    disabled: [8, 24, 8],
};

let lastPulseAt = 0;
let lastPulseType = null;

function hasVibrationApi() {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

function hasCoarsePointer() {
    if (typeof window === 'undefined' || !window.matchMedia) return true;
    return window.matchMedia('(pointer: coarse)').matches;
}

function isEnabled() {
    try {
        const value = localStorage.getItem(STORAGE_KEY);
        return value === null ? true : value === 'true';
    } catch {
        return true;
    }
}

export function canHaptic() {
    return hasVibrationApi() && hasCoarsePointer() && isEnabled();
}

export function haptic(type = 'tap') {
    if (!canHaptic()) return false;

    const now = Date.now();
    const isFeedbackPulse = type === 'success' || type === 'error' || type === 'notification';
    if (now - lastPulseAt < 35 && !isFeedbackPulse && type === lastPulseType) return false;
    lastPulseAt = now;
    lastPulseType = type;

    const pattern = PATTERNS[type] ?? PATTERNS.tap;
    try {
        return navigator.vibrate(pattern);
    } catch {
        return false;
    }
}

export function setHapticsEnabled(value) {
    try {
        localStorage.setItem(STORAGE_KEY, String(Boolean(value)));
    } catch {
        // Ignore storage failures; haptics remain best-effort.
    }
}

export function getHapticsEnabled() {
    return isEnabled();
}

function isDisabledInteractive(element) {
    return (
        element.disabled ||
        element.getAttribute('aria-disabled') === 'true' ||
        element.classList.contains('disabled')
    );
}

function resolveHapticType(element) {
    const explicit = element.getAttribute('data-haptic');
    if (explicit) return explicit;
    if (isDisabledInteractive(element)) return 'disabled';
    if (element.getAttribute('role') === 'tab') return 'select';
    if (element.classList.contains('active') || element.classList.contains('selected')) return 'select';
    return 'tap';
}

export function installGlobalHaptics(root = document) {
    if (!root?.addEventListener) return () => {};

    const handlePointerDown = (event) => {
        if (event.pointerType && event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
        if (event.button !== undefined && event.button !== 0) return;

        const target = event.target;
        if (!(target instanceof Element)) return;

        const interactive = target.closest(
            'button, a[href], [role="button"], [role="tab"], [role="menuitem"], [data-haptic]'
        );
        if (!interactive || interactive.getAttribute('data-haptic') === 'none') return;
        if (interactive.closest('[data-haptics="off"]')) return;

        const type = resolveHapticType(interactive);
        haptic(type);
    };

    root.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });

    return () => {
        root.removeEventListener('pointerdown', handlePointerDown, { capture: true });
    };
}
