import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { X, Heart, Trophy, Volume2, ChevronRight } from 'lucide-react';
import { getNodeById, getExercisesForUnit, getExercisesForNode, getNextNode, getNodeRoute } from '../lib/db';
import { useProgress } from '../context/ProgressContext';
import { useUser } from '../context/UserContext';
import speak, { scheduleSpeak, clearSpeakQueue } from '../utils/speak';
import { loadSettings } from '../lib/settings';
import { checkVietnameseInput } from '../utils/fuzzyVietnamese';
import { playSuccess, playError } from '../utils/sound';
import SoundButton from '../components/SoundButton';
import { buildFillBlankSentence, getFillBlankCorrectSentence, FeedbackBanner, ProgressBar } from '../components/Exercise';
import { DEFAULT_LEARNER_MODE, getProgressMode } from '../data/learnerModes';
import { useT } from '../lib/i18n';
import '../components/LessonGame.css';

const UNIT_QUIZ_SIZE = 20;
const MODULE_QUIZ_SIZE = 6;
const PASS_THRESHOLD = 0.8; // 80% required to pass

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const UnitTest = () => {
    const { nodeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const t = useT();
    const progressCtx = useProgress();
    const { userProfile } = useUser();
    const currentMode = userProfile?.learnerMode || DEFAULT_LEARNER_MODE;
    const progressMode = getProgressMode(currentMode);

    const [exercises, setExercises] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const testMode = loadSettings().testMode === true;
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);
    const [unitTitle, setUnitTitle] = useState('');

    // Hearts disabled (was from DongContext, now simplified)
    const hearts = Infinity;

    // Reorder state
    const [orderedTokens, setOrderedTokens] = useState([]);
    const [availableTokens, setAvailableTokens] = useState([]);

    // Match pairs state
    const [matchPairs, setMatchPairs] = useState([]);
    const [shuffledLeft, setShuffledLeft] = useState([]);
    const [shuffledRight, setShuffledRight] = useState([]);
    const [matchSelectedLeft, setMatchSelectedLeft] = useState(null);
    const [matchSelectedRight, setMatchSelectedRight] = useState(null);
    const [matchedSet, setMatchedSet] = useState(new Set());
    const [matchFlashWrong, setMatchFlashWrong] = useState(false);

    // New exercise type state
    const [typedAnswer, setTypedAnswer] = useState('');
    const [imageError, setImageError] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [speechResult, setSpeechResult] = useState('');
    const [speechSupported, setSpeechSupported] = useState(true);
    const recognitionRef = useRef(null);
    const [fuzzyHint, setFuzzyHint] = useState(null);

    const rewardGivenRef = useRef(false);

    const [isModuleTest, setIsModuleTest] = useState(false);
    const [nextNodeRoute, setNextNodeRoute] = useState(null);
    const [nextNodeLabel, setNextNodeLabel] = useState('');

    const stopTestAudio = React.useCallback(() => {
        clearSpeakQueue({ stopCurrent: true });
    }, []);

    useEffect(() => {
        stopTestAudio();
        // Reset all state on every navigation (including retry)
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setIsChecking(false);
        setIsCorrect(null);
        setIsFinished(false);
        setScore(0);
        setTypedAnswer('');
        setFuzzyHint(null);
        setSpeechResult('');
        setIsRecording(false);
        setImageError(false);
        rewardGivenRef.current = false;

        const node = getNodeById(nodeId);
        if (!node) { navigate('/', { state: { tab: 'study' } }); return; }

        setUnitTitle(node.label || 'Unit Test');
        const moduleScoped = node.test_scope === 'module';
        setIsModuleTest(moduleScoped);

        const allExercises = moduleScoped
            ? getExercisesForNode(nodeId)
            : getExercisesForUnit(node.unit_id);
        const quizSize = moduleScoped ? MODULE_QUIZ_SIZE : UNIT_QUIZ_SIZE;
        const picked = shuffle(allExercises).slice(0, quizSize);
        setExercises(picked);

        const next = getNextNode(nodeId);
        if (next) {
            setNextNodeRoute(getNodeRoute(next));
            setNextNodeLabel(next.label || 'Next');
        }
        return stopTestAudio;
    }, [nodeId, location.key, stopTestAudio]);

    const passed = exercises.length > 0 && (score / exercises.length) >= PASS_THRESHOLD;

    useEffect(() => {
        if (isFinished && !rewardGivenRef.current && passed) {
            rewardGivenRef.current = true;
            progressCtx.completeNode(nodeId, { immediate: true, isTest: true, mode: progressMode });
        }
    }, [isFinished, passed]);

    const currentEx = exercises[currentIndex];
    const progress = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0;

    useEffect(() => {
        stopTestAudio();
        setSelectedAnswer(null);
        setIsChecking(false);
        setIsCorrect(null);
        setTypedAnswer('');
        setFuzzyHint(null);
        setSpeechResult('');
        setIsRecording(false);
        setImageError(false);
        if (currentEx && ['reorder_words', 'translation_word_bank'].includes(currentEx.exercise_type)) {
            setAvailableTokens([...currentEx.prompt.tokens].sort(() => Math.random() - 0.5));
            setOrderedTokens([]);
        }
        // Auto-play audio for exercises that present Vietnamese text
        if (currentEx) {
            const { exercise_type: et, prompt: p } = currentEx;
            if (et === 'listen_type' || et === 'listen_choose') {
                if (p.audio_text) scheduleSpeak(p.audio_text, 300);
            } else if (et === 'mcq_translate_to_en') {
                if (p.source_text_vi) scheduleSpeak(p.source_text_vi, 300);
            }
        }
        if (currentEx && currentEx.exercise_type === 'match_pairs') {
            const pairs = currentEx.prompt.pairs || [];
            setMatchPairs(pairs);
            setShuffledLeft([...pairs].sort(() => Math.random() - 0.5));
            setShuffledRight([...pairs].sort(() => Math.random() - 0.5));
            setMatchSelectedLeft(null);
            setMatchSelectedRight(null);
            setMatchedSet(new Set());
            setMatchFlashWrong(false);
        }
    }, [currentIndex, currentEx, stopTestAudio]);

    // Match pairs tap handler
    const handleMatchTap = (side, index) => {
        if (isChecking) return;
        const pair = side === 'left' ? shuffledLeft[index] : shuffledRight[index];
        const pairKey = `${pair.vi_text}::${pair.en_text}`;
        if (matchedSet.has(pairKey)) return;

        if (side === 'left') {
            setMatchSelectedLeft(index);
            if (matchSelectedRight !== null) {
                const leftPair = shuffledLeft[index];
                const rightPair = shuffledRight[matchSelectedRight];
                if (leftPair.vi_text === rightPair.vi_text && leftPair.en_text === rightPair.en_text) {
                    playSuccess();
                    const newMatched = new Set(matchedSet);
                    newMatched.add(pairKey);
                    setMatchedSet(newMatched);
                    setMatchSelectedLeft(null);
                    setMatchSelectedRight(null);
                    if (newMatched.size === matchPairs.length) {
                        setTimeout(() => { setIsCorrect(true); setIsChecking(true); setScore(s => s + 1); }, 400);
                    }
                } else {
                    playError();
                    setMatchFlashWrong(true);
                    setTimeout(() => { setMatchFlashWrong(false); setMatchSelectedLeft(null); setMatchSelectedRight(null); }, 500);
                }
            }
        } else {
            setMatchSelectedRight(index);
            if (matchSelectedLeft !== null) {
                const leftPair = shuffledLeft[matchSelectedLeft];
                const rightPair = shuffledRight[index];
                const rightKey = `${rightPair.vi_text}::${rightPair.en_text}`;
                if (leftPair.vi_text === rightPair.vi_text && leftPair.en_text === rightPair.en_text) {
                    playSuccess();
                    const newMatched = new Set(matchedSet);
                    newMatched.add(rightKey);
                    setMatchedSet(newMatched);
                    setMatchSelectedLeft(null);
                    setMatchSelectedRight(null);
                    if (newMatched.size === matchPairs.length) {
                        setTimeout(() => { setIsCorrect(true); setIsChecking(true); setScore(s => s + 1); }, 400);
                    }
                } else {
                    playError();
                    setMatchFlashWrong(true);
                    setTimeout(() => { setMatchFlashWrong(false); setMatchSelectedLeft(null); setMatchSelectedRight(null); }, 500);
                }
            }
        }
    };

    const handleCheck = () => {
        if (!currentEx) return;
        let correct = false;

        if (currentEx.exercise_type === 'mcq_translate_to_vi') correct = selectedAnswer === currentEx.prompt.answer_vi;
        else if (currentEx.exercise_type === 'mcq_translate_to_en') correct = selectedAnswer === currentEx.prompt.answer_en;
        else if (currentEx.exercise_type === 'listen_choose') correct = selectedAnswer === currentEx.prompt.answer_vi;
        else if (currentEx.exercise_type === 'picture_choice') correct = selectedAnswer === currentEx.prompt.answer_vi;
        else if (currentEx.exercise_type === 'reorder_words' || currentEx.exercise_type === 'translation_word_bank') {
            const userStr = orderedTokens.join(' ');
            const ansStr = currentEx.prompt.answer_tokens.join(' ');
            correct = userStr === ansStr || userStr.replace(/\s*[.!?]+$/g, '') === ansStr.replace(/\s*[.!?]+$/g, '');
        }
        else if (currentEx.exercise_type === 'fill_blank') correct = selectedAnswer === currentEx.prompt.answer_vi;
        else if (currentEx.exercise_type === 'match_pairs') correct = matchedSet.size === matchPairs.length;
        else if (currentEx.exercise_type === 'listen_type') {
            const result = checkVietnameseInput(typedAnswer, currentEx.prompt.answer_vi, currentEx.prompt.answer_vi_no_diacritics);
            correct = result.fuzzy;
            if (correct && !result.exact) setFuzzyHint(currentEx.prompt.answer_vi);
        } else if (currentEx.exercise_type === 'speak_sentence') {
            const result = checkVietnameseInput(speechResult || typedAnswer, currentEx.prompt.answer_vi, currentEx.prompt.answer_vi_no_diacritics);
            correct = result.fuzzy;
            if (correct && !result.exact) setFuzzyHint(currentEx.prompt.answer_vi);
        }
        else correct = true;

        setIsCorrect(correct);
        setIsChecking(true);
        if (correct) {
            playSuccess();
            const completedSentence = getCompletedSentenceAudio(currentEx);
            if (completedSentence) scheduleSpeak(completedSentence, 300);
            setScore(s => s + 1);
        }
        else { playError(); if (!testMode) progressCtx.loseHeart(); }
    };

    const handleNext = () => {
        if (hearts === 0) { navigate('/', { state: { tab: 'study' } }); return; }
        if (currentIndex < exercises.length - 1) setCurrentIndex(i => i + 1);
        else {
            stopTestAudio();
            setIsFinished(true);
        }
    };

    const handleSkip = () => {
        if (!testMode) return;
        setScore(s => s + 1);
        if (currentIndex < exercises.length - 1) setCurrentIndex(i => i + 1);
        else {
            stopTestAudio();
            setIsFinished(true);
        }
    };

    const canCheck = () => {
        if (!currentEx) return false;
        if (currentEx.exercise_type === 'match_pairs') return false;
        if (['reorder_words', 'translation_word_bank'].includes(currentEx.exercise_type)) return orderedTokens.length > 0;
        if (currentEx.exercise_type === 'listen_type') return typedAnswer.trim().length > 0;
        if (currentEx.exercise_type === 'speak_sentence') return (speechResult || typedAnswer).trim().length > 0;
        return selectedAnswer !== null && selectedAnswer !== '';
    };

    const handleWordBankClick = (word) => { if (!isChecking) setOrderedTokens([...orderedTokens, word]); };
    const handleRemoveOrderedWord = (index) => { if (!isChecking) { const t = [...orderedTokens]; t.splice(index, 1); setOrderedTokens(t); } };

    const handlePlayAudio = (text) => { if (text) speak(text); };

    const getCompletedSentenceAudio = (exercise) => {
        if (!exercise || !['reorder_words', 'translation_word_bank'].includes(exercise.exercise_type)) return '';
        return exercise.prompt?.answer_vi || exercise.prompt?.answer_tokens?.join(' ') || '';
    };

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Enter') return;
            if (isFinished) return;
            if (isChecking) handleNext();
            else if (canCheck()) handleCheck();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (exercises.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', padding: 24 }}>
                <h2>Loading test...</h2>
            </div>
        );
    }

    if (isFinished) {
        const pct = exercises.length > 0 ? Math.round((score / exercises.length) * 100) : 0;
        const thresholdPct = Math.round(PASS_THRESHOLD * 100);

        return (
            <div className="lesson-game">
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 20 }}>
                    <div style={{
                        width: 80, height: 80,
                        backgroundColor: passed ? '#F9731615' : 'var(--danger-color)15',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {passed
                            ? <Trophy size={40} color="#F97316" fill="#F97316" />
                            : <X size={40} color="var(--danger-color)" strokeWidth={2.5} />
                        }
                    </div>
                    <h1 style={{ color: passed ? '#F97316' : 'var(--danger-color)', fontSize: 24, margin: 0, fontWeight: 800 }}>
                        {passed
                            ? (isModuleTest ? t('test_quiz_complete') : t('test_passed'))
                            : t('test_not_quite')}
                    </h1>
                    <div style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        <strong style={{ color: passed ? '#F97316' : 'var(--danger-color)' }}>{score}/{exercises.length}</strong> {t('test_correct')} ({pct}%)
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                        {passed
                            ? (isModuleTest ? t('test_next_module_unlocked') : t('test_next_unit_unlocked'))
                            : t('test_need_to_pass').replace('{percent}', thresholdPct)}
                    </p>
                </div>
                <div className="lesson-game__actionbar" style={{ '--lesson-action-bar-bg': 'var(--surface-color)' }}>
                    <div className="lesson-game__actionbar-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {passed ? (
                        <>
                            {nextNodeRoute && (
                                <button className="ghost" onClick={() => navigate('/', { state: { tab: 'study' } })} style={{ width: '100%', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    {t('test_back_to_roadmap')}
                                </button>
                            )}
                            <SoundButton className="primary w-full shadow-lg" onClick={() => navigate(nextNodeRoute || '/')} style={{ fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {t('continue_upper')} {nextNodeRoute && <ChevronRight size={20} />}
                            </SoundButton>
                        </>
                    ) : (
                        <>
                            <button className="ghost" onClick={() => navigate('/', { state: { tab: 'study' } })} style={{ width: '100%', color: 'var(--text-muted)', fontWeight: 600 }}>
                                {t('test_back_to_roadmap')}
                            </button>
                            <SoundButton
                                className="primary w-full shadow-lg"
                                style={{ fontSize: 18, backgroundColor: 'var(--danger-color)', boxShadow: '0 4px 0 #B52F4E' }}
                                onClick={() => navigate(`/test/${nodeId}`, { replace: true })}
                            >
                                {t('test_try_again')}
                            </SoundButton>
                        </>
                    )}
                    </div>
                </div>
            </div>
        );
    }

    const getAudioText = () => {
        if (!currentEx) return '';
        const p = currentEx.prompt;
        if (p.target_vi) return p.target_vi;
        if (p.audio_text) return p.audio_text;
        if (p.answer_vi) return p.answer_vi;
        return '';
    };

    const renderExercise = () => {
        if (!currentEx) return null;
        const { exercise_type, prompt } = currentEx;
        const audioText = getAudioText();

        return (
            <div className="lesson-game__exercise" data-exercise-type={exercise_type}>
                <h2 className="lesson-game__instruction">{prompt.instruction}</h2>

                {exercise_type !== 'picture_choice' && exercise_type !== 'speak_sentence' && (
                    <div className="lesson-game__prompt-area">
                        {['listen_choose', 'listen_type'].includes(exercise_type) ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'center' }}>
                                <button
                                    className="secondary"
                                    style={{ width: 100, height: 100, borderRadius: 20, color: '#F97316', borderColor: '#F97316', boxShadow: '0 5px 0 #C2410C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => handlePlayAudio(audioText)}
                                >
                                    <Volume2 size={48} />
                                </button>
                                {exercise_type === 'listen_type' && (
                                    <button
                                        className="secondary"
                                        style={{ width: 56, height: 56, borderRadius: 14, color: 'var(--text-muted)', borderColor: 'var(--border-color)', boxShadow: '0 3px 0 var(--border-color)', fontSize: 24 }}
                                        onClick={() => speak(audioText, 0.7)}
                                    >
                                        🐢
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{ flex: 1, padding: 18, backgroundColor: 'var(--surface-color)', borderRadius: 16, border: '2px solid var(--border-color)' }}>
                                <span style={{ fontSize: 20, fontWeight: 500 }}>{prompt.source_text_en || prompt.source_text_vi || prompt.template_vi || "Translate this"}</span>
                            </div>
                        )}
                    </div>
                )}

                <div
                    className="lesson-game__response-area"
                    data-compact={exercise_type === 'picture_choice' || exercise_type === 'speak_sentence'}
                >
                    {/* Multiple Choice */}
                    {['mcq_translate_to_vi', 'mcq_translate_to_en', 'listen_choose'].includes(exercise_type) &&
                        (prompt.choices_vi || prompt.choices_en).map((choice, idx) => (
                            <button
                                key={idx}
                                className={selectedAnswer === choice ? 'primary' : 'secondary'}
                                style={{
                                    width: '100%', justifyContent: 'flex-start', padding: 20, fontSize: 18,
                                    borderColor: selectedAnswer === choice ? '#F97316' : 'var(--border-color)',
                                    backgroundColor: selectedAnswer === choice ? 'rgba(249,115,22,0.1)' : 'transparent',
                                    color: selectedAnswer === choice ? '#F97316' : 'var(--text-main)'
                                }}
                                onClick={() => { if (!isChecking) { setSelectedAnswer(choice); if (prompt.choices_vi) speak(choice); } }}
                                disabled={isChecking}
                            >
                                {choice}
                            </button>
                        ))}

                    {/* Picture Choice */}
                    {exercise_type === 'picture_choice' && (
                        <>
                            <div style={{ width: '100%', maxWidth: 300, margin: '0 auto 16px', borderRadius: 16, overflow: 'hidden', border: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
                                {prompt.image_url && !imageError ? (
                                    <img src={prompt.image_url} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} onError={() => setImageError(true)} />
                                ) : (
                                    <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>{prompt.emoji_fallback || '?'}</div>
                                )}
                            </div>
                            {(prompt.choices_vi || []).map((choice, idx) => (
                                <button key={idx} className={selectedAnswer === choice ? 'primary' : 'secondary'}
                                    style={{ width: '100%', justifyContent: 'flex-start', padding: 20, fontSize: 18, borderColor: selectedAnswer === choice ? '#F97316' : 'var(--border-color)', backgroundColor: selectedAnswer === choice ? 'rgba(249,115,22,0.1)' : 'transparent', color: selectedAnswer === choice ? '#F97316' : 'var(--text-main)' }}
                                    onClick={() => { if (!isChecking) { setSelectedAnswer(choice); speak(choice); } }} disabled={isChecking}
                                >{choice}</button>
                            ))}
                        </>
                    )}

                    {/* Listen & Type */}
                    {exercise_type === 'listen_type' && (
                        <input type="text" value={typedAnswer} onChange={(e) => setTypedAnswer(e.target.value)} placeholder="Type what you hear..." disabled={isChecking} autoFocus
                            style={{ width: '100%', padding: 16, fontSize: 18, borderRadius: 12, border: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }}
                            onFocus={(e) => { e.target.style.borderColor = '#F97316'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                        />
                    )}

                    {/* Speak Sentence */}
                    {exercise_type === 'speak_sentence' && (
                        <>
                            <div style={{ textAlign: 'center', padding: 24, backgroundColor: 'var(--surface-color)', borderRadius: 16, border: '2px solid var(--border-color)', marginBottom: 16 }}>
                                <p style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>{prompt.target_vi}</p>
                                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{prompt.target_en}</p>
                                <button className="secondary" style={{ marginTop: 12, color: '#F97316', borderColor: '#F97316' }} onClick={() => handlePlayAudio(prompt.target_vi)}>
                                    <Volume2 size={20} /> Listen
                                </button>
                            </div>
                            <input type="text" value={speechResult || typedAnswer} onChange={(e) => { setSpeechResult(''); setTypedAnswer(e.target.value); }} placeholder="Type the sentence..." disabled={isChecking}
                                style={{ width: '100%', padding: 16, fontSize: 18, borderRadius: 12, border: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </>
                    )}

                    {/* Word Reordering / Translation Word Bank */}
                    {['reorder_words', 'translation_word_bank'].includes(exercise_type) && (
                        <>
                            <div className="lesson-game__word-answer-line">
                                {orderedTokens.length === 0 && <span style={{ color: 'var(--text-muted)', padding: '10px 0', width: '100%' }}>{t('test_tap_words')}</span>}
                                {orderedTokens.map((token, idx) => (
                                    <button key={idx} style={{ padding: '10px 16px', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', borderRadius: 12, cursor: isChecking ? 'default' : 'pointer', boxShadow: '0 2px 0 var(--border-color)', fontSize: 17, fontWeight: 500, color: 'var(--text-main)' }} onClick={() => { handleRemoveOrderedWord(idx); speak(token); }}>
                                        {token}
                                    </button>
                                ))}
                            </div>
                            <div className="lesson-game__word-bank">
                                {availableTokens.map((word, idx) => {
                                    const usedCount = orderedTokens.filter(w => w === word).length;
                                    const bankBefore = availableTokens.slice(0, idx).filter(w => w === word).length;
                                    const isUsed = bankBefore < usedCount;
                                    return (
                                        <button key={`bank-${idx}`} style={{
                                            padding: '10px 16px', borderRadius: 12, fontSize: 17, fontWeight: 500,
                                            boxShadow: isUsed ? 'none' : '0 2px 0 var(--border-color)',
                                            backgroundColor: isUsed ? 'var(--bg-color)' : 'var(--surface-color)',
                                            border: isUsed ? '2px solid transparent' : '2px solid var(--border-color)',
                                            color: isUsed ? 'transparent' : 'var(--text-main)',
                                            cursor: isUsed || isChecking ? 'default' : 'pointer',
                                            pointerEvents: isUsed ? 'none' : 'auto',
                                        }} onClick={() => { if (!isUsed) { handleWordBankClick(word); speak(word); } }} disabled={isUsed || isChecking}>
                                            {word}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Fill in the Blank — MCQ choices */}
                    {exercise_type === 'fill_blank' && (
                        <>
                            <div style={{ padding: 16, backgroundColor: 'var(--surface-color)', borderRadius: 16, border: '2px solid var(--border-color)', fontSize: 20, lineHeight: 1.6, marginBottom: 12 }}>
                                {(prompt.template_vi || '').split('____').map((part, i, arr) => (
                                    <React.Fragment key={i}>
                                        <span>{part}</span>
                                        {i < arr.length - 1 && (
                                            <span
                                                style={{
                                                    display: 'inline-block', minWidth: 80, borderBottom: '3px solid #F97316',
                                                    textAlign: 'center', fontWeight: 700, color: '#F97316', padding: '2px 8px',
                                                    cursor: selectedAnswer && !isChecking ? 'pointer' : 'default',
                                                    backgroundColor: selectedAnswer ? 'rgba(249,115,22,0.15)' : 'transparent',
                                                    borderRadius: selectedAnswer ? 8 : 0,
                                                }}
                                                onClick={() => selectedAnswer && !isChecking && setSelectedAnswer(null)}
                                            >
                                                {selectedAnswer || '\u00A0\u00A0\u00A0\u00A0'}
                                            </span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                                {(prompt.choices_vi || []).map((choice, idx) => {
                                    const isUsed = selectedAnswer === choice;
                                    return (
                                        <button
                                            key={idx}
                                            style={{
                                                padding: '12px 20px', borderRadius: 12, fontSize: 17, fontWeight: 500,
                                                backgroundColor: isUsed ? 'var(--bg-color)' : 'var(--surface-color)',
                                                border: isUsed ? '2px solid transparent' : '2px solid var(--border-color)',
                                                color: isUsed ? 'transparent' : 'var(--text-main)',
                                                boxShadow: isUsed ? 'none' : '0 2px 0 var(--border-color)',
                                                cursor: isUsed || isChecking ? 'default' : 'pointer',
                                                pointerEvents: isUsed ? 'none' : 'auto',
                                            }}
                                            onClick={() => {
                                                if (!isChecking) {
                                                    setSelectedAnswer(choice);
                                                    speak(buildFillBlankSentence(prompt, choice));
                                                }
                                            }}
                                            disabled={isUsed || isChecking}
                                        >
                                            {choice}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Match Pairs */}
                    {exercise_type === 'match_pairs' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {shuffledLeft.map((pair, idx) => {
                                    const pairKey = `${pair.vi_text}::${pair.en_text}`;
                                    const isMatched = matchedSet.has(pairKey);
                                    const isSelected = matchSelectedLeft === idx;
                                    const isWrong = matchFlashWrong && isSelected;
                                    return (
                                        <button key={`l-${idx}`} onClick={() => { handleMatchTap('left', idx); if (!isMatched) speak(pair.vi_text); }} disabled={isMatched || isChecking}
                                            style={{
                                                padding: '14px 12px', borderRadius: 12, fontSize: 17, fontWeight: 600, textAlign: 'center', transition: 'all 0.2s',
                                                cursor: isMatched ? 'default' : 'pointer',
                                                backgroundColor: isMatched ? 'rgba(6,214,160,0.15)' : isWrong ? 'rgba(239,71,111,0.15)' : isSelected ? 'rgba(249,115,22,0.15)' : 'var(--surface-color)',
                                                border: isMatched ? '2px solid var(--success-color)' : isWrong ? '2px solid var(--danger-color)' : isSelected ? '2px solid #F97316' : '2px solid var(--border-color)',
                                                color: isMatched ? 'var(--success-color)' : isWrong ? 'var(--danger-color)' : isSelected ? '#F97316' : 'var(--text-main)',
                                                opacity: isMatched ? 0.6 : 1, boxShadow: isMatched ? 'none' : '0 2px 0 var(--border-color)'
                                            }}
                                        >{pair.vi_text}</button>
                                    );
                                })}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {shuffledRight.map((pair, idx) => {
                                    const pairKey = `${pair.vi_text}::${pair.en_text}`;
                                    const isMatched = matchedSet.has(pairKey);
                                    const isSelected = matchSelectedRight === idx;
                                    const isWrong = matchFlashWrong && isSelected;
                                    return (
                                        <button key={`r-${idx}`} onClick={() => handleMatchTap('right', idx)} disabled={isMatched || isChecking}
                                            style={{
                                                padding: '14px 12px', borderRadius: 12, fontSize: 17, fontWeight: 600, textAlign: 'center', transition: 'all 0.2s',
                                                cursor: isMatched ? 'default' : 'pointer',
                                                backgroundColor: isMatched ? 'rgba(6,214,160,0.15)' : isWrong ? 'rgba(239,71,111,0.15)' : isSelected ? 'rgba(249,115,22,0.15)' : 'var(--surface-color)',
                                                border: isMatched ? '2px solid var(--success-color)' : isWrong ? '2px solid var(--danger-color)' : isSelected ? '2px solid #F97316' : '2px solid var(--border-color)',
                                                color: isMatched ? 'var(--success-color)' : isWrong ? 'var(--danger-color)' : isSelected ? '#F97316' : 'var(--text-main)',
                                                opacity: isMatched ? 0.6 : 1, boxShadow: isMatched ? 'none' : '0 2px 0 var(--border-color)'
                                            }}
                                        >{pair.en_text}</button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="lesson-game">
            {/* Top bar */}
            <div className="lesson-game__topbar">
                <button className="ghost" onClick={() => navigate('/', { state: { tab: 'study' } })} style={{ padding: 8 }}>
                    <X size={24} color="var(--text-muted)" />
                </button>
                <div style={{ flex: 1 }}>
                    <ProgressBar progress={progress / 100} height={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--lesson-hearts)', fontWeight: 700 }}>
                    <Heart size={24} fill="var(--lesson-hearts)" /> {testMode ? '∞' : hearts}
                </div>
            </div>

            {/* Main content */}
            <div className="lesson-game__scroll">
                <div className="lesson-game__stage">
                    {hearts === 0 ? (
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: 32, color: 'var(--danger-color)' }}>Out of Hearts!</h2>
                            <p style={{ color: 'var(--text-muted)' }}>{t('test_keep_practicing')}</p>
                        </div>
                    ) : renderExercise()}
                </div>
            </div>

            {/* Bottom check bar */}
            <div
                className="lesson-game__actionbar"
                style={{
                    '--lesson-action-bar-bg': isChecking
                        ? (isCorrect ? 'var(--lesson-correct-fill)' : 'var(--lesson-error-fill)')
                        : 'var(--surface-color)',
                }}
            >
                <div className="lesson-game__actionbar-content">
                {isChecking ? (
                    <FeedbackBanner
                        isCorrect={isCorrect}
                        correctAnswer={
                            !isCorrect
                                ? (currentEx?.exercise_type === 'fill_blank'
                                    ? getFillBlankCorrectSentence(currentEx.prompt)
                                    : (currentEx?.prompt?.answer_vi || currentEx?.prompt?.answer_en || (currentEx?.prompt?.answer_tokens && currentEx.prompt.answer_tokens.join(' '))))
                                : ''
                        }
                        fuzzyHint={fuzzyHint}
                        alternatives={currentEx?.prompt?.accepted_en}
                        onContinue={handleNext}
                    />
                ) : (
                    <div className="lesson-game__button-row">
                        <SoundButton
                            className={`${canCheck() ? '' : 'disabled'} shadow-lg`}
                            style={{
                                flex: 1, fontSize: 18, fontWeight: 800, borderRadius: 25, border: 'none',
                                textTransform: 'uppercase', letterSpacing: 1,
                                backgroundColor: canCheck() ? 'var(--primary-color)' : 'var(--lesson-check-disabled-bg)',
                                color: canCheck() ? '#1A1A1A' : 'var(--lesson-check-disabled-text)',
                                boxShadow: canCheck() ? '0 4px 0 var(--primary-color-hover)' : 'none',
                                opacity: 1,
                            }}
                            onClick={handleCheck}
                        >
                            {t('test_check')}
                        </SoundButton>
                        {testMode && (
                            <button
                                className="shadow-lg"
                                style={{ padding: '0 20px', fontSize: 14, fontWeight: 700, backgroundColor: 'var(--warning-color)', color: '#1A1A1A', borderRadius: 12, border: 'none', boxShadow: '0 4px 0 #c77b00' }}
                                onClick={handleSkip}
                            >
                                {t('test_skip')}
                            </button>
                        )}
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default UnitTest;
