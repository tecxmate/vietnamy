import React, { useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, BookText, LogOut, FileText, BookOpen, Music,
    Users, PenTool, FlaskConical, Download, Upload, Menu, X, Lightbulb, Sparkles
} from 'lucide-react';
import { logoutAdmin } from '../../lib/adminAuth';
import { exportDB, importDB } from '../../lib/storage/mockDbStore';
import './AdminLayout.css';

const NAV_ITEMS = [
    { to: '/admin/mapper', label: 'Roadmap Mapper', icon: LayoutDashboard },
    { to: '/admin/lesson', label: 'Lesson Builder', icon: BookText },
    { to: '/admin/concepts', label: 'Concepts', icon: Lightbulb },
    { to: '/admin/adaptive', label: 'Adaptive Sequencer', icon: Sparkles },
    { divider: true },
    { to: '/admin/articles', label: 'Articles', icon: FileText },
    { to: '/admin/vocab', label: 'Vocabulary', icon: BookOpen },
    { to: '/admin/tones', label: 'Tone Words', icon: Music },
    { to: '/admin/drills', label: 'Drill Modules', icon: PenTool },
    { to: '/admin/kinship', label: 'Kinship & Pronouns', icon: Users },
    { to: '/admin/mascot', label: 'Mascot Scripts', icon: Sparkles },
];

const PAGE_TITLES = {
    '/admin/mapper': 'Roadmap Mapper',
    '/admin/lesson': 'Lesson Builder',
    '/admin/concepts': 'Concepts',
    '/admin/adaptive': 'Adaptive Sequencer',
    '/admin/articles': 'Articles',
    '/admin/vocab': 'Vocabulary',
    '/admin/tones': 'Tone Words',
    '/admin/drills': 'Drill Modules',
    '/admin/kinship': 'Kinship & Pronouns',
    '/admin/mascot': 'Mascot Scripts',
};

const downloadJson = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

const handleExport = () => {
    const payload = exportDB();
    downloadJson(payload, `vnme-curriculum-edits-${new Date().toISOString().slice(0, 10)}.json`);
};

const handleImport = async (file) => {
    if (!file) return;
    const ok = confirm(
        `Import "${file.name}"?\n\n` +
        'This REPLACES your current curriculum (units, lessons, exercises). ' +
        'Student progress is not affected. Tip: export first if you want a backup.'
    );
    if (!ok) return;
    try {
        const text = await file.text();
        importDB(JSON.parse(text));
        alert('Import successful. Reloading...');
        window.location.reload();
    } catch (err) {
        alert(`Import failed: ${err.message || err}`);
    }
};

// Open the live app as a fresh student: wipes lesson progress + coins/hearts/streak,
// but keeps the user profile, onboarding state, and any curriculum edits made via the
// CMS (those live in vnme_mock_db_v24, which is untouched here).
const openAsFreshStudent = (navigate) => {
    const ok = confirm(
        'Reset all student progress (completed nodes, coins, hearts, streak) and open the app as a fresh student?\n\n' +
        'Your curriculum edits will be preserved. Your user profile will be preserved.'
    );
    if (!ok) return;
    try {
        localStorage.removeItem('vietnamy_progress');
        localStorage.removeItem('vietnamy_dong');
    } catch { /* ignore */ }
    navigate('/');
    // Reload so every context re-reads localStorage from scratch.
    if (typeof window !== 'undefined') setTimeout(() => window.location.reload(), 0);
};

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const importInputRef = useRef(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const pageTitle = PAGE_TITLES[location.pathname] || 'Admin';

    const closeMobileNav = () => setIsMobileNavOpen(false);

    const renderNavItems = () => NAV_ITEMS.map((item, index) => {
        if (item.divider) return <div key={`divider-${index}`} className="admin-nav-divider" />;
        const Icon = item.icon;
        return (
            <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
                title={item.label}
                onClick={closeMobileNav}
            >
                <Icon size={20} />
                <span className="admin-nav-label">{item.label}</span>
            </NavLink>
        );
    });

    return (
        <div className={`admin-shell${isCollapsed ? ' sidebar-collapsed' : ''}${isMobileNavOpen ? ' mobile-nav-open' : ''}`}>
            <button className="admin-sidebar-scrim" type="button" aria-label="Close admin menu" onClick={closeMobileNav} />

            <nav className="admin-sidebar" aria-label="Admin navigation">
                <div className="admin-sidebar-header">
                    <div className="admin-brand" title="Vietnamy Admin">
                        <span className="admin-brand-text">Vietnamy Admin</span>
                    </div>
                    <button className="admin-mobile-close" type="button" aria-label="Close admin menu" onClick={closeMobileNav}>
                        <X size={20} />
                    </button>
                    <button
                        className="admin-collapse-btn"
                        type="button"
                        aria-label={isCollapsed ? 'Expand admin sidebar' : 'Collapse admin sidebar'}
                        onClick={() => setIsCollapsed(value => !value)}
                    >
                        <span className="admin-collapse-emoji" aria-hidden="true">⚙️</span>
                    </button>
                </div>

                <div className="admin-nav-list">{renderNavItems()}</div>

                <div className="admin-sidebar-actions">
                    <button className="admin-sidebar-btn" onClick={handleExport} title="Download a JSON backup of your curriculum edits (units, lessons, exercises). Excludes student progress.">
                        <Download size={16} /> <span className="admin-nav-label">Export edits</span>
                    </button>
                    <button className="admin-sidebar-btn" onClick={() => importInputRef.current?.click()} title="Restore curriculum edits from a previously exported JSON file. Replaces current edits.">
                        <Upload size={16} /> <span className="admin-nav-label">Import edits</span>
                    </button>
                    <input
                        ref={importInputRef}
                        type="file"
                        accept="application/json,.json"
                        style={{ display: 'none' }}
                        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; handleImport(f); }}
                    />
                </div>

                <button
                    className="admin-fresh-btn"
                    onClick={() => openAsFreshStudent(navigate)}
                    title="Wipe progress (coins/hearts/streak/completed nodes) and open the app as a fresh student. Curriculum edits and user profile are preserved."
                >
                    <FlaskConical size={20} />
                    <span className="admin-nav-label">Test as fresh student</span>
                </button>

                <button
                    className="admin-back-btn"
                    onClick={() => {
                        logoutAdmin();
                        navigate('/');
                    }}
                    title="Back to App"
                >
                    <LogOut size={20} />
                    <span className="admin-nav-label">Back to App</span>
                </button>
            </nav>

            <main className="admin-main">
                <header className="admin-mobile-topbar">
                    <button className="admin-mobile-menu" type="button" aria-label="Open admin menu" onClick={() => setIsMobileNavOpen(true)}>
                        <Menu size={22} />
                    </button>
                    <div className="admin-mobile-title">
                        <span>Vietnamy Admin</span>
                        <strong>{pageTitle}</strong>
                    </div>
                </header>
                <div className="admin-main-inner">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
