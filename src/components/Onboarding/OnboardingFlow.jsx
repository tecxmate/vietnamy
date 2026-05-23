import React, { useState, useEffect, useRef } from 'react';
import { Globe, Clock, Target, Star, Play, Square } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { buildTtsUrl } from '../../utils/speak';

const VOICE_OPTIONS = [
    { id: 'google', displayOrder: 1, displayName: 'Ms. Google - Northern Accent', dialect: 'north' },
    { id: 'azure-south', displayOrder: 2, displayName: 'Hoài My · Southern Accent', dialect: 'south' },
    { id: 'azure-north', displayOrder: 3, displayName: 'Nam Minh · Southern Accent', dialect: 'north' },
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
                <h1 className="onboarding-title" style={{ fontSize: 32 }}>Learn Vietnamese<br />the fun way.</h1>
            </div>
            <div className="flex-col gap-4">
                {requireAuth ? (
                    <>
                        {inAppBrowser ? (
                            <div style={{ textAlign: 'center', padding: '20px 16px', backgroundColor: 'var(--surface-color-light)', borderRadius: 12 }}>
                                <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, marginTop: 0 }}>Open in Safari to continue</p>
                                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                                    Google sign-in is not supported in this browser. Copy the link and paste it in Safari or Chrome.
                                </p>
                                <button
                                    className="primary w-full"
                                    onClick={() => {
                                        navigator.clipboard?.writeText(window.location.href);
                                        alert('Link copied! Open Safari or Chrome and paste it.');
                                    }}
                                    style={{ fontSize: 18, padding: '16px' }}
                                >
                                    Copy link
                                </button>
                            </div>
                        ) : (
                            <button
                                className="primary w-full"
                                onClick={signInWithGoogle}
                                style={{ fontSize: 18, padding: '16px' }}
                            >
                                Sign in with Google
                            </button>
                        )}
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                            Sign in to get started
                        </p>
                    </>
                ) : (
                    <>
                        <button className="primary w-full" onClick={nextStep} style={{ fontSize: 18, padding: '16px' }}>
                            Get started
                        </button>
                        {signInWithGoogle && (
                            <button
                                className="secondary w-full"
                                onClick={signInWithGoogle}
                                style={{ fontSize: 18, padding: '16px' }}
                            >
                                Sign in with Google
                            </button>
                        )}
                        <button className="ghost w-full" onClick={() => onComplete()} style={{ fontSize: 16, padding: '12px' }}>
                            I already have an account
                        </button>
                    </>
                )}
            </div>
        </div>,

        // Screen 1: Name
        <div key="s1" className="onboarding-screen">
            <div className="onboarding-content">
                <h2 className="onboarding-title">What's your name?</h2>
                <p className="text-center" style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
                    So we can personalize your experience.
                </p>
                <input
                    type="text"
                    value={onboardingData.name}
                    onChange={(e) => setOnboardingData({ ...onboardingData, name: e.target.value })}
                    placeholder="Enter your name"
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
                    Continue
                </button>
            </div>
        </div>,

        // Screen 2: Goal & Motivation
        <div key="s2" className="onboarding-screen">
            <div className="onboarding-content">
                <h2 className="onboarding-title">Why are you learning Vietnamese?</h2>
                {[
                    { id: 'travel', icon: <Globe />, label: 'Travel basics' },
                    { id: 'family', icon: <Target />, label: 'Talk with family' },
                    { id: 'work', icon: <Clock />, label: 'Work' },
                    { id: 'fun', icon: <Star />, label: 'Just for fun' }
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
                    Continue
                </button>
            </div>
        </div>,

        // Screen 3: Voice picker (also sets dialect)
        <div key="s3" className="onboarding-screen">
            <div className="onboarding-content">
                <h2 className="onboarding-title">Pick a voice you'll learn with</h2>
                <p className="text-center" style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                    Tap ▶ to hear each one. Choose what sounds best to you.
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
                                aria-label={isPlaying ? 'Stop sample' : 'Play sample'}
                            >
                                {isPlaying ? <Square size={18} fill="#fff" /> : <Play size={18} fill="#fff" style={{ marginLeft: 2 }} />}
                            </span>
                            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, textAlign: 'left', flex: 1 }}>
                                <span style={{ fontSize: 17, fontWeight: 700 }}>{v.displayName}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="bottom-cta">
                <button className="primary w-full" onClick={nextStep} disabled={!onboardingData.voiceId}>
                    Continue
                </button>
            </div>
        </div>,

        // Screen 4: Level
        <div key="s4" className="onboarding-screen">
            <div className="onboarding-content">
                <h2 className="onboarding-title">How much Vietnamese do you know?</h2>
                {[
                    { id: 'new', label: 'I am new to Vietnamese' },
                    { id: 'basic', label: 'I know some basics' },
                    { id: 'intermediate', label: 'I am at an intermediate level' }
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
                    Continue
                </button>
            </div>
        </div>,

        // Screen 5: Daily Goal
        <div key="s5" className="onboarding-screen">
            <div className="onboarding-content">
                <h2 className="onboarding-title">Set your daily goal</h2>
                <p className="text-center" style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
                    Consistent practice is the key to fluency.
                </p>
                <div className="flex-col gap-4">
                    {[5, 10, 15, 20].map(mins => (
                        <button
                            key={mins}
                            className={`option-btn w-full ${onboardingData.dailyMins === mins ? 'selected' : ''}`}
                            onClick={() => setOnboardingData({ ...onboardingData, dailyMins: mins })}
                        >
                            <div className="flex justify-between w-full p-2">
                                <span style={{ fontSize: 18, fontWeight: 700 }}>{mins} mins / day</span>
                                <span style={{ color: onboardingData.dailyMins === mins ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 400 }}>
                                    {mins === 5 ? 'Casual' : mins === 10 ? 'Regular' : mins === 15 ? 'Serious' : 'Intense'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            <div className="bottom-cta">
                <button className="primary w-full" onClick={nextStep}>
                    Continue
                </button>
            </div>
        </div>,

        // Screen 6: App Language Selection
        <div key="s_lang" className="onboarding-screen">
            <div className="onboarding-content">
                <h2 className="onboarding-title">App Language</h2>
                <p className="text-center" style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                    Select your default language.
                </p>
                <div className="flex-col gap-3" style={{ overflowY: 'auto', maxHeight: '50vh', padding: '4px' }}>
                    {[
                        { id: 'en', label: 'English' },
                        { id: 'zh', label: '简体中文' },
                        { id: 'zh-t', label: '繁體中文' },
                        { id: 'ja', label: '日本語' },
                        { id: 'ko', label: '한국어' },
                        { id: 'es', label: 'Español' },
                        { id: 'fr', label: 'Français' },
                        { id: 'de', label: 'Deutsch' },
                        { id: 'it', label: 'Italiano' },
                        { id: 'ru', label: 'Русский' },
                        { id: 'no', label: 'Norsk' }
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
                    Continue
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
                <h2 style={{ fontSize: 24, marginBottom: 8 }}>Lesson 1 Complete!</h2>
                <div style={{ width: 120, height: 120, backgroundColor: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '32px 0' }}>
                    <Star size={64} color="#1A1A1A" fill="#1A1A1A" />
                </div>
                <p style={{ fontSize: 18, color: 'var(--text-muted)' }}>You just learned your first basic greeting and tone. Great job!</p>
                <div className="flex gap-4 mt-6">
                    <div className="glass-panel text-center">
                        <span style={{ display: 'block', fontSize: 24, fontWeight: 700, color: 'var(--secondary-color)' }}>+10</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>XP Earned</span>
                    </div>
                    <div className="glass-panel text-center">
                        <span style={{ display: 'block', fontSize: 24, fontWeight: 700, color: '#FF9F1C' }}>1</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Day Streak</span>
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
                    Continue to Roadmap
                </button>
            </div>
        </div>
    ];

    return screens[currentStep];
};

export default OnboardingFlow;
