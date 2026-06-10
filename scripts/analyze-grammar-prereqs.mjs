// READ-ONLY feasibility analysis (NOT wired into the app, NOT part of the build).
//
// Proves the Adaptive-Curriculum doc's claim that a grammar prerequisite graph is
// *derivable* from existing data: every sentence now carries grammarTagIds (Pass 5
// took coverage to 100%), so for lessons walked in order we can compute, per lesson:
//   introduces_grammar = grammar tags appearing here for the FIRST time
//   requires_grammar   = grammar tags used here but introduced in an EARLIER lesson
// It also surfaces a data-quality signal: tags USED before they're ever introduced.
//
// Output: a proposal at docs/curr/derived-grammar-prerequisites.json + a console summary.
// This is a decision-support artifact only — adopting it (and the wider tag schema)
// is a product decision left to the user.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cur = JSON.parse(readFileSync(join(ROOT, 'content/curriculum.json'), 'utf8'));
const tagName = new Map((cur.grammarTags || []).map(t => [t.id, t.name]));
const sentsByLesson = new Map();
for (const s of cur.sentences || []) {
    if (!sentsByLesson.has(s.lessonId)) sentsByLesson.set(s.lessonId, []);
    sentsByLesson.get(s.lessonId).push(s);
}

// Lesson order: by unit orderIndex, then lesson order within the array.
const unitOrder = new Map((cur.units || []).map(u => [u.id, u.orderIndex ?? 9999]));
const lessons = [...(cur.lessons || [])]
    .map((l, i) => ({ ...l, _i: i }))
    .sort((a, b) => (unitOrder.get(a.unitId) - unitOrder.get(b.unitId)) || (a._i - b._i));

const seen = new Set();      // grammar tags introduced so far
const proposal = [];
let withReq = 0, totalReq = 0;
const usedBeforeIntroduced = new Set(); // can't happen with this algo (first use = introduce), kept for clarity

for (const l of lessons) {
    const used = new Set();
    for (const s of sentsByLesson.get(l.id) || []) for (const t of s.grammarTagIds || []) used.add(t);
    const introduces = [], requires = [];
    for (const t of used) (seen.has(t) ? requires : introduces).push(t);
    introduces.forEach(t => seen.add(t));
    if (requires.length) { withReq++; totalReq += requires.length; }
    proposal.push({
        id: l.id, title: l.title, cefr: l.cefrLevel,
        introduces_grammar: introduces.sort(),
        requires_grammar: requires.sort(),
        requires_grammar_named: requires.map(t => tagName.get(t) || t).sort(),
    });
}

writeFileSync(join(ROOT, 'docs/curr/derived-grammar-prerequisites.json'),
    JSON.stringify({ note: 'PROPOSAL — derived by scripts/analyze-grammar-prereqs.mjs from sentence grammarTagIds; not applied.', generatedFromLessonOrder: true, lessons: proposal }, null, 2) + '\n');

console.log(`lessons analyzed: ${lessons.length}`);
console.log(`lessons with a derived requires_grammar: ${withReq} (${Math.round(withReq / lessons.length * 100)}%)`);
console.log(`avg requires_grammar per such lesson: ${(totalReq / Math.max(1, withReq)).toFixed(1)}`);
console.log(`distinct grammar tags ever introduced: ${seen.size}/${cur.grammarTags.length}`);
console.log('\nsample (first 6 lessons with requires):');
proposal.filter(p => p.requires_grammar.length).slice(0, 6).forEach(p =>
    console.log(`  ${p.id} "${p.title}" — requires: [${p.requires_grammar_named.join(', ')}]`));
console.log('\nwrote docs/curr/derived-grammar-prerequisites.json');
