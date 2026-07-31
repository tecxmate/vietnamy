# Vietnamy — Tạp Chí ("Thanh âm Việt Nam") Design System

The magazine visual language for the app. Cream paper, hot-pink / navy / teal / gold.
This doc + the interactive prototype are the **design north star**; the theme files
below make it real in code.

## Reference artifacts
- **Interactive prototype**: [`tap-chi-prototype.html`](./tap-chi-prototype.html) — a self-contained
  Claude Artifact showing all 5 tabs in this style (open in a browser). Recreated from `vnme-app` content.
  Nav order as built: Learn · Talk · Dict · Explore · Library.
- **Theme (code)**: `src/styles/themes/tap-chi.css` — remaps the app's design tokens onto the palette.
- **Activation**: `src/lib/theme.js` (`applyTheme('tap-chi')` sets `<html data-theme="tap-chi">`).
- **Origin branch**: `design/tap-chi-han-noi` (has extras not yet harvested — see "Not yet ported").

## The 4 color rules (from the prototype — follow these strictly)
1. **Pink** `#EE4A75` — the ONE next action on a screen. Nothing else. (primary CTA, active nav)
2. **Navy** `#204081` — structure & state: labels, current item, playhead, surfaces, dictionary hero.
3. **Teal** `#38BA94` — earned: known, correct, saved, due.
4. **Gold** `#FCBD1B` — attention: new words, audio buttons, highlights on dark.

Extended accents (theme-only — **not** in the prototype): **Plum** `#7D3C6A` (grammar),
**Terracotta** `#C8572B` (scene/roleplay).

## Palette
| Token | Hex (prototype) |
|---|---|
| pink / pink-dk | `#EE4A75` / `#C5305A` |
| navy / navy-dk | `#204081` / `#142C5C` |
| teal / teal-dk | `#38BA94` / `#23886A` |
| gold / gold-dk | `#FCBD1B` / `#CC9610` |
| cream (paper) | `#FBF3E2` |
| paper shade (dividers, grabbers) | `#D9C9A4` |
| ink (text) | `#1B1A3A` |
| muted text | `#9A8F74` |
| secondary text | `#57514A` |
| paper line (border) | `#E7D9BB` |

Note: the theme file currently ships a paler cream (`--tc-cream: #faf8f3`) than the
prototype's `#FBF3E2`. The prototype is the north star — align the theme when convenient.

Light-only by design (cream paper is the identity — it overrides OS dark mode).

## Typography
- **Finesse** (local `public/fonts/Finesse-Roman.otf`) — display serif for **Vietnamese headwords / titles only**.
- **Be Vietnam Pro** (Google) — body sans (definitions, examples, UI). Loaded lazily by `theme.js`.
- **Anton** (Google) — heavy display accents.
- Rule: headword/title = Finesse; everything readable (body) = Be Vietnam Pro.

## Signature treatments
- **Poster offset shadow** on cards/CTAs: `box-shadow: 0 4-5px 0 <darker>` (the "3D edge").
- **Navy halftone hero** for the dictionary headword (radial-dot texture, Finesse headword, gold speaker).
- **Teal rule** (`border-left: 4px solid teal`) on example lists.
- Pink CTA with a darker-pink 3D edge (`--cta-edge`).

## How it works in code (why it was cheap to apply)
The theme is scoped to `:root[data-theme="tap-chi"]` and **remaps the app's existing CSS variables**
(`--primary-color`, `--bg-color`, `--surface-color`, `--text-main`, `--border-color`, …). So every
component that uses those tokens — including the AI Tutor and Video tabs — inherits the look with **no
rewrite**. Only a handful of screens (dictionary hero, library cards, feedback FAB) get bespoke selectors.

On the `living-spec` branch it is **default-on** (`applyStoredTheme()` falls back to the magazine theme).
To make it user-toggleable, wire a Display setting that stores `theme: 'tap-chi' | null` and call `applyTheme()`.

## Not yet ported from `design/tap-chi-han-noi` (next passes)
- `WordOfDay` component + `src/lib/wordOfDay.js` (the "phở / TỪ TRONG NGÀY" card in the prototype).
- `src/lib/nodePalette.js` — per-category roadmap node colors (green/teal/plum/terracotta).
- The Display settings toggle to switch the theme on/off.
- Per-screen polish of the new AI Tutor & Video tabs to fully match the prototype's magazine cards.
