import React from 'react';
import { Home, BookOpen, Search, Library, User, Bell, Settings, Pen, Music } from 'lucide-react';
import { useT } from '../lib/i18n';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';

const BottomNav = ({ activeTab, setActiveTab, onPreloadTab, tabs: allowedTabs, switcher = null }) => {
    const t = useT();
    const { userProfile } = useUser();
    const { unreadCount, openPanel } = useNotifications();

    const allTabs = [
        { id: 'home', icon: <Home size={24} />, label: t('nav_home') },
        { id: 'dicthome', icon: <Home size={24} />, label: t('nav_home') },
        { id: 'study', icon: <BookOpen size={24} />, label: t('nav_study') },
        { id: 'grammar', icon: <Pen size={24} />, label: t('nav_grammar') },
        { id: 'sounds', icon: <Music size={24} />, label: t('nav_sounds') },
        { id: 'dictionary', icon: <Search size={24} />, label: t('nav_dictionary') },
        { id: 'library', icon: <Library size={24} />, label: t('nav_library') },
    ];
    const tabs = allowedTabs ? allTabs.filter(tab => allowedTabs.includes(tab.id)) : allTabs;

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
                {switcher}
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                        onPointerEnter={() => onPreloadTab?.(tab.id)}
                        onPointerDown={() => onPreloadTab?.(tab.id)}
                        onFocus={() => onPreloadTab?.(tab.id)}
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
                        <span>{t('nav_notifications')}</span>
                        {unreadCount > 0 && <span className="sidebar-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>
                    <button className="nav-item" onClick={openSettings}>
                        <Settings size={24} />
                        <span>{t('nav_settings')}</span>
                    </button>
                    <div className="sidebar-profile" onClick={openSettings}>
                        <div className="sidebar-avatar">
                            <User size={18} />
                        </div>
                        <div className="sidebar-profile-info">
                            <span className="sidebar-profile-name">{userProfile.name || t('nav_sidebar_profile_name')}</span>
                            <span className="sidebar-profile-sub">{userProfile.dailyMins ? `${userProfile.dailyMins}m/day` : t('nav_sidebar_profile_subtitle')}</span>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default BottomNav;
