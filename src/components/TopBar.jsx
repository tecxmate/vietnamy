import { useState } from 'react';
import {
    Target, Zap, User, Wrench, Bell, Crown,
    Settings, BookOpen, ShoppingBag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDong } from '../context/DongContext';
import { useUser } from '../context/UserContext';

const TAB_META = {
    home: null,
    study: null,
    dictionary: { title: 'Dictionary', subtitle: 'Search Vietnamese words' },
    grammar: { title: 'Grammar', subtitle: 'Browse patterns by level' },
    library: { title: 'Library', subtitle: 'Grammar, reading & practice' },
    community: { title: 'Community', subtitle: 'Leaderboards & friends' },
};

const TopBar = ({ activeTab, subtitleOverride }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { balance, dailyStreak, isExecutive } = useDong();
    const { userProfile } = useUser();
    const isHome = activeTab === 'home';
    const isRoadmap = activeTab === 'roadmap';
    const meta = TAB_META[activeTab];

    return (
        <>
            <header className="top-bar">
                {/* Profile Avatar */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    style={{
                        padding: '8px', borderRadius: '50%',
                        backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)',
                        marginRight: 'var(--spacing-3)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0,
                    }}
                >
                    <User size={22} />
                </button>

                {/* Center: greeting (home), progress bar (roadmap), or tab title */}
                {isHome ? (
                    <div style={{ flex: 1, marginRight: 'var(--spacing-3)', overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 16, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; })()}, {userProfile?.name || 'Bạn'}!
                        </p>
                    </div>
                ) : isRoadmap ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, marginRight: 'var(--spacing-3)' }}>
                        <Target size={18} color="var(--text-muted)" />
                        <div style={{ flex: 1, height: 8, backgroundColor: 'var(--surface-color-light)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <div style={{ width: '66%', height: '100%', backgroundColor: 'var(--primary-color)' }} />
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, marginRight: 'var(--spacing-3)', overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {meta?.title}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                            {subtitleOverride || meta?.subtitle}
                        </p>
                    </div>
                )}

                {/* Stats — always visible */}
                <div style={{
                    display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0,
                    backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-full)', padding: '4px 6px',
                }}>
                    <button onClick={() => navigate('/premium')} className="ghost" style={{
                        padding: '4px 6px', display: 'flex', alignItems: 'center',
                        color: isExecutive ? '#06D6A0' : '#FFD166',
                    }}>
                        <Crown size={17} fill={isExecutive ? '#06D6A0' : '#FFD166'} />
                    </button>
                    <div style={{ width: 1, height: 16, backgroundColor: 'var(--border-color)' }} />
                    <button onClick={() => navigate('/notifications')} className="ghost" style={{
                        padding: '4px 6px', display: 'flex', alignItems: 'center',
                        color: 'var(--text-muted)', position: 'relative',
                    }}>
                        <Bell size={17} />
                        <div style={{ position: 'absolute', top: 1, right: 3, width: 7, height: 7, borderRadius: '50%', backgroundColor: '#EF476F' }} />
                    </button>
                    <div style={{ width: 1, height: 16, backgroundColor: 'var(--border-color)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 6px', fontSize: 13, fontWeight: 700, color: '#FF6B35' }}>
                        <Zap size={13} fill="currentColor" /> {dailyStreak}
                    </div>
                    <div style={{ width: 1, height: 16, backgroundColor: 'var(--border-color)' }} />
                    <div onClick={() => navigate('/shop')} style={{ padding: '4px 6px', fontSize: 13, fontWeight: 800, color: '#F2C255', cursor: 'pointer' }}>
                        {balance.toLocaleString()}₫
                    </div>
                </div>
            </header>

            {/* ─── Left Drawer (Spotify-style) ──────────────────── */}
            {isMenuOpen && (
                <>
                    <div className="drawer-overlay" onClick={() => setIsMenuOpen(false)} />
                    <div className="drawer-panel" onClick={e => e.stopPropagation()}>

                        {/* Profile Card */}
                        <div
                            onClick={() => { setIsMenuOpen(false); navigate('/account'); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '24px 20px 20px', cursor: 'pointer',
                            }}
                        >
                            <div style={{
                                width: 48, height: 48, backgroundColor: 'var(--primary-color)',
                                borderRadius: '50%', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: '#1A1A1A', flexShrink: 0,
                            }}>
                                <User size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: 18, margin: 0, fontWeight: 800 }}>{userProfile.name || 'Learner'}</h3>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>View account</span>
                            </div>
                        </div>

                        <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '0 20px' }} />

                        {/* Menu Items */}
                        <nav style={{ padding: '8px 0', flex: 1 }}>
                            <DrawerItem
                                icon={<Crown size={20} />}
                                label="Your Premium"
                                badge={isExecutive ? 'Executive' : null}
                                badgeColor={isExecutive ? '#06D6A0' : null}
                                onClick={() => { setIsMenuOpen(false); navigate('/premium'); }}
                            />
                            <DrawerItem
                                icon={<ShoppingBag size={20} />}
                                label="Dong Shop"
                                onClick={() => { setIsMenuOpen(false); navigate('/shop'); }}
                            />
                            <DrawerItem
                                icon={<Bell size={20} />}
                                label="Notifications"
                                onClick={() => { setIsMenuOpen(false); navigate('/notifications'); }}
                            />
                            <DrawerItem
                                icon={<BookOpen size={20} />}
                                label="Achievements"
                                onClick={() => { setIsMenuOpen(false); navigate('/achievements'); }}
                            />

                            <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '8px 20px' }} />

                            <DrawerItem
                                icon={<Wrench size={20} />}
                                label="Admin CMS"
                                onClick={() => { setIsMenuOpen(false); navigate('/admin'); }}
                            />
                            <DrawerItem
                                icon={<Settings size={20} />}
                                label="Settings and preferences"
                                onClick={() => { setIsMenuOpen(false); navigate('/settings'); }}
                            />
                        </nav>

                        {/* Footer */}
                        <div style={{ padding: '16px 20px 24px', borderTop: '1px solid var(--border-color)' }}>
                            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Vietnamy Education · <a href="https://tecxmate.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>TECXMATE.COM</a>
                            </p>
                        </div>
                    </div>
                </>
            )}

        </>
    );
};

// ─── Drawer Item ─────────────────────────────────────────────

const DrawerItem = ({ icon, label, detail, badge, badgeColor, onClick }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 20px', cursor: 'pointer',
        }}
    >
        <span style={{ color: 'var(--text-main)', display: 'flex', opacity: 0.7 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{label}</span>
        {badge && (
            <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: badgeColor ? `${badgeColor}20` : 'var(--surface-color-light)',
                color: badgeColor || 'var(--text-muted)',
                border: `1px solid ${badgeColor ? `${badgeColor}40` : 'var(--border-color)'}`,
            }}>
                {badge}
            </span>
        )}
        {detail && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{detail}</span>
        )}
    </div>
);

export default TopBar;
