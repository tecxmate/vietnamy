import React from 'react';
import { Trophy, Star, RotateCcw } from 'lucide-react';
import SoundButton from '../SoundButton';

const SceneEnding = ({ scene, results, onFinish }) => {
    if (!results) return null;

    const { score, total, tier } = results;
    const ending = scene.phases?.find(p => p.type === 'perform')?.config?.endings?.[tier];
    const pct = Math.round((score / total) * 100);

    const tierConfig = {
        perfect: { emoji: '🌟', label: 'Perfect!', color: 'var(--primary-color)', icon: Trophy },
        good: { emoji: '👏', label: 'Well Done!', color: 'var(--success-color)', icon: Star },
        retry: { emoji: '💪', label: 'Keep Going!', color: 'var(--secondary-color)', icon: RotateCcw },
    };

    const t = tierConfig[tier] || tierConfig.good;
    const TierIcon = t.icon;

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px 24px', textAlign: 'center' }}>
                {/* Trophy / icon */}
                <div style={{
                    width: 100, height: 100, borderRadius: 'var(--radius-full)',
                    backgroundColor: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 24, boxShadow: `0 8px 24px ${t.color}33`
                }}>
                    <TierIcon size={48} color="var(--bg-color)" strokeWidth={2.5} />
                </div>

                <h1 style={{ fontSize: 28, fontWeight: 800, color: t.color, marginBottom: 8 }}>
                    {t.label}
                </h1>

                <p style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 24 }}>
                    {score}/{total} correct ({pct}%)
                </p>

                {/* Scene beat / dramatic ending */}
                {ending?.scene_beat && (
                    <div style={{
                        maxWidth: 340, padding: '16px 20px', borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)',
                        fontStyle: 'italic', fontSize: 15, lineHeight: 1.6,
                        color: 'var(--text-main)'
                    }}>
                        {ending.scene_beat}
                    </div>
                )}

                {/* Bonus dong */}
                {ending?.bonus_dong > 0 && (
                    <div style={{
                        marginTop: 16, display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 16, fontWeight: 700, color: 'var(--primary-color)'
                    }}>
                        +{ending.bonus_dong} ₫ bonus!
                    </div>
                )}
            </div>

            {/* Bottom bar */}
            <div style={{
                padding: '20px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)', borderTop: '2px solid var(--border-color)',
                backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column',
                gap: 10, minHeight: 100, justifyContent: 'center'
            }}>
                <SoundButton
                    className="primary w-full shadow-lg"
                    style={{ fontSize: 17 }}
                    onClick={onFinish}
                >
                    BACK TO ROADMAP
                </SoundButton>
            </div>
        </div>
    );
};

export default SceneEnding;
