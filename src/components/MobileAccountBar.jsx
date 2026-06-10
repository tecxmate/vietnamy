import React from 'react';
import { User } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useT } from '../lib/i18n';
import './MobileAccountBar.css';

/**
 * Study-tab avatar (top-left). Tapping it opens the Settings drawer directly
 * via the `open-settings` event that TopBar listens for. Notifications now live
 * in their own bell in the Study header, so this is settings-only. Lives only on
 * the Study tab; hidden ≥768px where the sidebar takes over.
 */
export default function MobileAccountBar({ inline = false }) {
    const { userProfile } = useUser();
    const t = useT();
    const initial = userProfile?.name?.trim?.()?.[0]?.toUpperCase();

    return (
        <div className={`mobile-account-bar${inline ? ' mobile-account-bar--inline' : ''}`}>
            <button
                className="mobile-account-avatar"
                onClick={() => window.dispatchEvent(new Event('open-settings'))}
                aria-label={t('settings')}
            >
                {initial ? <span className="mobile-account-initial">{initial}</span> : <User size={20} />}
            </button>
        </div>
    );
}
