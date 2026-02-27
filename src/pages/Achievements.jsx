import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Trophy, Lock, Flame, BookOpen, Zap, Star,
    Target, Globe, Headphones, Heart, Crown, Sparkles, Award
} from 'lucide-react';

const BADGES = [
    // Unlocked
    { id: 1, icon: <Flame size={28} />, title: 'First Flame', desc: 'Complete your first lesson', color: '#FF6B35', unlocked: true, date: 'Jan 15' },
    { id: 2, icon: <BookOpen size={28} />, title: 'Word Collector', desc: 'Learn 50 vocabulary words', color: '#1CB0F6', unlocked: true, date: 'Jan 22' },
    { id: 3, icon: <Zap size={28} />, title: '3-Day Streak', desc: 'Maintain a 3-day streak', color: '#FFD166', unlocked: true, date: 'Jan 18' },
    { id: 4, icon: <Star size={28} />, title: 'Perfect Score', desc: 'Get 100% on any lesson', color: '#CE82FF', unlocked: true, date: 'Feb 1' },
    { id: 5, icon: <Target size={28} />, title: 'Unit Master', desc: 'Complete an entire unit', color: '#06D6A0', unlocked: true, date: 'Feb 8' },
    { id: 6, icon: <Headphones size={28} />, title: 'Tone Trainer', desc: 'Complete Tone Practice', color: '#1CB0F6', unlocked: true, date: 'Feb 3' },
    { id: 7, icon: <Globe size={28} />, title: 'Dictionary Diver', desc: 'Look up 100 words', color: '#FFD166', unlocked: true, date: 'Feb 10' },
    // Locked
    { id: 8, icon: <Flame size={28} />, title: '7-Day Streak', desc: 'Maintain a 7-day streak', color: '#FF6B35', unlocked: false, progress: '4/7 days' },
    { id: 9, icon: <BookOpen size={28} />, title: 'Bookworm', desc: 'Read 10 articles', color: '#1CB0F6', unlocked: false, progress: '3/10 articles' },
    { id: 10, icon: <Heart size={28} />, title: 'No Hearts Lost', desc: 'Complete 5 lessons without losing a heart', color: '#EF476F', unlocked: false, progress: '2/5 lessons' },
    { id: 11, icon: <Crown size={28} />, title: 'Grammar Guru', desc: 'Master all A1 grammar patterns', color: '#FFD166', unlocked: false, progress: '8/15 patterns' },
    { id: 12, icon: <Sparkles size={28} />, title: 'Vocabulary Vault', desc: 'Learn 200 words', color: '#CE82FF', unlocked: false, progress: '147/200 words' },
    { id: 13, icon: <Award size={28} />, title: 'Speed Demon', desc: 'Complete a lesson in under 2 minutes', color: '#06D6A0', unlocked: false, progress: 'Not started' },
    { id: 14, icon: <Flame size={28} />, title: '30-Day Streak', desc: 'Maintain a 30-day streak', color: '#FF6B35', unlocked: false, progress: '4/30 days' },
    { id: 15, icon: <Trophy size={28} />, title: 'Completionist', desc: 'Complete all lessons in the roadmap', color: '#FFD166', unlocked: false, progress: '18/120 lessons' },
];

const Achievements = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const unlocked = BADGES.filter(b => b.unlocked);
    const locked = BADGES.filter(b => !b.unlocked);
    const shown = filter === 'unlocked' ? unlocked : filter === 'locked' ? locked : BADGES;

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
                <span style={{ fontSize: 18, fontWeight: 800 }}>Achievements</span>
                <div style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--primary-color)' }}>
                    <Trophy size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {unlocked.length}/{BADGES.length}
                </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
                {/* Trophy Showcase */}
                <div style={{
                    textAlign: 'center', padding: 24, marginBottom: 20,
                    backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    background: 'linear-gradient(135deg, rgba(255,209,102,0.08), rgba(206,130,255,0.08))',
                }}>
                    <Trophy size={48} color="#FFD166" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 32, fontWeight: 800 }}>{unlocked.length}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Badges Earned</div>
                    <div style={{
                        marginTop: 12, height: 8, backgroundColor: 'var(--surface-color-light)',
                        borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-color)',
                    }}>
                        <div style={{
                            width: `${(unlocked.length / BADGES.length) * 100}%`,
                            height: '100%', backgroundColor: 'var(--primary-color)', borderRadius: 4,
                        }} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                        {BADGES.length - unlocked.length} more to unlock
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[
                        { id: 'all', label: `All (${BADGES.length})` },
                        { id: 'unlocked', label: `Earned (${unlocked.length})` },
                        { id: 'locked', label: `Locked (${locked.length})` },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            style={{
                                padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                                border: filter === f.id ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                                backgroundColor: filter === f.id ? 'rgba(255,209,102,0.15)' : 'transparent',
                                color: filter === f.id ? 'var(--primary-color)' : 'var(--text-muted)',
                                cursor: 'pointer',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Badge Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                    {shown.map(badge => (
                        <div
                            key={badge.id}
                            style={{
                                padding: 16, textAlign: 'center',
                                backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                                border: `1px solid ${badge.unlocked ? badge.color + '40' : 'var(--border-color)'}`,
                                opacity: badge.unlocked ? 1 : 0.5,
                                position: 'relative',
                            }}
                        >
                            {!badge.unlocked && (
                                <Lock size={14} style={{ position: 'absolute', top: 10, right: 10, color: 'var(--text-muted)' }} />
                            )}
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: badge.unlocked ? badge.color + '20' : 'var(--surface-color-light)',
                                color: badge.unlocked ? badge.color : 'var(--text-muted)',
                                border: `2px solid ${badge.unlocked ? badge.color : 'var(--border-color)'}`,
                            }}>
                                {badge.icon}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{badge.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>{badge.desc}</div>
                            {badge.unlocked ? (
                                <div style={{ fontSize: 10, color: badge.color, fontWeight: 700, marginTop: 8 }}>Earned {badge.date}</div>
                            ) : (
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 8 }}>{badge.progress}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Achievements;
