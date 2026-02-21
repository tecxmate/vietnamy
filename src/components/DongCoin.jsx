import { useState, useEffect } from 'react';
import './DongCoin.css';

/**
 * Gold Vietnam Dong coin — pure CSS
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} animate — pulse glow
 */
export function DongCoin({ size = 'sm', animate = false, className = '' }) {
    return (
        <span className={`dong-coin dong-coin--${size} ${animate ? 'dong-coin--pulse' : ''} ${className}`}>
            <span className="dong-coin__face">
                <span className="dong-coin__symbol">₫</span>
            </span>
            <span className="dong-coin__edge" />
            <span className="dong-coin__shine" />
        </span>
    );
}

/**
 * Animated reward burst — coin shower when Dong is earned
 * Renders absolutely positioned particles that fly up and fade
 */
export function DongRewardBurst({ amount, show }) {
    const [particles, setParticles] = useState([]);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!show) { setVisible(false); return; }
        setVisible(true);

        // Generate random particles
        const ps = Array.from({ length: 12 }, (_, i) => ({
            id: i,
            x: Math.random() * 200 - 100,
            y: -(Math.random() * 120 + 40),
            delay: Math.random() * 0.3,
            size: Math.random() * 8 + 12,
            rotation: Math.random() * 360,
        }));
        setParticles(ps);

        const timer = setTimeout(() => setVisible(false), 2500);
        return () => clearTimeout(timer);
    }, [show]);

    if (!visible) return null;

    return (
        <div className="dong-burst">
            <div className="dong-burst__amount">+{amount.toLocaleString()}₫</div>
            {particles.map(p => (
                <span
                    key={p.id}
                    className="dong-burst__particle"
                    style={{
                        '--dx': `${p.x}px`,
                        '--dy': `${p.y}px`,
                        '--delay': `${p.delay}s`,
                        '--psize': `${p.size}px`,
                        '--rot': `${p.rotation}deg`,
                    }}
                >
                    ₫
                </span>
            ))}
        </div>
    );
}

/**
 * Inline formatted Dong balance
 */
export function DongBalance({ amount, size = 'sm' }) {
    return (
        <span className={`dong-balance dong-balance--${size}`}>
            <DongCoin size={size} />
            <span className="dong-balance__amount">
                {amount.toLocaleString()}₫
            </span>
        </span>
    );
}

/**
 * Daily login bonus toast — slides in from top, auto-dismisses
 */
export function DongDailyToast({ amount, streak, show }) {
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        if (!show) { setVisible(false); return; }
        setVisible(true);
        setLeaving(false);

        const leaveTimer = setTimeout(() => setLeaving(true), 3500);
        const hideTimer = setTimeout(() => setVisible(false), 4200);
        return () => { clearTimeout(leaveTimer); clearTimeout(hideTimer); };
    }, [show]);

    if (!visible) return null;

    return (
        <div className={`dong-daily-toast ${leaving ? 'dong-daily-toast--leaving' : ''}`}>
            <div className="dong-daily-toast__icon">🔥</div>
            <div className="dong-daily-toast__content">
                <div className="dong-daily-toast__title">Day {streak} Streak!</div>
                <div className="dong-daily-toast__amount">
                    <DongCoin size="sm" animate /> +{amount.toLocaleString()}₫ daily bonus
                </div>
            </div>
        </div>
    );
}
