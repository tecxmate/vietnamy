import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

function loadHistory() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function NotificationProvider({ children }) {
    const [history, setHistory] = useState(() => loadHistory());
    const [liveQueue, setLiveQueue] = useState([]); // toast queue
    const [unreadCount, setUnreadCount] = useState(() => {
        const h = loadHistory();
        return h.filter(n => !n.read).length;
    });
    const [panelOpen, setPanelOpen] = useState(false);

    // Persist history
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
    }, [history]);

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
            setHistory(h => [entry, ...h].slice(0, MAX_HISTORY));
            setUnreadCount(c => c + 1);

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
        setHistory(h => h.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    }, []);

    const closePanel = useCallback(() => setPanelOpen(false), []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        setUnreadCount(0);
        localStorage.removeItem(STORAGE_KEY);
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
