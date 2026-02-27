import React, { useState } from 'react';
import { X, Copy, Check, Gift, Users, Trophy, Award, Crown, Share2, Megaphone } from 'lucide-react';
import './ReferralModal.css';

const ShareMethod = ({ icon, label, onClick, color }) => (
    <button className="share-method-btn" style={{ '--method-color': color }} onClick={onClick}>
        <div className="share-icon-wrapper" style={{ backgroundColor: color }}>
            {icon}
        </div>
        <span className="share-label">{label}</span>
    </button>
);

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
