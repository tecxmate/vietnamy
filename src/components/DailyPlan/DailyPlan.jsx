import React, { useMemo } from 'react';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { getDueItems } from '../../lib/srs';
import { useMagazineActive } from '../../lib/nodePalette';
import { useT } from '../../lib/i18n';

// "Hôm nay · today's plan" — the prototype's daily-plan card at the top of Study.
// Tier 0: composed entirely from existing data (SRS due queue). Theme-gated to
// the Tạp Chí magazine theme, like WordOfDay.
export default function DailyPlan({ onReview }) {
  const t = useT();
  const active = useMagazineActive();
  const dueCount = useMemo(() => {
    try { return getDueItems().length; } catch { return 0; }
  }, []);

  if (!active) return null;

  // Rough time estimate: ~20s per due card + a 5-min lesson slot.
  const mins = Math.max(5, Math.round((dueCount * 20) / 60) + 5);

  return (
    <section style={{ padding: '4px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 8px' }}>
        <CalendarDays size={15} color="var(--primary-color)" />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--primary-color)' }}>
          {t('plan_kicker', 'Hôm nay · today’s plan')}
        </span>
      </div>

      <div style={{
        background: 'var(--tc-navy, #204081)', color: '#fff', borderRadius: 18,
        padding: '16px 18px', boxShadow: '0 5px 0 var(--tc-navy-dk, #142c5c)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--tc-finesse, Georgia, serif)', fontSize: 34, lineHeight: 1 }}>
            ≈ {mins} {t('plan_minutes', 'phút')}
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.82, marginTop: 6 }}>
            {dueCount > 0
              ? t('plan_due', '{n} thẻ đến hạn · {n} cards due').replace(/\{n\}/g, dueCount)
              : t('plan_clear', 'Không có thẻ đến hạn · all caught up')}
          </div>
        </div>
        {dueCount > 0 && (
          <button
            onClick={() => onReview?.()}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--tc-pink, #EE4A75)', color: '#fff', border: 'none',
              borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 800,
              fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 3px 0 var(--tc-pink-dk, #c5305a)',
            }}
          >
            {t('plan_review', 'Ôn ngay')} <ArrowRight size={15} />
          </button>
        )}
      </div>
    </section>
  );
}
