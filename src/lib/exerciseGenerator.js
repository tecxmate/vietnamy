// Exercise Generator — auto-produces Duolingo-style exercises from lesson items
// Input: lesson items (words/sentences with translations) + distractor pool
// Output: progressive exercise sequence

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Pick distractors with POS-aware tiering (better pedagogical distractors)
 * Tier 1: Same POS from pool (hardest - can't eliminate by word type)
 * Tier 2: Any POS from pool (fallback)
 */
function pickDistractors(item, pool, count, field = 'en_text') {
    const candidates = pool.filter(p => p.id !== item.id && p[field] !== item[field]);

    // If item has POS, prefer same-POS distractors
    if (item.pos) {
        const samePOS = candidates.filter(p => p.pos === item.pos);
        const otherPOS = candidates.filter(p => p.pos !== item.pos);

        // Prioritize same-POS, then fill with others
        const tier1 = shuffleArray(samePOS);
        const tier2 = shuffleArray(otherPOS);
        const combined = [...tier1, ...tier2];
        return combined.slice(0, count).map(c => c[field]);
    }

    const shuffled = shuffleArray(candidates);
    return shuffled.slice(0, count).map(c => c[field]);
}

function isSentence(item) {
    return item.id.startsWith('it_s_') || item.id.startsWith('it_p_') ||
        (item.vi_text && item.vi_text.split(' ').length >= 3);
}

function isTemplated(item) {
    return /\{[A-Z]+\}/.test(item.vi_text);
}

/**
 * Pick items that have appeared in the fewest exercises so far.
 * Ensures every item gets multi-modal coverage across exercise types.
 */
function pickItemsLeastSeen(pool, count, itemCount) {
    const shuffled = shuffleArray(pool);
    shuffled.sort((a, b) => (itemCount.get(a.id) || 0) - (itemCount.get(b.id) || 0));
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    selected.forEach(i => itemCount.set(i.id, (itemCount.get(i.id) || 0) + 1));
    return selected;
}


// Phase 1: Match pairs — batch of items shown together
function generateMatchPairs(lessonId, batch, exIndex) {
    return {
        id: `${lessonId}_gen_${exIndex}`,
        lesson_id: lessonId,
        exercise_type: 'match_pairs',
        prompt: {
            instruction: 'Match the pairs',
            pairs: batch.map(item => ({
                vi_text: item.vi_text,
                en_text: item.en_text
            }))
        }
    };
}

// MCQ — translate in one direction
function generateMCQ(lessonId, item, pool, direction, exIndex) {
    if (direction === 'to_en') {
        const distractors = pickDistractors(item, pool, 2, 'en_text');
        const choices = shuffleArray([item.en_text, ...distractors]);
        return {
            id: `${lessonId}_gen_${exIndex}`,
            lesson_id: lessonId,
            exercise_type: 'mcq_translate_to_en',
            prompt: {
                instruction: 'Translate to English',
                source_text_vi: item.vi_text,
                choices_en: choices,
                answer_en: item.en_text,
                // Include all accepted translations for display/checking
                accepted_en: item.accepted || [item.en_text],
            }
        };
    } else {
        const distractors = pickDistractors(item, pool, 2, 'vi_text');
        const choices = shuffleArray([item.vi_text, ...distractors]);
        return {
            id: `${lessonId}_gen_${exIndex}`,
            lesson_id: lessonId,
            exercise_type: 'mcq_translate_to_vi',
            prompt: {
                instruction: 'Translate to Vietnamese',
                source_text_en: item.en_text,
                choices_vi: choices,
                answer_vi: item.vi_text,
                // Include accepted English translations for context
                accepted_en: item.accepted || [item.en_text],
            }
        };
    }
}

// Listen & choose
function generateListenChoose(lessonId, item, pool, exIndex) {
    const distractors = pickDistractors(item, pool, 2, 'vi_text');
    const choices = shuffleArray([item.vi_text, ...distractors]);
    return {
        id: `${lessonId}_gen_${exIndex}`,
        lesson_id: lessonId,
        exercise_type: 'listen_choose',
        prompt: {
            instruction: 'Listen and choose',
            audio_item_id: item.id,
            audio_text: item.vi_text,
            choices_vi: choices,
            answer_vi: item.vi_text
        }
    };
}

// Picture choice — show image, pick the correct Vietnamese word
function generatePictureChoice(lessonId, item, pool, imageData, exIndex) {
    const distractors = pickDistractors(item, pool, 3, 'vi_text');
    const choices = shuffleArray([item.vi_text, ...distractors]);
    return {
        id: `${lessonId}_gen_${exIndex}`,
        lesson_id: lessonId,
        exercise_type: 'picture_choice',
        prompt: {
            instruction: 'What is this?',
            image_url: imageData.image,
            emoji_fallback: imageData.emoji,
            choices_vi: choices,
            answer_vi: item.vi_text
        }
    };
}

// Listen & type — hear audio, type what you hear
function generateListenType(lessonId, item, exIndex) {
    return {
        id: `${lessonId}_gen_${exIndex}`,
        lesson_id: lessonId,
        exercise_type: 'listen_type',
        prompt: {
            instruction: 'Type what you hear',
            audio_text: item.vi_text,
            audio_item_id: item.id,
            answer_vi: item.vi_text,
            answer_vi_no_diacritics: item.vi_text_no_diacritics || null
        }
    };
}

// Translation word bank — translate English to Vietnamese using tappable word tokens
function generateTranslationWordBank(lessonId, item, pool, exIndex) {
    const tokens = item.vi_text.replace(/([.!?,])/g, ' $1').split(/\s+/).filter(t => t);
    if (tokens.length < 2) return null;

    // Generate distractor tokens from other items in pool
    const distractorTokens = pool
        .filter(p => p.id !== item.id)
        .flatMap(p => p.vi_text.split(/\s+/).filter(t => t.length > 1))
        .filter(w => !tokens.includes(w));
    let uniqueDistractors = [...new Set(distractorTokens)];

    // Skip word bank if not enough curriculum-safe distractors
    if (uniqueDistractors.length < 2) return null;

    const numDistractors = Math.min(3, Math.max(2, Math.floor(tokens.length * 0.5)));
    const selectedDistractors = shuffleArray(uniqueDistractors).slice(0, numDistractors);
    const allTokens = shuffleArray([...tokens, ...selectedDistractors]);

    return {
        id: `${lessonId}_gen_${exIndex}`,
        lesson_id: lessonId,
        exercise_type: 'translation_word_bank',
        prompt: {
            instruction: 'Translate this sentence',
            source_text_en: item.en_text,
            tokens: allTokens,
            answer_tokens: tokens,
            answer_vi: item.vi_text,
            // Include accepted translations for flexible answer checking
            accepted_en: item.accepted || [item.en_text],
        }
    };
}

// Speak this sentence — display sentence, record speech
function generateSpeakSentence(lessonId, item, exIndex) {
    return {
        id: `${lessonId}_gen_${exIndex}`,
        lesson_id: lessonId,
        exercise_type: 'speak_sentence',
        prompt: {
            instruction: 'Speak this sentence',
            target_vi: item.vi_text,
            target_en: item.en_text,
            answer_vi: item.vi_text,
            answer_vi_no_diacritics: item.vi_text_no_diacritics || null
        }
    };
}

// Reorder words — scramble sentence tokens
function generateReorder(lessonId, item, exIndex) {
    const tokens = item.vi_text.replace(/([.!?,])/g, ' $1').split(/\s+/).filter(t => t);
    if (tokens.length < 2) return null;
    let scrambled = shuffleArray(tokens);
    let attempts = 0;
    while (scrambled.join(' ') === tokens.join(' ') && attempts < 10) {
        scrambled = shuffleArray(tokens);
        attempts++;
    }
    return {
        id: `${lessonId}_gen_${exIndex}`,
        lesson_id: lessonId,
        exercise_type: 'reorder_words',
        prompt: {
            instruction: 'Put the words in order',
            target_vi: item.vi_text,
            source_text_en: item.en_text,
            tokens: scrambled,
            answer_tokens: tokens,
            // Include accepted translations for context
            accepted_en: item.accepted || [item.en_text],
        }
    };
}

// Grammar-aware target words for fill_blank exercises
const TENSE_MARKERS = ['đã', 'đang', 'sẽ', 'rồi', 'chưa', 'sắp', 'vừa'];
const QUESTION_WORDS = ['gì', 'nào', 'đâu', 'ai', 'sao', 'mấy', 'bao nhiêu', 'khi nào', 'tại sao'];
const MEASURE_WORDS = ['cái', 'con', 'người', 'chiếc', 'quyển', 'ly', 'chai', 'tô', 'đĩa', 'bát'];

/**
 * Select the best word to blank based on grammar tags and pedagogical value
 */
function selectBlankTarget(words, tags) {
    const lowerWords = words.map(w => w.toLowerCase());

    // Priority 1: Tense markers (if sentence has tense tag)
    if (tags?.some(t => ['GT015', 'GT016', 'GT017', 'GT018', 'GT019'].includes(t))) {
        const tenseIdx = lowerWords.findIndex(w => TENSE_MARKERS.includes(w));
        if (tenseIdx !== -1) return { word: words[tenseIdx], index: tenseIdx, type: 'tense' };
    }

    // Priority 2: Question words (if sentence has question tag)
    if (tags?.some(t => t.startsWith('GT00') && parseInt(t.slice(2)) >= 3 && parseInt(t.slice(2)) <= 12)) {
        const qIdx = lowerWords.findIndex(w => QUESTION_WORDS.includes(w));
        if (qIdx !== -1) return { word: words[qIdx], index: qIdx, type: 'question' };
    }

    // Priority 3: Measure words
    const measureIdx = lowerWords.findIndex(w => MEASURE_WORDS.includes(w));
    if (measureIdx !== -1) return { word: words[measureIdx], index: measureIdx, type: 'measure' };

    // Fallback: Random content word (not punctuation, not too short)
    const candidates = words
        .map((w, i) => ({ word: w, index: i }))
        .filter(({ word }) => word.length > 1 && !/^[.!?,]+$/.test(word));

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
}

// Fill in the blank — remove a word from a sentence, offer MCQ choices
function generateFillBlank(lessonId, sentenceItem, pool, exIndex) {
    const words = sentenceItem.vi_text.split(/\s+/).filter(t => t);
    if (words.length < 2) return null;

    // Use grammar-tag-aware target selection
    const target = selectBlankTarget(words, sentenceItem.tags);
    if (!target) return null;

    const blanked = words.map((w, i) => i === target.index ? '____' : w).join(' ');

    // Generate distractors based on blank type
    let distractorPool;
    if (target.type === 'tense') {
        distractorPool = TENSE_MARKERS.filter(w => w !== target.word.toLowerCase());
    } else if (target.type === 'question') {
        distractorPool = QUESTION_WORDS.filter(w => w !== target.word.toLowerCase());
    } else if (target.type === 'measure') {
        distractorPool = MEASURE_WORDS.filter(w => w !== target.word.toLowerCase());
    } else {
        // Fallback: words from other items in pool
        distractorPool = pool
            .filter(p => p.id !== sentenceItem.id)
            .flatMap(p => p.vi_text.split(/\s+/).filter(t => t.length > 1))
            .filter(w => w !== target.word);
    }

    const uniqueDistractors = [...new Set(distractorPool)];
    const distractorChoices = shuffleArray(uniqueDistractors).slice(0, 2);
    const choices = shuffleArray([target.word, ...distractorChoices]);

    return {
        id: `${lessonId}_gen_${exIndex}`,
        lesson_id: lessonId,
        exercise_type: 'fill_blank',
        prompt: {
            instruction: 'Fill in the blank',
            template_vi: blanked,
            source_text_en: sentenceItem.en_text,
            choices_vi: choices,
            answer_vi: target.word,
            blank_type: target.type || 'general',
        }
    };
}

// Fill in the blank — blank out a KNOWN WORD within a sentence that contains it
function generateWordInContextFillBlank(lessonId, wordItem, allItems, pool, exIndex) {
    const wordText = wordItem.vi_text.toLowerCase();
    // Find a sentence in this lesson that contains this word
    const sentence = allItems.find(item =>
        isSentence(item) && item.vi_text.toLowerCase().includes(wordText)
    );
    if (!sentence) return null;

    // Replace the word occurrence with ____
    const escaped = wordItem.vi_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const blanked = sentence.vi_text.replace(regex, '____');
    if (blanked === sentence.vi_text) return null;

    // Distractors: other word items from the pool
    const distractors = pool
        .filter(p => p.id !== wordItem.id && !isSentence(p))
        .map(p => p.vi_text)
        .filter(t => t !== wordItem.vi_text);
    const uniqueDistractors = [...new Set(distractors)];
    const choices = shuffleArray([wordItem.vi_text, ...shuffleArray(uniqueDistractors).slice(0, 2)]);

    return {
        id: `${lessonId}_gen_${exIndex}`,
        lesson_id: lessonId,
        exercise_type: 'fill_blank',
        prompt: {
            instruction: 'Fill in the blank',
            template_vi: blanked,
            source_text_en: sentence.en_text,
            choices_vi: choices,
            answer_vi: wordItem.vi_text
        }
    };
}

/**
 * Session profiles define which exercise types to include and how many per session.
 * Session 0 (first): heavy on recognition (match, picture, MCQ).
 * Session 1: more listening and production MCQ, less matching.
 * Session 2: heavier on typing, word bank, reorder.
 * Session 3: hardest — more speak, fill-blank, listen-type, fewer MCQ.
 */
const SESSION_PROFILES = [
    // Session 0: Introduction — some recognition, but contextual from the start
    { match: true, picture: 1, mcqToEn: 2, listenChoose: 1, mcqToVi: 1, listenType: 1, wordBank: 2, reorder: 2, fillBlank: 3, speak: 0 },
    // Session 1: Reinforcement — more production in context
    { match: false, picture: 0, mcqToEn: 1, listenChoose: 1, mcqToVi: 1, listenType: 2, wordBank: 2, reorder: 2, fillBlank: 3, speak: 1 },
    // Session 2: Production — heavy contextual
    { match: false, picture: 0, mcqToEn: 1, listenChoose: 1, mcqToVi: 0, listenType: 2, wordBank: 3, reorder: 2, fillBlank: 3, speak: 1 },
    // Session 3: Mastery — almost all production/context
    { match: false, picture: 0, mcqToEn: 0, listenChoose: 1, mcqToVi: 0, listenType: 2, wordBank: 3, reorder: 2, fillBlank: 3, speak: 2 },
];

// --- Interleaving: distribute exercise types with soft difficulty curve ---

const EASY_TYPES = new Set(['picture_choice', 'mcq_translate_to_en', 'listen_choose']);
const HARD_TYPES = new Set(['translation_word_bank', 'reorder_words', 'speak_sentence']);
// Everything else (mcq_translate_to_vi, listen_type, fill_blank) is medium

/**
 * Pick from one of the tier buckets using weighted random selection.
 * Weights determine probability of picking from each tier.
 * Returns and removes the picked exercise from its bucket.
 */
function weightedPick(buckets, weights) {
    // Build list of eligible tiers (non-empty buckets)
    const eligible = Object.keys(weights).filter(k => buckets[k].length > 0 && weights[k] > 0);
    if (eligible.length === 0) {
        // Fallback: grab from any non-empty bucket
        const any = Object.keys(buckets).find(k => buckets[k].length > 0);
        return any ? buckets[any].shift() : null;
    }
    const totalWeight = eligible.reduce((sum, k) => sum + weights[k], 0);
    let roll = Math.random() * totalWeight;
    for (const tier of eligible) {
        roll -= weights[tier];
        if (roll <= 0) return buckets[tier].shift();
    }
    // Fallback to last eligible
    return buckets[eligible[eligible.length - 1]].shift();
}

/**
 * Swap adjacent same-type exercises with the nearest different-type exercise.
 * Mutates the array in place.
 */
function dedupeConsecutive(arr) {
    for (let i = 1; i < arr.length; i++) {
        if (arr[i].exercise_type === arr[i - 1].exercise_type) {
            // Find nearest swap candidate ahead
            let swapIdx = -1;
            for (let j = i + 1; j < arr.length; j++) {
                if (arr[j].exercise_type !== arr[i].exercise_type &&
                    (i < 2 || arr[j].exercise_type !== arr[i - 2]?.exercise_type)) {
                    swapIdx = j;
                    break;
                }
            }
            if (swapIdx !== -1) {
                [arr[i], arr[swapIdx]] = [arr[swapIdx], arr[i]];
            }
        }
    }
}

/**
 * Reorder exercises so types are interleaved with a soft difficulty curve.
 * match_pairs stay at the front. Easy types biased early, hard types biased late.
 */
function interleaveExercises(exercises) {
    const matchExercises = exercises.filter(e => e.exercise_type === 'match_pairs');
    const rest = exercises.filter(e => e.exercise_type !== 'match_pairs');
    if (rest.length <= 2) return [...matchExercises, ...rest];

    const buckets = {
        easy: shuffleArray(rest.filter(e => EASY_TYPES.has(e.exercise_type))),
        medium: shuffleArray(rest.filter(e => !EASY_TYPES.has(e.exercise_type) && !HARD_TYPES.has(e.exercise_type))),
        hard: shuffleArray(rest.filter(e => HARD_TYPES.has(e.exercise_type))),
    };

    const result = [];
    const total = rest.length;
    for (let i = 0; i < total; i++) {
        const progress = total > 1 ? i / (total - 1) : 0;
        const weights = {
            easy:   buckets.easy.length   > 0 ? 1 - progress : 0,
            medium: buckets.medium.length > 0 ? 0.5 : 0,
            hard:   buckets.hard.length   > 0 ? progress : 0,
        };
        const picked = weightedPick(buckets, weights);
        if (picked) result.push(picked);
    }

    dedupeConsecutive(result);
    return [...matchExercises, ...result];
}

/**
 * Main generator: takes lesson items and produces a progressive exercise sequence.
 * Phase ordering follows Duolingo pedagogy: recognition → production, passive → active.
 * The session parameter (0-3) varies the exercise mix so repeat sessions feel different.
 *
 * @param {string} lessonId
 * @param {Array<{id, vi_text, en_text, audio_key, item_type, vi_text_no_diacritics}>} items
 * @param {Array} distractorPool - items from sibling lessons for wrong answers
 * @param {Object} imageMap - { viText: { image, emoji } } for picture_choice exercises
 * @param {number} session - session number (0-3), varies the exercise mix
 * @returns {Array} exercises
 */
export function generateExercises(lessonId, items, distractorPool, imageMap = {}, session = 0) {
    if (!items || items.length === 0) return [];

    const profile = SESSION_PROFILES[Math.min(session, SESSION_PROFILES.length - 1)];
    const allPool = [...items, ...distractorPool];
    const exercises = [];
    let exIndex = 0;

    const wordItems = items.filter(i => !isSentence(i));
    const sentenceItems = items.filter(i => isSentence(i));
    const nonTemplatedSentences = sentenceItems.filter(i => !isTemplated(i));
    const nonTemplatedWords = wordItems.filter(i => !isTemplated(i));

    // Track exercise count per item to ensure multi-modal coverage
    const itemCount = new Map();

    // --- Phase 1: Match Pairs (batches of 3-5) ---
    if (profile.match) {
        const batchSize = Math.min(5, Math.max(3, wordItems.length));
        for (let i = 0; i < wordItems.length; i += batchSize) {
            const batch = wordItems.slice(i, i + batchSize);
            if (batch.length >= 2) {
                exercises.push(generateMatchPairs(lessonId, batch, exIndex++));
            }
        }
    }

    // --- Phase 2: Picture Choice (words with images only) ---
    if (profile.picture > 0) {
        const imageItems = wordItems.filter(i => imageMap[i.vi_text.toLowerCase()]);
        const pictureItems = shuffleArray(imageItems).slice(0, Math.min(profile.picture, imageItems.length));
        for (const item of pictureItems) {
            const imgData = imageMap[item.vi_text.toLowerCase()];
            exercises.push(generatePictureChoice(lessonId, item, allPool, imgData, exIndex++));
        }
    }

    // --- Phase 3: Recognition MCQ (vi → en) ---
    const recognitionItems = pickItemsLeastSeen(wordItems, profile.mcqToEn, itemCount);
    for (const item of recognitionItems) {
        exercises.push(generateMCQ(lessonId, item, allPool, 'to_en', exIndex++));
    }

    // --- Phase 4: Listen & Choose ---
    const listenItems = pickItemsLeastSeen(wordItems, profile.listenChoose, itemCount);
    for (const item of listenItems) {
        exercises.push(generateListenChoose(lessonId, item, allPool, exIndex++));
    }

    // --- Phase 5: Production MCQ (en → vi) ---
    const productionItems = pickItemsLeastSeen(wordItems, profile.mcqToVi, itemCount);
    for (const item of productionItems) {
        exercises.push(generateMCQ(lessonId, item, allPool, 'to_vi', exIndex++));
    }

    // --- Phase 6: Listen & Type (words, non-templated) ---
    const listenTypeItems = pickItemsLeastSeen(nonTemplatedWords, profile.listenType, itemCount);
    for (const item of listenTypeItems) {
        exercises.push(generateListenType(lessonId, item, exIndex++));
    }

    // --- Phase 7: Translation Word Bank (sentences, non-templated) ---
    const wordBankSentences = pickItemsLeastSeen(nonTemplatedSentences, profile.wordBank, itemCount);
    for (const item of wordBankSentences) {
        const ex = generateTranslationWordBank(lessonId, item, allPool, exIndex);
        if (ex) { exercises.push(ex); exIndex++; }
    }

    // --- Phase 8: Reorder Words (sentences only) ---
    const reorderSentences = pickItemsLeastSeen(sentenceItems, profile.reorder, itemCount);
    for (const item of reorderSentences) {
        const ex = generateReorder(lessonId, item, exIndex);
        if (ex) { exercises.push(ex); exIndex++; }
    }

    // --- Phase 9: Fill in the Blank (sentences + words in context) ---
    const sentenceFillCount = Math.min(Math.ceil(profile.fillBlank / 2), sentenceItems.length);
    const fillSentences = pickItemsLeastSeen(sentenceItems, sentenceFillCount, itemCount);
    for (const item of fillSentences) {
        const ex = generateFillBlank(lessonId, item, allPool, exIndex);
        if (ex) { exercises.push(ex); exIndex++; }
    }
    // Fill remaining slots with word-in-context fill blanks
    const remainingFill = profile.fillBlank - fillSentences.length;
    if (remainingFill > 0) {
        const fillWords = pickItemsLeastSeen(wordItems, remainingFill, itemCount);
        for (const item of fillWords) {
            const ex = generateWordInContextFillBlank(lessonId, item, items, allPool, exIndex);
            if (ex) { exercises.push(ex); exIndex++; }
        }
    }

    // --- Phase 10: Speak Sentence (sentences, non-templated) ---
    if (profile.speak > 0) {
        const speakItems = pickItemsLeastSeen(nonTemplatedSentences, profile.speak, itemCount);
        for (const item of speakItems) {
            exercises.push(generateSpeakSentence(lessonId, item, exIndex++));
        }
    }

    // Interleave exercise types for variety (match_pairs stay first, soft difficulty curve)
    return interleaveExercises(exercises);
}
