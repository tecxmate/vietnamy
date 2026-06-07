import React, { useState, useEffect, useRef } from 'react';
import { Globe, Clock, Target, Star, Play, Square, Volume2 } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { buildTtsUrl } from '../../utils/speak';
import { useT } from '../../lib/i18n';

const VOICE_OPTIONS = [
    { id: 'google', displayOrder: 1, displayName: 'Ms. Google', description: 'Female Northern Accent', dialect: 'north', isOfficialAccent: true },
    { id: 'azure-south', displayOrder: 2, displayName: 'Hoài My', description: 'Female Southern Accent', dialect: 'south' },
    { id: 'azure-north', displayOrder: 3, displayName: 'Nam Minh', description: 'Male Northern Accent', dialect: 'north', isOfficialAccent: true },
];

const VOICE_OPTIONS_DISPLAY = [...VOICE_OPTIONS].sort((a, b) => a.displayOrder - b.displayOrder);

const VOICE_SAMPLE = 'Xin chào! Tôi rất vui được làm quen với bạn.';

// Detect in-app browsers that block Google OAuth
function isInAppBrowser() {
    const ua = navigator.userAgent || '';
    // Barcelona = Threads, FBAN/FBAV = Facebook, GSA = Google app
    if (/FBAN|FBAV|Instagram|Threads|Barcelona|Line\/|Twitter|MicroMessenger|Snapchat|TikTok|GSA\//i.test(ua)) return true;
    // iOS: no Safari in UA but has AppleWebKit = likely an in-app webview
    if (/iPhone|iPad/.test(ua) && /AppleWebKit/.test(ua) && !/Safari/.test(ua)) return true;
    return false;
}

const OnboardingFlow = ({ onComplete, requireAuth = false }) => {
    const { updateUserProfile } = useUser();
    const { signInWithGoogle, profile: authProfile } = useAuth();
    const t = useT();
    const [currentStep, setCurrentStep] = useState(requireAuth ? 0 : 1);
    const inAppBrowser = isInAppBrowser();
    const [onboardingData, setOnboardingData] = useState({
        nativeLang: 'en',
        name: '',
        goal: '',
        dialect: '',
        voiceId: '',
        level: '',
        dailyMins: 10,
    });
    const [playingVoice, setPlayingVoice] = useState(null);
    const audioRef = useRef(null);

    const playSample = (voiceId) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (playingVoice === voiceId) {
            setPlayingVoice(null);
            return;
        }
        const url = buildTtsUrl(VOICE_SAMPLE, 'vi', voiceId);
        const audio = new Audio(url);
        audioRef.current = audio;
        setPlayingVoice(voiceId);
        audio.play().catch(() => setPlayingVoice(null));
        const clear = () => {
            if (audioRef.current === audio) audioRef.current = null;
            setPlayingVoice(prev => (prev === voiceId ? null : prev));
        };
        audio.addEventListener('ended', clear);
        audio.addEventListener('error', clear);
    };

    // Tone teaser — play an arbitrary syllable with the chosen voice.
    const [teaserPlaying, setTeaserPlaying] = useState(null);
    const [teaserRevealed, setTeaserRevealed] = useState(false);
    const playClip = (text, key) => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        const audio = new Audio(buildTtsUrl(text, 'vi', onboardingData.voiceId || undefined));
        audioRef.current = audio;
        setTeaserPlaying(key);
        audio.play().catch(() => setTeaserPlaying(null));
        const clear = () => { if (audioRef.current === audio) audioRef.current = null; setTeaserPlaying(prev => (prev === key ? null : prev)); };
        audio.addEventListener('ended', clear);
        audio.addEventListener('error', clear);
    };

    useEffect(() => () => {
        if (audioRef.current) audioRef.current.pause();
    }, []);

    // Auto-populate name from Google profile
    useEffect(() => {
        if (authProfile?.fullName && !onboardingData.name) {
            setOnboardingData(prev => ({ ...prev, name: authProfile.fullName }));
        }
    }, [authProfile]);

    const nextStep = () => setCurrentStep(prev => prev + 1);

    const screens = [
        // Screen 0: Welcome + Sign In
        <div key="s0" className="onboarding-screen">
            <div className="onboarding-content">
                <div className="flex justify-center mb-4">
                    <img
                        src="/icon-192.png"
                        alt="Vietnamy"
                        width="120"
                        height="120"
                        style={{ borderRadius: 24, display: 'block' }}
                    />
                </div>
                <h1 className="onboarding-title" style={{ fontSize: 32 }}>{t('onboarding_welcome_title')}</h1>
            </div>
            <div className="flex-col gap-4">
                {requireAuth ? (
                    <>
                        {inAppBrowser ? (
                            <div style={{ textAlign: 'center', padding: '20px 16px', backgroundColor: 'var(--surface-color-light)', borderRadius: 12 }}>
                                <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, marginTop: 0 }}>{t('onboarding_name_open_browser_title')}</p>
                                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                                    {t('onboarding_open_browser_desc')}
                                </p>
                                <button
                                    className="primary w-full"
                                    onClick={() => {
                                        navigator.clipboard?.writeText(window.location.href);
                                        alert(t('onboarding_copy_link_hint'));
                                    }}
                                    style={{ fontSize: 18, padding: '16px' }}
                                >
                                    {t('onboarding_copy_link')}
                                </button>
                            </div>
                        ) : (
                            <button
                                className="primary w-full"
                                onClick={signInWithGoogle}
                                style={{ fontSize: 18, padding: '16px' }}
                            >
                                {t('onboarding_sign_in_google')}
                            </button>
                        )}
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                            {t('onboarding_sign_in_help')}
                        </p>
                    </>
                ) : (
                    <>
                        <button className="primary w-full" onClick={nextStep} style={{ fontSize: 18, padding: '16px' }}>
                            {t('onboarding_get_started')}
                        </button>
                        {signInWithGoogle && (
                            <button
                                className="secondary w-full"
                                onClick={signInWithGoogle}
                                style={{ fontSize: 18, padding: '16px' }}
                            >
                                {t('onboarding_sign_in_google')}
                            </button>
                        )}
                        <button className="ghost w-full" onClick={() => onComplete()} style={{ fontSize: 16, padding: '12px' }}>
                            {t('onboarding_have_account')}
                        </button>
                    </>
                )}
            </div>
        </div>,

        // Screen 1: Name
        <div key="s1" className="onboarding-screen">
            <div className="onboarding-content">
                <h2 className="onboarding-title">{t('onboarding_name_label')}</h2>
                <p className="text-center" style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
                    {t('onboarding_name_help')}
                </p>
                <input
                    type="text"
                    value={onboardingData.name}
                    onChange={(e) => setOnboardingData({ ...onboardingData, name: e.target.value })}
                    placeholder={t('onboarding_name_placeholder')}
                    autoFocus
                    maxLength={30}
                    style={{
                        width: '100%', padding: 16, fontSize: 20, borderRadius: 12,
                        border: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)',
                        color: 'var(--text-main)', outline: 'none', textAlign: 'center',
                        boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && onboardingData.name.trim()) nextStep(); }}
                />
            </div>
            <div className="bottom-cta">
                <button className="primary w-full" onClick={nextStep} disabled={!onboardingData.name.trim()}>
                    {t('onboarding_continue')}
                </button>
            </div>
        </div>,

        // Screen 2: Goal & Motivation
        <div key="s2" className="onboarding-screen">
            <div className="onboarding-content">
                <h2 className="onboarding-title">{t('onboarding_goal_title')}</h2>
                {[
                    { id: 'travel', icon: <Globe />, label: t('onboarding_goal_travel') },
                    { id: 'family', icon: <Target />, label: t('onboarding_goal_family') },
                    { id: 'work', icon: <Clock />, label: t('onboarding_goal_work') },
                    { id: 'fun', icon: <Star />, label: t('onboarding_goal_fun') }
                ].map(item => (
                    <button
                        key={item.id}
                        className={`option-btn w-full ${onboardingData.goal === item.id ? 'selected' : ''}`}
                        onClick={() => setOnboardingData({ ...onboardingData, goal: item.id })}
                    >
                        <div className="flex items-center gap-4 text-left p-2">
                            <span style={{ color: onboardingData.goal === item.id ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                                {item.icon}
                            </span>
                            <span style={{ fontSize: 18 }}>{item.label}</span>
                        </div>
                    </button>
                ))}
            </div>
            <div className="bottom-cta">
                <button className="primary w-full" onClick={nextStep} disabled={!onboardingData.goal}>
                    {t('onboarding_continue')}
                </button>
            </div>
        </div>,

        // Screen 3: Voice picker (also sets dialect)
        <div key="s3" className="onboarding-screen">
            <div className="onboarding-content">
                <h2 className="onboarding-title">{t('onboarding_voice_title')}</h2>
                <p className="text-center" style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                    {t('onboarding_voice_help')}
                </p>
                {VOICE_OPTIONS_DISPLAY.map(v => {
                    const selected = onboardingData.voiceId === v.id;
                    const isPlaying = playingVoice === v.id;
                    return (
                        <button
                            key={v.id}
                            className={`option-btn w-full ${selected ? 'selected' : ''}`}
                            onClick={() => setOnboardingData({ ...onboardingData, voiceId: v.id, dialect: v.dialect })}
                            style={{ padding: '14px 16px', alignItems: 'center', gap: 12, marginBottom: 12 }}
                        >
                            <span
                                onClick={(e) => { e.stopPropagation(); playSample(v.id); }}
                                style={{
                                    width: 44, height: 44, borderRadius: '50%',
                                    background: isPlaying ? 'var(--secondary-color)' : 'var(--primary-color)',
                                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, cursor: 'pointer',
                                }}
                                aria-label={isPlaying ? t('onboarding_voice_stop_sample') : t('onboarding_voice_play_sample')}
                            >
                                {isPlaying ? <Square size={18} fill="#fff" /> : <Play size={18} fill="#fff" style={{ marginLeft: 2 }} />}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, textAlign: 'left', flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 17, fontWeight: 700 }}>{v.displayName}</span>
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginLeft: 'auto', minWidth: 0, flexWrap: 'wrap' }}>
                                    {v.isOfficialAccent && (
                                        <span
                                            aria-label="Main official accent"
                                            title="Main official accent"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#FF9F1C',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Star size={16} fill="currentColor" />
                                        </span>
                                    )}
                                    <span style={{ fontSize: 13, fontWeight: 600, color: selected ? 'inherit' : 'var(--text-muted)', textAlign: 'right' }}>{v.description}</span>
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="bottom-cta">
                <button className="primary w-full" onClick={nextStep} disabled={!onboardingData.voiceId}>
                    {t('onboarding_continue')}
                </button>
            </div>
        </div>,

        // Screen 4: Level
        <div key="s4" className="onboarding-screen">
            <div className="onboarding-content">
                <h2 className="onboarding-title">{t('onboarding_level_title')}</h2>
                {[
                    { id: 'new', label: t('onboarding_level_new') },
                    { id: 'basic', label: t('onboarding_level_basic') },
                    { id: 'intermediate', label: t('onboarding_level_intermediate') }
                ].map(item => (
                    <button
                        key={item.id}
                        className={`option-btn w-full text-left justify-start ${onboardingData.level === item.id ? 'selected' : ''}`}
                        onClick={() => setOnboardingData({ ...onboardingData, level: item.id })}
                        style={{ padding: '20px' }}
                    >
                        <span style={{ fontSize: 18 }}>{item.label}</span>
                    </button>
                ))}
            </div>
            <div className="bottom-cta">
                <button className="primary w-full" onClick={nextStep} disabled={!onboardingData.level}>
                    {t('onboarding_continue')}
                </button>
            </div>
        </div>,

        // Screen 5: Daily Goal
        <div key="s5" className="onboarding-screen">
            <div className="onboarding-content">
                <h2 className="onboarding-title">{t('onboarding_daily_goal_title')}</h2>
                <p className="text-center" style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
                    {t('onboarding_daily_goal_help')}
                </p>
                <div className="flex-col gap-4">
                    {[5, 10, 15, 20].map(mins => (
                        <button
                            key={mins}
                            className={`option-btn w-full ${onboardingData.dailyMins === mins ? 'selected' : ''}`}
                            onClick={() => setOnboardingData({ ...onboardingData, dailyMins: mins })}
                        >
                            <div className="flex justify-between w-full p-2">
                                <span style={{ fontSize: 18, fontWeight: 700 }}>{t(`onboarding_goal_${mins}`)}</span>
                                <span style={{ color: onboardingData.dailyMins === mins ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 400 }}>
                                    {mins === 5 ? t('onboarding_goal_casual') : mins === 10 ? t('onboarding_goal_regular') : mins === 15 ? t('onboarding_goal_serious') : t('onboarding_goal_intense')}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            <div className="bottom-cta">
                <button className="primary w-full" onClick={nextStep}>
                    {t('onboarding_continue')}
                </button>
            </div>
        </div>,

        // Screen 6: App Language Selection
        <div key="s_lang" className="onboarding-screen">
            <div className="onboarding-content">
                <h2 className="onboarding-title">{t('onboarding_app_lang_title')}</h2>
                <p className="text-center" style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                    {t('onboarding_app_lang_help')}
                </p>
                <div className="flex-col gap-3" style={{ overflowY: 'auto', maxHeight: '50vh', padding: '4px' }}>
                    {[
                        { id: 'en', label: t('onboarding_lang_en') },
                        { id: 'zh-s', label: t('onboarding_lang_zh_s') },
                        { id: 'zh-t', label: t('onboarding_lang_zh_t') },
                    ].map(lang => (
                        <button
                            key={lang.id}
                            className={`option-btn w-full ${onboardingData.nativeLang === lang.id ? 'selected' : ''}`}
                            onClick={() => {
                                setOnboardingData({ ...onboardingData, nativeLang: lang.id });
                                updateUserProfile({ nativeLang: lang.id });
                            }}
                            style={{ padding: '16px', justifyContent: 'center' }}
                        >
                            <span style={{ fontSize: 18, fontWeight: 600 }}>{lang.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="bottom-cta">
                <button className="primary w-full" onClick={nextStep} disabled={!onboardingData.nativeLang}>
                    {t('onboarding_continue')}
                </button>
            </div>
        </div>,

        // Screen: Tone teaser — "can you hear it?" (the hook for Foundations)
        <div key="s_teaser" className="onboarding-screen">
            <div className="onboarding-content items-center text-center">
                <h2 style={{ fontSize: 24, marginBottom: 8 }}>{t('onboarding_teaser_title', 'Can you hear it?')}</h2>
                <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 28, maxWidth: 320 }}>
                    {t('onboarding_teaser_sub', 'Tap to listen. Same letters — but is it the same word?')}
                </p>
                <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                    {[['ma', 'a'], ['mà', 'b']].map(([syl, key]) => (
                        <button
                            key={key}
                            className="secondary"
                            onClick={() => playClip(syl, key)}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                padding: '20px 28px', borderRadius: 16, fontSize: 28, fontWeight: 800,
                                borderColor: teaserPlaying === key ? 'var(--primary-color)' : 'var(--border-color)',
                            }}
                        >
                            <Volume2 size={22} color="var(--secondary-color)" />
                            {syl}
                        </button>
                    ))}
                </div>
                {!teaserRevealed ? (
                    <>
                        <p style={{ fontSize: 15, marginBottom: 12 }}>{t('onboarding_teaser_q', 'Do they mean the same word?')}</p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="secondary" onClick={() => setTeaserRevealed(true)} style={{ padding: '12px 28px', borderRadius: 12, fontWeight: 700 }}>
                                {t('onboarding_teaser_same', 'Same')}
                            </button>
                            <button className="secondary" onClick={() => setTeaserRevealed(true)} style={{ padding: '12px 28px', borderRadius: 12, fontWeight: 700 }}>
                                {t('onboarding_teaser_diff', 'Different')}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="glass-panel text-center" style={{ maxWidth: 340 }}>
                        <p style={{ fontWeight: 800, fontSize: 17, marginBottom: 6, color: 'var(--primary-color)' }}>
                            {t('onboarding_teaser_reveal_title', 'Different words!')}
                        </p>
                        <p style={{ fontSize: 16, marginBottom: 8 }}><strong>ma</strong> = {t('onboarding_teaser_ma', 'ghost')} · <strong>mà</strong> = {t('onboarding_teaser_mafall', 'but')}</p>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            {t('onboarding_teaser_reveal_body', 'Vietnamese has 6 tones — the same letters change meaning with pitch. That’s what we’ll train first.')}
                        </p>
                    </div>
                )}
            </div>
            <div className="bottom-cta">
                <button className="primary w-full" onClick={nextStep} disabled={!teaserRevealed}>
                    {t('continue_upper', 'CONTINUE')}
                </button>
            </div>
        </div>,
        // Screen 7: First Win Mini-Lesson
        <div key="s6" className="onboarding-screen" style={{ backgroundColor: 'var(--surface-color)' }}>
            <div className="flex items-center justify-center p-4">
                <div style={{ width: '100%', height: 12, backgroundColor: 'var(--surface-color-light)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: '80%', height: '100%', backgroundColor: 'var(--primary-color)' }}></div>
                </div>
            </div>
            <div className="onboarding-content items-center text-center" style={{ paddingTop: 0 }}>
                <h2 style={{ fontSize: 24, marginBottom: 8 }}>{t('onboarding_first_win_title')}</h2>
                <div style={{ width: 120, height: 120, backgroundColor: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '32px 0' }}>
                    <Star size={64} color="#1A1A1A" fill="#1A1A1A" />
                </div>
                <p style={{ fontSize: 18, color: 'var(--text-muted)' }}>{t('onboarding_first_win_desc')}</p>
                <div className="flex gap-4 mt-6">
                    <div className="glass-panel text-center">
                        <span style={{ display: 'block', fontSize: 24, fontWeight: 700, color: 'var(--secondary-color)' }}>+10</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('onboarding_first_win_xp')}</span>
                    </div>
                    <div className="glass-panel text-center">
                        <span style={{ display: 'block', fontSize: 24, fontWeight: 700, color: '#FF9F1C' }}>1</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('onboarding_first_win_streak')}</span>
                    </div>
                </div>
            </div>
            <div className="bottom-cta">
                <button className="primary w-full" onClick={() => {
                    updateUserProfile({
                        nativeLang: onboardingData.nativeLang,
                        name: onboardingData.name.trim() || 'Bạn',
                        goal: onboardingData.goal,
                        dialect: onboardingData.dialect,
                        level: onboardingData.level,
                        dailyMins: onboardingData.dailyMins,
                    });
                    if (onboardingData.voiceId) {
                        try {
                            const raw = localStorage.getItem('vnme_settings');
                            const settings = raw ? JSON.parse(raw) : {};
                            settings.ttsVoice = onboardingData.voiceId;
                            localStorage.setItem('vnme_settings', JSON.stringify(settings));
                        } catch { /* ignore */ }
                    }
                    onComplete();
                }}>
                    {t('onboarding_continue_to_roadmap')}
                </button>
            </div>
        </div>
    ];

    return screens[currentStep];
};

export default OnboardingFlow;
