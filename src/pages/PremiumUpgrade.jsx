import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Crown, Zap, Headphones, Sparkles, CheckCircle,
    Briefcase, Flag, Home, Building, Wine, Globe, Shield, Star,
    BookOpen, Users, X
} from 'lucide-react';
import { useDong } from '../context/DongContext';

const PLANS = [
    { id: 'monthly', label: 'Monthly', price: '$15', period: '/mo', note: null },
    { id: 'annual', label: 'Annual', price: '$150', period: '/yr', note: 'SAVE $30', monthly: '$12.50/mo' },
    { id: 'lifetime', label: 'Lifetime', price: '$299', period: '', note: 'BEST VALUE', monthly: 'One-time payment' },
];

const FEATURES = [
    { icon: <Zap size={20} color="#06D6A0" />, title: 'Unlimited Hearts', desc: 'Never wait to practice again — make mistakes freely' },
    { icon: <Headphones size={20} color="#1CB0F6" />, title: 'Executive Modules', desc: '6 premium modules: Business, Golf, Real Estate, and more' },
    { icon: <Sparkles size={20} color="#CE82FF" />, title: 'Ad-Free Experience', desc: 'Focus on learning without interruptions' },
    { icon: <Shield size={20} color="#FFD166" />, title: 'Streak Repair', desc: 'Missed a day? Repair your streak once per month' },
    { icon: <Star size={20} color="#EF476F" />, title: 'Priority Support', desc: 'Direct access to tutors and community mentors' },
    { icon: <BookOpen size={20} color="#06D6A0" />, title: 'Advanced Content', desc: 'B2/C1 level content, business vocabulary packs' },
];

const EXECUTIVE_MODULES = [
    { icon: <Briefcase size={18} />, title: 'Business Etiquette', color: '#FFD166' },
    { icon: <Flag size={18} />, title: 'Golf Vietnamese', color: '#06D6A0' },
    { icon: <Home size={18} />, title: 'Household Staff', color: '#1CB0F6' },
    { icon: <Building size={18} />, title: 'Real Estate', color: '#CE82FF' },
    { icon: <Wine size={18} />, title: 'Dining & Networking', color: '#EF476F' },
    { icon: <Globe size={18} />, title: 'Luxury Travel', color: '#FFD166' },
];

const TESTIMONIALS = [
    { name: 'David M.', role: 'Expat in HCMC', text: 'The Executive modules helped me communicate with my staff in 2 months. Worth every penny.', rating: 5 },
    { name: 'Jennifer L.', role: 'Real Estate Investor', text: 'I can now negotiate property deals in Vietnamese. My agent was shocked!', rating: 5 },
    { name: 'Tom K.', role: 'Golf Enthusiast', text: 'The golf vocabulary module made my weekends at Long Thanh so much more fun.', rating: 5 },
];

const PremiumUpgrade = () => {
    const navigate = useNavigate();
    const { isExecutive, activateExecutive } = useDong();
    const [selectedPlan, setSelectedPlan] = useState('annual');
    const [justUpgraded, setJustUpgraded] = useState(false);

    const handleUpgrade = () => {
        activateExecutive();
        setJustUpgraded(true);
    };

    if (isExecutive && !justUpgraded) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)',
                }}>
                    <button className="ghost" onClick={() => navigate(-1)} style={{ padding: 6, display: 'flex' }}>
                        <ArrowLeft size={22} />
                    </button>
                    <span style={{ fontSize: 18, fontWeight: 800 }}>Vietnamy Executive</span>
                </div>
                <div style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(6,214,160,0.2), rgba(6,214,160,0.05))',
                        border: '2px solid rgba(6,214,160,0.3)',
                    }}>
                        <Crown size={40} color="#06D6A0" fill="#06D6A0" />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>You're an Executive!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>All premium features are unlocked.</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '14px 32px', borderRadius: 14, border: 'none',
                            backgroundColor: '#06D6A0', color: '#1A1A1A', fontSize: 16, fontWeight: 800, cursor: 'pointer',
                        }}
                    >
                        Continue Learning
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: 100 }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)',
            }}>
                <button className="ghost" onClick={() => navigate(-1)} style={{ padding: 6, display: 'flex' }}>
                    <ArrowLeft size={22} />
                </button>
                <span style={{ fontSize: 18, fontWeight: 800 }}>Upgrade to Executive</span>
            </div>

            <div style={{ padding: '20px 20px 0' }}>
                {/* Hero */}
                <div style={{
                    textAlign: 'center', padding: '32px 20px',
                    background: 'linear-gradient(135deg, rgba(255,209,102,0.1), rgba(206,130,255,0.1))',
                    borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: 24,
                }}>
                    <Crown size={56} color="#FFD166" fill="#FFD166" style={{ marginBottom: 12 }} />
                    <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>
                        Vietnamy <span style={{ color: '#FFD166' }}>Executive</span>
                    </h1>
                    <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                        Stop translating. Start communicating.<br />Unlock the full cultural toolkit.
                    </p>
                </div>

                {/* Features */}
                <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
                        What You Get
                    </span>
                    {FEATURES.map((f, i) => (
                        <div key={i} style={{
                            display: 'flex', gap: 14, padding: '14px 0',
                            borderBottom: i < FEATURES.length - 1 ? '1px solid var(--border-color)' : 'none',
                        }}>
                            <div style={{ flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{f.title}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.3 }}>{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Executive Modules Preview */}
                <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
                        Exclusive Modules
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {EXECUTIVE_MODULES.map((m, i) => (
                            <div key={i} style={{
                                padding: 14, textAlign: 'center',
                                backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-color)',
                            }}>
                                <div style={{ color: m.color, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{m.icon}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3 }}>{m.title}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Testimonials */}
                <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
                        What Members Say
                    </span>
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                        {TESTIMONIALS.map((t, i) => (
                            <div key={i} style={{
                                minWidth: 240, padding: 16, flexShrink: 0,
                                backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-color)',
                            }}>
                                <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                                    {Array(t.rating).fill(null).map((_, j) => <Star key={j} size={14} color="#FFD166" fill="#FFD166" />)}
                                </div>
                                <p style={{ fontSize: 13, lineHeight: 1.4, margin: '0 0 10px', fontStyle: 'italic', color: 'var(--text-main)' }}>
                                    "{t.text}"
                                </p>
                                <div style={{ fontSize: 12, fontWeight: 700 }}>{t.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.role}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing Cards */}
                <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>
                        Choose Your Plan
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {PLANS.map(plan => (
                            <div
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', padding: 16,
                                    backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                                    border: selectedPlan === plan.id ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                                }}
                            >
                                {plan.note && (
                                    <div style={{
                                        position: 'absolute', top: 0, right: 0, padding: '2px 10px',
                                        backgroundColor: plan.id === 'lifetime' ? '#06D6A0' : '#EF476F',
                                        color: 'white', fontSize: 9, fontWeight: 800,
                                        borderBottomLeftRadius: 8, textTransform: 'uppercase',
                                    }}>
                                        {plan.note}
                                    </div>
                                )}
                                <div style={{
                                    width: 22, height: 22, borderRadius: '50%', marginRight: 14, flexShrink: 0,
                                    border: `2px solid ${selectedPlan === plan.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {selectedPlan === plan.id && (
                                        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 700 }}>{plan.label}</div>
                                    {plan.monthly && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{plan.monthly}</div>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: 22, fontWeight: 800 }}>{plan.price}</span>
                                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{plan.period}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fixed CTA */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                padding: '16px 20px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                backgroundColor: 'var(--surface-color)', borderTop: '1px solid var(--border-color)',
                maxWidth: 480, margin: '0 auto',
            }}>
                <button
                    onClick={handleUpgrade}
                    style={{
                        width: '100%', padding: '16px 24px', borderRadius: 14, border: 'none',
                        backgroundColor: justUpgraded ? '#06D6A0' : 'var(--primary-color)',
                        color: justUpgraded ? 'white' : '#1A1A1A',
                        fontSize: 16, fontWeight: 800, cursor: 'pointer',
                        boxShadow: `0 4px 0 ${justUpgraded ? '#04875f' : '#c49a30'}`,
                    }}
                >
                    {justUpgraded ? (
                        <><CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Welcome to Executive!</>
                    ) : (
                        'START FREE 7-DAY TRIAL'
                    )}
                </button>
                <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>
                    Cancel anytime. No charge until trial ends.
                </p>
            </div>
        </div>
    );
};

export default PremiumUpgrade;
