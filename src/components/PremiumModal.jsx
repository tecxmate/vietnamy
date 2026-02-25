import React, { useState } from 'react';
import {
    X, Crown, Zap, Headphones, Sparkles, CheckCircle,
    Briefcase, Flag, Home, Building, Wine, Globe, Building2
} from 'lucide-react';
import { useDong } from '../context/DongContext';
import './PremiumModal.css';

const EXECUTIVE_MODULES = [
    { icon: <Briefcase size={18} />, title: 'Business Etiquette & Meetings' },
    { icon: <Flag size={18} />, title: 'Golf Course Vietnamese' },
    { icon: <Home size={18} />, title: 'Directing Household Staff' },
    { icon: <Building size={18} />, title: 'Real Estate Negotiation' },
    { icon: <Wine size={18} />, title: 'Networking Dinners' },
    { icon: <Globe size={18} />, title: 'Luxury Travel & Concierge' },
];

const BenefitItem = ({ icon, title, description }) => (
    <div className="benefit-item">
        <div className="benefit-icon">{icon}</div>
        <div className="benefit-text">
            <h4>{title}</h4>
            <p>{description}</p>
        </div>
    </div>
);

const PremiumModal = ({ onClose }) => {
    const [selectedPlan, setSelectedPlan] = useState('annual');
    const { isExecutive, activateExecutive } = useDong();
    const [justActivated, setJustActivated] = useState(false);

    const handleUpgrade = () => {
        activateExecutive();
        setJustActivated(true);
        setTimeout(() => onClose(), 1500);
    };

    if (isExecutive && !justActivated) {
        return (
            <div className="modal-overlay premium-overlay" onClick={onClose}>
                <div className="modal-content premium-modal slide-up" onClick={e => e.stopPropagation()}>
                    <button className="premium-close ghost" onClick={onClose}>
                        <X size={24} />
                    </button>
                    <div className="premium-header">
                        <div className="premium-hero-icon" style={{ borderColor: 'rgba(6, 214, 160, 0.4)', background: 'rgba(6, 214, 160, 0.1)' }}>
                            <Crown size={48} color="#06D6A0" fill="#06D6A0" />
                        </div>
                        <h2 className="premium-headline">VnMe <span style={{ color: '#06D6A0' }}>Executive</span></h2>
                        <p className="premium-subhead" style={{ color: '#06D6A0' }}>You're an Executive member!</p>
                        <p className="premium-subhead">All premium modules and features are unlocked.</p>
                    </div>
                    <div className="premium-footer" style={{ paddingTop: 24 }}>
                        <button className="premium-cta" style={{ background: '#06D6A0', boxShadow: '0 6px 0 #04875f' }} onClick={onClose}>
                            <CheckCircle size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} /> CONTINUE LEARNING
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay premium-overlay" onClick={onClose}>
            <div className="modal-content premium-modal slide-up" onClick={e => e.stopPropagation()}>
                <button className="premium-close ghost" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="premium-header">
                    <div className="premium-hero-icon">
                        <Crown size={48} color="#FFD166" fill="#FFD166" />
                    </div>
                    <h2 className="premium-headline">VnMe <span className="premium-text">Executive</span></h2>
                    <p className="premium-subhead">Stop translating. Start communicating.<br />Unlock the full cultural toolkit.</p>
                </div>

                <div className="premium-benefits">
                    <BenefitItem
                        icon={<Zap size={24} color="#06D6A0" fill="#06D6A0" />}
                        title="Unlimited Practice Hearts"
                        description="Make as many mistakes as you need without waiting to refill."
                    />
                    <BenefitItem
                        icon={<Headphones size={24} color="#1CB0F6" fill="#1CB0F6" />}
                        title="Executive Learning Modules"
                        description="Master the Vietnamese that matters for your career and lifestyle."
                    />
                    <BenefitItem
                        icon={<Sparkles size={24} color="#CE82FF" fill="#CE82FF" />}
                        title="Priority Audio Requests"
                        description="Skip the line when requesting custom human translations."
                    />
                </div>

                {/* Executive Modules Grid */}
                <div className="executive-modules-section">
                    <h3 className="executive-modules-heading">
                        <Crown size={16} color="#FFD166" /> Exclusive Modules
                    </h3>
                    <div className="executive-modules-grid">
                        {EXECUTIVE_MODULES.map((mod, i) => (
                            <div key={i} className="executive-module-card">
                                <div className="executive-module-icon">{mod.icon}</div>
                                <span className="executive-module-title">{mod.title}</span>
                                <span className="executive-badge">EXECUTIVE</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="premium-pricing">
                    <div
                        className={`price-card ${selectedPlan === 'monthly' ? 'selected' : ''}`}
                        onClick={() => setSelectedPlan('monthly')}
                    >
                        <div className="price-title">Monthly</div>
                        <div className="price-amount">$15<span className="price-period">/mo</span></div>
                    </div>
                    <div
                        className={`price-card best-value ${selectedPlan === 'annual' ? 'selected' : ''}`}
                        onClick={() => setSelectedPlan('annual')}
                    >
                        <div className="best-value-badge">BEST VALUE (SAVE $30)</div>
                        <div className="price-title">Annually</div>
                        <div className="price-amount">$150<span className="price-period">/yr</span></div>
                        <div className="price-monthly-equiv">$12.50 / month</div>
                    </div>
                </div>

                <div className="premium-footer">
                    <button className="premium-cta" onClick={handleUpgrade}>
                        {justActivated ? '✓ WELCOME TO EXECUTIVE!' : 'UPGRADE NOW'}
                    </button>
                    <p className="premium-guarantee">Cancel anytime. 7-day money-back guarantee.</p>
                </div>

                {/* Enterprise CTA */}
                <div className="enterprise-cta">
                    <div className="enterprise-cta-icon">
                        <Building2 size={24} color="#118AB2" />
                    </div>
                    <div className="enterprise-cta-text">
                        <h4>Enterprise & Corporate Licenses</h4>
                        <p>Equip your whole team. Custom onboarding, usage analytics, and priority support.</p>
                    </div>
                    <button
                        className="enterprise-btn"
                        onClick={() => alert('MOCKUP: Opens enterprise inquiry form for bulk licenses ($5,000/yr for 50 seats).')}
                    >
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PremiumModal;
