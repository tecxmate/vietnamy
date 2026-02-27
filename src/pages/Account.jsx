import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, ChevronRight, Flame, BookOpen, Zap, Star, Target, Clock, TrendingUp,
    Mail, RefreshCw, LogOut, Shield, BarChart3, Lock,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useDong } from '../context/DongContext';
import { getUnits, getNodesForUnitWithProgress } from '../lib/db';

const MOCK_STATS = {
    wordsLearned: 147, lessonsCompleted: 18,
    practiceMinutes: 342, avgAccuracy: 84,
};

const MOCK_WEEK = [
    { day: 'M', mins: 12 },
    { day: 'T', mins: 18 },
    { day: 'W', mins: 8 },
    { day: 'T', mins: 22 },
    { day: 'F', mins: 15 },
    { day: 'S', mins: 0 },
    { day: 'S', mins: 10 },
];

const MY_BADGES = [
    { icon: <Flame size={18} />, title: 'First Flame', color: '#FF6B35', unlocked: true },
    { icon: <BookOpen size={18} />, title: 'Word Collector', color: '#1CB0F6', unlocked: true },
    { icon: <Zap size={18} />, title: '3-Day Streak', color: '#FFD166', unlocked: true },
    { icon: <Star size={18} />, title: 'Perfect Score', color: '#CE82FF', unlocked: true },
    { icon: <Target size={18} />, title: 'Unit Master', color: '#06D6A0', unlocked: true },
    { icon: <Flame size={18} />, title: '7-Day Streak', color: '#FF6B35', unlocked: false },
    { icon: <Star size={18} />, title: 'Grammar Guru', color: '#FFD166', unlocked: false },
    { icon: <Zap size={18} />, title: 'Speed Demon', color: '#06D6A0', unlocked: false },
];

const Account = () => {
    const navigate = useNavigate();
    const { userProfile } = useUser();
    const { completedNodes, dailyStreak } = useDong();
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const dialectLabel = userProfile.dialect === 'north' ? 'Northern' : userProfile.dialect === 'south' ? 'Southern' : userProfile.dialect === 'both' ? 'Both Dialects' : '';
    const goalLabel = userProfile.dailyMins ? `${userProfile.dailyMins}m/day` : '';

    // Compute progress
    const { totalCompleted, totalNodes, levelPct } = useMemo(() => {
        const units = getUnits();
        let comp = 0, total = 0;
        units.forEach(unit => {
            const nodes = getNodesForUnitWithProgress(unit.id, completedNodes);
            comp += nodes.filter(n => n.status === 'completed').length;
            total += nodes.length;
        });
        return { totalCompleted: comp, totalNodes: total, levelPct: total > 0 ? Math.round((comp / total) * 100) : 0 };
    }, [completedNodes]);

    const s = MOCK_STATS;
    const maxMins = Math.max(...MOCK_WEEK.map(d => d.mins), 1);
    const unlockedCount = MY_BADGES.filter(b => b.unlocked).length;

    const handleReset = () => {
        localStorage.clear();
        window.location.reload();
    };

    const handleLogout = () => {
        if (confirm('Log out of your account?')) {
            alert('MOCKUP: Logs user out and redirects to login screen.');
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: 32 }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)',
            }}>
                <button className="ghost" onClick={() => navigate(-1)} style={{ padding: 6, display: 'flex' }}>
                    <ArrowLeft size={22} />
                </button>
                <span style={{ fontSize: 18, fontWeight: 800 }}>Account</span>
            </div>

            <div style={{ padding: '20px 20px 0' }}>

                {/* ═══ My Progress Card ═════════════════════════════ */}
                <div style={{
                    backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)', padding: 20, marginBottom: 20,
                }}>
                    <SectionLabel icon={<BarChart3 size={14} />} title="My Progress" noMargin />

                    {/* Profile + Level */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                            backgroundColor: '#06D6A0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: 22, fontWeight: 900,
                        }}>
                            A1
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: 18, fontWeight: 800 }}>{userProfile.name || 'Bạn'}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{levelPct}% to A2</span>
                            </div>
                            <div style={{
                                height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 6,
                                backgroundColor: 'var(--surface-color-light)', border: '1px solid var(--border-color)',
                            }}>
                                <div style={{
                                    width: `${levelPct}%`, height: '100%', borderRadius: 4,
                                    backgroundColor: '#06D6A0',
                                    transition: 'width 0.3s',
                                }} />
                            </div>
                            <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 12, fontWeight: 700 }}>
                                <span style={{ color: 'var(--text-muted)' }}>{totalCompleted} / {totalNodes} nodes</span>
                                <span style={{ color: '#FF6B35', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Flame size={11} fill="#FF6B35" /> {dailyStreak}d streak
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16 }}>
                        {[
                            { icon: <BookOpen size={14} />, val: s.wordsLearned, label: 'Words', color: '#1CB0F6' },
                            { icon: <Target size={14} />, val: s.lessonsCompleted, label: 'Lessons', color: '#FFD166' },
                            { icon: <Clock size={14} />, val: `${s.practiceMinutes}m`, label: 'Practice', color: '#CE82FF' },
                            { icon: <TrendingUp size={14} />, val: `${s.avgAccuracy}%`, label: 'Accuracy', color: '#06D6A0' },
                        ].map((st, i) => (
                            <div key={i} style={{
                                textAlign: 'center', padding: '10px 4px',
                                backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                            }}>
                                <div style={{ color: st.color, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{st.icon}</div>
                                <div style={{ fontSize: 18, fontWeight: 800 }}>{st.val}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{st.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* This Week Chart */}
                    <div style={{ marginTop: 20 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>This Week</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, height: 80, gap: 6 }}>
                            {MOCK_WEEK.map((d, i) => {
                                const barH = d.mins > 0 ? Math.max((d.mins / maxMins) * 60, 6) : 2;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{d.mins}</span>
                                        <div style={{
                                            width: '100%', maxWidth: 28, height: barH, borderRadius: 4,
                                            backgroundColor: d.mins > 0 ? 'var(--primary-color)' : 'var(--border-color)',
                                        }} />
                                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>{d.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Badges */}
                    <div style={{ marginTop: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>
                                Badges ({unlockedCount}/{MY_BADGES.length})
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                            {MY_BADGES.map((badge, i) => (
                                <div key={i} style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                    minWidth: 52, flexShrink: 0,
                                }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: badge.unlocked ? badge.color + '18' : 'var(--surface-color-light)',
                                        color: badge.unlocked ? badge.color : 'var(--text-muted)',
                                        border: `2px solid ${badge.unlocked ? badge.color + '40' : 'var(--border-color)'}`,
                                        opacity: badge.unlocked ? 1 : 0.4,
                                    }}>
                                        {badge.unlocked ? badge.icon : <Lock size={14} />}
                                    </div>
                                    <span style={{
                                        fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
                                        color: badge.unlocked ? 'var(--text-main)' : 'var(--text-muted)',
                                        opacity: badge.unlocked ? 1 : 0.5,
                                    }}>
                                        {badge.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ Account Management ═════════════════════════ */}
                <div style={{ marginBottom: 20 }}>
                    <SectionLabel icon={<Shield size={14} />} title="Account" />
                    <div style={{
                        backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-color)', overflow: 'hidden',
                    }}>
                        <AccountRow
                            icon={<Mail size={16} />}
                            label="Change Email"
                            detail="learner@example.com"
                            onClick={() => alert('MOCKUP: Opens email change form. Sends verification to new email.')}
                        />
                        <AccountRow
                            icon={<User size={16} />}
                            label="Edit Profile"
                            detail="Name, avatar, dialect"
                            onClick={() => alert('MOCKUP: Opens profile editor with name, avatar upload, dialect preference.')}
                        />
                        <AccountRow
                            icon={<RefreshCw size={16} />}
                            label="Reset All Progress"
                            color="var(--danger-color)"
                            onClick={() => setShowResetConfirm(true)}
                        />
                        <AccountRow
                            icon={<LogOut size={16} />}
                            label="Log Out"
                            color="#EF476F"
                            onClick={handleLogout}
                            last
                        />
                    </div>
                </div>

                {/* App Info */}
                <div style={{ textAlign: 'center', padding: '12px 0 24px', color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13 }}>Vietnamy Education</p>
                    <p style={{ margin: 0, fontSize: 11 }}>Version 1.0.0</p>
                    <p style={{ margin: '8px 0 0', fontSize: 11 }}>
                        <span style={{ color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>
                        {' · '}
                        <span style={{ color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>
                    </p>
                </div>
            </div>

            {/* ═══ Reset Confirmation Modal ═══════════════════ */}
            {showResetConfirm && (
                <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
                    <div className="modal-content slide-up" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: '32px 24px' }}>
                        <RefreshCw size={40} style={{ color: '#EF476F', marginBottom: 16 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>Reset All Progress?</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 24px' }}>
                            This will erase all your learning data. This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                style={{
                                    flex: 1, padding: '14px 20px', borderRadius: 'var(--radius-md)',
                                    border: '2px solid var(--border-color)', backgroundColor: 'transparent',
                                    color: 'var(--text-main)', fontSize: 15, fontWeight: 700,
                                    cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReset}
                                style={{
                                    flex: 1, padding: '14px 20px', borderRadius: 'var(--radius-md)',
                                    border: 'none', backgroundColor: '#EF476F', color: 'white',
                                    fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                                }}
                            >
                                Reset Everything
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SectionLabel = ({ icon, title, noMargin }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: noMargin ? 0 : 10,
    }}>
        <span style={{ color: 'var(--primary-color)', display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>
            {title}
        </span>
    </div>
);

const AccountRow = ({ icon, label, detail, color, onClick, last }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            borderBottom: last ? 'none' : '1px solid var(--border-color)',
            cursor: 'pointer',
        }}
    >
        <span style={{ color: color || 'var(--primary-color)', display: 'flex' }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: color || 'var(--text-main)' }}>{label}</span>
        {detail && <span style={{ fontSize: 12, color: color || 'var(--text-muted)', fontWeight: 600 }}>{detail}</span>}
        <ChevronRight size={16} color="var(--text-muted)" />
    </div>
);

export default Account;
