import React, { useState } from 'react';
import {
    Users, ExternalLink, Crown, Flame, Search,
    UserPlus, Medal, Star, Video, Calendar,
    Building, MapPin,
} from 'lucide-react';
import './CommunityTab.css';

const TUTORS = [
    { name: 'Ngoc Anh', title: 'Business Vietnamese Specialist', rate: '$35/30min', specialties: ['Business Meetings', 'Negotiations'], initials: 'NA', rating: 4.9, color: '#FFD166' },
    { name: 'Minh Duc', title: 'Executive Communication Coach', rate: '$40/30min', specialties: ['Real Estate', 'Legal Terms'], initials: 'MD', rating: 5.0, color: '#1CB0F6' },
    { name: 'Thu Hien', title: 'Social & Cultural Guide', rate: '$25/30min', specialties: ['Dining Etiquette', 'Networking'], initials: 'TH', rating: 4.8, color: '#06D6A0' },
];

const LUXURY_PARTNERS = [
    { title: 'Park Hyatt Saigon', description: 'Exclusive language sessions for hotel guests', tag: 'Hotel Partner', initials: 'PH', color: '#FFD166' },
    { title: 'Six Senses Con Dao', description: 'Complimentary basic modules for resort guests', tag: 'Resort Partner', initials: 'SS', color: '#06D6A0' },
    { title: 'Vietnam Golf & Country Club', description: 'On-course vocabulary cards for members', tag: 'Golf Partner', initials: 'VG', color: '#1CB0F6' },
    { title: 'Savills Vietnam', description: 'Real estate Vietnamese for property buyers', tag: 'Real Estate', initials: 'SV', color: '#CE82FF' },
];

// ─── Component ──────────────────────────────────────────────

const CommunityTab = () => {
    const [showAddFriend, setShowAddFriend] = useState(false);

    return (
        <div className="comm-container">

            {/* ═══ LEADERBOARD ════════════════════════════════════════ */}
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
                <button
                    onClick={() => setShowAddFriend(true)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        width: '100%', padding: '12px 16px', marginTop: 12,
                        borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-color)',
                        backgroundColor: 'transparent', color: 'var(--text-muted)',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    <UserPlus size={18} /> Add Friends to Compete
                </button>
            </section>

            {/* ═══ PREMIUM TUTORING ═══════════════════════════════════ */}
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
                                {tutor.specialties.map((sp, j) => (
                                    <span key={j} className="tutor-specialty-chip">{sp}</span>
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

            {/* ═══ LUXURY PARTNERS ════════════════════════════════════ */}
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

            {/* ═══ CORPORATE TRAINING ═════════════════════════════════ */}
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

            {/* ═══ ADD FRIEND MODAL ═══════════════════════════════════ */}
            {showAddFriend && (
                <div className="modal-overlay" onClick={() => setShowAddFriend(false)}>
                    <div className="modal-content slide-up" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: '32px 24px' }}>
                        <UserPlus size={48} style={{ color: 'var(--primary-color)', marginBottom: 16 }} />
                        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>Add Friends</h2>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 24px', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
                            Compete on the leaderboard, share streaks, and cheer each other on!
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            <button style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '14px 20px', borderRadius: 'var(--radius-md)', border: 'none',
                                backgroundColor: 'var(--primary-color)', color: '#1A1A1A',
                                fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                <Users size={18} /> Share Invite Link
                            </button>
                            <button style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '14px 20px', borderRadius: 'var(--radius-md)',
                                border: '2px solid var(--border-color)', backgroundColor: 'transparent',
                                color: 'var(--text-main)', fontSize: 15, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                <Search size={18} /> Find by Username
                            </button>
                        </div>
                        <span className="comm-coming-tag">Coming Soon</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityTab;
