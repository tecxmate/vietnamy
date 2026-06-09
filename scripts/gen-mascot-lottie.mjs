#!/usr/bin/env node
/**
 * Generate richer Bé Khế Lottie loops — one per expression, with the full face
 * (star body, leaf sprouts, cheeks, expression-specific eyes/mouth) plus tailored
 * motion and accents. Lottie is JSON, so generating it from shared shape builders
 * is far more reliable than hand-writing it.
 *
 *   node scripts/gen-mascot-lottie.mjs
 *
 * Writes src/components/BeKhe/lottie/<expression>.json for all 8 states.
 * Coordinates mirror the inline <BeKhe> SVG (star radius ~46, centred at 0,0;
 * the layer is positioned at canvas centre 60,60).
 */
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'components', 'BeKhe', 'lottie');
const FR = 30, W = 120, H = 120, C = [60, 60];

// ── palette (normalised RGBA) ───────────────────────────────────────────────
const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255, 1];
const STAR = hex('#FBD24A'), LINE = hex('#E3A92E'), LEAF = hex('#5BBF72');
const CHEEK = hex('#FF9E9E'), INK = hex('#3A2A12'), WHITE = hex('#FFFFFF'), BOOK = hex('#7CC3D6');
const CONFETTI = [hex('#58CC02'), hex('#EF6B6B'), hex('#E3A92E'), hex('#5BBF72'), hex('#1CB0F6')];

// ── shape builders ──────────────────────────────────────────────────────────
const fill = (c, o = 100) => ({ ty: 'fl', c: { a: 0, k: c }, o: { a: 0, k: o }, r: 1, nm: 'fl' });
const stroke = (c, w) => ({ ty: 'st', c: { a: 0, k: c }, o: { a: 0, k: 100 }, w: { a: 0, k: w }, lc: 2, lj: 2, nm: 'st' });
const tr = ({ p = [0, 0], a = [0, 0], s = [100, 100], r = 0, o = 100 } = {}) =>
    ({ ty: 'tr', p: { a: 0, k: p }, a: { a: 0, k: a }, s: { a: 0, k: s }, r: { a: 0, k: r }, o: { a: 0, k: o } });
const grp = (it, nm = 'g') => ({ ty: 'gr', it: [...it, tr({})], nm });
const grpT = (it, t, nm = 'g') => ({ ty: 'gr', it: [...it, tr(t)], nm });
const star = (or, ir, pt = 5) => ({ ty: 'sr', sy: 1, d: 1, pt: { a: 0, k: pt }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 0 }, ir: { a: 0, k: ir }, is: { a: 0, k: 0 }, or: { a: 0, k: or }, os: { a: 0, k: 0 }, nm: 'sr' });
const el = (cx, cy, w, h) => ({ ty: 'el', p: { a: 0, k: [cx, cy] }, s: { a: 0, k: [w, h] }, nm: 'el' });
const rect = (cx, cy, w, h, rd = 2) => ({ ty: 'rc', p: { a: 0, k: [cx, cy] }, s: { a: 0, k: [w, h] }, r: { a: 0, k: rd }, nm: 'rc' });
// open bezier path; v=vertices, o/i = out/in tangents (relative)
const path = (v, o = null, i = null, closed = false) =>
    ({ ty: 'sh', ks: { a: 0, k: { c: closed, v, o: o || v.map(() => [0, 0]), i: i || v.map(() => [0, 0]) } }, nm: 'sh' });

// ── reusable face parts (matching the inline SVG) ───────────────────────────
const body = () => grp([star(46, 18), fill(STAR), stroke(LINE, 3)], 'body');
const leaves = () => [
    grpT([el(0, 0, 16, 10), fill(LEAF)], { p: [6, -50], r: 25 }, 'leaf1'),
    grpT([el(0, 0, 14, 8), fill(LEAF)], { p: [-4, -52], r: -20 }, 'leaf2'),
    grp([path([[-7, -44], [0, -47], [7, -44]], [[3, -3], [3, 0], [0, 0]], [[0, 0], [-3, 0], [-3, -3]]), stroke(LEAF, 4)], 'stem'),
];
const cheeks = (cy = 6) => grp([el(-20, cy, 10, 10), el(20, cy, 10, 10), fill(CHEEK, 80)], 'cheeks');
const dotEyes = () => [
    grp([el(-13, -6, 11, 11), el(13, -6, 11, 11), fill(INK)], 'eyes'),
    grp([el(-11.5, -8, 3.4, 3.4), el(14.5, -8, 3.4, 3.4), fill(WHITE)], 'glints'),
];
const happyEyes = () => [grp([
    path([[-17, -5], [-12.5, -9], [-8, -5]], [[1.5, -1.5], [1.5, 0], [0, 0]], [[0, 0], [-1.5, 0], [-1.5, -1.5]]),
    path([[8, -5], [12.5, -9], [17, -5]], [[1.5, -1.5], [1.5, 0], [0, 0]], [[0, 0], [-1.5, 0], [-1.5, -1.5]]),
    stroke(INK, 3),
], 'happyEyes')];
const sleepyEyes = () => [grp([
    path([[-19, -5], [-13, -1], [-7, -5]], [[2, 1.5], [2, 0], [0, 0]], [[0, 0], [-2, 0], [-2, 1.5]]),
    path([[7, -5], [13, -1], [19, -5]], [[2, 1.5], [2, 0], [0, 0]], [[0, 0], [-2, 0], [-2, 1.5]]),
    stroke(INK, 3),
], 'sleepyEyes')];
const wowEyes = () => [
    grp([el(-13, -5, 15, 15), el(13, -5, 15, 15), fill(WHITE), stroke(INK, 2.5)], 'wowWhites'),
    grp([el(-13, -4, 6.8, 6.8), el(13, -4, 6.8, 6.8), fill(INK)], 'wowPupils'),
];
const smile = (depth = 9) => grp([path([[-9, 7], [9, 7]], [[depth * 0.7, depth], [0, 0]], [[0, 0], [-depth * 0.7, depth]]), stroke(INK, 3)], 'mouth');
const openMouth = () => grp([el(0, 11, 11, 14), fill(INK)], 'mouthO');
const worriedMouth = () => grp([path([[-9, 11], [9, 11]], [[6, -5], [0, 0]], [[0, 0], [-6, -5]]), stroke(INK, 3)], 'mouthW');
const flatMouth = () => grp([path([[-8, 9], [8, 7]], [[5, 2], [0, 0]], [[0, 0], [-5, -1]]), stroke(INK, 3)], 'mouthT');
const brow = (x, y, dx, dy) => grp([path([[x, y], [x + dx, y + dy]], [[dx * 0.5, dy], [0, 0]], [[0, 0], [-dx * 0.5, -dy]]), stroke(INK, 2.4)], 'brow');
const sparkle = (cx, cy, sz) => grpT([star(sz, sz * 0.4, 4), fill(LINE)], { p: [cx, cy] }, 'sparkle');

// ── layer builders ──────────────────────────────────────────────────────────
let _ind = 0;
const layer = (shapes, ks, op = 60) => ({ ddd: 0, ind: ++_ind, ty: 4, nm: 'l' + _ind, sr: 1, ks, shapes, ip: 0, op, st: 0, bm: 0 });
const K = (kfs) => ({ a: 1, k: kfs.map((kf, idx) => idx < kfs.length - 1 ? { t: kf.t, s: kf.s, i: { x: kf.ix ?? 0.4, y: kf.iy ?? 1 }, o: { x: kf.ox ?? 0.4, y: kf.oy ?? 0 } } : { t: kf.t, s: kf.s }) });
// p/s/r/o are already K(...) results (or omitted → static defaults).
const ks = ({ p, s, r, o } = {}) => ({
    o: o || { a: 0, k: 100 },
    r: r || { a: 0, k: 0 },
    p: p || { a: 0, k: C },
    a: { a: 0, k: [0, 0] },
    s: s || { a: 0, k: [100, 100] },
});
// position/scale keyframe helpers around centre C
const bob = (amp, op = 90) => K([{ t: 0, s: [C[0], C[1] + amp] }, { t: op / 2, s: [C[0], C[1] - amp] }, { t: op, s: [C[0], C[1] + amp] }]);
const pulse = (lo, hi, op = 60) => K([{ t: 0, s: [lo, lo] }, { t: op * 0.45, s: [hi, hi] }, { t: op, s: [lo, lo] }]);

const doc = (nm, layers, op) => ({ v: '5.7.4', fr: FR, ip: 0, op, w: W, h: H, nm, ddd: 0, assets: [], layers });

// ── per-expression compositions ─────────────────────────────────────────────
function face(parts, cheekY) {
    // Authored bottom→top: body, leaves, cheeks, eyes/mouth/extras. Lottie paints
    // shapes[] first-on-top, so reverse it (face parts must sit above the body).
    return [body(), ...leaves(), cheeks(cheekY), ...parts].reverse();
}

function build(name) {
    _ind = 0;
    switch (name) {
        case 'idle': {
            const op = 90;
            return doc('idle', [layer(face([...dotEyes(), smile(9)]), ks({ p: bob(3, op) }), op)], op);
        }
        case 'cheer': {
            const op = 45;
            const sp = layer([sparkle(34, -34, 8)], ks({ s: pulse(40, 120, op), o: K([{ t: 0, s: 0 }, { t: op * 0.4, s: 100 }, { t: op, s: 0 }]) }), op);
            const f = layer(face([...happyEyes(), smile(12)]), ks({ s: pulse(96, 110, op) }), op);
            return doc('cheer', [sp, f], op);
        }
        case 'celebrate': {
            const op = 70;
            const f = layer(face([...dotEyes(), openMouth()], 7), ks({
                p: K([{ t: 0, s: C }, { t: 18, s: [C[0], C[1] - 12] }, { t: 40, s: C }, { t: 55, s: [C[0], C[1] - 5] }, { t: op, s: C }]),
                s: K([{ t: 0, s: [100, 100] }, { t: 18, s: [112, 112] }, { t: 40, s: [100, 100] }, { t: op, s: [100, 100] }]),
            }), op);
            const conf = CONFETTI.map((c, k) => {
                const x = -42 + k * 21;
                return layer([grp([rect(0, 0, 6, 6, 1.5), fill(c)], 'c')], ks({
                    p: K([{ t: 0, s: [C[0] + x, C[1] - 50] }, { t: op, s: [C[0] + x + (k % 2 ? 8 : -8), C[1] + 48] }]),
                    r: K([{ t: 0, s: 0 }, { t: op, s: 220 * (k % 2 ? 1 : -1) }]),
                    o: K([{ t: 0, s: 0 }, { t: 8, s: 100 }, { t: op - 10, s: 100 }, { t: op, s: 0 }]),
                }), op);
            });
            return doc('celebrate', [...conf, f], op);
        }
        case 'oops': {
            const op = 60;
            const f = layer(face([...dotEyes(), worriedMouth(), brow(-20, -16, 11, 4), brow(20, -16, -11, 4)]), ks({
                r: K([{ t: 0, s: -4 }, { t: 30, s: 4 }, { t: op, s: -4 }]),
            }), op);
            return doc('oops', [f], op);
        }
        case 'thinking': {
            const op = 80;
            const f = layer(face([...dotEyes(), flatMouth()]), ks({ p: bob(2.5, op) }), op);
            const q = layer([sparkle(30, -28, 7)], ks({ o: K([{ t: 0, s: 30 }, { t: 40, s: 100 }, { t: op, s: 30 }]), s: pulse(80, 110, op) }), op);
            return doc('thinking', [q, f], op);
        }
        case 'wow': {
            const op = 60;
            const f = layer(face([...wowEyes(), openMouth()], 7), ks({ s: K([{ t: 0, s: [60, 60] }, { t: 16, s: [112, 112] }, { t: 30, s: [100, 100] }, { t: op, s: [100, 100] }]) }), op);
            const s1 = layer([sparkle(-38, -30, 7)], ks({ s: pulse(40, 120, op), o: K([{ t: 0, s: 0 }, { t: 20, s: 100 }, { t: 40, s: 0 }, { t: op, s: 0 }]) }), op);
            const s2 = layer([sparkle(36, -28, 6)], ks({ s: pulse(40, 120, op), o: K([{ t: 0, s: 0 }, { t: 30, s: 0 }, { t: 45, s: 100 }, { t: op, s: 0 }]) }), op);
            return doc('wow', [s1, s2, f], op);
        }
        case 'sleepy': {
            const op = 100;
            const f = layer(face([...sleepyEyes(), smile(5)]), ks({ p: bob(2, op) }), op);
            const z = (cx, cy, sz, delay) => layer([grp([rect(0, 0, sz, sz, 1), fill(LINE)], 'z')], ks({
                p: K([{ t: delay, s: [C[0] + cx, C[1] + cy] }, { t: delay + 50, s: [C[0] + cx + 8, C[1] + cy - 26] }]),
                o: K([{ t: delay, s: 0 }, { t: delay + 12, s: 90 }, { t: delay + 40, s: 90 }, { t: delay + 50, s: 0 }]),
            }), op);
            return doc('sleepy', [z(26, -22, 6, 0), z(34, -30, 8, 30), f], op);
        }
        case 'reading': {
            const op = 90;
            const bookG = grpT([
                path([[-22, 0], [0, -5], [22, 0], [22, 16], [0, 11], [-22, 16]], null, null, true), fill(BOOK), stroke(INK, 2.4),
            ], { p: [0, 34] }, 'book');
            const spine = grpT([path([[0, -5], [0, 11]]), stroke(INK, 2.4)], { p: [0, 34] }, 'spine');
            const f = layer([...face([...dotEyes(), smile(8)]), bookG, spine], ks({ p: bob(2, op) }), op);
            return doc('reading', [f], op);
        }
        default:
            throw new Error('unknown ' + name);
    }
}

mkdirSync(OUT, { recursive: true });
const NAMES = ['idle', 'cheer', 'celebrate', 'oops', 'thinking', 'wow', 'sleepy', 'reading'];
for (const n of NAMES) {
    const json = build(n);
    JSON.parse(JSON.stringify(json)); // sanity
    writeFileSync(join(OUT, `${n}.json`), JSON.stringify(json, null, 1));
    console.log('wrote', n + '.json');
}
console.log('done');
