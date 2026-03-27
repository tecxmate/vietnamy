/**
 * checkAnswer — Consolidated answer-checking logic for all exercise types.
 *
 * Supports both grammar field names (sentence_vi, answer_vi) and
 * lesson field names (source_text_vi, choices_en) via fallback.
 *
 * @param {string} exerciseType
 * @param {*} userAnswer — string for most types, or Set size for match_pairs
 * @param {object} prompt — the exercise prompt object
 * @returns {{ correct: boolean, fuzzy?: boolean, correctAnswer?: string }}
 */
export const checkAnswer = (exerciseType, userAnswer, prompt) => {
    switch (exerciseType) {
        case 'mcq_translate_to_vi': {
            const answer = prompt.answer_vi;
            return { correct: userAnswer === answer, correctAnswer: answer };
        }

        case 'mcq_translate_to_en': {
            const answer = prompt.answer_en;
            return { correct: userAnswer === answer, correctAnswer: answer };
        }

        case 'listen_choose': {
            // Grammar uses answer_en; lesson uses answer_vi — try both
            const answer = prompt.answer_en ?? prompt.answer_vi;
            return { correct: userAnswer === answer, correctAnswer: answer };
        }

        case 'fill_blank': {
            const answer = prompt.answer_vi;
            const accepted = prompt.accepted_answers_vi || [answer];
            const correct = accepted.some(
                a => a.toLowerCase() === (userAnswer || '').toLowerCase()
            );
            return { correct, correctAnswer: answer };
        }

        case 'reorder_words': {
            const answer = prompt.answer_vi ?? prompt.answer_tokens?.join(' ');
            const userStr = (userAnswer || '').trim();
            const ansStr = (answer || '').trim();
            // Accept with or without trailing punctuation
            const correct =
                userStr === ansStr ||
                userStr.replace(/\s*[.!?]+$/g, '') === ansStr.replace(/\s*[.!?]+$/g, '');
            return { correct, correctAnswer: answer };
        }

        case 'match_pairs': {
            // userAnswer is the count of matched pairs; prompt.pairs is the full set
            const pairs = prompt.pairs || [];
            const correct =
                typeof userAnswer === 'number'
                    ? userAnswer === pairs.length
                    : false;
            return { correct };
        }

        default: {
            // Unknown type — pass-through (assume correct if there's any answer)
            return { correct: userAnswer !== null && userAnswer !== '' };
        }
    }
};
