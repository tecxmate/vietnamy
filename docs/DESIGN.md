# Vietnamy — Tạp Chí ("Thanh âm Việt Nam") Design System

The magazine visual language for the app: a **Việt Nam editorial / collage** look — cream paper,
bold flat color blocks, oversized serif Vietnamese type, halftone dots, plus-mark motifs, and hard
offset shadows. Hot-pink / navy / teal / gold.

This doc + the interactive prototype are the **design north star**; the theme files below make it
real in code.

## Reference artifacts
- **Interactive prototype**: [`DESIGN.html`](./DESIGN.html) — a self-contained Claude Artifact
  showing all 5 tabs in this style (open in a browser). Recreated from `vnme-app` content.
  Nav order as built: Learn · Talk · Dict · Explore · Library.
- **Theme (code)**: `src/styles/themes/tap-chi.css` — remaps the app's design tokens onto the palette.
- **Activation**: `src/lib/theme.js` (`applyTheme('tap-chi')` sets `<html data-theme="tap-chi">`).
- **Origin branch**: `design/tap-chi-han-noi` (pre-rename branch name; has extras not yet
  harvested — see "Not yet ported").

---

## 1. Design principles

1. **Magazine, not gameboard.** Each screen reads like a cover or a dictionary spread, not a
   candy trail. Lead with one big idea (a word, an entry) set in large serif type.
2. **Flat color blocks + hard shadows.** Saturated fills, no gradients. Depth comes from solid
   offset shadows, never blur.
3. **Vietnamese type is the hero.** Every Vietnamese word/term is set in the Finesse serif at
   large sizes. Tone marks are celebrated (often colored gold).
4. **Print texture.** Halftone dot fields and plus-mark glyphs carry collage energy into the UI.
5. **Restraint in the chrome.** Labels, kickers and buttons are tight uppercase sans. Let the
   serif headlines do the shouting.

---

## 2. Color

### The 4 color rules (from the prototype — follow these strictly)
1. **Pink** `#EE4A75` — the ONE next action on a screen. Nothing else. (primary CTA, active nav)
2. **Navy** `#204081` — structure & state: labels, current item, playhead, surfaces, dictionary hero.
3. **Teal** `#38BA94` — earned: known, correct, saved, due.
4. **Gold** `#FCBD1B` — attention: new words, audio buttons, highlights on dark.

Extended accents (theme-only — **not** in the prototype): **Plum** `#7D3C6A` (grammar),
**Terracotta** `#C8572B` (scene/roleplay).

### Palette
| Token | Hex (prototype) |
|---|---|
| pink / pink-dk | `#EE4A75` / `#C5305A` |
| navy / navy-dk | `#204081` / `#142C5C` |
| teal / teal-dk | `#38BA94` / `#23886A` |
| gold / gold-dk | `#FCBD1B` / `#CC9610` |
| cream (paper) | `#FBF3E2` |
| paper shade (dividers, grabbers) | `#D9C9A4` |
| ink (text, borders, hard shadows) | `#1B1A3A` |
| muted text | `#9A8F74` |
| secondary text | `#57514A` |
| paper line (hairline border) | `#E7D9BB` |
| locked / disabled text | `#B8AB8B` |
| dashed locked ring | `#CDBF9D` |

```css
:root {
  --pink:    #EE4A75;  /* primary brand / dominant cover fill, CTAs        */
  --navy:    #204081;  /* secondary surface (entry hero), checkmarks, nums */
  --teal:    #38BA94;  /* accent — category tags, example rules            */
  --yellow:  #FCBD1B;  /* highlight — tone marks, issue numerals, play btn */
  --cream:   #FBF3E2;  /* paper background                                 */
  --ink:     #1B1A3A;  /* text, hard-shadow outlines, borders             */
  --pink-dk: #C5305A;  /* darker pink — used ONLY for pink offset shadows  */
}
```

The darker tints (`-dk`) are used **only** as the offset under a card or button of that color.

Light-only by design (cream paper is the identity — it overrides OS dark mode).

Note: the theme file currently ships a paler cream (`--tc-cream: #faf8f3`) than the prototype's
`#FBF3E2`. The prototype is the north star — align the theme when convenient.

### Usage rules
- **Pink** is the dominant cover fill and the primary CTA color. One pink hero per screen max.
- **Navy** is the alternate dark surface (e.g. dictionary entry hero) and all checkmarks / index
  numerals. Navy is the Dictionary's accent throughout.
- **Teal** and **gold** are accents only — category tags, the active "play" button, tone marks,
  example-sentence rules. Never large fills.
- Body screens sit on **cream**; the tab bar is white with a 2px `--ink` top border.

---

## 3. Typography

Three families, each with one job.

| Role | Family | Notes |
|---|---|---|
| Display / all Vietnamese words | **Finesse-Roman** (serif) | `@font-face`, local `public/fonts/Finesse-Roman.otf`. High-contrast editorial serif w/ full Vietnamese diacritics. |
| Issue numerals (cover) | **Anton** (Google) | Condensed poster numerals, used for the "SỐ 12" block only. |
| UI / masthead / labels / body gloss | **Be Vietnam Pro** (Google) | Weights 400–900. Loaded lazily by `theme.js`. |

```css
@font-face {
  font-family:'Finesse';
  src:url('/fonts/Finesse-Roman.otf') format('opentype');
  font-weight:400; font-display:swap;
}
/* Google: Be Vietnam Pro (400,500,600,700,800,900) + Anton */
```

### Type scale (mobile, 372px frame)
| Token | Size / weight | Family | Use |
|---|---|---|---|
| Cover word | 104px / 400 | Finesse | Word-of-the-day headline |
| Entry headword | 96px / 400 | Finesse | Dictionary entry |
| Gloss / definition | 21–23px / 400 | Finesse | Meaning lines |
| Index term (`.vn`) | 18px / 400 | Finesse | Lesson names |
| Masthead wordmark | 21px / 900 | Be Vietnam Pro | `việtnamy` (`namy` in pink) |
| Section / kicker label | 10–11px / 800, `letter-spacing:.14–.16em`, UPPERCASE | Be Vietnam Pro | Kickers, tab labels, sec headers |
| Body gloss / meta | 11–13px / 600 | Be Vietnam Pro | English translations, counts |

**Rule:** headword/title = Finesse; everything readable (body) = Be Vietnam Pro. Never mix Finesse
and a sans on the same line — Vietnamese term in Finesse on its own line, English gloss in Be
Vietnam Pro on the line below. Finesse runs visually small: size it up ~1.4× relative to an
equivalent sans line to optically match.

Finesse covers Vietnamese only — Chinese / Hán content keeps the existing fonts.

---

## 4. Motifs & texture

- **Plus-mark** — a `+` centered in a thin-stroke circle. Sizes: default 18px, `.sm` 14px. Used
  in section headers, top-bar chrome, decorative pairs. Inherits `currentColor`.
  ```css
  .plus { display:inline-grid; place-items:center; width:18px; height:18px;
          border-radius:50%; border:1.6px solid currentColor; }
  .plus::before { content:'+'; font-size:13px; font-weight:700; line-height:1; }
  ```
- **Halftone field** — white dots at low opacity over colored cards:
  ```css
  background-image:radial-gradient(#fff 1.4px, transparent 1.6px);
  background-size:11px 11px; opacity:.14–.16;
  ```
- **Sunburst** — `repeating-conic-gradient(from 0deg, var(--yellow) 0 9deg, transparent 9deg 18deg)`
  as a partial circle bleeding off a corner of the cover.

---

## 5. Signature treatments

- **Poster offset shadow** — the "3D edge", in two sizes:
  - **Cards / heroes**: `box-shadow: 0 12–14px 0 -4px <darker>` (inset by `-4px`).
  - **Buttons / CTAs**: `box-shadow: 0 3–5px 0 <darker>` (no inset).
  Always the `-dk` tint of the fill: pink→`#C5305A`, navy→`#142C5C`, gold→`#CC9610`, teal→`#23886A`.
- **Navy halftone hero** for the dictionary headword (radial-dot texture, Finesse headword, gold speaker).
- **Teal rule** (`border-left: 4px solid teal`) on example lists.
- Pink CTA with a darker-pink 3D edge (`--cta-edge`).

---

## 6. Components

### Colored hero card (cover / entry)
Rounded 20px, saturated fill, white text, **hard offset shadow** `0 14px 0 -4px <darker>`.
Overflow hidden so halftone/sunburst clip to the radius. Contains: a kicker pill, the giant
Finesse word (tone mark in `--yellow`), a phonetic breakdown row, gloss, and a gold action
button. Pink variant = cover; navy variant = dictionary entry.

### Kicker pill
Uppercase 10px/800 sans on a solid fill, `padding:5px 9px; border-radius:20px`. Navy pill on pink
card; teal text-label on navy card.

### Phonetic breakdown row
Inline segments — each `.seg` is an `rgba(255,255,255,.18)` chip `padding:3px 8px; radius:5px`, then
the IPA in lighter weight. Splits a word into onset / vowel / tone-name + IPA.

### Listen / play button
Gold fill, ink text, `box-shadow:0 4px 0 #CC9610` (hard). Speaker or ▶ icon. The round variant
(42–54px circle) is the audio control on entry screens.

### Lesson index row
On cream, separated by `1px solid #E7D9BB`. Layout: `[cat icon 30px] [Finesse num] [name block] [state]`.
- **cat icon**: 9px-radius rounded square, white icon, fill cycles pink→teal→gold→navy by category.
- **state**: completed = navy circle + white check; current = pink "Tiếp" button w/ hard shadow;
  locked = 2px **dashed** `#CDBF9D` ring + muted text.

### Bottom tab bar
White, `border-top:2px solid var(--ink)`, **5 items** (Learn · Talk · Dict · Explore · Library),
9–9.5px/800 uppercase, icon + label, active = pink.

### Bottom sheet
Cream, `border-top:2px solid var(--ink)`, radius `22px 22px 0 0`, drag grabber = 44×4px
`#D9C9A4` pill. Used for word actions, saved conversations, and collection pickers.

### Outlined / collage card (etymology, callouts)
White fill, `2px solid var(--ink)`, radius 14px, hard shadow `4px 5px 0 var(--ink)`. Used for
Hán-Việt etymology and other "pasted-in" blocks.

### Example-sentence block
`border-left:4px solid var(--teal); padding-left:14px`. Vietnamese sentence in Finesse, English
gloss in muted sans below.

---

## 7. Screen anatomy

**Home / Learn** — masthead (wordmark + plus pair) → pink magazine **cover hero** (word of the
day) → lesson **index** on cream → tab bar.

**Dictionary entry** — top bar (back chip + "Mục từ · NN" + plus pair) → navy **entry hero**
(headword, tone flag, IPA + play) → scrolling body (Định nghĩa / Ví dụ / Gốc từ sections)
→ pinned bottom CTA ("Thêm vào sổ tay").

---

## 8. Device frame & layout

Mock frames are 372 × 806 phone shells (radius 52px, 11px bezel) on a neutral canvas. The app
content is the `.screen` (radius 42px). When building the real app, drop the bezel and let
`.screen` fill the viewport. Status bar 48px; tab bar pinned bottom with safe-area padding
(`padding-bottom:26px` placeholder).

### Vietnamese copy conventions
UI is bilingual: Vietnamese primary, English gloss secondary. Keep real diacritics (never strip
tone marks). Common labels: Học (Learn), Từ điển (Dictionary), Luyện (Practice), Tôi (Me),
Tiếp (Continue), Nghe phát âm (Listen), Từ trong ngày (Word of the day), Chặng (Stage/Unit),
Thư viện (Library), Khám phá (Explore).

---

## 9. How it works in code (why it was cheap to apply)

The theme is scoped to `:root[data-theme="tap-chi"]` and **remaps the app's existing CSS variables**
(`--primary-color`, `--bg-color`, `--surface-color`, `--text-main`, `--border-color`, …). So every
component that uses those tokens — including the AI Tutor and Video tabs — inherits the look with **no
rewrite**. Only a handful of screens (dictionary hero, library cards, feedback FAB) get bespoke selectors.

On the `living-spec` branch it is **default-on** (`applyStoredTheme()` falls back to the magazine theme).
To make it user-toggleable, wire a Display setting that stores `theme: 'tap-chi' | null` and call `applyTheme()`.

---

## 10. Do / Don't

**Do** — flat saturated blocks; hard offset shadows; oversized Finesse Vietnamese; gold tone
marks; plus-marks + halftone for texture; one hero per screen.

**Don't** — gradients or blurred drop-shadows; Finesse and sans on one line; more than one pink
hero per screen; large teal/gold fills; rounded "bubble" gamification nodes; stripping diacritics;
inventing colors or fonts outside §2–§3.

---

## Not yet ported from `design/tap-chi-han-noi` (next passes)
- `WordOfDay` component + `src/lib/wordOfDay.js` (the "phở / TỪ TRONG NGÀY" card in the prototype).
- `src/lib/nodePalette.js` — per-category roadmap node colors (green/teal/plum/terracotta).
- The Display settings toggle to switch the theme on/off.
- Per-screen polish of the new AI Tutor & Video tabs to fully match the prototype's magazine cards.
