import React from 'react';
import {
    Trophy, Users, Activity, ExternalLink, Crown, Flame,
    UserPlus, Medal, Star, Zap, GraduationCap, Video, Calendar,
    Building, MapPin
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

// Premium tutor profiles
const TUTORS = [
    { name: 'Ngoc Anh', title: 'Business Vietnamese Specialist', rate: '$35/30min', specialties: ['Business Meetings', 'Negotiations'], initials: 'NA', rating: 4.9, color: '#FFD166' },
    { name: 'Minh Duc', title: 'Executive Communication Coach', rate: '$40/30min', specialties: ['Real Estate', 'Legal Terms'], initials: 'MD', rating: 5.0, color: '#1CB0F6' },
    { name: 'Thu Hien', title: 'Social & Cultural Guide', rate: '$25/30min', specialties: ['Dining Etiquette', 'Networking'], initials: 'TH', rating: 4.8, color: '#06D6A0' },
];

// Luxury partner cards
const LUXURY_PARTNERS = [
    { title: 'Park Hyatt Saigon', description: 'Exclusive language sessions for hotel guests', tag: 'Hotel Partner', initials: 'PH', color: '#FFD166' },
    { title: 'Six Senses Con Dao', description: 'Complimentary basic modules for resort guests', tag: 'Resort Partner', initials: 'SS', color: '#06D6A0' },
    { title: 'Vietnam Golf & Country Club', description: 'On-course vocabulary cards for members', tag: 'Golf Partner', initials: 'VG', color: '#1CB0F6' },
    { title: 'Savills Vietnam', description: 'Real estate Vietnamese for property buyers', tag: 'Real Estate', initials: 'SV', color: '#CE82FF' },
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

            {/* ─── Premium 1-on-1 Tutoring ─────────────────────────── */}
            <section className="comm-section premium-tutor-section" style={{ background: 'linear-gradient(135deg, rgba(28, 176, 246, 0.1), rgba(28, 176, 246, 0.2))', borderColor: 'rgba(28, 176, 246, 0.3)' }}>
                <div className="comm-section-header">
                    <Video size={20} color="#1CB0F6" />
                    <h2 className="comm-section-title" style={{ color: '#1CB0F6' }}>1-on-1 Executive Tutoring</h2>
                </div>
                <div className="tutor-profiles">
                    {TUTORS.map((tutor, i) => (
                        <div key={i} className="tutor-profile-card">
                            <div className="tutor-profile-top">
                                <div className="tutor-avatar" style={{ backgroundColor: tutor.color }}>
                                    {tutor.initials}
                                </div>
                                <div className="tutor-info">
                                    <span className="tutor-name">{tutor.name}</span>
                                    <span className="tutor-title">{tutor.title}</span>
                                    <div className="tutor-rating">
                                        <Star size={12} fill="#FFD166" color="#FFD166" />
                                        <span>{tutor.rating}</span>
                                    </div>
                                </div>
                                <span className="tutor-rate">{tutor.rate}</span>
                            </div>
                            <div className="tutor-specialties">
                                {tutor.specialties.map((s, j) => (
                                    <span key={j} className="tutor-specialty-chip">{s}</span>
                                ))}
                            </div>
                            <button
                                className="tutor-book-btn"
                                onClick={() => alert(`MOCKUP: Opens Calendly booking for ${tutor.name}. Platform takes 20% commission.`)}
                            >
                                <Calendar size={14} /> Book Session
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Luxury Partners ─────────────────────────────────── */}
            <section className="comm-section">
                <div className="comm-section-header">
                    <MapPin size={20} className="comm-section-icon" />
                    <h2 className="comm-section-title">Luxury Partners</h2>
                </div>
                <div className="comm-resources">
                    {LUXURY_PARTNERS.map((partner, i) => (
                        <div key={i} className="comm-resource-card">
                            <div className="partner-logo" style={{ backgroundColor: `${partner.color}20`, color: partner.color }}>
                                {partner.initials}
                            </div>
                            <div className="comm-resource-info">
                                <span className="comm-resource-tag">{partner.tag}</span>
                                <span className="comm-resource-title">{partner.title}</span>
                                <span className="comm-resource-desc">{partner.description}</span>
                            </div>
                            <ExternalLink size={16} className="comm-resource-link" />
                        </div>
                    ))}
                </div>
                <p className="comm-coming-soon">Partner integrations launching soon</p>
            </section>

            {/* ─── Corporate Training ──────────────────────────────── */}
            <section className="comm-section" style={{ background: 'linear-gradient(135deg, rgba(17, 138, 178, 0.08), rgba(17, 138, 178, 0.18))', borderColor: 'rgba(17, 138, 178, 0.25)' }}>
                <div className="comm-section-header">
                    <Building size={20} color="#118AB2" />
                    <h2 className="comm-section-title" style={{ color: '#1CB0F6' }}>Corporate Training</h2>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px' }}>
                    Onboard your entire team with custom Vietnamese programs. Includes progress dashboards, dedicated account manager, and tailored content for your industry.
                </p>
                <button
                    className="corporate-inquiry-btn"
                    onClick={() => alert('MOCKUP: Opens corporate training inquiry form. Enterprise licenses start at $5,000/yr for 50 seats.')}
                >
                    Request a Proposal
                </button>
            </section>
        </div>
    );
};

export default CommunityTab;
