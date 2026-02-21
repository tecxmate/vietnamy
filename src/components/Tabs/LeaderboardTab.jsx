import React from 'react';
import { Award, Medal, Trophy, Star } from 'lucide-react';

const LeaderboardTab = () => {
    return (
        <div style={{ padding: 'var(--spacing-4)', paddingBottom: '100px' }}>

            {/* Achievements Preview */}
            <div className="flex justify-between items-center mb-4">
                <h3 style={{ fontSize: 18, margin: 0 }}>My Achievements</h3>
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

            {/* Friends Leaderboard Mockup */}
            <div className="flex justify-between items-center mb-4">
                <h3 style={{ fontSize: 18, margin: 0 }}>Friends League</h3>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Ends in 2d</span>
            </div>

            <div className="glass-panel" style={{ padding: 0 }}>
                {[
                    { name: 'Maria S.', xp: 2450, isMe: false, rank: 1 },
                    { name: 'Nguyễn Văn Test', xp: 1250, isMe: true, rank: 2 },
                    { name: 'Alex H.', xp: 980, isMe: false, rank: 3 },
                    { name: 'David Lee', xp: 850, isMe: false, rank: 4 }
                ].map((user, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 p-4 border-b"
                        style={{
                            borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none',
                            backgroundColor: user.isMe ? 'rgba(255, 209, 102, 0.05)' : 'transparent'
                        }}
                    >
                        <div style={{ width: 24, textAlign: 'center', fontWeight: 800, color: user.rank <= 3 ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                            {user.rank}
                        </div>
                        <div style={{ width: 40, height: 40, backgroundColor: user.isMe ? 'var(--primary-color)' : 'var(--surface-color-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: user.isMe ? '#1A1A1A' : 'var(--text-main)' }}>
                            {user.rank === 1 ? <Trophy size={20} /> : <UserIcon name={user.name} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: 16, color: user.isMe ? 'var(--primary-color)' : 'var(--text-main)' }}>{user.name} {user.isMe && '(You)'}</h4>
                        </div>
                        <div className="flex items-center gap-1 font-bold">
                            {user.xp} <span style={{ color: 'var(--primary-color)', fontSize: 12 }}>XP</span>
                        </div>
                    </div>
                ))}
            </div>

            <button className="primary w-full mt-6">Invite Friends</button>
        </div>
    );
};

// Helper to render initial for avatar
const UserIcon = ({ name }) => (
    <span style={{ fontWeight: 700 }}>{name.charAt(0)}</span>
);

export default LeaderboardTab;
