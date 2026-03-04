import React, { useState } from 'react';
import { X, Copy, Check, Gift, Users, Trophy, Award, Crown, Share2, Megaphone } from 'lucide-react';
import { PARTNER_CTAS } from '../data/articleData';
import './ReferralModal.css';

const ShareMethod = ({ icon, label, onClick, color }) => (
    <button className="share-method-btn" style={{ '--method-color': color }} onClick={onClick}>
        <div className="share-icon-wrapper" style={{ backgroundColor: color }}>
            {icon}
        </div>
        <span className="share-label">{label}</span>
    </button>
);

const PartnerVoucher = ({ cta }) => {
    const [copiedCode, setCopiedCode] = useState(false);

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(cta.code);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } catch { /* ignore */ }
    };

    return (
        <div className="partner-voucher-section">
            <p className="section-label" style={{ padding: '0 24px', marginBottom: 12 }}>Partner Reward</p>
            <div style={{ padding: '0 24px 24px', position: 'relative', overflow: 'hidden' }}>
                {/* Confetti bursts */}
                {[...Array(8)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        width: 8, height: 8,
                        borderRadius: '50%',
                        backgroundColor: ['#FFD166', '#06D6A0', '#EF476F', '#118AB2', '#FF8BC1', '#CE82FF', '#1CB0F6', '#58CC02'][i],
                        top: '40%', left: '50%',
                        animation: `confettiBurst 1.2s ${i * 0.08}s ease-out forwards`,
                        transform: `rotate(${i * 45}deg) translateX(${40 + i * 10}px)`,
                        opacity: 0,
                        zIndex: 3,
                    }} />
                ))}

                {/* Voucher card */}
                <div style={{
                    width: '100%', borderRadius: 16, overflow: 'hidden',
                    border: '3px solid #FFD166',
                    animation: 'giftDrop 0.8s ease-out',
                    position: 'relative',
                    background: `linear-gradient(135deg, ${cta.theme}, ${cta.themeDark || cta.theme})`,
                }}>
                    {/* Shimmer overlay */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s 0.8s ease-in-out infinite',
                        pointerEvents: 'none', zIndex: 2,
                    }} />

                    {/* Partner image */}
                    <div style={{ width: '100%', height: 100, overflow: 'hidden' }}>
                        <img src={cta.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                    </div>

                    {/* Card content */}
                    <div style={{ padding: '16px 20px', position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#FFD166', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                            {cta.discount_en}
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2, marginBottom: 12 }}>
                            {cta.title_en}
                        </div>

                        {/* Code box */}
                        <button
                            onClick={handleCopyCode}
                            style={{
                                width: '100%', padding: '10px 14px',
                                border: '2px dashed rgba(255,255,255,0.5)', borderRadius: 10,
                                backgroundColor: 'rgba(0,0,0,0.2)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                color: 'white', fontSize: 16, fontWeight: 800, letterSpacing: 2,
                            }}
                        >
                            {copiedCode ? 'COPIED!' : cta.code}
                            <Copy size={14} color="rgba(255,255,255,0.6)" />
                        </button>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Tap to copy code</div>
                    </div>
                </div>

                {/* Invite progress */}
                <div style={{ marginTop: 16, animation: 'fadeSlideUp 0.8s 0.4s ease-out both' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-main)' }}>
                        Invite friends to unlock full reward!
                    </p>
                    <div style={{ width: '100%', height: 10, backgroundColor: 'var(--surface-color-light)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <div style={{
                            height: '100%', backgroundColor: '#FFD166', borderRadius: 5,
                            animation: 'progressFill 1.2s 0.6s ease-out both',
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>2 of 3 friends</span>
                        <span style={{ color: '#CC9202', fontWeight: 700 }}>1 more!</span>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes giftDrop {
                    0% { opacity: 0; transform: translateY(-80px) scale(0.8); }
                    60% { opacity: 1; transform: translateY(10px) scale(1.02); }
                    80% { transform: translateY(-5px) scale(0.99); }
                    100% { transform: translateY(0) scale(1); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes confettiBurst {
                    0% { opacity: 1; transform: scale(0) rotate(0deg); }
                    40% { opacity: 1; }
                    100% { opacity: 0; transform: scale(1) rotate(180deg) translate(80px, -60px); }
                }
                @keyframes progressFill {
                    from { width: 0%; }
                    to { width: 66%; }
                }
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

const MilestoneProgress = ({ invites }) => {
    const milestones = [
        { count: 1, label: 'Friendly', icon: <Users size={20} />, activeColor: '#06D6A0' },
        { count: 3, label: 'Bronze Frame', icon: <Trophy size={20} />, activeColor: '#CD7F32' },
        { count: 5, label: 'Ambassador', icon: <Award size={20} />, activeColor: '#118AB2' },
        { count: 10, label: 'Golden VIP', icon: <Crown size={20} />, activeColor: '#FFD166' },
    ];

    const maxInvites = milestones[milestones.length - 1].count;
    const progressPercent = Math.min(100, (invites / maxInvites) * 100);

    return (
        <div className="milestone-tracker">
            <h3 className="milestone-title">Your Rewards</h3>
            <div className="milestone-progress-bar">
                <div className="milestone-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="milestone-nodes">
                {milestones.map((ms, idx) => {
                    const isReached = invites >= ms.count;
                    return (
                        <div key={idx} className={`milestone-node ${isReached ? 'reached' : ''}`} style={{ '--active-color': ms.activeColor }}>
                            <div className="milestone-icon">
                                {ms.icon}
                            </div>
                            <div className="milestone-info">
                                <span className="milestone-count">{ms.count} {ms.count === 1 ? 'Friend' : 'Friends'}</span>
                                <span className="milestone-reward">{ms.label}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ReferralModal = ({ onClose, username = 'learner123' }) => {
    const [copied, setCopied] = useState(false);
    const [partnerCta] = useState(() => PARTNER_CTAS[Math.floor(Math.random() * PARTNER_CTAS.length)]);

    // Mock data for the demonstration
    const currentInvites = 2;
    const inviteLink = `vn.me/invite/${username}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Learn Vietnamese with me on Vietnamy!',
                    text: 'Finish your first lesson and we both get 500₫ and a free Streak Freeze! 🏆',
                    url: `https://${inviteLink}`,
                });
            } catch (err) {
                console.error("Share failed", err);
            }
        } else {
            handleCopy();
        }
    };

    return (
        <div className="modal-overlay referral-overlay" onClick={onClose}>
            <div className="modal-content referral-modal slide-up" onClick={e => e.stopPropagation()}>

                <button className="referral-close ghost" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="referral-header">
                    <div className="referral-hero-icon">
                        <Gift size={48} color="#1A1A1A" />
                    </div>
                    <h2 className="referral-headline">Invite Friends, Get Rewards!</h2>
                    <p className="referral-subhead">
                        When a friend finishes their first lesson using your link, you <strong>both</strong> earn <strong>500₫</strong>!
                    </p>
                </div>

                <div className="referral-link-section">
                    <p className="section-label">Your Unique Link</p>
                    <div className="link-box">
                        <span className="link-text">{inviteLink}</span>
                        <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? 'COPIED!' : 'COPY'}
                        </button>
                    </div>
                </div>

                <div className="share-methods">
                    <ShareMethod
                        icon={<Share2 size={24} color="white" />}
                        label="Share"
                        color="var(--primary-color)"
                        onClick={handleNativeShare}
                    />
                    <ShareMethod
                        icon={<span style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>W</span>}
                        label="WhatsApp"
                        color="#25D366"
                        onClick={() => window.open(`https://wa.me/?text=Learn Vietnamese with me! Join using my link: https://${inviteLink}`, '_blank')}
                    />
                    <ShareMethod
                        icon={<span style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>M</span>}
                        label="Messenger"
                        color="#00B2FF"
                        onClick={handleCopy}
                    />
                </div>

                {partnerCta && <PartnerVoucher cta={partnerCta} />}

                <MilestoneProgress invites={currentInvites} />

                <div className="partner-banner" onClick={() => { }}>
                    <div className="partner-banner-icon">
                        <Megaphone size={24} color="#1A1A1A" />
                    </div>
                    <div className="partner-banner-text">
                        <span className="partner-banner-title">Are you a Creator or Teacher?</span>
                        <span className="partner-banner-subtitle">Learn about Partnerships <span className="arrow">&rarr;</span></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferralModal;
