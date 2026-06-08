// Bé Khế mascot scripts — the storyteller-guide's lines for every learning beat.
//
// Canonical content lives in content/mascotScripts.json (a config block + a
// categories map). Admin edits (Mascot Editor) are saved to localStorage and
// override the baked bundle at runtime — same CMS pattern as the other editors
// (vnme_cms_*). The whole override replaces the default wholesale (no merge).
//
// The one public runtime entry point is getLine(): it returns a ready-to-render
// { text, expression, sound, haptic } or null. null is normal and safe — it
// means "Bé Khế stays quiet here" (master off, category off, chattiness
// suppressed, or no matching line), and every surface treats null as "no mascot
// line," so toggling things off never breaks the UI.

import { Converter } from 'opencc-js';
import { loadOverride, saveOverride, resetOverride } from './contentOverrides';
import defaults from '../../content/mascotScripts.json';

export const MASCOT_STORAGE_KEY = 'vnme_cms_mascot';

// Simplified → Traditional, same as the dictionary/library surfaces. Chinese
// lines are authored once in Simplified (text.zh); zh-t is derived at render.
const s2t = Converter({ from: 'cn', to: 'tw' });

// In-memory "recently shown" ring per category, so a pool never repeats a line
// back-to-back. Resets on reload — intentional; it's a UX nicety, not state.
const recent = {};

/** Bundled default OR the admin override, whichever is present. */
export function getMascotData() {
    return migrate(loadOverride(MASCOT_STORAGE_KEY, defaults));
}

/** Persist the full mascot blob (used by the Mascot Editor). */
export function saveMascotData(data) {
    saveOverride(MASCOT_STORAGE_KEY, data);
}

/** Drop the admin override and fall back to the bundled default. */
export function resetMascotData() {
    resetOverride(MASCOT_STORAGE_KEY);
}

const TIER_ALLOWED = {
    minimal: { core: true, flavor: false, ambient: false },
    normal: { core: true, flavor: true, ambient: false },
    chatty: { core: true, flavor: true, ambient: true },
};

/**
 * Pick the line Bé Khế should say for a given moment.
 *
 * @param {string} categoryId  e.g. 'correct', 'wrong', 'unit_intro'
 * @param {object} [opts]
 * @param {string} [opts.lang='en']  active app language ('en' | 'zh-s' | 'zh-t')
 * @param {string|number} [opts.slot=null]  key for `slots` categories (unit id, streak count…)
 * @param {object} [opts.vars]  interpolation values for {name}, {recap}, … tokens
 * @returns {{ text, expression, sound, haptic } | null}  null = stay silent
 */
export function getLine(categoryId, { lang = 'en', slot = null, vars = null } = {}) {
    const data = getMascotData();
    if (!data?.config?.enabled) return null;

    const cat = data.categories?.[categoryId];
    if (!cat || cat.enabled === false) return null;
    if (!TIER_ALLOWED[data.config.chattiness]?.[cat.tier]) return null;

    const active = (cat.lines || []).filter((l) => l.enabled !== false);
    if (active.length === 0) return null;

    let line;
    if (cat.kind === 'slots') {
        line = active.find((l) => String(l.key) === String(slot));
        if (!line) return null;
    } else {
        const window = data.config.avoidRepeatWindow ?? 3;
        let candidates = active.filter((l) => !(recent[categoryId] || []).includes(l.id));
        if (candidates.length === 0) candidates = active;
        line = weightedPick(candidates);
        recent[categoryId] = [...(recent[categoryId] || []), line.id].slice(-window);
    }

    return {
        text: resolveText(line, lang, data.config.languageFallback, vars),
        expression: cat.fx?.expression ?? 'idle',
        sound: cat.fx?.sound ?? null,
        haptic: cat.fx?.haptic ?? null,
    };
}

function weightedPick(lines) {
    const total = lines.reduce((s, l) => s + (l.weight ?? 1), 0);
    let r = Math.random() * total;
    for (const l of lines) {
        r -= l.weight ?? 1;
        if (r <= 0) return l;
    }
    return lines[lines.length - 1];
}

function resolveText(line, lang, fallback = 'en', vars = null) {
    let text;
    if (lang === 'zh-t') {
        const zh = line.text?.zh;
        text = zh ? s2t(zh) : line.text?.[fallback] || line.text?.en || '';
    } else if (lang === 'zh-s' || lang === 'zh') {
        text = line.text?.zh || line.text?.[fallback] || line.text?.en || '';
    } else {
        text = line.text?.[lang] || line.text?.[fallback] || line.text?.en || '';
    }
    return interpolate(text, vars);
}

function interpolate(text, vars) {
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

// Future-proofing for schema bumps; identity for now.
function migrate(data) {
    return data;
}
