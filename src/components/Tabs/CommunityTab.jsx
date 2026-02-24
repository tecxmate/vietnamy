import React from 'react';
import {
    Trophy, Users, Activity, ExternalLink, Crown, Flame,
    UserPlus, Medal, Star, Zap, BookOpen, GraduationCap,
} from 'lucide-react';
import './CommunityTab.css';

// Mock leaderboard data
const LEADERBOARD = [
    { rank: 1, name: 'Minh T.', xp: 12450, streak: 42, isYou: false },
    { rank: 2, name: 'Sarah L.', xp: 11200, streak: 38, isYou: false },
    { rank: 3, name: 'Huy N.', xp: 9800, streak: 27, isYou: false },
    { rank: 4, name: 'You', xp: 8650, streak: 15, isYou: true },
    { rank: 5, name: 'Linh P.', xp: 7300, streak: 21, isYou: false },
    { rank: 6, name: 'James K.', xp: 6100, streak: 12, isYou: false },
    { rank: 7, name: 'Trang V.', xp: 5400, streak: 9, isYou: false },
];

const RANK_ICONS = {
    1: <Crown size={16} style={{ color: '#FFD166' }} />,
    2: <Medal size={16} style={{ color: '#C0C0C0' }} />,
    3: <Medal size={16} style={{ color: '#CD7F32' }} />,
};

// Mock activity feed
const ACTIVITIES = [
    { id: 1, icon: <Star size={16} />, text: 'Minh T. completed Unit 3: At the Market', time: '2h ago', color: 'var(--primary-color)' },
    { id: 2, icon: <Flame size={16} />, text: 'Sarah L. reached a 38-day streak!', time: '5h ago', color: '#FF5722' },
    { id: 3, icon: <Zap size={16} />, text: 'Huy N. mastered 50 vocabulary words', time: '8h ago', color: 'var(--success-color)' },
    { id: 4, icon: <GraduationCap size={16} />, text: 'Linh P. unlocked Advanced Grammar', time: '1d ago', color: 'var(--secondary-color)' },
];

// Affiliate / resource links (placeholders)
const RESOURCES = [
    {
        title: 'Vietnamese Made Easy',
        description: 'Comprehensive textbook for beginners to intermediate learners',
        tag: 'Textbook',
    },
    {
        title: 'VN Language School',
        description: 'Live online classes with native Vietnamese teachers',
        tag: 'Online School',
    },
    {
        title: 'Saigon Cram School',
        description: 'In-person intensive courses in Ho Chi Minh City',
        tag: 'Cram School',
    },
    {
        title: 'Vietnamese Podcast Network',
        description: 'Daily listening practice with native speakers',
        tag: 'Podcast',
    },
];

const CommunityTab = () => {
    return (
        <div className="comm-container">
            {/* ─── Leaderboard ─────────────────────────────────────── */}
            <section className="comm-section">
                <div className="comm-section-header">
                    <Trophy size={20} className="comm-section-icon" />
                    <h2 className="comm-section-title">Leaderboard</h2>
                </div>
                <div className="comm-leaderboard">
                    {LEADERBOARD.map(user => (
                        <div key={user.rank} className={`comm-lb-row ${user.isYou ? 'you' : ''}`}>
                            <span className="comm-lb-rank">
                                {RANK_ICONS[user.rank] || <span>#{user.rank}</span>}
                            </span>
                            <div className="comm-lb-avatar" style={{ backgroundColor: user.isYou ? 'var(--primary-color)' : 'var(--border-color)' }}>
                                <span>{user.name.charAt(0)}</span>
                            </div>
                            <div className="comm-lb-info">
                                <span className="comm-lb-name">{user.name}</span>
                                <span className="comm-lb-streak">
                                    <Flame size={12} style={{ color: '#FF5722' }} /> {user.streak}d
                                </span>
                            </div>
                            <span className="comm-lb-xp">{user.xp.toLocaleString()} XP</span>
                        </div>
                    ))}
                </div>
                <p className="comm-coming-soon">Weekly rankings refresh every Monday</p>
            </section>

            {/* ─── Friends ─────────────────────────────────────────── */}
            <section className="comm-section">
                <div className="comm-section-header">
                    <Users size={20} className="comm-section-icon" />
                    <h2 className="comm-section-title">Friends</h2>
                </div>
                <div className="comm-friends-empty">
                    <UserPlus size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                    <p className="comm-friends-text">Add friends to see their progress and compete together!</p>
                    <button className="comm-add-friend-btn" disabled>
                        <UserPlus size={16} /> Add Friend
                    </button>
                    <span className="comm-coming-tag">Coming Soon</span>
                </div>
            </section>

            {/* ─── Activity Feed ────────────────────────────────────── */}
            <section className="comm-section">
                <div className="comm-section-header">
                    <Activity size={20} className="comm-section-icon" />
                    <h2 className="comm-section-title">Activity</h2>
                </div>
                <div className="comm-activity-list">
                    {ACTIVITIES.map(act => (
                        <div key={act.id} className="comm-activity-row">
                            <div className="comm-activity-icon" style={{ color: act.color }}>
                                {act.icon}
                            </div>
                            <div className="comm-activity-info">
                                <span className="comm-activity-text">{act.text}</span>
                                <span className="comm-activity-time">{act.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Resources & Affiliates ───────────────────────────── */}
            <section className="comm-section">
                <div className="comm-section-header">
                    <BookOpen size={20} className="comm-section-icon" />
                    <h2 className="comm-section-title">Resources & Partners</h2>
                </div>
                <div className="comm-resources">
                    {RESOURCES.map((res, i) => (
                        <div key={i} className="comm-resource-card">
                            <div className="comm-resource-info">
                                <span className="comm-resource-tag">{res.tag}</span>
                                <span className="comm-resource-title">{res.title}</span>
                                <span className="comm-resource-desc">{res.description}</span>
                            </div>
                            <ExternalLink size={16} className="comm-resource-link" />
                        </div>
                    ))}
                </div>
                <p className="comm-coming-soon">Partner links coming soon. Interested in partnering? Contact us!</p>
            </section>
        </div>
    );
};

export default CommunityTab;
