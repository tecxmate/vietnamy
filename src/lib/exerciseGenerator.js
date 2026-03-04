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

function pickDistractors(item, pool, count, field = 'en_text') {
    const candidates = pool.filter(p => p.id !== item.id && p[field] !== item[field]);
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

// Common Vietnamese words used as fallback distractors for word bank
const FALLBACK_DISTRACTOR_TOKENS = ['là', 'có', 'được', 'rất', 'cho', 'từ', 'và', 'một', 'không', 'này'];

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
                answer_en: item.en_text
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
                answer_vi: item.vi_text
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

    // Fallback if insufficient distractors
    if (uniqueDistractors.length < 2) {
        const fallbacks = FALLBACK_DISTRACTOR_TOKENS.filter(w => !tokens.includes(w));
        uniqueDistractors = [...new Set([...uniqueDistractors, ...fallbacks])];
    }

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
            answer_vi: item.vi_text
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
            answer_tokens: tokens
        }
    };
}

// Fill in the blank — remove a word from a sentence, offer MCQ choices
function generateFillBlank(lessonId, sentenceItem, pool, exIndex) {
    const words = sentenceItem.vi_text.split(/\s+/).filter(t => t);
    if (words.length < 2) return null;

    const candidates = words
        .map((w, i) => ({ word: w, index: i }))
        .filter(({ word }) => word.length > 1 && !/^[.!?,]+$/.test(word));

    if (candidates.length === 0) return null;

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const blanked = words.map((w, i) => i === target.index ? '____' : w).join(' ');

    const otherWords = pool
        .filter(p => p.id !== sentenceItem.id)
        .flatMap(p => p.vi_text.split(/\s+/).filter(t => t.length > 1))
        .filter(w => w !== target.word);
    const uniqueDistractors = [...new Set(otherWords)];
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
            answer_vi: target.word
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
    // Session 0: Introduction — recognition heavy
    { match: true, picture: 3, mcqToEn: 4, listenChoose: 2, mcqToVi: 3, listenType: 1, wordBank: 1, reorder: 1, fillBlank: 1, speak: 0 },
    // Session 1: Reinforcement — balanced, shift toward production
    { match: true, picture: 2, mcqToEn: 2, listenChoose: 2, mcqToVi: 3, listenType: 2, wordBank: 1, reorder: 1, fillBlank: 1, speak: 1 },
    // Session 2: Production — less MCQ, more active exercises
    { match: false, picture: 1, mcqToEn: 2, listenChoose: 1, mcqToVi: 2, listenType: 2, wordBank: 2, reorder: 2, fillBlank: 2, speak: 1 },
    // Session 3: Mastery — hardest types, minimal hand-holding
    { match: false, picture: 0, mcqToEn: 1, listenChoose: 1, mcqToVi: 1, listenType: 2, wordBank: 2, reorder: 2, fillBlank: 2, speak: 2 },
];

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
    const recognitionItems = shuffleArray(wordItems).slice(0, Math.min(profile.mcqToEn, wordItems.length));
    for (const item of recognitionItems) {
        exercises.push(generateMCQ(lessonId, item, allPool, 'to_en', exIndex++));
    }

    // --- Phase 4: Listen & Choose ---
    const listenItems = shuffleArray(wordItems).slice(0, Math.min(profile.listenChoose, wordItems.length));
    for (const item of listenItems) {
        exercises.push(generateListenChoose(lessonId, item, allPool, exIndex++));
    }

    // --- Phase 5: Production MCQ (en → vi) ---
    const productionItems = shuffleArray(wordItems).slice(0, Math.min(profile.mcqToVi, wordItems.length));
    for (const item of productionItems) {
        exercises.push(generateMCQ(lessonId, item, allPool, 'to_vi', exIndex++));
    }

    // --- Phase 6: Listen & Type (words, non-templated) ---
    const listenTypeItems = shuffleArray(nonTemplatedWords).slice(0, Math.min(profile.listenType, nonTemplatedWords.length));
    for (const item of listenTypeItems) {
        exercises.push(generateListenType(lessonId, item, exIndex++));
    }

    // --- Phase 7: Translation Word Bank (sentences, non-templated) ---
    const wordBankSentences = shuffleArray(nonTemplatedSentences).slice(0, Math.min(profile.wordBank, nonTemplatedSentences.length));
    for (const item of wordBankSentences) {
        const ex = generateTranslationWordBank(lessonId, item, allPool, exIndex);
        if (ex) { exercises.push(ex); exIndex++; }
    }

    // --- Phase 8: Reorder Words (sentences only) ---
    const reorderSentences = shuffleArray(sentenceItems).slice(0, Math.min(profile.reorder, sentenceItems.length));
    for (const item of reorderSentences) {
        const ex = generateReorder(lessonId, item, exIndex);
        if (ex) { exercises.push(ex); exIndex++; }
    }

    // --- Phase 9: Fill in the Blank (sentences only) ---
    const fillSentences = shuffleArray(sentenceItems).slice(0, Math.min(profile.fillBlank, sentenceItems.length));
    for (const item of fillSentences) {
        const ex = generateFillBlank(lessonId, item, allPool, exIndex);
        if (ex) { exercises.push(ex); exIndex++; }
    }

    // --- Phase 10: Speak Sentence (sentences, non-templated) ---
    if (profile.speak > 0) {
        const speakItems = shuffleArray(nonTemplatedSentences).slice(0, Math.min(profile.speak, nonTemplatedSentences.length));
        for (const item of speakItems) {
            exercises.push(generateSpeakSentence(lessonId, item, exIndex++));
        }
    }

    return exercises;
}
