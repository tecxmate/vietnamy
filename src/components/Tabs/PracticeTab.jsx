import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Music, Users, Hash, PenTool, Type, Keyboard, Lock, Layers, Crown, Briefcase, Home, Building, Wine, Flag } from 'lucide-react';
import { useDong } from '../../context/DongContext';
import PremiumModal from '../PremiumModal';

const executiveModules = [
    { id: 'biz-etiquette', title: 'Business Etiquette', icon: <Briefcase size={24} className="practice-icon" />, level: 'Executive' },
    { id: 'directing-staff', title: 'Directing Staff', icon: <Home size={24} className="practice-icon" />, level: 'Executive' },
    { id: 'real-estate', title: 'Real Estate', icon: <Building size={24} className="practice-icon" />, level: 'Executive' },
    { id: 'networking', title: 'Networking Dinners', icon: <Wine size={24} className="practice-icon" />, level: 'Executive' },
    { id: 'golf-vn', title: 'Golf Vietnamese', icon: <Flag size={24} className="practice-icon" />, level: 'Executive' },
];

const PracticeTab = () => {
    const { balance, isUnlocked, unlockModule, getModuleCost, initialized, isExecutive } = useDong();
    const [unlockTarget, setUnlockTarget] = useState(null);
    const [justUnlocked, setJustUnlocked] = useState(null);
    const [showPremium, setShowPremium] = useState(false);

    const practiceModules = [
        { id: 'tones', title: 'Tone Mastery', icon: <Music size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/tones' },
        { id: 'pronouns', title: 'Pronouns', icon: <Users size={24} className="practice-icon" />, level: 'All Levels', link: '/practice/pronouns' },
        { id: 'numbers', title: 'Numbers', icon: <Hash size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/numbers' },
        { id: 'tonemarks', title: 'Tone Marks', icon: <PenTool size={24} className="practice-icon" />, level: 'Intermediate', link: '/practice/tonemarks' },
        { id: 'vowels', title: 'Vowels', icon: <Type size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/vowels' },
        // { id: 'pitch', title: 'Pitch Training', icon: <Activity size={24} className="practice-icon" />, level: 'Advanced', link: '/practice/pitch' },
        { id: 'telex', title: 'TELEX Typing', icon: <Keyboard size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/telex' },
        { id: 'flashcards', title: 'Flashcard Decks', icon: <Layers size={24} className="practice-icon" />, level: 'All Levels', link: '/practice/flashcards' },
    ];

    const handleCardClick = (ex, e) => {
        const cost = getModuleCost(ex.id);
        if (cost !== null && !isUnlocked(ex.id)) {
            e.preventDefault(); // Prevent navigation
            setUnlockTarget(ex);
        }
    };

    const handleUnlock = () => {
        if (!unlockTarget) return;
        const success = unlockModule(unlockTarget.id);
        if (success) {
            setJustUnlocked(unlockTarget.id);
            setUnlockTarget(null);
            setTimeout(() => setJustUnlocked(null), 1500);
        }
    };

    const cost = unlockTarget ? getModuleCost(unlockTarget.id) : 0;
    const canAfford = balance >= (cost || 0);

    return (
        <div style={{ padding: 'var(--spacing-4)', paddingBottom: '100px' }}>
            <div className="practice-grid">
                {practiceModules.map((mod, idx) => {
                    const moduleCost = getModuleCost(mod.id);
                    const locked = moduleCost !== null && !isUnlocked(mod.id);
                    const isFlash = justUnlocked === mod.id;

                    return (
                        <Link
                            key={idx}
                            to={mod.link}
                            onClick={(e) => handleCardClick(mod, e)}
                            className={`practice-card ${locked ? 'locked' : ''}`}
                            style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                border: isFlash ? '2px solid #06D6A0' : undefined
                            }}
                        >
                            {locked && (
                                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, backgroundColor: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 12 }}>
                                    <Lock size={12} />
                                    {moduleCost.toLocaleString()}₫
                                </div>
                            )}
                            {mod.icon}
                            <h3 style={{ fontSize: 16, margin: 0, marginTop: 12 }}>{mod.title}</h3>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{mod.level}</span>
                        </Link>
                    );
                })}
            </div>

            {/* ─── Executive Modules ──────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '28px 0 16px', paddingBottom: 12, borderBottom: '1px solid rgba(255, 209, 102, 0.2)' }}>
                <Crown size={20} color="#FFD166" fill="#FFD166" />
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#FFD166' }}>Executive Modules</h2>
                <span style={{ fontSize: 10, fontWeight: 900, background: '#FFD166', color: '#1A1A1A', padding: '2px 8px', borderRadius: 8, letterSpacing: 0.5 }}>PRO</span>
            </div>
            <div className="practice-grid">
                {executiveModules.map((mod, idx) => (
                    <div
                        key={idx}
                        onClick={() => !isExecutive && setShowPremium(true)}
                        className={`practice-card ${isExecutive ? '' : 'locked'}`}
                        style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: isExecutive ? 'default' : 'pointer',
                            opacity: isExecutive ? 1 : 0.75,
                            border: isExecutive ? '1.5px solid rgba(255, 209, 102, 0.4)' : undefined,
                        }}
                    >
                        <div style={{
                            position: 'absolute', top: 8, right: 8,
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 9, fontWeight: 900, letterSpacing: 0.5,
                            backgroundColor: isExecutive ? 'rgba(6, 214, 160, 0.9)' : 'rgba(255, 209, 102, 0.9)',
                            color: '#1A1A1A',
                            padding: '3px 8px', borderRadius: 8,
                        }}>
                            <Crown size={10} /> {isExecutive ? 'UNLOCKED' : 'EXECUTIVE'}
                        </div>
                        {mod.icon}
                        <h3 style={{ fontSize: 16, margin: 0, marginTop: 12 }}>{mod.title}</h3>
                        <span style={{ fontSize: 12, color: '#FFD166', marginTop: 4, fontWeight: 700 }}>{mod.level}</span>
                    </div>
                ))}
            </div>

            {/* Unlock Modal Overlay */}
            {unlockTarget && (
                <div className="modal-overlay" onClick={() => setUnlockTarget(null)}>
                    <div className="modal-content slide-up" onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>🔓 Unlock {unlockTarget.title}?</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 24, fontWeight: 'bold', margin: '16px 0', color: '#F2C255' }}>
                            <span>{cost?.toLocaleString()}₫</span>
                        </div>
                        {!canAfford && (
                            <p style={{ color: 'var(--danger-color)', fontSize: 14 }}>
                                Not enough ₫! Complete lessons to earn more.
                            </p>
                        )}
                        <div className="flex gap-4 mt-6">
                            <button
                                className="primary w-full"
                                onClick={handleUnlock}
                                disabled={!canAfford}
                            >
                                Unlock
                            </button>
                            <button
                                className="ghost w-full"
                                onClick={() => setUnlockTarget(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
        </div>
    );
};

export default PracticeTab;
