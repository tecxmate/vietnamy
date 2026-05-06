import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Sparkles } from 'lucide-react';

const AdminLayout = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', overflow: 'hidden' }}>
            {/* Top Navigation */}
            <nav style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '8px 16px',
                backgroundColor: 'var(--surface-color)',
                borderBottom: '1px solid var(--border-color)',
                flexShrink: 0,
            }}>
                <h2 style={{ fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 18 }}>⚙️</span> Vietnamy Admin
                </h2>

                <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                    <NavLink
                        to="/admin/curriculum-preview"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                            borderRadius: 'var(--radius-md)', textDecoration: 'none', fontSize: 13,
                            backgroundColor: isActive ? 'rgba(242, 107, 90, 0.1)' : 'transparent',
                            color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                            fontWeight: isActive ? 700 : 500,
                        })}
                    >
                        <Sparkles size={16} />
                        Study Curriculum
                    </NavLink>

                    {/* Legacy editors (Roadmap Mapper, Lesson Builder, Grammar, Articles, Vocab,
                        Tone Words, Drills, Kinship) are temporarily hidden. Routes still resolve. */}
                </div>

                <button
                    className="ghost"
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        color: 'var(--text-muted)', fontSize: 13, padding: '6px 12px',
                    }}
                >
                    <LogOut size={16} />
                    Back to App
                </button>
            </nav>

            {/* Main Content Area */}
            <main style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
