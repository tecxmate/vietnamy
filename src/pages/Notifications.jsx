import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Bell, Flame, Trophy, Gift, Crown, BookOpen,
    Star, Zap, Heart, Clock, Users, Check, CheckCheck, Layers
} from 'lucide-react';

const MOCK_NOTIFICATIONS = [
    // Today
    { id: 1, type: 'streak', icon: <Flame size={20} />, color: '#FF6B35', title: 'Keep your streak alive!', body: "You haven't practiced today. Complete a quick lesson to maintain your 4-day streak.", time: '2h ago', read: false, group: 'Today' },
    { id: 2, type: 'reward', icon: <Gift size={20} />, color: '#06D6A0', title: 'Daily Bonus: 400₫', body: 'You earned your daily streak bonus. Come back tomorrow for even more!', time: '8h ago', read: false, group: 'Today' },
    { id: 3, type: 'achievement', icon: <Trophy size={20} />, color: '#FFD166', title: 'Badge Unlocked: Dictionary Diver', body: "You've looked up 100 words! Check your Achievements page.", time: '10h ago', read: false, group: 'Today' },
    { id: 4, type: 'friend', icon: <Star size={20} />, color: 'var(--primary-color)', title: 'Minh T. completed Unit 3', body: 'Minh T. just finished "At the Market" — can you keep up?', time: '2h ago', read: false, group: 'Today' },
    // Yesterday
    { id: 5, type: 'lesson', icon: <BookOpen size={20} />, color: '#1CB0F6', title: 'New Lesson Available', body: 'Unit 2, Lesson 3: "At the Coffee Shop" is now unlocked. Ready to learn?', time: '1d ago', read: true, group: 'Yesterday' },
    { id: 6, type: 'srs', icon: <Layers size={20} />, color: '#CE82FF', title: '12 Cards Due for Review', body: 'You have vocabulary cards ready for review. Spaced repetition works best when consistent!', time: '1d ago', read: true, group: 'Yesterday' },
    { id: 7, type: 'social', icon: <Users size={20} />, color: '#1CB0F6', title: 'Minh T. passed you!', body: 'Minh T. just moved ahead of you on the leaderboard with 12,450 XP. Time to study!', time: '1d ago', read: true, group: 'Yesterday' },
    { id: 8, type: 'friend', icon: <Flame size={20} />, color: '#FF5722', title: 'Sarah L. hit a 38-day streak!', body: "Your friend Sarah L. is on fire. Send her some encouragement!", time: '1d ago', read: true, group: 'Yesterday' },
    // This Week
    { id: 9, type: 'friend', icon: <Zap size={20} />, color: 'var(--success-color)', title: 'Huy N. mastered 50 words', body: 'Huy N. just hit a vocabulary milestone. You have 147 — keep going!', time: '2d ago', read: true, group: 'This Week' },
    { id: 10, type: 'premium', icon: <Crown size={20} />, color: '#FFD166', title: 'Executive Trial Available', body: 'Try Vietnamy Executive free for 7 days. Unlock business modules and unlimited hearts.', time: '3d ago', read: true, group: 'This Week' },
    { id: 11, type: 'achievement', icon: <Star size={20} />, color: '#FFD166', title: 'Badge Unlocked: Perfect Score', body: 'You scored 100% on "Greetings & Introductions". Amazing work!', time: '4d ago', read: true, group: 'This Week' },
    { id: 12, type: 'friend', icon: <Heart size={20} />, color: '#CE82FF', title: 'Linh P. unlocked Advanced Grammar', body: 'Your friend Linh P. is making big progress!', time: '4d ago', read: true, group: 'This Week' },
    { id: 13, type: 'streak', icon: <Flame size={20} />, color: '#FF6B35', title: '3-Day Streak!', body: "You're on fire! Keep going to unlock the 7-Day Streak badge.", time: '5d ago', read: true, group: 'This Week' },
    { id: 14, type: 'tip', icon: <Zap size={20} />, color: '#06D6A0', title: 'Pro Tip: Long-press Dictionary', body: 'Did you know? Long-press the Dictionary icon to use camera OCR or voice input!', time: '6d ago', read: true, group: 'This Week' },
];

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const groups = [...new Set(notifications.map(n => n.group))];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', paddingBottom: 32 }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)',
            }}>
                <button className="ghost" onClick={() => navigate(-1)} style={{ padding: 6, display: 'flex' }}>
                    <ArrowLeft size={22} />
                </button>
                <Bell size={20} color="var(--primary-color)" />
                <span style={{ fontSize: 18, fontWeight: 800 }}>Notifications</span>
                {unreadCount > 0 && (
                    <div style={{
                        padding: '2px 8px', borderRadius: 10, backgroundColor: '#EF476F',
                        color: 'white', fontSize: 11, fontWeight: 800,
                    }}>
                        {unreadCount}
                    </div>
                )}
                <button
                    onClick={markAllRead}
                    className="ghost"
                    style={{
                        marginLeft: 'auto', padding: '6px 12px', fontSize: 13, fontWeight: 700,
                        color: unreadCount > 0 ? 'var(--primary-color)' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}
                >
                    <CheckCheck size={16} /> Mark all read
                </button>
            </div>

            <div style={{ padding: '12px 20px' }}>
                {groups.map(group => {
                    const groupNotifs = notifications.filter(n => n.group === group);
                    return (
                        <div key={group} style={{ marginBottom: 20 }}>
                            <span style={{
                                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: 0.5, color: 'var(--text-muted)', display: 'block',
                                marginBottom: 8, paddingLeft: 4,
                            }}>
                                {group}
                            </span>
                            <div style={{
                                backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-color)', overflow: 'hidden',
                            }}>
                                {groupNotifs.map((notif, i) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => markRead(notif.id)}
                                        style={{
                                            display: 'flex', gap: 12, padding: '14px 16px',
                                            borderBottom: i < groupNotifs.length - 1 ? '1px solid var(--border-color)' : 'none',
                                            cursor: 'pointer',
                                            backgroundColor: notif.read ? 'transparent' : 'rgba(255,209,102,0.04)',
                                        }}
                                    >
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: notif.color + '18', color: notif.color,
                                        }}>
                                            {notif.icon}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                <span style={{ fontSize: 14, fontWeight: notif.read ? 600 : 800, flex: 1 }}>
                                                    {notif.title}
                                                </span>
                                                {!notif.read && (
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1CB0F6', flexShrink: 0 }} />
                                                )}
                                            </div>
                                            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 4 }}>
                                                {notif.body}
                                            </div>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{notif.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Empty State (hidden — just here for dev reference) */}
                {notifications.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                        <Bell size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.3 }} />
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>All caught up!</div>
                        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No new notifications right now.</div>
                    </div>
                )}

                {/* Notification Settings Link */}
                <div style={{
                    marginTop: 12, padding: 16, textAlign: 'center',
                    backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Manage notification preferences in{' '}
                        <span
                            style={{ color: 'var(--primary-color)', fontWeight: 700, cursor: 'pointer' }}
                            onClick={() => navigate('/')}
                        >
                            Settings
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
