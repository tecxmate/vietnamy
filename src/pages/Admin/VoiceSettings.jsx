import React, { useState } from 'react';
import { Volume2, Lock } from 'lucide-react';
import { TTS_VOICE_CATALOG, getVoiceAvailability, setVoiceEnabled } from '../../data/ttsVoices';

// Human labels for the admin view (the app-facing labels are i18n keys, but
// admins work in English). Mirrors the catalog ids.
const VOICE_META = {
    'google': { name: 'Google (Northern)', note: 'Always on — the stable default reading voice.' },
    'azure-north': { name: 'Azure Northern — Nam Minh', note: 'Reading voice (male, northern accent).' },
    'azure-south': { name: 'Azure Southern — Hoài My', note: 'Reading voice (female, southern accent). Currently unstable.' },
};

const VoiceSettings = () => {
    const [availability, setAvailability] = useState(() => getVoiceAvailability());

    const toggle = (voiceId, next) => {
        setVoiceEnabled(voiceId, next);
        setAvailability(getVoiceAvailability());
    };

    return (
        <div style={{ maxWidth: 640 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
                Control which TTS reading voices students can pick. Google is always on.
                Turn a reading voice off to hide it everywhere — the voice picker, onboarding,
                and any saved selection falls back to the northern voice (then Google).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {TTS_VOICE_CATALOG.map(voice => {
                    const meta = VOICE_META[voice.id] || { name: voice.id, note: '' };
                    const enabled = !!availability[voice.id];
                    const locked = !!voice.alwaysOn;
                    return (
                        <div
                            key={voice.id}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '14px 16px', borderRadius: 12,
                                border: '1px solid var(--border-color)',
                                background: 'var(--surface-color)',
                            }}
                        >
                            <Volume2 size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{meta.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{meta.note}</div>
                            </div>
                            {locked ? (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                                    flexShrink: 0,
                                }}>
                                    <Lock size={13} /> Always on
                                </span>
                            ) : (
                                <button
                                    role="switch"
                                    aria-checked={enabled}
                                    aria-label={meta.name}
                                    onClick={() => toggle(voice.id, !enabled)}
                                    style={{
                                        position: 'relative', width: 46, height: 26,
                                        borderRadius: 13, border: 'none', cursor: 'pointer',
                                        flexShrink: 0,
                                        background: enabled ? 'var(--primary-color)' : 'var(--border-color)',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    <span style={{
                                        position: 'absolute', top: 3,
                                        left: enabled ? 23 : 3,
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: '#fff',
                                        transition: 'left 0.2s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                    }} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5, marginTop: 20 }}>
                Note: this override is stored on this device. The shipped default keeps the
                southern voice off for everyone until it stabilizes.
            </p>
        </div>
    );
};

export default VoiceSettings;
