// Demo for the Layer 3 sequencer (read-only; proves behavior, wired into nothing).
// Run: node scripts/demo-sequencer.mjs
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getNextBestLessons } from '../src/lib/sequencer.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cur = JSON.parse(readFileSync(join(ROOT, 'content/curriculum.json'), 'utf8'));
const lessons = cur.lessons;
const byId = new Map(lessons.map((l) => [l.id, l]));
const fmt = (c) => `${c.lesson.id} "${c.lesson.title}" [${c.lesson.topic}/${c.lesson.cefrLevel}]`
    + `${c.spine ? ' ⛓spine' : ''}  score=${c.total.toFixed(2)} `
    + `(purpose ${c.breakdown.purpose.toFixed(2)}, diff ${c.breakdown.difficulty.toFixed(2)}, variety ${c.breakdown.variety.toFixed(2)})`;

function show(title, state) {
    console.log(`\n=== ${title} ===`);
    console.log(`  done: ${state.completedLessonIds.length} lessons | purpose: ${state.purpose} | level≈${state.estimatedLevel} | recent: [${state.recentTopics.join(', ')}]`);
    const next = getNextBestLessons(state, lessons, { limit: 5 });
    next.forEach((c, i) => console.log(`  ${i + 1}. ${fmt(c)}`));
    // prove no prerequisite is violated
    const introduced = new Set();
    state.completedLessonIds.forEach((id) => (byId.get(id)?.adaptive?.introducesGrammar || []).forEach((g) => introduced.add(g)));
    const bad = next.filter((c) => (c.lesson.adaptive?.requiresGrammar || []).some((g) => !introduced.has(g)));
    console.log(`  prerequisite violations among suggestions: ${bad.length}`);
}

// A brand-new learner (nothing done) — should surface the spine on-ramp first.
show('New learner · explore_vietnam', {
    completedLessonIds: [], purpose: 'explore_vietnam', estimatedLevel: 2, recentTopics: [],
});

// Same progress, two different purposes → the path should diverge.
const done = ['lesson_001a', 'lesson_001b', 'lesson_002a', 'lesson_002b', 'lesson_003', 'lesson_004'];
show('After A1 basics · explore_vietnam (travel)', {
    completedLessonIds: done, purpose: 'explore_vietnam', estimatedLevel: 4, recentTopics: ['greetings', 'basics'],
});
show('After A1 basics · professional (work)', {
    completedLessonIds: done, purpose: 'professional', estimatedLevel: 4, recentTopics: ['greetings', 'basics'],
});
show('After A1 basics · heritage', {
    completedLessonIds: done, purpose: 'heritage', estimatedLevel: 4, recentTopics: ['greetings', 'basics'],
});
