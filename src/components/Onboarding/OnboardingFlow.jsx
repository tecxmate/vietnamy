import React, { useState, useEffect } from 'react';
import { Globe, Clock, Target, Star } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';

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
        level: '',
        dailyMins: 10,
    });

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
                    <div style={{ width: 120, height: 120, backgroundColor: 'var(--primary-color)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 64 }}>🇻🇳</span>
                    </div>
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
                                    Google sign-in is not supported in this browser. Tap <strong>⋯</strong> above and select <strong>"Open in Safari"</strong>.
                                </p>
                                <button
                                    className="primary w-full"
                                    onClick={() => {
                                        navigator.clipboard?.writeText(window.location.href);
                                        alert('Link copied! Paste it in Safari or Chrome.');
                                    }}
                                    style={{ fontSize: 16, padding: '14px' }}
                                >
                                    Copy link
                                </button>
                            </div>
                        ) : (
                            <button
                                className="primary w-full"
                                onClick={signInWithGoogle}
                                style={{ fontSize: 18, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                            >
                                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#fff" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
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
                                style={{ fontSize: 18, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                            >
                                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
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

        // Screen 3: Dialect
        <div key="s3" className="onboarding-screen">
            <div className="onboarding-content">
                <h2 className="onboarding-title">Choose your dialect focus</h2>
                <p className="text-center" style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
                    Vietnamese sounds different depending on the region.
                </p>
                {[
                    { id: 'north', title: 'Northern (Hanoi)', desc: 'Standard for national TV' },
                    { id: 'south', title: 'Southern (Saigon)', desc: 'Common in diaspora & pop culture' },
                    { id: 'both', title: 'Both', desc: 'I want to understand everyone!' }
                ].map(item => (
                    <button
                        key={item.id}
                        className={`option-btn w-full ${onboardingData.dialect === item.id ? 'selected' : ''}`}
                        onClick={() => setOnboardingData({ ...onboardingData, dialect: item.id })}
                        style={{ padding: '16px 20px', alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}
                    >
                        <span style={{ fontSize: 18, fontWeight: 700 }}>{item.title}</span>
                        <span style={{ fontSize: 14, fontWeight: 400, color: onboardingData.dialect === item.id ? 'inherit' : 'var(--text-muted)' }}>{item.desc}</span>
                    </button>
                ))}
            </div>
            <div className="bottom-cta">
                <button className="primary w-full" onClick={nextStep} disabled={!onboardingData.dialect}>
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
