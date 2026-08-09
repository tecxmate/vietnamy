#!/usr/bin/env node
/**
 * One-off data migration: move dialect out of prose and into the dialect field.
 *
 * Two problems in src/data/unified_db.json:
 *
 * 1. Nine words encode their region inside the English gloss ("father (Northern)").
 *    The gloss is what MCQ choices render, so "Translate: father" could be answered
 *    with either bố or ba — an unanswerable question. The region belongs in the
 *    `dialect` enum, which the app can filter and label on.
 *
 * 2. Two words encode BOTH regional forms inside vi_text ("Tô (Bắc) / Tô lớn (Nam)").
 *    vi_text is fed to TTS and is the expected answer for "type what you hear", so
 *    the learner is asked to type the annotation. Reduced to a single speakable
 *    word; the original regional string is preserved verbatim in `note` rather than
 *    resolved, since choosing the "right" regional form is a linguistic call for a
 *    native reviewer, not a data cleanup.
 *
 * Idempotent — safe to re-run. After running: npm run content:build
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DB_PATH = join(ROOT, 'src/data/unified_db.json');

// id -> { en, dialect, note?, pos? }
const FIXES = {
    it_w_0005: { en: 'yes', dialect: 'north' },
    it_w_0006: { en: 'yes', dialect: 'south', note: 'Also a polite/deferential response' },
    it_w_0072: { en: 'expensive', dialect: 'south' },
    it_w_0091: { en: 'thousand', dialect: 'north' },
    it_w_0092: { en: 'thousand', dialect: 'south' },
    it_w_0160: { en: 'father', dialect: 'north' },
    // pos was "number" — the POS of ba "three", wrong for this kinship sense, and
    // now load-bearing since the generator picks same-POS distractors.
    it_w_0161: { en: 'father', dialect: 'south', pos: 'noun' },
    it_w_0162: { en: 'mother', dialect: 'north' },
    it_w_0163: { en: 'mother', dialect: 'south' },
};

// id -> { vi, en, note } for entries whose vi_text held two forms plus annotations
const VI_FIXES = {
    it_w_0874: { vi: 'tô', en: 'bowl', note: 'Regional variants: Tô (Bắc) / Tô lớn (Nam)' },
    it_w_0875: { vi: 'bố', en: 'father', note: 'Regional variants: Bố (Bắc) / Ba (Nam)', dialect: 'north' },
};

const db = JSON.parse(readFileSync(DB_PATH, 'utf8'));
let changed = 0;

for (const word of db.vocabulary || []) {
    const fix = FIXES[word.id] || VI_FIXES[word.id];
    if (!fix) continue;

    if (fix.vi && word.vi_text !== fix.vi) {
        console.log(`  ${word.id}  vi_text  ${JSON.stringify(word.vi_text)} -> ${JSON.stringify(fix.vi)}`);
        word.vi_text = fix.vi;
        changed++;
    }
    if (fix.pos && word.pos !== fix.pos) {
        console.log(`  ${word.id}  pos      ${word.pos} -> ${fix.pos}`);
        word.pos = fix.pos;
        changed++;
    }
    if (fix.dialect && word.dialect !== fix.dialect) {
        console.log(`  ${word.id}  dialect  ${word.dialect} -> ${fix.dialect}`);
        word.dialect = fix.dialect;
        changed++;
    }
    if (fix.note && word.note !== fix.note) {
        word.note = fix.note;
        changed++;
    }

    const en = (word.translations || []).find((t) => t.lang === 'en' && t.is_primary)
        || (word.translations || []).find((t) => t.lang === 'en');
    if (fix.en && en && en.text !== fix.en) {
        console.log(`  ${word.id}  en       ${JSON.stringify(en.text)} -> ${JSON.stringify(fix.en)}`);
        en.text = fix.en;
        changed++;
    }
}

if (changed === 0) {
    console.log('Already applied — nothing to change.');
} else {
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2) + '\n');
    console.log(`\n${changed} field(s) updated in src/data/unified_db.json`);
    console.log('Now run: npm run content:build');
}
