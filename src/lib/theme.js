/* =========================================================================
   Theme application — toggles the opt-in Tạp Chí magazine theme.

   The theme is stored in vnme_settings (`theme: 'tap-chi' | undefined`) and
   applied as `data-theme` on <html>, which the scoped rules in
   styles/themes/tap-chi.css respond to. Fonts the theme needs (Be Vietnam Pro
   + Anton) are loaded lazily the first time it activates.
   ========================================================================= */

import { loadSettings } from './settings';

export const MAGAZINE_THEME = 'tap-chi';

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900&family=Anton&display=swap';

// Load Be Vietnam Pro + Anton once (Finesse is a local @font-face).
export function ensureMagazineFonts() {
  if (typeof document === 'undefined' || document.getElementById('tapchi-fonts')) return;
  const link = document.createElement('link');
  link.id = 'tapchi-fonts';
  link.rel = 'stylesheet';
  link.href = FONTS_HREF;
  document.head.appendChild(link);
}

// Reflect a theme choice onto <html>. Pass null/undefined to clear.
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === MAGAZINE_THEME) {
    root.dataset.theme = MAGAZINE_THEME;
    ensureMagazineFonts();
  } else {
    delete root.dataset.theme;
  }
  // Let JS-gated surfaces (e.g. <WordOfDay/>) react without a remount.
  window.dispatchEvent(new CustomEvent('vnme-theme-changed', { detail: theme || null }));
}

// True when the magazine theme is currently active.
export function isMagazineTheme() {
  return typeof document !== 'undefined' && document.documentElement.dataset.theme === MAGAZINE_THEME;
}

// Apply whatever theme is currently persisted in settings (call at startup).
export function applyStoredTheme() {
  // Living-spec: default to the Tạp Chí magazine theme unless the user explicitly
  // picked another (undefined = never set → default on; null = user cleared it).
  const stored = loadSettings().theme;
  applyTheme(stored === undefined ? MAGAZINE_THEME : stored);
}
