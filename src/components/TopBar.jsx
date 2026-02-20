import React from 'react';
import { Target, Heart, Zap } from 'lucide-react';

const TopBar = ({ stats }) => {
    return (
        <header className="top-bar">
            {/* Daily Goal Bar */}
            <div className="flex items-center gap-2" style={{ flex: 1, marginRight: 'var(--spacing-4)' }}>
                <Target size={20} color="var(--text-muted)" />
                <div style={{ flex: 1, height: 8, backgroundColor: 'var(--surface-color-light)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: '66%', height: '100%', backgroundColor: 'var(--primary-color)' }}></div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>10/15m</span>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
                <div className="stat-badge streak">
                    <Zap size={20} fill="currentColor" /> {stats.streak}
                </div>
                <div className="stat-badge hearts">
                    <Heart size={20} fill="currentColor" /> {stats.hearts}
                </div>
            </div>
        </header>
    );
};

export default TopBar;
