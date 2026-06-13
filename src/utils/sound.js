// UI Sound Effects via snd-lib (SND01 "sine" kit)
// Does NOT play when TTS or mic recording is active to avoid conflicts.
import SndModule from 'snd-lib';
import { haptic } from './haptics';

const STORAGE_KEY = 'vnme_sound_enabled';
const DEFAULT_SOUND_KIT = '01';

const Snd = SndModule?.default || SndModule;
const SOUNDS = Snd?.SOUNDS || {
    BUTTON: 'button',
    CAUTION: 'caution',
    CELEBRATION: 'celebration',
    DISABLED: 'disabled',
    NOTIFICATION: 'notification',
    SELECT: 'select',
    TAP: 'tap',
    TOGGLE_OFF: 'toggle_off',
    TOGGLE_ON: 'toggle_on',
    TRANSITION_DOWN: 'transition_down',
    TRANSITION_UP: 'transition_up',
};
const KITS = Snd?.KITS || { SND01: DEFAULT_SOUND_KIT };

let snd = null;
let ready = false;
let loading = null;
let muted = false; // temporary mute (e.g. during mic recording)

function scheduleInteractionEffect(fn) {
    if (typeof window === 'undefined') {
        fn();
        return;
    }
    window.setTimeout(fn, 0);
}

// Load the sound kit outside critical tap handlers when possible.
function init() {
    if (typeof Snd !== 'function') return Promise.resolve();
    if (snd || loading) return loading;
    snd = new Snd();
    loading = snd.load(KITS.SND01)
        .then(() => { ready = true; })
        .catch(() => {
            snd = null;
            ready = false;
            loading = null;
        });
    return loading;
}

function isEnabled() {
    if (muted) return false;
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return v === null ? true : v === 'true';
    } catch { return true; }
}

function play(sound) {
    if (!ready || !isEnabled()) return;
    try { snd?.play(sound, { volume: 0.5 }); } catch { /* swallow */ }
}

function playOrWarm(sound) {
    if (!isEnabled()) return;
    if (!ready) {
        init();
        return;
    }
    play(sound);
}

function feedback(type, sound) {
    scheduleInteractionEffect(() => {
        haptic(type);
        playOrWarm(sound);
    });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const preloadUISounds = () => {
    if (isEnabled()) init();
};

export const playSuccess     = () => feedback('success', SOUNDS.TOGGLE_ON);
export const playError       = () => feedback('error', SOUNDS.TOGGLE_OFF);
export const playCelebration = () => feedback('success', SOUNDS.CELEBRATION);
export const playNotification= () => feedback('notification', SOUNDS.NOTIFICATION);
export const playButton      = () => feedback('tap', SOUNDS.BUTTON);
export const playSelect      = () => feedback('select', SOUNDS.SELECT);
export const playTap         = () => feedback('tap', SOUNDS.TAP);
export const playDisabled    = () => feedback('disabled', SOUNDS.DISABLED);
export const playToggleOn    = () => feedback('select', SOUNDS.TOGGLE_ON);
export const playToggleOff   = () => feedback('select', SOUNDS.TOGGLE_OFF);
export const playTransitionUp   = () => scheduleInteractionEffect(() => playOrWarm(SOUNDS.TRANSITION_UP));
export const playTransitionDown = () => scheduleInteractionEffect(() => playOrWarm(SOUNDS.TRANSITION_DOWN));

// ─── Conflict guards (call from mic/pitch modules) ──────────────────────────

export const muteUISounds   = () => { muted = true; };
export const unmuteUISounds = () => { muted = false; };

// ─── Settings ────────────────────────────────────────────────────────────────

export function setSoundEnabled(v) {
    localStorage.setItem(STORAGE_KEY, String(v));
}

export function getSoundEnabled() {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return v === null ? true : v === 'true';
    } catch { return true; }
}

// ─── Notification → sound mapping ────────────────────────────────────────────

const NOTIF_SOUNDS = {
    streak_3:              SOUNDS.CELEBRATION,
    streak_5:              SOUNDS.CELEBRATION,
    lesson_complete:       SOUNDS.CELEBRATION,
    coins_earned:          SOUNDS.NOTIFICATION,
    lost_heart:            SOUNDS.CAUTION,
    achievement_tonemaster:SOUNDS.CELEBRATION,
    daily_streak:          SOUNDS.NOTIFICATION,
};

export function playNotifSound(notifId) {
    const sound = NOTIF_SOUNDS[notifId];
    if (sound) scheduleInteractionEffect(() => playOrWarm(sound));
}
