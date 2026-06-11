import { useEffect, useState } from 'react';
import { isMagazineTheme } from './theme';

/* =========================================================================
   Old → Tạp Chí color mapping.

   The app's legacy "color set" (the recolored-Duolingo category palette) is
   hardcoded as hex across the skill tree, mode switcher and recommendations.
   When the magazine theme is active we swap each old color for its closest
   magazine relative; otherwise colors pass through unchanged. This is the
   "only inside the theme" version of replacing the old set — defaults are
   untouched.
   ========================================================================= */

// old hex → closest magazine relative (keys uppercased).
export const MAGAZINE_RELATIVE = {
  // accents / category hues
  '#1CB0F6': '#204081', // blue (phonetics) → navy
  '#A78BFA': '#7D3C6A', // purple (grammar) → plum
  '#06D6A0': '#38BA94', // green (scene/srs) → teal
  '#10B981': '#38BA94', // green (beginner mode) → teal
  '#FFB703': '#FCBD1B', // orange (vocab) → gold
  '#F59E0B': '#C8572B', // gold (scene variant) → terracotta
  '#FF9F43': '#C8572B', // library vocabulary orange → terracotta
  '#FFD166': '#FCBD1B', // library intermediate level → gold
  '#EF4444': '#C5305A', // red (test) → lacquer red
  '#EF476F': '#C5305A', // red-pink (heritage / advanced) → lacquer red
  '#F26B5A': '#EE4A75', // coral (beginner mode) → pink
  // matching dark/shadow shades
  '#CC9202': '#CC9610',
  '#0D8ECF': '#142C5C',
  '#7C3AED': '#5A2C4E', // grammar dark → plum dark
  '#05A67D': '#2A9476',
  '#B91C1C': '#9E2547',
  '#D97706': '#9E4220', // gold-scene dark → terracotta dark
};

// Resolve a single hex to its magazine relative when the theme is active.
export function relColor(hex, active = isMagazineTheme()) {
  if (!active || typeof hex !== 'string') return hex;
  return MAGAZINE_RELATIVE[hex.toUpperCase()] || hex;
}

// A translucent tint of a hex's magazine relative (for soft badge/card fills).
// Falls back to the original hex when the theme is off.
export function relTint(hex, pct, active = isMagazineTheme()) {
  if (!active || typeof hex !== 'string') return hex;
  return `color-mix(in srgb, ${relColor(hex, true)} ${pct}%, transparent)`;
}

// Re-render a component when the magazine theme toggles on/off.
export function useMagazineActive() {
  const [active, setActive] = useState(isMagazineTheme);
  useEffect(() => {
    const onChange = () => setActive(isMagazineTheme());
    window.addEventListener('vnme-theme-changed', onChange);
    return () => window.removeEventListener('vnme-theme-changed', onChange);
  }, []);
  return active;
}
