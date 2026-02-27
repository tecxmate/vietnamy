import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ShoppingBag, Palette, Shield, Zap, Heart, Star,
    Clock, Sparkles, Gift, Crown, CheckCircle
} from 'lucide-react';
import { useDong } from '../context/DongContext';

const SHOP_CATEGORIES = [
    { id: 'powerups', label: 'Power-Ups', icon: <Zap size={16} /> },
    { id: 'cosmetics', label: 'Themes', icon: <Palette size={16} /> },
    { id: 'boosts', label: 'Boosts', icon: <Star size={16} /> },
];

const SHOP_ITEMS = [
    // Power-Ups
    { id: 'hearts_refill', category: 'powerups', icon: <Heart size={24} />, color: '#EF476F', name: 'Heart Refill', desc: 'Restore all 5 hearts instantly', price: 500, popular: true },
    { id: 'streak_freeze', category: 'powerups', icon: <Shield size={24} />, color: '#1CB0F6', name: 'Streak Freeze', desc: 'Protect your streak for 1 day if you miss practice', price: 750, popular: true },
    { id: 'time_bonus', category: 'powerups', icon: <Clock size={24} />, color: '#CE82FF', name: 'Extra Time', desc: '+30 seconds on timed exercises', price: 300 },
    { id: 'hint_pack', category: 'powerups', icon: <Sparkles size={24} />, color: '#FFD166', name: 'Hint Pack (5)', desc: 'Reveal a hint during any exercise', price: 600 },
    // Themes
    { id: 'theme_ocean', category: 'cosmetics', icon: <Palette size={24} />, color: '#1CB0F6', name: 'Ocean Theme', desc: 'Cool blue interface with wave accents', price: 2000 },
    { id: 'theme_sakura', category: 'cosmetics', icon: <Palette size={24} />, color: '#F78DA7', name: 'Sakura Theme', desc: 'Soft pink cherry blossom aesthetic', price: 2000 },
    { id: 'theme_forest', category: 'cosmetics', icon: <Palette size={24} />, color: '#06D6A0', name: 'Forest Theme', desc: 'Deep green nature-inspired theme', price: 2000 },
    { id: 'theme_midnight', category: 'cosmetics', icon: <Palette size={24} />, color: '#7B68EE', name: 'Midnight Theme', desc: 'Dark purple elegant night mode', price: 2500, popular: true },
    // Boosts
    { id: 'xp_double', category: 'boosts', icon: <Zap size={24} />, color: '#FFD166', name: '2x XP (1 Hour)', desc: 'Double all XP earned for 60 minutes', price: 1000, popular: true },
    { id: 'dong_magnet', category: 'boosts', icon: <Star size={24} />, color: '#F2C255', name: 'Dong Magnet (1hr)', desc: '+50% Dong earned from lessons', price: 800 },
    { id: 'gift_box', category: 'boosts', icon: <Gift size={24} />, color: '#06D6A0', name: 'Mystery Box', desc: 'Random reward: 200-5000₫ or a rare item', price: 400 },
];

const DongShop = () => {
    const navigate = useNavigate();
    const { balance } = useDong();
    const [activeCategory, setActiveCategory] = useState('powerups');
    const [purchasedId, setPurchasedId] = useState(null);

    const items = SHOP_ITEMS.filter(i => i.category === activeCategory);

    const handlePurchase = (item) => {
        if (balance < item.price) {
            alert('Not enough Dong! Keep practicing to earn more.');
            return;
        }
        setPurchasedId(item.id);
        setTimeout(() => setPurchasedId(null), 2000);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: 32 }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)',
            }}>
                <button className="ghost" onClick={() => navigate(-1)} style={{ padding: 6, display: 'flex' }}>
                    <ArrowLeft size={22} />
                </button>
                <ShoppingBag size={20} color="var(--primary-color)" />
                <span style={{ fontSize: 18, fontWeight: 800 }}>Dong Shop</span>
                <div style={{
                    marginLeft: 'auto', padding: '6px 12px', borderRadius: 20,
                    backgroundColor: 'rgba(242,194,85,0.15)', fontSize: 14, fontWeight: 800, color: '#F2C255',
                }}>
                    {balance.toLocaleString()}₫
                </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
                {/* Category Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
                    {SHOP_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '10px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                                border: activeCategory === cat.id ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                                backgroundColor: activeCategory === cat.id ? 'rgba(255,209,102,0.15)' : 'transparent',
                                color: activeCategory === cat.id ? 'var(--primary-color)' : 'var(--text-muted)',
                                cursor: 'pointer', whiteSpace: 'nowrap',
                            }}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {items.map(item => (
                        <div
                            key={item.id}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14, padding: 16,
                                backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                                border: `1px solid ${purchasedId === item.id ? 'var(--success-color)' : 'var(--border-color)'}`,
                                position: 'relative', overflow: 'hidden',
                            }}
                        >
                            {item.popular && (
                                <div style={{
                                    position: 'absolute', top: 0, right: 0, padding: '2px 10px',
                                    backgroundColor: '#EF476F', color: 'white', fontSize: 9, fontWeight: 800,
                                    borderBottomLeftRadius: 8, textTransform: 'uppercase', letterSpacing: 0.5,
                                }}>
                                    Popular
                                </div>
                            )}
                            <div style={{
                                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: item.color + '18', color: item.color,
                            }}>
                                {item.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{item.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.3 }}>{item.desc}</div>
                            </div>
                            <button
                                onClick={() => handlePurchase(item)}
                                style={{
                                    padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                    fontSize: 13, fontWeight: 800, flexShrink: 0,
                                    backgroundColor: purchasedId === item.id ? 'var(--success-color)' : balance >= item.price ? 'var(--primary-color)' : 'var(--surface-color-light)',
                                    color: purchasedId === item.id ? 'white' : balance >= item.price ? '#1A1A1A' : 'var(--text-muted)',
                                }}
                            >
                                {purchasedId === item.id ? (
                                    <><CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Bought</>
                                ) : (
                                    `${item.price.toLocaleString()}₫`
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Earn More Section */}
                <div style={{
                    marginTop: 24, padding: 20, textAlign: 'center',
                    backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    background: 'linear-gradient(135deg, rgba(242,194,85,0.08), rgba(206,130,255,0.08))',
                }}>
                    <Crown size={32} color="#FFD166" style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Want more Dong?</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.4 }}>
                        Complete lessons, maintain streaks, and ace quizzes to earn Dong!
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '12px 24px', borderRadius: 12, border: 'none',
                            backgroundColor: 'var(--primary-color)', color: '#1A1A1A',
                            fontSize: 14, fontWeight: 800, cursor: 'pointer',
                        }}
                    >
                        Start a Lesson
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DongShop;
