import React, { useState } from 'react';
import {
    Target, Zap, User, X, ChevronDown, ChevronRight, RefreshCw,
    Globe, Type, Volume2, Wrench, Moon, Sun, Clock, Bell, Gift, Crown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDong } from '../context/DongContext';
import { useUser } from '../context/UserContext';
import ReferralModal from './ReferralModal';
import PremiumModal from './PremiumModal';

const SETTINGS_KEY = 'vnme_settings';

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function saveSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

const TAB_META = {
    roadmap: null, // roadmap shows progress bar instead
    practice: { title: 'Practice', subtitle: 'Focus on specific skills' },
    dictionary: { title: 'Dictionary', subtitle: 'Search Vietnamese words' },
    grammar: { title: 'Grammar', subtitle: 'Browse patterns by level' },
    library: { title: 'Library', subtitle: 'Read Vietnamese articles' },
    community: { title: 'Community', subtitle: 'Leaderboards & friends' },
};

const TopBar = ({ activeTab, subtitleOverride }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReferralOpen, setIsReferralOpen] = useState(false);
    const [isPremiumOpen, setIsPremiumOpen] = useState(false);
    const navigate = useNavigate();
    const { balance, dailyStreak, isExecutive } = useDong();
    const { userProfile, updateUserProfile } = useUser();
    const isRoadmap = activeTab === 'roadmap';
    const meta = TAB_META[activeTab];

    const [settings, setSettings] = useState(() => loadSettings());

    const updateSetting = (key, value) => {
        const next = { ...settings, [key]: value };
        setSettings(next);
        saveSettings(next);
    };

    const dialectLabel = userProfile.dialect === 'north' ? 'Northern' : userProfile.dialect === 'south' ? 'Southern' : userProfile.dialect === 'both' ? 'Both Dialects' : '';
    const goalLabel = userProfile.dailyMins ? `${userProfile.dailyMins}m/day` : '';

    const handleReset = () => {
        if (confirm('Reset all progress and settings? This cannot be undone.')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <>
            <header className="top-bar">
                {/* Profile Avatar */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    style={{
                        padding: '8px', borderRadius: '50%',
                        backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)',
                        marginRight: 'var(--spacing-3)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0,
                    }}
                >
                    <User size={22} />
                </button>

                {/* Center: progress bar (roadmap) or tab title */}
                {isRoadmap ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, marginRight: 'var(--spacing-3)' }}>
                        <Target size={18} color="var(--text-muted)" />
                        <div style={{ flex: 1, height: 8, backgroundColor: 'var(--surface-color-light)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <div style={{ width: '66%', height: '100%', backgroundColor: 'var(--primary-color)' }} />
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, marginRight: 'var(--spacing-3)', overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {meta?.title}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                            {subtitleOverride || meta?.subtitle}
                        </p>
                    </div>
                )}

                {/* Stats — always visible */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                    <button onClick={() => setIsPremiumOpen(true)} className="ghost" style={{ padding: 6, color: isExecutive ? '#06D6A0' : '#FFD166', display: 'flex', alignItems: 'center' }}>
                        <Crown size={20} fill={isExecutive ? '#06D6A0' : '#FFD166'} />
                    </button>
                    <button onClick={() => setIsReferralOpen(true)} className="ghost" style={{ padding: 6, color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}>
                        <Gift size={20} />
                    </button>
                    <div className="stat-badge streak" style={{ padding: '4px 6px', fontSize: '13px' }}>
                        <Zap size={14} fill="currentColor" /> {dailyStreak}
                    </div>
                    <div className="stat-badge" style={{ padding: '4px 6px', fontSize: '13px', color: '#F2C255' }}>
                        {balance.toLocaleString()}₫
                    </div>
                </div>
            </header>

            {/* ─── Settings Modal ────────────────────────────────── */}
            {isMenuOpen && (
                <div className="modal-overlay" onClick={() => setIsMenuOpen(false)}>
                    <div className="modal-content slide-up" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ margin: 0, fontSize: 20 }}>Settings</h2>
                            <button className="ghost" onClick={() => setIsMenuOpen(false)} style={{ padding: 6 }}>
                                <X size={22} />
                            </button>
                        </div>

                        {/* Profile Card */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: 16, backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                            <div style={{ width: 52, height: 52, backgroundColor: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1A1A', flexShrink: 0 }}>
                                <User size={26} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: 17, margin: '0 0 2px', fontWeight: 800 }}>{userProfile.name || 'Learner'}</h3>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                    {[dialectLabel, goalLabel].filter(Boolean).join(' · ') || 'Vietnamese Learner'}
                                </span>
                            </div>
                        </div>

                        {/* Scrollable Settings */}
                        <div style={{ margin: '0 -24px -48px', padding: '0 24px 48px', overflowY: 'auto', maxHeight: '55vh' }}>

                            {/* Learning Preferences */}
                            <SettingsGroup title="Learning">
                                <SettingSelect
                                    label="Dialect"
                                    icon={<Globe size={16} />}
                                    value={userProfile.dialect || 'south'}
                                    options={[{ v: 'north', l: 'Northern' }, { v: 'south', l: 'Southern' }, { v: 'both', l: 'Both' }]}
                                    onChange={v => updateUserProfile({ dialect: v })}
                                />
                                <SettingSelect
                                    label="Daily Goal"
                                    icon={<Clock size={16} />}
                                    value={String(userProfile.dailyMins || 10)}
                                    options={[{ v: '5', l: '5 min' }, { v: '10', l: '10 min' }, { v: '15', l: '15 min' }, { v: '20', l: '20 min' }]}
                                    onChange={v => updateUserProfile({ dailyMins: parseInt(v) })}
                                />
                                <SettingSelect
                                    label="Level"
                                    icon={<Target size={16} />}
                                    value={userProfile.level || 'new'}
                                    options={[{ v: 'new', l: 'Beginner' }, { v: 'basic', l: 'Elementary' }, { v: 'intermediate', l: 'Intermediate' }]}
                                    onChange={v => updateUserProfile({ level: v })}
                                />
                            </SettingsGroup>

                            {/* Voice & Sound */}
                            <SettingsGroup title="Voice & Sound">
                                <SettingSelect
                                    label="TTS Speed"
                                    icon={<Volume2 size={16} />}
                                    value={settings.ttsSpeed || '0.9'}
                                    options={[{ v: '0.6', l: 'Slow' }, { v: '0.9', l: 'Normal' }, { v: '1.2', l: 'Fast' }]}
                                    onChange={v => updateSetting('ttsSpeed', v)}
                                />
                            </SettingsGroup>

                            {/* Display */}
                            <SettingsGroup title="Display">
                                <SettingSelect
                                    label="Font Size"
                                    icon={<Type size={16} />}
                                    value={settings.fontSize || 'medium'}
                                    options={[{ v: 'small', l: 'Small' }, { v: 'medium', l: 'Medium' }, { v: 'large', l: 'Large' }]}
                                    onChange={v => updateSetting('fontSize', v)}
                                />
                            </SettingsGroup>

                            {/* Notifications */}
                            <SettingsGroup title="Reminders">
                                <SettingToggle
                                    label="Daily Reminder"
                                    icon={<Bell size={16} />}
                                    checked={settings.dailyReminder !== false}
                                    onChange={v => updateSetting('dailyReminder', v)}
                                />
                            </SettingsGroup>

                            {/* Actions */}
                            <SettingsGroup title="Advanced">
                                <SettingAction
                                    label="Admin CMS"
                                    icon={<Wrench size={16} />}
                                    onClick={() => { setIsMenuOpen(false); navigate('/admin'); }}
                                />
                                <SettingAction
                                    label="Reset All Progress"
                                    icon={<RefreshCw size={16} />}
                                    color="var(--danger-color)"
                                    onClick={handleReset}
                                />
                            </SettingsGroup>
                        </div>
                    </div>
                </div>
            )}

            {isReferralOpen && (
                <ReferralModal onClose={() => setIsReferralOpen(false)} username={userProfile.name?.toLowerCase().replace(/\s+/g, '') || 'learner123'} />
            )}

            {isPremiumOpen && (
                <PremiumModal onClose={() => setIsPremiumOpen(false)} />
            )}
        </>
    );
};

// ─── Setting Components ──────────────────────────────────────

const SettingsGroup = ({ title, children }) => (
    <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>{title}</span>
        <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            {children}
        </div>
    </div>
);

const SettingSelect = ({ label, icon, value, options, onChange }) => {
    const [open, setOpen] = useState(false);
    const current = options.find(o => o.v === value);

    return (
        <div style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div
                onClick={() => setOpen(!open)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer' }}
            >
                <span style={{ color: 'var(--primary-color)', display: 'flex' }}>{icon}</span>
                <span style={{ flex: 1, fontSize: 15 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', backgroundColor: 'var(--surface-color-light)', padding: '4px 10px', borderRadius: 8 }}>
                    {current?.l || value}
                </span>
                <ChevronDown size={14} color="var(--text-muted)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </div>
            {open && (
                <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {options.map(o => (
                        <button
                            key={o.v}
                            onClick={() => { onChange(o.v); setOpen(false); }}
                            style={{
                                padding: '8px 14px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700,
                                border: o.v === value ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                                backgroundColor: o.v === value ? 'rgba(255,209,102,0.15)' : 'transparent',
                                color: o.v === value ? 'var(--primary-color)' : 'var(--text-main)',
                                cursor: 'pointer',
                            }}
                        >
                            {o.l}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const SettingToggle = ({ label, icon, checked, onChange }) => (
    <div
        onClick={() => onChange(!checked)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
    >
        <span style={{ color: 'var(--primary-color)', display: 'flex' }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 15 }}>{label}</span>
        <div style={{
            width: 46, height: 26, backgroundColor: checked ? 'var(--success-color)' : 'var(--surface-color-light)',
            borderRadius: 13, position: 'relative', transition: '0.3s', border: '1px solid var(--border-color)',
        }}>
            <div style={{
                width: 22, height: 22, backgroundColor: 'white', borderRadius: '50%',
                position: 'absolute', top: 1, left: checked ? 22 : 1, transition: '0.3s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
        </div>
    </div>
);

const SettingAction = ({ label, icon, color = 'var(--text-main)', onClick }) => (
    <div
        onClick={onClick}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
    >
        <span style={{ color, display: 'flex' }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color }}>{label}</span>
        <ChevronRight size={16} color="var(--text-muted)" />
    </div>
);

export default TopBar;
