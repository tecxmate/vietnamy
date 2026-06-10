// Single source of truth for which TTS voices are available.
//
// Google is always on. The "reading voices" (Azure North/South) can be toggled
// from Admin → Voice Settings. azure-south ships DISABLED by default because the
// southern voice is currently unstable; an admin can re-enable it per-device via
// the override stored in `vnme_settings.ttsVoiceAvailability`.

import { loadSettings, saveSettings } from '../lib/settings';

export const ALWAYS_ON_VOICE = 'google';
export const FALLBACK_VOICE = 'azure-north';

export const TTS_VOICE_CATALOG = [
    { id: 'google', labelKey: 'tts_voice_google_north', alwaysOn: true },
    { id: 'azure-north', labelKey: 'tts_voice_azure_north' },
    { id: 'azure-south', labelKey: 'tts_voice_azure_south' },
];

// Code-level defaults — apply to every user until an admin overrides locally.
const DEFAULT_ENABLED = {
    'google': true,
    'azure-north': true,
    'azure-south': false, // temporarily off — southern voice is unstable
};

// Effective enabled-map = code defaults overlaid with the admin override.
export function getVoiceAvailability(settings) {
    const s = settings || loadSettings();
    const overrides = s.ttsVoiceAvailability || {};
    const map = {};
    for (const voice of TTS_VOICE_CATALOG) {
        map[voice.id] = voice.alwaysOn
            ? true
            : (overrides[voice.id] ?? DEFAULT_ENABLED[voice.id] ?? false);
    }
    return map;
}

export function isVoiceEnabled(voiceId, settings) {
    return !!getVoiceAvailability(settings)[voiceId];
}

export function getEnabledVoices(settings) {
    const map = getVoiceAvailability(settings);
    return TTS_VOICE_CATALOG.filter(voice => map[voice.id]);
}

// Admin write — persists a per-device override. Google can't be disabled.
export function setVoiceEnabled(voiceId, enabled) {
    if (voiceId === ALWAYS_ON_VOICE) return;
    const s = loadSettings();
    saveSettings({
        ...s,
        ttsVoiceAvailability: { ...(s.ttsVoiceAvailability || {}), [voiceId]: enabled },
    });
}
