import React, { useState } from 'react';
import { User, Bell, Settings as SettingsIcon } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useUser } from '../context/UserContext';
import { useT } from '../lib/i18n';
import './MobileAccountBar.css';

/**
 * Mobile-only account entry point. The desktop TopBar/sidebar (which holds the
 * profile/settings drawer + notifications) is hidden on mobile, leaving Settings
 * and Notifications unreachable. This slim bar restores access Spotify-style: an
 * avatar top-left that opens a small menu. It reuses the existing surfaces —
 * Settings via the portaled drawer (the `open-settings` event TopBar listens
 * for) and Notifications via the NotificationContext panel — so nothing is
 * duplicated. Hidden ≥768px where the sidebar takes over.
 */
export default function MobileAccountBar() {
    const [open, setOpen] = useState(false);
    const { unreadCount, openPanel } = useNotifications();
    const { userProfile } = useUser();
    const t = useT();

    const openSettings = () => {
        setOpen(false);
        window.dispatchEvent(new Event('open-settings'));
    };
    const openNotifications = () => {
        setOpen(false);
        openPanel();
    };

    return (
        <div className="mobile-account-bar">
            <button
                className="mobile-account-avatar"
                onClick={() => setOpen(v => !v)}
                aria-label={userProfile?.name || t('settings')}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <User size={20} />
                {unreadCount > 0 && <span className="mobile-account-dot" />}
            </button>

            {open && (
                <>
                    <div className="mobile-account-overlay" onClick={() => setOpen(false)} />
                    <div className="mobile-account-menu" role="menu">
                        {userProfile?.name && (
                            <div className="mobile-account-name">{userProfile.name}</div>
                        )}
                        <button role="menuitem" className="mobile-account-item" onClick={openNotifications}>
                            <Bell size={18} />
                            <span>{t('notifications')}</span>
                            {unreadCount > 0 && <span className="mobile-account-badge">{unreadCount}</span>}
                        </button>
                        <button role="menuitem" className="mobile-account-item" onClick={openSettings}>
                            <SettingsIcon size={18} />
                            <span>{t('settings')}</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
