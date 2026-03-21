import React, { useState, useEffect } from 'react';
import {
    Target, Zap, User, X, ChevronDown, ChevronRight, RefreshCw,
    Globe, Type, Volume2, Wrench, Moon, Sun, Clock, Bell, Gift, Heart, CircleDollarSign,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDong } from '../context/DongContext';
import { useUser } from '../context/UserContext';
import { useT } from '../lib/i18n';
import ReferralModal from './ReferralModal';
import { useNotifications } from '../context/NotificationContext';
import { getSoundEnabled, setSoundEnabled, playTap, playSelect, playTransitionUp, playTransitionDown } from '../utils/sound';

const SETTINGS_KEY = 'vnme_settings';

export function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        if (parsed.testMode === undefined) parsed.testMode = true;
        return parsed;
    } catch { return { testMode: true }; }
}

export function saveSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

const TAB_META = {
    home: null,
    study: null,
    dictionary: { title: 'Dictionary', subtitle: 'Search Vietnamese words' },
    grammar: { title: 'Grammar', subtitle: 'Browse patterns by level' },
    scenes: { title: 'Scenes', subtitle: 'Learn through real-life scenarios' },
    library: { title: 'Library', subtitle: 'Grammar, readings & vocabulary' },
    practice: { title: 'Practice', subtitle: 'Skills & pronunciation drills' },
};

const TopBar = ({ activeTab, subtitleOverride }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [isReferralOpen, setIsReferralOpen] = useState(false);
    const navigate = useNavigate();
    const { dailyStreak, hearts, coins } = useDong();
    const { userProfile, updateUserProfile } = useUser();
    const { unreadCount, openPanel } = useNotifications();
    const isHome = activeTab === 'home';
    const isRoadmap = activeTab === 'roadmap';
    const meta = TAB_META[activeTab];

    const t = useT();
    const [settings, setSettings] = useState(() => loadSettings());

    const updateSetting = (key, value) => {
        const next = { ...settings, [key]: value };
        setSettings(next);
        saveSettings(next);
    };

    const dialectLabel = userProfile.dialect === 'north' ? 'Northern' : userProfile.dialect === 'south' ? 'Southern' : userProfile.dialect === 'both' ? 'Both Dialects' : '';
    const goalLabel = userProfile.dailyMins ? `${userProfile.dailyMins}m/day` : '';

    const openMenu = () => {
        playTransitionUp();
        setMenuVisible(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setIsMenuOpen(true)));
    };
    const closeMenu = () => {
        playTransitionDown();
        setIsMenuOpen(false);
        setTimeout(() => setMenuVisible(false), 280);
    };

    // Listen for sidebar settings button (desktop)
    useEffect(() => {
        const handler = () => openMenu();
        window.addEventListener('open-settings', handler);
        return () => window.removeEventListener('open-settings', handler);
    });

    const handleReset = () => {
        if (confirm(t('reset_confirm'))) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <>
            <header className="top-bar">
                {/* Profile Avatar */}
                <button
                    onClick={openMenu}
                    style={{
                        padding: '8px', borderRadius: '50%',
                        backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)',
                        marginRight: 'var(--spacing-3)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0,
                    }}
                >
                    <User size={22} />
                </button>

                {/* Center: greeting (home), progress bar (roadmap), or tab title */}
                {isHome ? (
                    <div style={{ flex: 1, marginRight: 'var(--spacing-3)', overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(() => {
                                const h = new Date().getHours();
                                const name = userProfile?.name || 'Bạn';
                                if (h >= 0 && h < 4) return `Ngủ muộn vậy ${name}? 🦉`;
                                if (h >= 4 && h < 6) return `${name} dậy sớm thật đấy! 🌅`;
                                if (h >= 6 && h < 12) return `Chào buổi sáng ${name} nha! ☀️`;
                                if (h >= 12 && h < 14) return `Đến giờ ăn trưa rồi ${name}! 🍜`;
                                if (h >= 14 && h < 18) return `Chúc ${name} buổi chiều vui vẻ! 🌤️`;
                                if (h >= 18 && h < 21) return `Chào buổi tối ${name}. 🌆`;
                                return `Muộn rồi đấy ${name} ạ. 🌙`;
                            })()}
                        </p>
                    </div>
                ) : isRoadmap ? (
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
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {userProfile.isDeveloperMode && (
                        <>
                            <button onClick={() => setIsReferralOpen(true)} className="ghost" style={{ padding: 6, color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}>
                                <Gift size={20} />
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 13, color: '#FFB703' }}>
                                <CircleDollarSign size={16} /> {coins}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 13, color: '#EF4444' }}>
                                <Heart size={16} fill="#EF4444" /> {hearts}
                            </div>
                        </>
                    )}
                    {/* Notification bell */}
                    <button
                        className="notif-bell-btn"
                        onClick={() => { playTransitionUp(); openPanel(); }}
                        aria-label="Notifications"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="notif-bell-badge">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* ─── Settings Panel (left slide-in) ───────────────────── */}
            {menuVisible && (
                <>
                    {/* Backdrop */}
                    <div
                        style={{
                            position: 'fixed', inset: 0, zIndex: 8500,
                            background: 'rgba(0,0,0,0.35)',
                            opacity: isMenuOpen ? 1 : 0,
                            transition: 'opacity 0.28s ease',
                        }}
                        onClick={closeMenu}
                    />

                    {/* Left panel */}
                    <div style={{
                        position: 'fixed', top: 0, left: 0, bottom: 0,
                        width: 'min(92vw, 360px)',
                        background: 'var(--bg-color)',
                        borderRight: '1px solid var(--border-color)',
                        zIndex: 8600,
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '8px 0 32px rgba(0,0,0,0.22)',
                        transform: isMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                        transition: 'transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1)',
                    }}>
                        {/* Panel Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            gap: 12,
                            padding: '16px 16px 12px',
                            borderBottom: '1px solid var(--border-color)',
                            flexShrink: 0,
                        }}>
                            <button
                                style={{
                                    background: 'none', border: 'none',
                                    color: 'var(--text-muted)', padding: 8,
                                    borderRadius: 8, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center',
                                    flexShrink: 0,
                                }}
                                onClick={closeMenu}
                            >
                                <X size={20} />
                            </button>
                            <div style={{
                                width: 38, height: 38,
                                backgroundColor: 'var(--primary-color)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#1A1A1A', flexShrink: 0,
                            }}>
                                <User size={20} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                                    {userProfile.name || 'Learner'}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    {[dialectLabel, goalLabel].filter(Boolean).join(' · ') || 'Vietnamese Learner'}
                                </div>
                            </div>
                        </div>

                        {/* Scrollable body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 32px', WebkitOverflowScrolling: 'touch' }}>

                            {/* Learning Preferences */}
                            <SettingsGroup title={t('learning')}>

                                <SettingSelect
                                    label={t('app_language')}
                                    icon={<Globe size={16} />}
                                    value={userProfile.nativeLang || 'en'}
                                    options={[
                                        { v: 'en', l: 'English' },
                                        { v: 'zh', l: '简体中文' },
                                        { v: 'zh-t', l: '繁體中文' },
                                        { v: 'ja', l: '日本語' },
                                        { v: 'fr', l: 'Français' },
                                        { v: 'de', l: 'Deutsch' },
                                        { v: 'ru', l: 'Русский' },
                                        { v: 'it', l: 'Italiano' },
                                        { v: 'no', l: 'Norsk' },
                                        { v: 'es', l: 'Español' },
                                        { v: 'ko', l: '한국어' },
                                    ]}
                                    onChange={v => updateUserProfile({ nativeLang: v })}
                                />
                                <SettingSelect
                                    label={t('daily_goal')}
                                    icon={<Clock size={16} />}
                                    value={String(userProfile.dailyMins || 10)}
                                    options={[{ v: '5', l: '5 min' }, { v: '10', l: '10 min' }, { v: '15', l: '15 min' }, { v: '20', l: '20 min' }]}
                                    onChange={v => updateUserProfile({ dailyMins: parseInt(v) })}
                                />
                                <SettingSelect
                                    label={t('level')}
                                    icon={<Target size={16} />}
                                    value={userProfile.level || 'new'}
                                    options={[{ v: 'new', l: 'Beginner' }, { v: 'basic', l: 'Elementary' }, { v: 'intermediate', l: 'Intermediate' }]}
                                    onChange={v => updateUserProfile({ level: v })}
                                />
                                <SettingMultiSelect
                                    label={t('visible_languages')}
                                    icon={<Globe size={16} />}
                                    values={userProfile.visibleDicts || ['en', 'zh-s', 'zh-t']}
                                    options={[
                                        { v: 'en', l: 'English' },
                                        { v: 'zh-s', l: 'Chinese (Simplified)' },
                                        { v: 'zh-t', l: 'Chinese (Traditional)' },
                                        { v: 'hanviet', l: 'Han-Viet' },
                                        { v: 'ja', l: 'Japanese' },
                                        { v: 'fr', l: 'French' },
                                        { v: 'de', l: 'German' },
                                        { v: 'ru', l: 'Russian' },
                                        { v: 'it', l: 'Italian' },
                                        { v: 'no', l: 'Norwegian' },
                                        { v: 'es', l: 'Spanish' },
                                    ]}
                                    onChange={next => updateUserProfile({ visibleDicts: next.length > 0 ? next : ['en'] })}
                                />
                            </SettingsGroup>

                            {/* Voice & Sound */}
                            <SettingsGroup title={t('voice_sound')}>
                                <SettingSelect
                                    label={t('tts_speed')}
                                    icon={<Volume2 size={16} />}
                                    value={settings.ttsSpeed || '0.9'}
                                    options={[{ v: '0.6', l: 'Slow' }, { v: '0.9', l: 'Normal' }, { v: '1.2', l: 'Fast' }]}
                                    onChange={v => updateSetting('ttsSpeed', v)}
                                />
                                <SettingToggle
                                    label="Sound Effects"
                                    icon={<Volume2 size={16} />}
                                    checked={getSoundEnabled()}
                                    onChange={v => { setSoundEnabled(v); if (v) playTap(); }}
                                />
                            </SettingsGroup>

                            {/* Display */}
                            <SettingsGroup title={t('display')}>
                                <SettingSelect
                                    label={t('font_size')}
                                    icon={<Type size={16} />}
                                    value={settings.fontSize || 'medium'}
                                    options={[{ v: 'small', l: 'Small' }, { v: 'medium', l: 'Medium' }, { v: 'large', l: 'Large' }]}
                                    onChange={v => updateSetting('fontSize', v)}
                                />
                            </SettingsGroup>

                            {/* Notifications */}
                            <SettingsGroup title={t('reminders')}>
                                <SettingToggle
                                    label={t('daily_reminder')}
                                    icon={<Bell size={16} />}
                                    checked={settings.dailyReminder !== false}
                                    onChange={v => updateSetting('dailyReminder', v)}
                                />
                            </SettingsGroup>

                            {/* Advanced */}
                            <SettingsGroup title={t('advanced')}>
                                <SettingToggle
                                    label={t('test_mode')}
                                    icon={<Zap size={16} />}
                                    checked={settings.testMode === true}
                                    onChange={v => updateSetting('testMode', v)}
                                />
                                <SettingToggle
                                    label="Developer Preview"
                                    icon={<Wrench size={16} />}
                                    checked={userProfile.isDeveloperMode === true}
                                    onChange={v => {
                                        if (v) {
                                            const pwd = window.prompt("Enter preview password:");
                                            if (pwd === "tecxmate2026") {
                                                updateUserProfile({ isDeveloperMode: true });
                                            } else {
                                                alert("Incorrect password.");
                                            }
                                        } else {
                                            updateUserProfile({ isDeveloperMode: false });
                                        }
                                    }}
                                />
                                {userProfile.isDeveloperMode && (
                                    <SettingAction
                                        label={t('admin_cms')}
                                        icon={<Wrench size={16} />}
                                        onClick={() => { closeMenu(); navigate('/admin'); }}
                                    />
                                )}
                                <SettingAction
                                    label={t('reset_progress')}
                                    icon={<RefreshCw size={16} />}
                                    color="var(--danger-color)"
                                    onClick={handleReset}
                                />
                            </SettingsGroup>

                            {/* Credits */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 0 12px', color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6, gap: 4 }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>Vietnamy Education</p>
                                <p style={{ margin: 0 }}>Developed by <a href="https://www.tecxmate.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>TECXMATE.COM</a></p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                    <button
                                        onClick={() => { closeMenu(); navigate('/terms'); }}
                                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}
                                    >Terms</button>
                                    <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>·</span>
                                    <button
                                        onClick={() => { closeMenu(); navigate('/privacy'); }}
                                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}
                                    >Privacy</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {isReferralOpen && (
                <ReferralModal onClose={() => setIsReferralOpen(false)} username={userProfile.name?.toLowerCase().replace(/\s+/g, '') || 'learner123'} />
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
                            onClick={() => { playSelect(); onChange(o.v); setOpen(false); }}
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

const SettingMultiSelect = ({ label, icon, values, options, onChange }) => {
    const [open, setOpen] = useState(false);
    const summary = options.filter(o => values.includes(o.v)).map(o => o.l).join(', ') || 'None';

    return (
        <div style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div
                onClick={() => setOpen(!open)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer' }}
            >
                <span style={{ color: 'var(--primary-color)', display: 'flex' }}>{icon}</span>
                <span style={{ flex: 1, fontSize: 15 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', backgroundColor: 'var(--surface-color-light)', padding: '4px 10px', borderRadius: 8, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {values.length} selected
                </span>
                <ChevronDown size={14} color="var(--text-muted)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </div>
            {open && (
                <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {options.map(o => {
                        const isOn = values.includes(o.v);
                        return (
                            <button
                                key={o.v}
                                onClick={() => {
                                    playSelect();
                                    const next = isOn
                                        ? values.filter(v => v !== o.v)
                                        : [...values, o.v];
                                    onChange(next);
                                }}
                                style={{
                                    padding: '8px 14px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700,
                                    border: isOn ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                                    backgroundColor: isOn ? 'rgba(255,209,102,0.15)' : 'transparent',
                                    color: isOn ? 'var(--primary-color)' : 'var(--text-main)',
                                    cursor: 'pointer',
                                }}
                            >
                                {o.l}
                            </button>
                        );
                    })}
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
