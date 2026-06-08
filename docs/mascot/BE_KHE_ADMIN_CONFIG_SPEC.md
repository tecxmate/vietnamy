# Bé Khế — Admin-Editable Script System (Design Spec)

**Goal:** Make every Bé Khế line editable and the whole storyteller *controllable* from the admin CMS — without a rebuild. Today the scripts live as hardcoded `bekhe_*` keys in `src/lib/i18n.js`, which no admin screen can touch. This spec lifts them into a CMS-managed data layer that follows your **existing** content pattern exactly (bundled JSON default → `vnme_cms_*` localStorage override → admin editor), so it slots into the system you already have.

**This is a design spec — no code has been written or changed.** Code samples below are the *intended* implementation for review.

**Control scope (as chosen):**
- ✅ Edit text + add/remove lines + per-line on/off
- ✅ Global master switch + per-category toggles
- ✅ Chattiness level + per-line weights
- ⛔️ Sound / haptic / expression mapping — **fixed per-category defaults**, shown read-only in the editor (not editable), to keep the admin UI simple. (Easy to promote to editable later.)

---

## 1. How this fits your existing CMS pattern

Your CMS is consistent and simple, and this design copies it 1:1:

| Your existing pattern (e.g. `concepts.js`, `VocabEditor`) | Mascot equivalent |
|---|---|
| Bundled default JSON (`src/content/concepts.json`) | `src/content/mascotScripts.json` |
| Override key (`vnme_cms_concepts`) | `vnme_cms_mascot` |
| Accessor: override → fallback (`getAllConcepts()`) | `getMascotData()` |
| Editor under `/admin/*`, gated by `AdminRoute` | `/admin/mascot`, same gate |
| Editor: load → edit in memory → `localStorage.setItem` → "Saved!" toast | identical |
| Import/Export JSON | identical |
| Override **replaces** default wholesale (no merge) | identical |

Nothing new architecturally. The only genuinely new idea is a small **config block** (enable/chattiness) living alongside the scripts, which mirrors your `settings.js` shape but is admin-owned instead of user-owned.

---

## 2. Data model

One file, one override key, so a single editor saves one blob (matches "entire object replaced"). Top level has a `config` block and a `categories` map.

### 2.1 Shape

```jsonc
{
  "version": 1,
  "config": {
    "enabled": true,            // master switch — false = Bé Khế silent everywhere
    "chattiness": "normal",     // "minimal" | "normal" | "chatty"
    "avoidRepeatWindow": 3,     // don't repeat a pool line within N picks
    "languageFallback": "en"    // if a line lacks the active language, use this
  },
  "categories": {
    "correct": {
      "id": "correct",
      "label": "Correct answer",
      "kind": "pool",           // "pool" = random pick · "slots" = keyed lookup
      "tier": "core",           // "core" | "flavor" | "ambient"  (see chattiness §2.3)
      "enabled": true,          // per-category toggle
      "trigger": "answer.correct",   // doc-only: where it fires (read-only in editor)
      "fx": { "expression": "cheer", "sound": "playSuccess", "haptic": "success" }, // read-only
      "lines": [
        { "id": "c1", "enabled": true, "weight": 1, "text": { "en": "Đúng rồi! Nailed it.", "zh-s": "", "zh-t": "" } },
        { "id": "c2", "enabled": true, "weight": 2, "text": { "en": "Tuyệt! (That's 'awesome.') 😎", "zh-s": "", "zh-t": "" } }
      ]
    },

    "unit_intro": {
      "id": "unit_intro",
      "label": "Unit intro (storyteller)",
      "kind": "slots",          // one specific line per slot key, not random
      "tier": "flavor",
      "enabled": true,
      "trigger": "lesson.unitStart",
      "fx": { "expression": "reading", "sound": null, "haptic": null },
      "lines": [
        { "id": "u1", "key": "unit_1", "enabled": true, "text": { "en": "Our first real words! …", "zh-s": "", "zh-t": "" } },
        { "id": "u2", "key": "unit_2", "enabled": true, "text": { "en": "Time to be polite. …", "zh-s": "", "zh-t": "" } }
      ]
    }
  }
}
```

### 2.2 Two category kinds

- **`pool`** — the app picks a random enabled line (respecting weights, avoiding recent repeats). Used for: `correct`, `wrong`, `retry`, `halfway`, `complete`, `test_pass`, `test_fail`, `unlock`, `return`, `streak_lost`, `welcome`.
- **`slots`** — the app looks up a specific line by `key`. Used for anything addressed by identity: `unit_intro` (key = unit id), `foundations_intro` (key = module id), `streak_combo` (key = `3`/`5`/`10`), `daily_streak` (key = `1`/`3`/`7`/`30`/`100`), onboarding steps.

This single distinction lets **one editor** handle every script type. Weight is ignored for `slots`.

### 2.3 Chattiness × tier (the "how talkative" control)

Each category has a `tier`. The global `chattiness` decides which tiers are allowed to fire:

| `chattiness` | core | flavor | ambient | Feel |
|---|---|---|---|---|
| `minimal` | ✅ | ⛔️ | ⛔️ | Only the essentials: correct, wrong, lesson complete. Quietest. |
| `normal` (default) | ✅ | ✅ | ⛔️ | Adds intros, streak hype, milestones. Duolingo-ish. |
| `chatty` | ✅ | ✅ | ✅ | Adds halfway nudges, idle/empty prompts, extra flavor. Most talkative. |

Suggested tier assignment:
- **core:** `correct`, `wrong`, `retry`, `complete`, `test_pass`, `test_fail`
- **flavor:** `welcome`, `unit_intro`, `foundations_intro`, `streak_combo`, `unlock`, `daily_streak`, `return`, `streak_lost`
- **ambient:** `halfway`, `empty`, `streak_save`, `tip_peek`

So the admin has **three layers of control**, coarse → fine:
1. `config.enabled` — everything on/off.
2. `chattiness` + each category's `enabled` — turn whole behaviors on/off.
3. per-line `enabled` + `weight` — tune the exact wording mix.

---

## 3. Runtime accessor (intended `src/lib/content/mascot.js`)

Mirrors `concepts.js` (override → fallback) and adds a gated, weighted, no-repeat picker. **Design only — not added to the repo.**

```js
import defaults from '../../content/mascotScripts.json';

const KEY = 'vnme_cms_mascot';
const recent = {};               // categoryId -> [recent line ids], in-memory

export function getMascotData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch { /* fall through */ }
  return defaults;
}

export function saveMascotData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

const TIER_ALLOWED = {
  minimal: { core: true,  flavor: false, ambient: false },
  normal:  { core: true,  flavor: true,  ambient: false },
  chatty:  { core: true,  flavor: true,  ambient: true  },
};

// Returns { text, expression, sound, haptic } or null (meaning: stay silent)
export function getLine(categoryId, { lang = 'en', slot = null } = {}) {
  const data = getMascotData();
  if (!data.config.enabled) return null;

  const cat = data.categories[categoryId];
  if (!cat || cat.enabled === false) return null;
  if (!TIER_ALLOWED[data.config.chattiness]?.[cat.tier]) return null;

  const active = cat.lines.filter(l => l.enabled !== false);
  if (active.length === 0) return null;

  let line;
  if (cat.kind === 'slots') {
    line = active.find(l => String(l.key) === String(slot));
    if (!line) return null;
  } else {
    // pool: drop recently shown, then weighted random
    const window = data.config.avoidRepeatWindow ?? 3;
    let candidates = active.filter(l => !(recent[categoryId] || []).includes(l.id));
    if (candidates.length === 0) candidates = active;
    line = weightedPick(candidates);
    recent[categoryId] = [...(recent[categoryId] || []), line.id].slice(-window);
  }

  return {
    text: resolveText(line, lang, data.config.languageFallback),
    expression: cat.fx?.expression ?? 'idle',
    sound: cat.fx?.sound ?? null,
    haptic: cat.fx?.haptic ?? null,
  };
}

function weightedPick(lines) {
  const total = lines.reduce((s, l) => s + (l.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const l of lines) { r -= (l.weight ?? 1); if (r <= 0) return l; }
  return lines[lines.length - 1];
}

function resolveText(line, lang, fallback) {
  return line.text?.[lang] || line.text?.[fallback] || '';
}

function migrate(data) {            // future-proofing for schema bumps
  return data;
}
```

**How a surface consumes it** (illustrative — e.g. the feedback banner):

```js
const r = getLine('correct', { lang: appLang });
if (r) {
  showBanner(r.text);
  if (r.sound && soundEnabled)   Snd[r.sound]?.();   // existing sound.js fns
  // r.expression -> swap Bé Khế face;  r.haptic handled inside the sound fn already
}
// r === null  -> render the plain banner with no mascot line (graceful)
```

The key property: **`getLine` returning `null` is normal and safe** — it just means "Bé Khế stays quiet here" (master off, category off, or chattiness suppressed it). Every surface treats null as "no mascot line," so toggling things off never breaks the UI.

---

## 4. Migration: lifting scripts out of `i18n.js`

A controlled move, reversible, no behavior change on day one:

1. **Generate `mascotScripts.json`** from the script bank in `BE_KHE_CHARACTER_BIBLE.md` (Part 3). Every `bekhe_*` key becomes a line; arrays become `pool` categories, single keys become `slots`. English fills `text.en`; `zh-s`/`zh-t` start empty (the accessor falls back to `en` until translated).
2. **Add `mascot.js`** accessor (§3).
3. **Repoint the surfaces** that currently call `t('bekhe_*')` / `feedback_praise` to call `getLine(...)`. Start with the highest-value one (`FeedbackBanner` → `getLine('correct')` / `getLine('wrong')`), then lesson-complete, intros, etc.
4. **Remove `bekhe_*` from `i18n.js`** once nothing references them. (Leave the generic UI strings — `continue_upper`, etc. — in i18n; only the *mascot personality* lines move.)

Because the accessor falls back to the bundled default when no override exists, **step 1–3 ship with identical behavior** to today; the admin override only kicks in once someone edits and saves.

> Translation handling: mascot lines are **content**, not UI chrome, so they live in `mascotScripts.json`, not `i18n.js`. The per-line `text` object holds all languages; the editor has language tabs (§5). The "Vietnamese sprinkle" words (Tuyệt!, Cố lên!…) stay Vietnamese in every language column — they're the thing being taught.

---

## 5. The `/admin/mascot` editor

Same skeleton as `VocabEditor` / `ConceptEditor`: load on mount, edit in memory, Save writes the blob, toast confirms, Import/Export JSON. Registered in `AdminLayout` nav and wrapped by the existing `AdminRoute` gate (no new auth).

### Layout

```
┌ /admin/mascot ─────────────────────────────────────────────────────────┐
│ ┌─ GLOBAL CONFIG (sticky top) ─────────────────────────────────────────┐ │
│ │  [●] Bé Khế enabled        Chattiness: ( Minimal · ◉ Normal · Chatty )│ │
│ │  Avoid-repeat window: [3]   Language: ( ◉ EN · 简 · 繁 )  [Export][Import]│ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ ┌ Categories ─────────────┐ ┌ Lines — "Correct answer"  (pool · core) ──┐ │
│ │ ◉ Correct      core  [●]│ │ fires on: answer.correct                  │ │
│ │   Wrong        core  [●]│ │ fx: cheer · playSuccess · success (locked)│ │
│ │   Streak combo flav  [●]│ │ ───────────────────────────────────────── │ │
│ │   Halfway      amb   [○]│ │ [●] wt[1▾] "Đúng rồi! Nailed it."     [🗑] │ │
│ │   Unit intro   flav  [●]│ │ [●] wt[2▾] "Tuyệt! (awesome) 😎"      [🗑] │ │
│ │   Foundations  flav  [●]│ │ [○] wt[1▾] "Nailed it. Don't act…"    [🗑] │ │
│ │   Lesson done  core  [●]│ │ [+ Add line]                              │ │
│ │   …                     │ │                                           │ │
│ │                         │ │ ── Preview ──────────────────────────────  │ │
│ │                         │ │ [▶ Roll a line]  → "Tuyệt! (awesome) 😎"  │ │
│ └─────────────────────────┘ └───────────────────────────────────────────┘ │
│ [Reset category to default]                       [Save]  ✓ Saved!         │
└────────────────────────────────────────────────────────────────────────────┘
```

### Controls (exactly the chosen scope)

- **Global config bar:** master `enabled`, `chattiness` segmented control, `avoidRepeatWindow`, active-language tabs, Export/Import.
- **Category list:** each row shows tier badge + an enable toggle (per-category on/off). Selecting one loads its lines.
- **Line rows:** per-line enable checkbox, weight stepper (pool only), the editable text for the active language, delete. "Add line" appends a blank.
- **Slots categories** (unit/foundations/daily-streak): same rows but show the `key` (e.g. `unit_3`) instead of a weight, and you can't add arbitrary lines — you edit the fixed slots.
- **Read-only fx badge:** shows the locked expression/sound/haptic for the category so the admin knows what fires, without being able to change it (out of chosen scope).
- **Preview ("Roll a line"):** runs `getLine(category)` live so the admin sees what learners would get under current toggles/weights/chattiness — including "(silent — suppressed by chattiness)" when applicable.
- **Reset to default / Save / toast / Import-Export:** same as every other editor.

### Language editing

The active-language tab swaps which `text[lang]` the line rows edit. Empty cells are tinted to flag "not translated yet → falls back to EN." This makes it obvious what still needs localization without blocking anything.

---

## 6. Why this is safe & low-risk

- **Additive.** New file, new key, new accessor, new route. Nothing existing is deleted until the surfaces are repointed (step 3–4), and even then behavior is identical thanks to the bundled fallback.
- **Fails quiet.** Any "off" state makes `getLine` return `null`, which every surface already treats as "no line." You can't break a lesson by toggling Bé Khế off.
- **Same mental model as the rest of the CMS.** Anyone who's used the vocab/grammar/drill editors will understand this one instantly.
- **Forward-compatible.** Promoting sound/haptic/expression to editable later is just exposing the already-present `fx` block in the editor — no schema change.

---

## 7. Build checklist (for the follow-up implementation session)

1. `src/content/mascotScripts.json` — generated from the Part 3 script bank.
2. `src/lib/content/mascot.js` — `getMascotData` / `saveMascotData` / `getLine` / helpers (§3).
3. `src/pages/Admin/MascotEditor.jsx` — editor (§5), copying `VocabEditor` scaffolding.
4. Register `/admin/mascot` route + `AdminLayout` nav entry.
5. Repoint surfaces in priority order: `FeedbackBanner` → lesson-complete → unit/foundations intros → streak/daily-streak/return.
6. Remove migrated `bekhe_*` keys from `i18n.js`.
7. QA: toggle master off, set chattiness minimal, disable a category, weight a line to 0-effect, switch language — confirm each behaves and nothing throws.
```
