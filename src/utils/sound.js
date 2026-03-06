// UI Sound Effects via snd-lib (SND01 "sine" kit)
// Does NOT play when TTS or mic recording is active to avoid conflicts.
import Snd from 'snd-lib';

const STORAGE_KEY = 'vnme_sound_enabled';

let snd = null;
let ready = false;
let muted = false; // temporary mute (e.g. during mic recording)

// Lazy init — loads kit on first interaction
function init() {
    if (snd) return;
    snd = new Snd();
    snd.load(Snd.KITS.SND01).then(() => { ready = true; });
}

function isEnabled() {
    if (muted) return false;
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        return v === null ? true : v === 'true';
    } catch { return true; }
}

function play(sound) {
    init();
    if (!ready || !isEnabled()) return;
    try { snd.play(sound, { volume: 0.5 }); } catch { /* swallow */ }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const playSuccess     = () => play(Snd.SOUNDS.TOGGLE_ON);
export const playError       = () => play(Snd.SOUNDS.TOGGLE_OFF);
export const playCelebration = () => play(Snd.SOUNDS.CELEBRATION);
export const playNotification= () => play(Snd.SOUNDS.NOTIFICATION);
export const playButton      = () => play(Snd.SOUNDS.BUTTON);
export const playSelect      = () => play(Snd.SOUNDS.SELECT);
export const playTap         = () => play(Snd.SOUNDS.TAP);
export const playDisabled    = () => play(Snd.SOUNDS.DISABLED);
export const playToggleOn    = () => play(Snd.SOUNDS.TOGGLE_ON);
export const playToggleOff   = () => play(Snd.SOUNDS.TOGGLE_OFF);
export const playTransitionUp   = () => play(Snd.SOUNDS.TRANSITION_UP);
export const playTransitionDown = () => play(Snd.SOUNDS.TRANSITION_DOWN);

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
    streak_3:              Snd.SOUNDS.CELEBRATION,
    streak_5:              Snd.SOUNDS.CELEBRATION,
    lesson_complete:       Snd.SOUNDS.CELEBRATION,
    coins_earned:          Snd.SOUNDS.NOTIFICATION,
    lost_heart:            Snd.SOUNDS.CAUTION,
    achievement_tonemaster:Snd.SOUNDS.CELEBRATION,
    daily_streak:          Snd.SOUNDS.NOTIFICATION,
};

export function playNotifSound(notifId) {
    const sound = NOTIF_SOUNDS[notifId];
    if (sound) play(sound);
}
