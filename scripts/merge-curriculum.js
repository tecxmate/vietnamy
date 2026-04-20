#!/usr/bin/env node
/**
 * Curriculum Merger
 *
 * Merges curriculum metadata into legacy LESSON_DEFS:
 * - Matches by Vietnamese text
 * - Adds POS, grammar tags, accepted translations
 * - Preserves legacy lesson structure and ordering
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Load curriculum data
const curriculumPath = join(PROJECT_ROOT, 'src/data/curricula/explore_vietnam.json');
const curriculum = JSON.parse(readFileSync(curriculumPath, 'utf8'));

// Build lookup maps from curriculum
const vocabByVi = new Map();
const sentencesByVi = new Map();

curriculum.lessons.forEach(lesson => {
    (lesson.words || []).forEach(w => {
        const key = w.vi.toLowerCase().trim();
        if (!vocabByVi.has(key)) {
            vocabByVi.set(key, w);
        }
    });
    (lesson.sentences || []).forEach(s => {
        const key = s.vi.toLowerCase().trim();
        if (!sentencesByVi.has(key)) {
            sentencesByVi.set(key, s);
        }
    });
});

console.log(`Loaded curriculum: ${vocabByVi.size} vocab, ${sentencesByVi.size} sentences`);

// Read the legacy LESSON_DEFS from db.js
const dbPath = join(PROJECT_ROOT, 'src/lib/db.js');
const dbContent = readFileSync(dbPath, 'utf8');

// Extract LESSON_DEFS array (between "const LESSON_DEFS = [" and "];")
const startMarker = 'const LESSON_DEFS = [';
const startIdx = dbContent.indexOf(startMarker);
if (startIdx === -1) {
    console.error('Could not find LESSON_DEFS in db.js');
    process.exit(1);
}

// Find the matching closing bracket
let depth = 0;
let endIdx = startIdx + startMarker.length;
for (let i = endIdx; i < dbContent.length; i++) {
    if (dbContent[i] === '[') depth++;
    if (dbContent[i] === ']') {
        if (depth === 0) {
            endIdx = i + 1;
            break;
        }
        depth--;
    }
}

const lessonDefsStr = dbContent.slice(startIdx + startMarker.length - 1, endIdx);

// Parse it (this is JS, not JSON, so we need to eval carefully)
// For safety, we'll use a regex-based approach to extract and enhance

// Stats
let wordsEnriched = 0;
let sentencesEnriched = 0;
let wordsNotFound = 0;
let sentencesNotFound = 0;

/**
 * Enrich a word object with curriculum metadata
 */
function enrichWord(word) {
    const key = word.vi.toLowerCase().trim();
    const match = vocabByVi.get(key);

    if (match) {
        wordsEnriched++;
        return {
            ...word,
            // Add curriculum metadata
            ...(match.pos && !word.pos ? { pos: match.pos } : {}),
            ...(match.frequency && !word.frequency ? { frequency: match.frequency } : {}),
            ...(match.hasImage && !word.hasImage ? { hasImage: match.hasImage } : {}),
        };
    } else {
        wordsNotFound++;
        return word;
    }
}

/**
 * Enrich a sentence object with curriculum metadata
 */
function enrichSentence(sentence) {
    const key = sentence.vi.toLowerCase().trim();
    const match = sentencesByVi.get(key);

    if (match) {
        sentencesEnriched++;
        return {
            ...sentence,
            // Add curriculum metadata
            ...(match.accepted && match.accepted.length > 1 ? { accepted: match.accepted } : {}),
            ...(match.tags ? { tags: match.tags } : {}),
            ...(match.note ? { note: match.note } : {}),
            ...(match.tokens ? { tokens: match.tokens } : {}),
        };
    } else {
        sentencesNotFound++;
        return sentence;
    }
}

// Create the metadata map as a separate JSON file
// This can be imported and applied at runtime
const metadataMap = {
    vocab: {},
    sentences: {},
};

// Build metadata maps
vocabByVi.forEach((v, key) => {
    metadataMap.vocab[key] = {
        pos: v.pos,
        frequency: v.frequency,
        hasImage: v.hasImage,
        difficulty: v.difficulty,
    };
});

sentencesByVi.forEach((s, key) => {
    metadataMap.sentences[key] = {
        accepted: s.accepted,
        tags: s.tags,
        note: s.note,
        tokens: s.tokens,
        difficulty: s.difficulty,
    };
});

// Write metadata map
const metadataPath = join(PROJECT_ROOT, 'src/data/curricula/metadata.json');
writeFileSync(metadataPath, JSON.stringify(metadataMap, null, 2));

console.log(`\n✅ Created metadata map: ${metadataPath}`);
console.log(`   Vocab entries: ${Object.keys(metadataMap.vocab).length}`);
console.log(`   Sentence entries: ${Object.keys(metadataMap.sentences).length}`);

// Also export grammar tags for reference
const grammarTagsPath = join(PROJECT_ROOT, 'src/data/curricula/grammar_tags.json');
writeFileSync(grammarTagsPath, JSON.stringify(curriculum.grammarTags, null, 2));
console.log(`   Grammar tags: ${curriculum.grammarTags.length}`);

console.log(`\n📝 To use: import metadata in db.js and apply during buildFromDefs()`);
