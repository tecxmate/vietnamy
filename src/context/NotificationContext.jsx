import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { playNotifSound } from '../utils/sound';

const NotificationContext = createContext(null);

// ─── Notification definitions (no emojis) ─────────────────────────────────────
export const NOTIFICATION_DEFS = {
    streak_3: {
        type: 'streak',
        icon: 'flame',
        title: 'On fire!',
        body: '3 correct in a row — keep that streak going.',
        color: '#FF6B35',
        accent: 'rgba(255,107,53,0.15)',
        border: 'rgba(255,107,53,0.3)',
    },
    streak_5: {
        type: 'streak',
        icon: 'flame',
        title: '5-answer streak!',
        body: 'Unstoppable. You\'re in the zone right now.',
        color: '#FF6B35',
        accent: 'rgba(255,107,53,0.15)',
        border: 'rgba(255,107,53,0.3)',
    },
    lesson_complete: {
        type: 'goal',
        icon: 'target',
        title: 'Lesson complete',
        body: 'Great work — daily goal progress updated.',
        color: '#06D6A0',
        accent: 'rgba(6,214,160,0.13)',
        border: 'rgba(6,214,160,0.3)',
    },
    achievement_tonemaster: {
        type: 'achievement',
        icon: 'trophy',
        title: 'Badge unlocked: Tonemaster',
        body: '5 correct answers in a row. Impressive focus!',
        color: '#9B5DE5',
        accent: 'rgba(155,93,229,0.13)',
        border: 'rgba(155,93,229,0.3)',
    },
    lost_heart: {
        type: 'warning',
        icon: 'heart-crack',
        title: 'Heart lost',
        body: 'Wrong answer — stay focused, you\'ve got this.',
        color: '#FF4B4B',
        accent: 'rgba(255,75,75,0.13)',
        border: 'rgba(255,75,75,0.3)',
    },
    daily_streak: {
        type: 'info',
        icon: 'calendar',
        title: 'Streak active',
        body: 'Your daily streak is running. Keep studying today!',
        color: '#4CC9F0',
        accent: 'rgba(76,201,240,0.13)',
        border: 'rgba(76,201,240,0.3)',
    },
    coins_earned: {
        type: 'reward',
        icon: 'coin',
        title: 'Coins earned',
        body: '+10 coins for completing the lesson.',
        color: '#FFB703',
        accent: 'rgba(255,183,3,0.13)',
        border: 'rgba(255,183,3,0.3)',
    },
};

// ─── Mock friend activity feed ─────────────────────────────────────────────────
const FRIEND_ACTIVITY = [
    { id: 'f1', name: 'Nikolas Doan', action: 'completed "Greetings" lesson', relativeTime: '5 min ago', type: 'lesson' },
    { id: 'f2', name: 'Sophie K.', action: 'is on a 7-day streak', relativeTime: '1 hr ago', type: 'streak' },
    { id: 'f3', name: 'David W.', action: 'unlocked the "Tonemaster" badge', relativeTime: '2 hr ago', type: 'achievement' },
    { id: 'f4', name: 'Brian Nguyen', action: 'completed the "Numbers" unit test', relativeTime: 'Yesterday', type: 'test' },
    { id: 'f5', name: 'Hana L.', action: 'joined Vietnamy', relativeTime: 'Yesterday', type: 'join' },
];

const STORAGE_KEY = 'vnme_notifications';
const MAX_HISTORY = 40;
const SERVER_HISTORY_LIMIT = 50;

const DEFAULT_SERVER_STYLE = {
    type: 'info',
    icon: 'bell',
    color: '#4CC9F0',
    accent: 'rgba(76,201,240,0.13)',
    border: 'rgba(76,201,240,0.3)',
};

function loadHistory() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function normalizeLocalHistory(history) {
    return history.map((item, index) => ({
        ...item,
        _uid: item._uid || `local_${item.id || 'notification'}_${item.timestamp || index}`,
        timestamp: item.timestamp || Date.now(),
        isServer: false,
    }));
}

function normalizeServerNotification(notification) {
    const style = NOTIFICATION_DEFS[notification.type] || DEFAULT_SERVER_STYLE;
    const timestamp = Date.parse(notification.at);
    return {
        _uid: `server_${notification.id}`,
        serverId: notification.id,
        id: notification.type || 'system',
        ...style,
        title: notification.title || style.title || 'Notification',
        body: notification.message || style.body || '',
        url: notification.url || '/',
        timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
        read: Boolean(notification.read),
        isServer: true,
        metadata: notification.metadata || {},
    };
}

async function getAuthHeaders() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : null;
}

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const userId = user?.id || '';
    const [localHistory, setLocalHistory] = useState(() => normalizeLocalHistory(loadHistory()));
    const [serverHistory, setServerHistory] = useState([]);
    const [serverUnreadCount, setServerUnreadCount] = useState(0);
    const [liveQueue, setLiveQueue] = useState([]); // toast queue
    const [panelOpen, setPanelOpen] = useState(false);
    const localUnreadCount = useMemo(() => localHistory.filter(n => !n.read).length, [localHistory]);
    const unreadCount = localUnreadCount + serverUnreadCount;
    const history = useMemo(() => (
        [...serverHistory, ...localHistory]
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, SERVER_HISTORY_LIMIT + MAX_HISTORY)
    ), [localHistory, serverHistory]);

    // Persist history
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localHistory.slice(0, MAX_HISTORY)));
    }, [localHistory]);

    const refreshServerNotifications = useCallback(async () => {
        await Promise.resolve();
        if (!userId || userId === 'local-dev') {
            setServerHistory([]);
            setServerUnreadCount(0);
            return;
        }
        const headers = await getAuthHeaders();
        if (!headers) return;
        const response = await fetch(`/api/notifications?limit=${SERVER_HISTORY_LIMIT}`, { headers });
        if (!response.ok) return;
        const data = await response.json();
        setServerHistory((data.notifications || []).map(normalizeServerNotification));
        setServerUnreadCount(Number(data.unreadCount || 0));
    }, [userId]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            refreshServerNotifications().catch(() => {});
        }, 0);
        return () => window.clearTimeout(timer);
    }, [refreshServerNotifications]);

    // Listen for vnme:notify events
    useEffect(() => {
        const handler = (e) => {
            const id = e.detail?.id;
            const def = id ? NOTIFICATION_DEFS[id] : null;
            if (!def) return;

            const entry = {
                _uid: `${id}_${Date.now()}`,
                id,
                ...def,
                timestamp: Date.now(),
                read: false,
            };

            // Play mapped UI sound
            playNotifSound(id);

            // Add to persistent history
            setLocalHistory(h => [entry, ...h].slice(0, MAX_HISTORY));

            // Push to live toast queue (max 2)
            setLiveQueue(q => q.length >= 2 ? q : [...q, entry]);
        };

        window.addEventListener('vnme:notify', handler);
        return () => window.removeEventListener('vnme:notify', handler);
    }, []);

    const dismissToast = useCallback((uid) => {
        setLiveQueue(q => q.filter(n => n._uid !== uid));
    }, []);

    const openPanel = useCallback(() => {
        setPanelOpen(true);
        // Mark all as read
        setLocalHistory(h => h.map(n => ({ ...n, read: true })));
        if (serverUnreadCount > 0) {
            setServerHistory(h => h.map(n => ({ ...n, read: true })));
            setServerUnreadCount(0);
            getAuthHeaders().then(headers => {
                if (!headers) return;
                return fetch('/api/notifications', {
                    method: 'PUT',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ markAllRead: true }),
                });
            }).catch(() => {});
        }
    }, [serverUnreadCount]);

    const closePanel = useCallback(() => setPanelOpen(false), []);

    const clearHistory = useCallback(() => {
        setLocalHistory([]);
        setServerHistory([]);
        setServerUnreadCount(0);
        localStorage.removeItem(STORAGE_KEY);
        getAuthHeaders().then(headers => {
            if (!headers) return;
            return fetch('/api/notifications', {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAllRead: true }),
            });
        }).catch(() => {});
    }, []);

    return (
        <NotificationContext.Provider value={{
            history,
            liveQueue,
            unreadCount,
            panelOpen,
            dismissToast,
            openPanel,
            closePanel,
            clearHistory,
            refreshServerNotifications,
            friendActivity: FRIEND_ACTIVITY,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}

// ─── Convenience helper (fire from anywhere) ───────────────────────────────────
export function fireNotification(id) {
    window.dispatchEvent(new CustomEvent('vnme:notify', { detail: { id } }));
}
