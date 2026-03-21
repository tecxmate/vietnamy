import React from 'react';
import { Home, BookOpen, Search, Library, Dumbbell, Sparkles, User, Bell, Settings } from 'lucide-react';
import { useT } from '../lib/i18n';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';

const BottomNav = ({ activeTab, setActiveTab }) => {
    const t = useT();
    const { userProfile } = useUser();
    const { unreadCount, openPanel } = useNotifications();

    const tabs = [
        { id: 'home', icon: <Home size={24} />, label: t('nav_home') },
        { id: 'study', icon: <BookOpen size={24} />, label: t('nav_study') },
        { id: 'dictionary', icon: <Search size={24} />, label: t('nav_dictionary') },
        { id: 'scenes', icon: <Sparkles size={24} />, label: t('nav_scenes') },
        { id: 'practice', icon: <Dumbbell size={24} />, label: t('nav_practice') },
        { id: 'library', icon: <Library size={24} />, label: t('nav_library') },
    ];

    const openSettings = () => {
        window.dispatchEvent(new Event('open-settings'));
    };

    return (
        <>
            <nav className="bottom-nav">
                <div className="sidebar-brand">
                    <img src="/icon.png" alt="Vietnamy" className="sidebar-brand-icon" />
                    <span className="sidebar-brand-name">Vietnamy</span>
                </div>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}

                {/* Desktop sidebar footer — profile & notifications */}
                <div className="sidebar-footer">
                    <button className="nav-item" onClick={() => openPanel()}>
                        <Bell size={24} />
                        <span>Notifications</span>
                        {unreadCount > 0 && <span className="sidebar-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>
                    <button className="nav-item" onClick={openSettings}>
                        <Settings size={24} />
                        <span>Settings</span>
                    </button>
                    <div className="sidebar-profile" onClick={openSettings}>
                        <div className="sidebar-avatar">
                            <User size={18} />
                        </div>
                        <div className="sidebar-profile-info">
                            <span className="sidebar-profile-name">{userProfile.name || 'Learner'}</span>
                            <span className="sidebar-profile-sub">{userProfile.dailyMins ? `${userProfile.dailyMins}m/day` : 'Vietnamese Learner'}</span>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default BottomNav;
