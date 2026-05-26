import { useCallback, useEffect, useRef, useState } from 'react';
import { checkVietnameseInput } from '../utils/fuzzyVietnamese';

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function getCompletedSentenceAudio(exercise) {
    if (!exercise || !['reorder_words', 'translation_word_bank'].includes(exercise.exercise_type)) return '';
    return exercise.prompt?.answer_vi || exercise.prompt?.answer_tokens?.join(' ') || '';
}

function normalizeTrailingPunctuation(value = '') {
    return value.replace(/\s*[.!?]+$/g, '');
}

function evaluateExerciseAnswer(exercise, state, options = {}) {
    if (!exercise) return { handled: false, correct: false, fuzzyHint: null };

    const { exercise_type: type, prompt = {} } = exercise;
    const { selectedAnswer, orderedTokens, typedAnswer, speechResult } = state;

    if (type === 'mcq_translate_to_vi') {
        return { handled: true, correct: selectedAnswer === prompt.answer_vi, fuzzyHint: null };
    }
    if (type === 'mcq_translate_to_en') {
        return { handled: true, correct: selectedAnswer === prompt.answer_en, fuzzyHint: null };
    }
    if (type === 'listen_choose' || type === 'picture_choice') {
        return { handled: true, correct: selectedAnswer === prompt.answer_vi, fuzzyHint: null };
    }
    if (type === 'reorder_words' || type === 'translation_word_bank') {
        const userStr = orderedTokens.join(' ');
        const ansStr = prompt.answer_tokens?.join(' ') || '';
        return {
            handled: true,
            correct: userStr === ansStr || normalizeTrailingPunctuation(userStr) === normalizeTrailingPunctuation(ansStr),
            fuzzyHint: null,
        };
    }
    if (type === 'fill_blank') {
        return { handled: true, correct: selectedAnswer === prompt.answer_vi, fuzzyHint: null };
    }
    if (type === 'match_pairs') {
        return { handled: false, correct: false, fuzzyHint: null };
    }
    if (type === 'listen_type') {
        const result = checkVietnameseInput(typedAnswer, prompt.answer_vi, prompt.answer_vi_no_diacritics);
        return {
            handled: true,
            correct: result.exact || result.fuzzy,
            fuzzyHint: result.fuzzy && !result.exact ? prompt.answer_vi : null,
        };
    }
    if (type === 'speak_sentence') {
        const pronunciationScore = options.pronunciationResult?.scores?.pronunciation;
        if (pronunciationScore != null) {
            return {
                handled: true,
                correct: pronunciationScore >= (options.pronunciationThreshold ?? 70),
                fuzzyHint: null,
            };
        }

        const result = checkVietnameseInput(
            speechResult || typedAnswer,
            prompt.answer_vi,
            prompt.answer_vi_no_diacritics
        );
        return {
            handled: true,
            correct: result.exact || result.fuzzy,
            fuzzyHint: result.fuzzy && !result.exact ? prompt.answer_vi : null,
        };
    }

    return { handled: true, correct: true, fuzzyHint: null };
}

export default function useQuizSession({ currentExercise, resetKey, onExerciseReset } = {}) {
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [orderedTokens, setOrderedTokens] = useState([]);
    const [availableTokens, setAvailableTokens] = useState([]);
    const [typedAnswer, setTypedAnswer] = useState('');
    const [speechResult, setSpeechResult] = useState('');
    const [fuzzyHint, setFuzzyHint] = useState(null);
    const [imageError, setImageError] = useState(false);

    const onExerciseResetRef = useRef(onExerciseReset);
    onExerciseResetRef.current = onExerciseReset;

    const resetExerciseState = useCallback((exercise = null) => {
        setSelectedAnswer(null);
        setIsChecking(false);
        setIsCorrect(null);
        setTypedAnswer('');
        setSpeechResult('');
        setFuzzyHint(null);
        setImageError(false);

        if (exercise && ['reorder_words', 'translation_word_bank'].includes(exercise.exercise_type)) {
            setAvailableTokens(shuffle(exercise.prompt?.tokens || []));
            setOrderedTokens([]);
        } else {
            setAvailableTokens([]);
            setOrderedTokens([]);
        }
    }, []);

    const resetSessionState = useCallback(() => {
        resetExerciseState(null);
    }, [resetExerciseState]);

    useEffect(() => {
        resetExerciseState(currentExercise);
        onExerciseResetRef.current?.(currentExercise);
    }, [currentExercise, resetKey, resetExerciseState]);

    const checkCurrentExercise = useCallback((options = {}) => {
        const result = evaluateExerciseAnswer(currentExercise, {
            selectedAnswer,
            orderedTokens,
            typedAnswer,
            speechResult,
        }, options);

        if (!result.handled) return result;

        setFuzzyHint(result.fuzzyHint);
        setIsCorrect(result.correct);
        setIsChecking(true);
        return result;
    }, [currentExercise, orderedTokens, selectedAnswer, speechResult, typedAnswer]);

    const canCheck = useCallback((options = {}) => {
        if (!currentExercise) return false;

        const type = currentExercise.exercise_type;
        if (type === 'match_pairs') return false;
        if (type === 'reorder_words' || type === 'translation_word_bank') return orderedTokens.length > 0;
        if (type === 'listen_type') return typedAnswer.trim().length > 0;
        if (type === 'speak_sentence') {
            if (options.speechBlocked) return false;
            return Boolean(options.pronunciationResult?.scores) || (speechResult || typedAnswer).trim().length > 0;
        }
        if (type === 'picture_choice') return selectedAnswer !== null;
        return selectedAnswer !== null && selectedAnswer !== '';
    }, [currentExercise, orderedTokens.length, selectedAnswer, speechResult, typedAnswer]);

    const completeMatch = useCallback(() => {
        setIsCorrect(true);
        setIsChecking(true);
        return { handled: true, correct: true, fuzzyHint: null };
    }, []);

    const handleReorderToggle = useCallback((word, index, source) => {
        if (isChecking) return;
        if (source === 'selected') {
            setOrderedTokens(prev => {
                const next = [...prev];
                next.splice(index, 1);
                return next;
            });
            return;
        }
        setOrderedTokens(prev => [...prev, word]);
    }, [isChecking]);

    return {
        selectedAnswer,
        setSelectedAnswer,
        isChecking,
        setIsChecking,
        isCorrect,
        setIsCorrect,
        orderedTokens,
        setOrderedTokens,
        availableTokens,
        setAvailableTokens,
        typedAnswer,
        setTypedAnswer,
        speechResult,
        setSpeechResult,
        fuzzyHint,
        setFuzzyHint,
        imageError,
        setImageError,
        resetExerciseState,
        resetSessionState,
        checkCurrentExercise,
        canCheck,
        completeMatch,
        handleReorderToggle,
    };
}
