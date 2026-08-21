// Guard the auto-generated grammar quizzes.
//
//   node scripts/validate-grammar-exercises.mjs
//
// Every grammar unit builds its quiz at runtime from its own examples. Units
// with fewer than four examples used to pad the multiple-choice options with
// "Not: <the answer reversed>" — nonsense text, repeated three times, and
// trivially guessable. This walks all 394 units and fails on any quiz that
// is unusable: a fabricated option, a duplicate option, a single-option
// question, or a unit that produces no exercises at all.
//
// Runs against content/grammar.json (the shipped bundle) with the same
// generator the app uses.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(HERE, '..', 'content/grammar.json'), 'utf8'));

// localStorage is only touched for admin overrides; stub it so the module loads.
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const db = await import('../src/lib/grammarModulesDB.js');
db.primeGrammarModules(data); // Node can't run the browser's dynamic JSON import

const FABRICATED = /^(Not:|Không phải:)/;

let units = 0;
let failures = 0;
const report = (msg) => { failures++; if (failures <= 12) console.error(`  ✗ ${msg}`); };

for (const level of data.levels) {
    for (const mod of level.modules) {
        for (const unit of mod.units) {
            units++;
            // Both session profiles — they use different exercise types.
            for (const session of [0, 1]) {
                const exercises = db.generateExercisesForUnit(unit.id, 6, session);
                if (!exercises.length) {
                    report(`${unit.id} (s${session}) produced no exercises`);
                    continue;
                }
                for (const ex of exercises) {
                    const opts = ex.prompt?.options_en || ex.prompt?.options_vi || null;
                    if (!opts) continue; // non-MCQ types carry no options
                    const fabricated = opts.filter(o => FABRICATED.test(o));
                    if (fabricated.length) {
                        report(`${unit.id} (s${session}) ${ex.exercise_type}: fabricated option ${JSON.stringify(fabricated[0])}`);
                    }
                    if (new Set(opts).size !== opts.length) {
                        report(`${unit.id} (s${session}) ${ex.exercise_type}: duplicate options ${JSON.stringify(opts)}`);
                    }
                    if (opts.length < 2) {
                        report(`${unit.id} (s${session}) ${ex.exercise_type}: only ${opts.length} option(s)`);
                    }
                    const answer = ex.prompt?.answer_en ?? ex.prompt?.answer_vi;
                    if (answer && !opts.includes(answer)) {
                        report(`${unit.id} (s${session}) ${ex.exercise_type}: answer missing from options`);
                    }
                }
            }
        }
    }
}

// ── Content-quality report (advisory, does not fail the build) ──────────────
// Roughly 5% of the examples came out of the source scrape mangled. The
// generator now keeps them out of the answer list whenever a clean sentence is
// available, but the underlying data still wants a human pass.
const mangled = (s) => !s || s.length > 110 || /NOTE\b/i.test(s) || /[?!]{3,}/.test(s) || /\d\s*=|=\s*\d/.test(s) || /[\t\n]/.test(s);
let examples = 0;
let suspect = 0;
for (const level of data.levels) {
    for (const mod of level.modules) {
        for (const unit of mod.units) {
            for (const ex of unit.examples || []) {
                examples++;
                if (mangled(ex.en) || mangled(ex.vi)) suspect++;
            }
        }
    }
}

if (failures) {
    console.error(`\n✗ grammar quizzes: ${failures} problem(s) across ${units} units`);
    process.exit(1);
}
console.log(`✓ grammar quizzes OK — ${units} units generate usable exercises in both session profiles`);
if (suspect) {
    console.log(`  note: ${suspect}/${examples} source examples (${(suspect / examples * 100).toFixed(1)}%) look mangled by the original scrape and are deprioritised as distractors — worth a content pass.`);
}
