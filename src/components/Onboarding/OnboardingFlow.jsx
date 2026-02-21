import React, { useState } from 'react';
import { ArrowRight, Volume2, Globe, Clock, Target, Bell, Mic, Star } from 'lucide-react';

const OnboardingFlow = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [onboardingData, setOnboardingData] = useState({
        goal: '',
        dialect: '',
        level: '',
        dailyMins: 10,
    });

    const nextStep = () => setCurrentStep(prev => prev + 1);

    const screens = [
        // Screen 0: Welcome
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
                <button className="primary w-full" onClick={nextStep} style={{ fontSize: 18, padding: '16px' }}>
                    Get started
                </button>
                <button className="secondary w-full" onClick={() => onComplete()} style={{ fontSize: 18, padding: '16px' }}>
                    I already have an account
                </button>
            </div>
        </div>,

        // Screen 1: Goal & Motivation
        <div key="s1" className="onboarding-screen">
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

        // Screen 2: Dialect
        <div key="s2" className="onboarding-screen">
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

        // Screen 3: Level
        <div key="s3" className="onboarding-screen">
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

        // Screen 4: Goal setup
        <div key="s4" className="onboarding-screen">
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

        // Screen 5: Permissions
        <div key="s5" className="onboarding-screen">
            <div className="onboarding-content items-center text-center">
                <h2 className="onboarding-title">Boost your learning</h2>

                <div className="glass-panel w-full mb-6 text-left">
                    <div className="flex items-center gap-4 mb-2">
                        <Bell size={24} color="var(--primary-color)" />
                        <span style={{ fontSize: 18, fontWeight: 700 }}>Notifications</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Reminders help you keep your streak alive and build a habit.</p>
                </div>

                <div className="glass-panel w-full mb-6 text-left">
                    <div className="flex items-center gap-4 mb-2">
                        <Mic size={24} color="var(--primary-color)" />
                        <span style={{ fontSize: 18, fontWeight: 700 }}>Microphone</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Required for pronunciation feedback and speaking exercises.</p>
                </div>

            </div>
            <div className="bottom-cta">
                <button className="primary w-full mb-4" onClick={nextStep}>
                    Allow Access
                </button>
                <button className="ghost w-full" onClick={nextStep}>
                    Maybe later
                </button>
            </div>
        </div>,

        // Screen 6: First Win Mini-Lesson
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
                <button className="primary w-full" onClick={onComplete}>
                    Continue to Roadmap
                </button>
            </div>
        </div>
    ];

    return screens[currentStep];
};

export default OnboardingFlow;
