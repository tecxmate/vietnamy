import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Moon, Globe, Clock, Target, Volume2, Type, Bell,
    ChevronDown, Eye, Clipboard, BookOpen, Wrench,
} from 'lucide-react';
import { useUser } from '../context/UserContext';

const SETTINGS_KEY = 'vnme_settings';

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function saveAllSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

const SettingsPage = () => {
    const navigate = useNavigate();
    const { userProfile, updateUserProfile } = useUser();
    const [settings, setSettings] = useState(() => loadSettings());
    const [saved, setSaved] = useState(false);

    const update = (key, value) => {
        const next = { ...settings, [key]: value };
        setSettings(next);
        saveAllSettings(next);
    };

    const handleSave = () => {
        saveAllSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: 32 }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)',
            }}>
                <button className="ghost" onClick={() => navigate(-1)} style={{ padding: 6, display: 'flex' }}>
                    <ArrowLeft size={22} />
                </button>
                <span style={{ flex: 1, fontSize: 18, fontWeight: 800, textAlign: 'center' }}>Settings</span>
                <button
                    onClick={handleSave}
                    style={{
                        padding: '6px 16px', borderRadius: 'var(--radius-md)', border: 'none',
                        backgroundColor: saved ? 'var(--success-color)' : 'var(--surface-color)',
                        color: saved ? '#1A1A1A' : 'var(--text-main)',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.2s',
                    }}
                >
                    {saved ? 'Saved!' : 'Save'}
                </button>
            </div>

            <div style={{ padding: '16px 20px 0' }}>

                {/* ═══ Developer ═════════════════════════════════ */}
                <SettingsSection>
                    <SettingToggle
                        label="Test Mode"
                        icon={<Wrench size={18} />}
                        checked={settings.testMode || false}
                        onChange={v => update('testMode', v)}
                        description="Unlock all lessons for testing"
                        last
                    />
                </SettingsSection>

                {/* ═══ Appearance ═════════════════════════════════ */}
                <SettingsSection>
                    <SettingToggle
                        label="Dark Mode"
                        icon={<Moon size={18} />}
                        checked={settings.darkMode || false}
                        onChange={v => update('darkMode', v)}
                        last
                    />
                </SettingsSection>

                {/* ═══ Learning ═══════════════════════════════════ */}
                <SettingsSection>
                    <SettingToggle
                        label="Auto-paste for lookup on open"
                        icon={<Clipboard size={18} />}
                        checked={settings.autoPaste !== false}
                        onChange={v => update('autoPaste', v)}
                    />
                    <SettingToggle
                        label="Auto-pronounce on lookup"
                        icon={<Volume2 size={18} />}
                        checked={settings.autoPronounce !== false}
                        onChange={v => update('autoPronounce', v)}
                    />
                    <SettingToggle
                        label="Vocabulary reminders"
                        icon={<BookOpen size={18} />}
                        checked={settings.vocabReminder !== false}
                        onChange={v => update('vocabReminder', v)}
                        last
                    />
                </SettingsSection>

                {/* ═══ Reminder Settings ══════════════════════════ */}
                <SettingsSection>
                    <SettingSelect
                        label="Reminder frequency"
                        value={settings.reminderFreq || '1 time'}
                        options={['1 time', '2 times', '3 times']}
                        onChange={v => update('reminderFreq', v)}
                    />
                    <SettingSelect
                        label="Start time"
                        value={settings.reminderStart || '07:00'}
                        options={['06:00', '07:00', '08:00', '09:00', '10:00']}
                        onChange={v => update('reminderStart', v)}
                    />
                    <SettingSelect
                        label="End time"
                        value={settings.reminderEnd || '21:00'}
                        options={['19:00', '20:00', '21:00', '22:00', '23:00']}
                        onChange={v => update('reminderEnd', v)}
                    />
                    <SettingSelect
                        label="Reminder days"
                        value={settings.reminderDays || 'Every day'}
                        options={['Every day', 'Weekdays', 'Weekends', 'Mon, Wed, Fri']}
                        onChange={v => update('reminderDays', v)}
                        last
                    />
                </SettingsSection>

                {/* ═══ Display & Language ═════════════════════════ */}
                <SettingsSection>
                    <SettingToggle
                        label="Show Han Viet"
                        icon={<Eye size={18} />}
                        checked={settings.showHanViet !== false}
                        onChange={v => update('showHanViet', v)}
                    />
                    <SettingSelect
                        label="Dialect"
                        value={userProfile.dialect === 'north' ? 'Northern' : userProfile.dialect === 'both' ? 'Both' : 'Southern'}
                        options={['Northern', 'Southern', 'Both']}
                        onChange={v => updateUserProfile({ dialect: v === 'Northern' ? 'north' : v === 'Both' ? 'both' : 'south' })}
                    />
                    <SettingSelect
                        label="Romanization"
                        value={settings.romanization || 'Pinyin'}
                        options={['Pinyin', 'IPA', 'None']}
                        onChange={v => update('romanization', v)}
                        last
                    />
                </SettingsSection>

                {/* ═══ General ════════════════════════════════════ */}
                <SettingsSection>
                    <SettingSelect
                        label="App Language"
                        value={settings.appLanguage || 'English'}
                        options={['English', 'Tiếng Việt', '中文']}
                        onChange={v => update('appLanguage', v)}
                    />
                    <SettingSelect
                        label="TTS Speed"
                        value={settings.ttsSpeed === '0.6' ? 'Slow' : settings.ttsSpeed === '1.2' ? 'Fast' : 'Normal'}
                        options={['Slow', 'Normal', 'Fast']}
                        onChange={v => update('ttsSpeed', v === 'Slow' ? '0.6' : v === 'Fast' ? '1.2' : '0.9')}
                    />
                    <SettingSelect
                        label="Font Size"
                        value={settings.fontSize || '15.0'}
                        options={['13.0', '14.0', '15.0', '16.0', '18.0']}
                        onChange={v => update('fontSize', v)}
                    />
                    <SettingSelect
                        label="Daily Goal"
                        value={`${userProfile.dailyMins || 10} min`}
                        options={['5 min', '10 min', '15 min', '20 min', '30 min']}
                        onChange={v => updateUserProfile({ dailyMins: parseInt(v) })}
                        last
                    />
                </SettingsSection>

            </div>
        </div>
    );
};

// ─── Sub-components ──────────────────────────────────────────

const SettingsSection = ({ children }) => (
    <div style={{
        backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)', marginBottom: 16, overflow: 'hidden',
    }}>
        {children}
    </div>
);

const SettingToggle = ({ label, icon, checked, onChange, description, last }) => (
    <div
        onClick={() => onChange(!checked)}
        style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            borderBottom: last ? 'none' : '1px solid var(--border-color)', cursor: 'pointer',
        }}
    >
        <div style={{ flex: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>{label}</span>
            {description && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{description}</p>}
        </div>
        <div style={{
            width: 50, height: 28, backgroundColor: checked ? '#3478F6' : 'var(--surface-color-light)',
            borderRadius: 14, position: 'relative', transition: '0.3s',
            border: checked ? 'none' : '1px solid var(--border-color)',
        }}>
            <div style={{
                width: 24, height: 24, backgroundColor: 'white', borderRadius: '50%',
                position: 'absolute', top: 2, left: checked ? 24 : 2, transition: '0.3s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
        </div>
    </div>
);

const SettingSelect = ({ label, value, options, onChange, last }) => {
    const [open, setOpen] = useState(false);

    return (
        <div style={{ borderBottom: last ? 'none' : '1px solid var(--border-color)' }}>
            <div
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    cursor: 'pointer',
                }}
            >
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{label}</span>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '5px 12px', borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)',
                }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{value}</span>
                    <ChevronDown size={14} color="var(--text-muted)" style={{
                        transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s',
                    }} />
                </div>
            </div>
            {open && (
                <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {options.map(opt => (
                        <button
                            key={opt}
                            onClick={() => { onChange(opt); setOpen(false); }}
                            style={{
                                padding: '8px 14px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700,
                                border: opt === value ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                                backgroundColor: opt === value ? 'rgba(255,209,102,0.15)' : 'transparent',
                                color: opt === value ? 'var(--primary-color)' : 'var(--text-main)',
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
