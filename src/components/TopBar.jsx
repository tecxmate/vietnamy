import React, { useState } from 'react';
import { Target, Heart, Zap, User, Settings, Shield, Wrench, X, ChevronDown, RefreshCw, Globe, Type, Volume2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TAB_META = {
    practice: { title: 'Targeted Practice', subtitle: 'Focus on specific skills for quick wins' },
    dictionary: { title: 'Dictionary', subtitle: 'Search Vietnamese words, technical terms, and phrases' },
    watch: { title: 'Watch & Learn', subtitle: 'Immerse yourself with native content' },
    leaderboard: { title: 'Leaderboard', subtitle: 'See how you stack up against other learners' },
};

const TopBar = ({ stats, activeTab }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const isRoadmap = activeTab === 'roadmap';
    const meta = TAB_META[activeTab];

    return (
        <>
            <header className="top-bar">
                {/* Profile Avatar Button */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    style={{
                        padding: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        marginRight: 'var(--spacing-4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-color)',
                        flexShrink: 0,
                    }}
                >
                    <User size={24} />
                </button>

                {/* Center: progress bar (roadmap) OR tab title (other tabs) */}
                {isRoadmap ? (
                    <div className="flex items-center gap-2" style={{ flex: 1, marginRight: 'var(--spacing-4)' }}>
                        <Target size={20} color="var(--text-muted)" />
                        <div style={{ flex: 1, height: 10, backgroundColor: 'var(--surface-color-light)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <div style={{ width: '66%', height: '100%', backgroundColor: 'var(--primary-color)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}></div>
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, marginRight: 'var(--spacing-4)', overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 15, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {meta?.title}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {meta?.subtitle}
                        </p>
                    </div>
                )}

                {/* Stats — Roadmap only */}
                {isRoadmap && (
                    <div className="flex gap-3">
                        <div className="stat-badge streak" style={{ padding: '4px 8px', fontSize: '14px' }}>
                            <Zap size={16} fill="currentColor" /> {stats.streak}
                        </div>
                        <div className="stat-badge hearts" style={{ padding: '4px 8px', fontSize: '14px' }}>
                            <Heart size={16} fill="currentColor" /> {stats.hearts}
                        </div>
                    </div>
                )}
            </header>


            {/* Account Settings Overlay Modal */}
            {isMenuOpen && (
                <div className="modal-overlay" onClick={() => setIsMenuOpen(false)}>
                    <div className="modal-content slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 style={{ margin: 0 }}>Account Settings</h2>
                            <button className="ghost" onClick={() => setIsMenuOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Profile Info */}
                        <div className="flex items-center gap-4 mb-6">
                            <div style={{ width: 64, height: 64, backgroundColor: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1A1A' }}>
                                <User size={32} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 20, margin: 0, marginBottom: 4 }}>Nguyễn Văn Test</h3>
                                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Southern Dialect • 10m/day goal</span>
                            </div>
                        </div>

                        {/* Scrollable Settings Area */}
                        <div style={{
                            margin: '0 -24px -24px -24px',
                            padding: '24px',
                            backgroundColor: 'rgba(0,0,0,0.03)',
                            overflowY: 'auto',
                            maxHeight: '65vh'
                        }}>
                            {/* Group 1 */}
                            <div className="glass-panel" style={{ padding: 0, marginBottom: '20px', borderRadius: '16px' }}>
                                <SettingDropdown label="Ngày nhắc trong tuần" value="2, 3, 4, 5, 6, 7, CN" />
                            </div>

                            {/* Group 2 */}
                            <div className="glass-panel" style={{ padding: 0, marginBottom: '20px', borderRadius: '16px' }}>
                                <SettingToggle label="Hiện Hán Việt" checked={true} />
                                <SettingDropdown label="Chế độ học" value="Phồn thể" />
                                <SettingDropdown label="Kiểu phiên âm" value="Bính âm" />
                            </div>

                            {/* Group 3 */}
                            <div className="glass-panel" style={{ padding: 0, marginBottom: '20px', borderRadius: '16px' }}>
                                <SettingDropdown label="Ngôn ngữ" value="Tiếng Việt" icon={<Globe size={16} color="var(--primary-color)" />} />
                                <SettingDropdown label="Font chữ" value="Nghiêm túc" icon={<Type size={16} color="#8D6E63" />} />
                                <SettingDropdown label="Cỡ chữ" value="15.0" />
                            </div>

                            {/* Group 4 */}
                            <div className="glass-panel" style={{ padding: 0, marginBottom: '20px', borderRadius: '16px' }}>
                                <SettingDropdown label="Giọng nói" value="Shi" icon={<User size={16} />} />
                                <SettingDropdown label="Tốc độ" value="1.0x" />
                            </div>

                            {/* Group 5: Actions */}
                            <div className="glass-panel" style={{ padding: 0, borderRadius: '16px' }}>
                                <SettingAction label="Tùy chọn Quản trị (Admin CMS)" icon={<Wrench size={18} />} onClick={() => { setIsMenuOpen(false); navigate('/admin'); }} />
                                <SettingAction label="Khôi phục cài đặt gốc" icon={<RefreshCw size={18} />} color="var(--danger-color)" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// --- Mockup Components for Settings ---

const SettingDropdown = ({ label, value, icon }) => (
    <div className="flex justify-between items-center p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: 16 }}>{label}</span>
        <div className="flex items-center gap-2" style={{ backgroundColor: 'var(--surface-color-light)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>
            {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
            <span style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
            <ChevronDown size={16} color="var(--text-muted)" />
        </div>
    </div>
);

const SettingToggle = ({ label, checked }) => (
    <div className="flex justify-between items-center p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: 16 }}>{label}</span>
        <div style={{
            width: 50, height: 30, backgroundColor: checked ? '#1e3a8a' : 'var(--surface-color-light)',
            borderRadius: 15, position: 'relative', cursor: 'pointer', transition: '0.3s'
        }}>
            <div style={{
                width: 26, height: 26, backgroundColor: 'white', borderRadius: '50%',
                position: 'absolute', top: 2, left: checked ? 22 : 2, transition: '0.3s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
        </div>
    </div>
);

const SettingAction = ({ label, icon, color = 'var(--text-main)', onClick }) => (
    <div onClick={onClick} className="flex items-center gap-3 p-4 cursor-pointer" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 16, fontWeight: 500, color }}>{label}</span>
    </div>
);

export default TopBar;
