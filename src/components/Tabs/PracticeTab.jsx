import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Music, Users, Hash, PenTool, Type, BookOpen, Activity, Keyboard, Lock } from 'lucide-react';
import { useDong } from '../../context/DongContext';

const PracticeTab = () => {
    const { balance, isUnlocked, unlockModule, getModuleCost, initialized } = useDong();
    const [unlockTarget, setUnlockTarget] = useState(null);
    const [justUnlocked, setJustUnlocked] = useState(null);

    const practiceModules = [
        { id: 'tones', title: 'Tone Mastery', icon: <Music size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/tones' },
        { id: 'pronouns', title: 'Pronouns', icon: <Users size={24} className="practice-icon" />, level: 'All Levels', link: '/practice/pronouns' },
        { id: 'numbers', title: 'Numbers', icon: <Hash size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/numbers' },
        { id: 'tonemarks', title: 'Tone Marks', icon: <PenTool size={24} className="practice-icon" />, level: 'Intermediate', link: '/practice/tonemarks' },
        { id: 'vowels', title: 'Vowels', icon: <Type size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/vowels' },
        { id: 'vocab', title: 'Vocabulary', icon: <BookOpen size={24} className="practice-icon" />, level: 'Dynamic SRS', link: '/practice/vocab' },
        { id: 'pitch', title: 'Pitch Training', icon: <Activity size={24} className="practice-icon" />, level: 'Advanced', link: '/practice/pitch' },
        { id: 'telex', title: 'TELEX Typing', icon: <Keyboard size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/telex' },
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
            {initialized && <div style={{ fontSize: 14, fontWeight: 'bold', color: '#F2C255', marginBottom: 16 }}>{balance.toLocaleString()}₫</div>}

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
        </div>
    );
};

export default PracticeTab;
