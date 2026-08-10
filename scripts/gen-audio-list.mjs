// Build the audio generation list for the Spelling Playground.
//
//   node scripts/gen-audio-list.mjs
//
// Produces content/spell_gen_list.json — every clip VieNeu-TTS should render,
// each with an ASCII-safe `slug` (filenames must dodge macOS NFC/NFD Unicode
// normalization) and the Vietnamese `text` to synthesize.
//   - all attested syllables (the blend / "Nghe" playback)
//   - initial names + tone names (the đánh-vần spell-out)

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import syllData from '../content/vn_syllables.json' with { type: 'json' };
import { INITIALS, TONES } from '../src/data/spellingBlocks.js';
import { spellAsciiId, spellSlug } from '../src/lib/spellSlug.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'content', 'spell_gen_list.json');

const items = [];
for (const syl of syllData.syllables) items.push({ slug: spellSlug(syl), text: syl, kind: 'syllable' });
for (const b of INITIALS) items.push({ slug: `ini-${spellAsciiId(b.id)}`, text: b.name, kind: 'initial' });
for (const t of TONES) items.push({ slug: `tone-${t.id}`, text: t.name, kind: 'tone' });

// Guard: slugs must be unique and pure-ASCII.
const seen = new Map();
const collisions = [];
for (const it of items) {
    if (/[^\x20-\x7E]/.test(it.slug)) collisions.push(`non-ascii: ${it.slug} (${it.text})`);
    if (seen.has(it.slug)) collisions.push(`dup: ${it.slug} = ${seen.get(it.slug)} & ${it.text}`);
    seen.set(it.slug, it.text);
}

writeFileSync(OUT, JSON.stringify({ voice: 'north', ext: 'mp3', items }, null, 0));
console.log(`items: ${items.length} (syllables + ${INITIALS.length} initials + ${TONES.length} tones)`);
console.log(`unique ascii slugs: ${collisions.length === 0 ? 'OK' : 'PROBLEMS'}`);
if (collisions.length) console.log(collisions.slice(0, 20).join('\n'));
console.log(`wrote ${OUT}`);
