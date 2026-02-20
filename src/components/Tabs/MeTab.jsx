import React from 'react';
import { Settings, Shield, Award, Medal, Flame, BookOpen, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MeTab = () => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: 'var(--spacing-4)', paddingBottom: '100px' }}>

            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-8">
                <div style={{ width: 80, height: 80, backgroundColor: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                    👤
                </div>
                <div>
                    <h2 style={{ fontSize: 24, margin: 0, marginBottom: 4 }}>Nguyễn Văn Test</h2>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Southern Dialect • 10m/day goal</span>
                </div>
            </div>

            {/* Stats Overview */}
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Statistics</h3>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 32 }}>
                <div className="glass-panel flex-col items-center">
                    <Flame size={32} color="#FF9F1C" className="mb-2" />
                    <span style={{ fontSize: 24, fontWeight: 700 }}>12</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Day Streak</span>
                </div>
                <div className="glass-panel flex-col items-center">
                    <Award size={32} color="var(--primary-color)" className="mb-2" />
                    <span style={{ fontSize: 24, fontWeight: 700 }}>1,250</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total XP</span>
                </div>
                <div className="glass-panel flex-col items-center" style={{ gridColumn: 'span 2' }}>
                    <BookOpen size={32} color="var(--secondary-color)" className="mb-2" />
                    <span style={{ fontSize: 24, fontWeight: 700 }}>84</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Words Mastered</span>
                </div>
            </div>

            {/* Achievements Preview */}
            <div className="flex justify-between items-center mb-4">
                <h3 style={{ fontSize: 18, margin: 0 }}>Achievements</h3>
                <button className="ghost" style={{ fontSize: 14 }}>View All</button>
            </div>

            <div className="glass-panel mb-8 flex items-center gap-4">
                <div style={{ backgroundColor: 'var(--surface-color-light)', padding: 12, borderRadius: '50%' }}>
                    <Medal size={32} color="var(--primary-color)" />
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, marginBottom: 4, fontSize: 16 }}>Early Bird</h4>
                    <div style={{ width: '100%', height: 8, backgroundColor: 'var(--surface-color-light)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: '80%', height: '100%', backgroundColor: 'var(--primary-color)' }}></div>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Complete 5 morning lessons (4/5)</span>
                </div>
            </div>

            {/* Settings Options */}
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Settings</h3>
            <div className="glass-panel" style={{ padding: 0 }}>
                {[
                    { icon: <Settings size={20} />, label: 'Preferences (Audio/Dialect)' },
                    { icon: <Shield size={20} />, label: 'Privacy & Permissions' },
                    { icon: <Wrench size={20} />, label: 'Admin CMS', action: () => navigate('/admin'), color: 'var(--secondary-color)' }
                ].map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 p-4 border-b"
                        style={{
                            borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none',
                            cursor: item.action ? 'pointer' : 'default',
                            color: item.color || 'inherit'
                        }}
                        onClick={item.action}
                    >
                        {item.icon}
                        <span style={{ fontSize: 16, fontWeight: item.action ? 700 : 400 }}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MeTab;
