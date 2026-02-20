import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookText, LogOut } from 'lucide-react';

const AdminLayout = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', overflow: 'hidden' }}>
            {/* Sidebar Navigation */}
            <nav style={{ width: '250px', backgroundColor: 'var(--surface-color)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: 'var(--spacing-4)' }}>
                <h2 style={{ fontSize: 20, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>⚙️</span> VNME Admin
                </h2>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <NavLink
                        to="/admin/mapper"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                            borderRadius: 'var(--radius-md)', textDecoration: 'none',
                            backgroundColor: isActive ? 'rgba(255, 209, 102, 0.1)' : 'transparent',
                            color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                            fontWeight: isActive ? 700 : 400
                        })}
                    >
                        <LayoutDashboard size={20} />
                        Roadmap Mapper
                    </NavLink>

                    <NavLink
                        to="/admin/lesson"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                            borderRadius: 'var(--radius-md)', textDecoration: 'none',
                            backgroundColor: isActive ? 'rgba(255, 209, 102, 0.1)' : 'transparent',
                            color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                            fontWeight: isActive ? 700 : 400
                        })}
                    >
                        <BookText size={20} />
                        Lesson Builder
                    </NavLink>
                </div>

                <button
                    className="ghost"
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', justifyContent: 'flex-start', color: 'var(--text-muted)' }}
                >
                    <LogOut size={20} className="mr-2" />
                    Back to App
                </button>
            </nav>

            {/* Main Content Area */}
            <main style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-8)' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
