import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Flame, BookOpen, Clock, Target, TrendingUp,
    Award, Calendar, BarChart3, Zap, Star, ChevronRight
} from 'lucide-react';
import { useDong } from '../context/DongContext';
import { useUser } from '../context/UserContext';

const MOCK_STATS = {
    wordsLearned: 147,
    wordsTotal: 2400,
    lessonsCompleted: 18,
    lessonsTotal: 120,
    grammarPatterns: 12,
    practiceMinutes: 342,
    avgAccuracy: 84,
    bestStreak: 15,
    totalXP: 8650,
    level: 'A1',
    levelProgress: 68,
    weeklyMinutes: [12, 18, 8, 22, 15, 0, 10], // Mon-Sun
};

const StatCard = ({ icon, label, value, sub, color = 'var(--primary-color)' }) => (
    <div style={{
        flex: '1 1 calc(50% - 6px)', minWidth: 140, padding: 16,
        backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ color, display: 'flex' }}>{icon}</div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
);

const ProfileStats = () => {
    const navigate = useNavigate();
    const { balance, dailyStreak } = useDong();
    const { userProfile } = useUser();
    const s = MOCK_STATS;
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const maxMin = Math.max(...s.weeklyMinutes, 1);

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
                <span style={{ fontSize: 18, fontWeight: 800 }}>My Profile</span>
            </div>

            <div style={{ padding: '20px 20px 0' }}>
                {/* Profile Card */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: 20,
                    backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)', marginBottom: 20,
                }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--primary-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1A1A', flexShrink: 0,
                    }}>
                        <User size={32} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800 }}>{userProfile.name || 'Learner'}</h2>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Flame size={14} color="#FF6B35" /> {dailyStreak} day streak
                            </span>
                            <span style={{ fontSize: 13, color: '#F2C255', fontWeight: 700 }}>{balance.toLocaleString()}₫</span>
                        </div>
                    </div>
                </div>

                {/* Level Progress */}
                <div style={{
                    padding: 20, backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)', marginBottom: 20,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>Current Level</span>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success-color)' }}>{s.level}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.levelProgress}% to A2</span>
                        </div>
                    </div>
                    <div style={{ height: 10, backgroundColor: 'var(--surface-color-light)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <div style={{ width: `${s.levelProgress}%`, height: '100%', backgroundColor: 'var(--success-color)', borderRadius: 5, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{s.totalXP.toLocaleString()} XP earned</div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                    <StatCard icon={<BookOpen size={18} />} label="Words" value={s.wordsLearned} sub={`of ${s.wordsTotal} total`} color="#1CB0F6" />
                    <StatCard icon={<Target size={18} />} label="Lessons" value={s.lessonsCompleted} sub={`of ${s.lessonsTotal} total`} color="var(--primary-color)" />
                    <StatCard icon={<Clock size={18} />} label="Minutes" value={s.practiceMinutes} sub="total practice" color="#CE82FF" />
                    <StatCard icon={<TrendingUp size={18} />} label="Accuracy" value={`${s.avgAccuracy}%`} sub="average score" color="var(--success-color)" />
                </div>

                {/* Weekly Activity Chart */}
                <div style={{
                    padding: 20, backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)', marginBottom: 20,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <BarChart3 size={16} color="var(--primary-color)" />
                        <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>This Week</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
                        {s.weeklyMinutes.map((min, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{min}m</span>
                                <div style={{
                                    width: '100%', maxWidth: 32, borderRadius: 6,
                                    height: Math.max(min / maxMin * 70, 4),
                                    backgroundColor: min > 0 ? 'var(--primary-color)' : 'var(--surface-color-light)',
                                    border: min === 0 ? '1px solid var(--border-color)' : 'none',
                                }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{days[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Links */}
                <div style={{
                    backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)', overflow: 'hidden',
                }}>
                    {[
                        { icon: <Award size={18} color="#FFD166" />, label: 'Achievements', route: '/achievements' },
                        { icon: <Star size={18} color="#CE82FF" />, label: 'Dong Shop', route: '/shop' },
                        { icon: <Zap size={18} color="#FF6B35" />, label: 'Best Streak: ' + s.bestStreak + ' days', route: null },
                    ].map((item, i) => (
                        <div
                            key={i}
                            onClick={() => item.route && navigate(item.route)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                                borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none',
                                cursor: item.route ? 'pointer' : 'default',
                            }}
                        >
                            {item.icon}
                            <span style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{item.label}</span>
                            {item.route && <ChevronRight size={16} color="var(--text-muted)" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProfileStats;
