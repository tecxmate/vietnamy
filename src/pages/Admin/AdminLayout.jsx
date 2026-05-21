import React, { useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookText, Languages, LogOut, FileText, BookOpen, Music, Users, PenTool, FlaskConical, Download, Upload } from 'lucide-react';
import { logoutAdmin } from '../../lib/adminAuth';
import { exportDB, importDB } from '../../lib/storage/mockDbStore';

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
        alert('Import successful. Reloading…');
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
    const importInputRef = useRef(null);
    const sidebarBtn = {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)', background: 'transparent',
        color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', textAlign: 'left',
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', overflow: 'hidden' }}>
            {/* Sidebar Navigation */}
            <nav style={{ width: '250px', backgroundColor: 'var(--surface-color)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: 'var(--spacing-4)' }}>
                <h2 style={{ fontSize: 20, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>⚙️</span> Vietnamy Admin
                </h2>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <NavLink
                        to="/admin/mapper"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                            borderRadius: 'var(--radius-md)', textDecoration: 'none',
                            backgroundColor: isActive ? 'rgba(242, 107, 90, 0.1)' : 'transparent',
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
                            backgroundColor: isActive ? 'rgba(242, 107, 90, 0.1)' : 'transparent',
                            color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                            fontWeight: isActive ? 700 : 400
                        })}
                    >
                        <BookText size={20} />
                        Lesson Builder
                    </NavLink>

                    <NavLink
                        to="/admin/grammar"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                            borderRadius: 'var(--radius-md)', textDecoration: 'none',
                            backgroundColor: isActive ? 'rgba(242, 107, 90, 0.1)' : 'transparent',
                            color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                            fontWeight: isActive ? 700 : 400
                        })}
                    >
                        <Languages size={20} />
                        Grammar Editor
                    </NavLink>

                    <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '8px 0' }} />

                    <NavLink
                        to="/admin/articles"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                            borderRadius: 'var(--radius-md)', textDecoration: 'none',
                            backgroundColor: isActive ? 'rgba(242, 107, 90, 0.1)' : 'transparent',
                            color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                            fontWeight: isActive ? 700 : 400
                        })}
                    >
                        <FileText size={20} />
                        Articles
                    </NavLink>

                    <NavLink
                        to="/admin/vocab"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                            borderRadius: 'var(--radius-md)', textDecoration: 'none',
                            backgroundColor: isActive ? 'rgba(242, 107, 90, 0.1)' : 'transparent',
                            color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                            fontWeight: isActive ? 700 : 400
                        })}
                    >
                        <BookOpen size={20} />
                        Vocabulary
                    </NavLink>

                    <NavLink
                        to="/admin/tones"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                            borderRadius: 'var(--radius-md)', textDecoration: 'none',
                            backgroundColor: isActive ? 'rgba(242, 107, 90, 0.1)' : 'transparent',
                            color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                            fontWeight: isActive ? 700 : 400
                        })}
                    >
                        <Music size={20} />
                        Tone Words
                    </NavLink>

                    <NavLink
                        to="/admin/drills"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                            borderRadius: 'var(--radius-md)', textDecoration: 'none',
                            backgroundColor: isActive ? 'rgba(242, 107, 90, 0.1)' : 'transparent',
                            color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                            fontWeight: isActive ? 700 : 400
                        })}
                    >
                        <PenTool size={20} />
                        Drill Modules
                    </NavLink>

                    <NavLink
                        to="/admin/kinship"
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                            borderRadius: 'var(--radius-md)', textDecoration: 'none',
                            backgroundColor: isActive ? 'rgba(242, 107, 90, 0.1)' : 'transparent',
                            color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                            fontWeight: isActive ? 700 : 400
                        })}
                    >
                        <Users size={20} />
                        Kinship & Pronouns
                    </NavLink>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                    <button onClick={handleExport} style={sidebarBtn} title="Download a JSON backup of your curriculum edits (units, lessons, exercises). Excludes student progress.">
                        <Download size={16} /> Export edits
                    </button>
                    <button onClick={() => importInputRef.current?.click()} style={sidebarBtn} title="Restore curriculum edits from a previously exported JSON file. Replaces current edits.">
                        <Upload size={16} /> Import edits
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
                    onClick={() => openAsFreshStudent(navigate)}
                    title="Wipe progress (coins/hearts/streak/completed nodes) and open the app as a fresh student. Curriculum edits and user profile are preserved."
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12,
                        padding: '12px 16px', marginBottom: 8,
                        borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-color)',
                        background: 'rgba(242, 107, 90, 0.08)', color: 'var(--primary-color)',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    }}
                >
                    <FlaskConical size={20} />
                    Test as fresh student
                </button>

                <button
                    className="ghost"
                    onClick={() => {
                        logoutAdmin();
                        navigate('/');
                    }}
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
