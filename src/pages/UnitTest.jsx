import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { X, Heart, Trophy, Volume2, ChevronRight } from 'lucide-react';
import { getNodeById, getExercisesForUnit, getExercisesForNode, getNextNode, getNodeRoute } from '../lib/db';
import { useProgress } from '../context/ProgressContext';
import { useUser } from '../context/UserContext';
import speak, { scheduleSpeak, clearSpeakQueue } from '../utils/speak';
import { loadSettings } from '../lib/settings';
import { playSuccess, playError, playCelebration, playNotification, playSelect, playTap } from '../utils/sound';
import SoundButton from '../components/SoundButton';
import BeKhe from '../components/BeKhe/BeKhe';
import { getLine } from '../lib/mascot';
import {
    buildFillBlankSentence,
    getFillBlankCorrectSentence,
    FeedbackBanner,
    FillBlankInput,
    MatchPairs,
    MCQOptions,
    ProgressBar,
    ReorderWords,
} from '../components/Exercise';
import useQuizSession, { getCompletedSentenceAudio } from '../hooks/useQuizSession';
import { DEFAULT_LEARNER_MODE, getProgressMode } from '../data/learnerModes';
import { useT } from '../lib/i18n';
import '../components/LessonGame.css';

const UNIT_QUIZ_SIZE = 20;
const MODULE_QUIZ_SIZE = 6;
const PASS_THRESHOLD = 0.8; // 80% required to pass

// Bé Khế sound dispatch — the mascot fx names map to the sound utils.
const SND = { playSuccess, playError, playCelebration, playNotification, playSelect, playTap };

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
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);

    // Hearts disabled (was from DongContext, now simplified)
    const hearts = Infinity;

    const rewardGivenRef = React.useRef(false);

    const [isModuleTest, setIsModuleTest] = useState(false);
    const [nextNodeRoute, setNextNodeRoute] = useState(null);

    const lang = userProfile?.nativeLang || 'en';

    const stopTestAudio = React.useCallback(() => {
        clearSpeakQueue({ stopCurrent: true });
    }, []);

    const currentEx = exercises[currentIndex];
    const progress = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0;

    const {
        selectedAnswer,
        setSelectedAnswer,
        isChecking,
        isCorrect,
        orderedTokens,
        availableTokens,
        typedAnswer,
        setTypedAnswer,
        speechResult,
        setSpeechResult,
        fuzzyHint,
        imageError,
        setImageError,
        resetSessionState,
        checkCurrentExercise,
        canCheck,
        completeMatch,
        handleReorderToggle: handleSharedReorderToggle,
    } = useQuizSession({
        currentExercise: currentEx,
        resetKey: currentIndex,
        onExerciseReset: React.useCallback((exercise) => {
            stopTestAudio();
            if (!exercise) return;
            const { exercise_type: type, prompt } = exercise;
            if (type === 'listen_type' || type === 'listen_choose') {
                if (prompt.audio_text) scheduleSpeak(prompt.audio_text, 300);
            } else if (type === 'mcq_translate_to_en') {
                if (prompt.source_text_vi) scheduleSpeak(prompt.source_text_vi, 300);
            }
        }, [stopTestAudio]),
    });

    useEffect(() => {
        stopTestAudio();
        // Reset all state on every navigation (including retry)
        setCurrentIndex(0);
        setIsFinished(false);
        setScore(0);
        resetSessionState();
        rewardGivenRef.current = false;

        const node = getNodeById(nodeId);
        if (!node) { navigate('/', { state: { tab: 'study' } }); return; }

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
        }
        return stopTestAudio;
    }, [nodeId, location.key, resetSessionState, stopTestAudio]);

    const passed = exercises.length > 0 && (score / exercises.length) >= PASS_THRESHOLD;

    useEffect(() => {
        if (isFinished && !rewardGivenRef.current && passed) {
            rewardGivenRef.current = true;
            progressCtx.completeNode(nodeId, { immediate: true, isTest: true, mode: progressMode });
        }
    }, [isFinished, passed]);

    // Bé Khế lines for the result screen. Memoized so the random pool pick stays
    // stable across re-renders; recomputed only when the test finishes (or the
    // pass/unlock state changes).
    const mascotResult = React.useMemo(
        () => (isFinished ? getLine(passed ? 'test_pass' : 'test_fail', { lang }) : null),
        [isFinished, passed, lang],
    );
    const mascotUnlock = React.useMemo(
        () => (isFinished && passed && nextNodeRoute ? getLine('unlock', { lang }) : null),
        [isFinished, passed, nextNodeRoute, lang],
    );

    // Play the mascot's sound once when the result screen appears. The result
    // screen plays no sound of its own, so there's no double-fire.
    useEffect(() => {
        if (!isFinished) return;
        const sound = mascotResult?.sound || mascotUnlock?.sound;
        if (sound) SND[sound]?.();
    }, [isFinished, mascotResult, mascotUnlock]);

    const handleCheck = () => {
        if (!currentEx) return;
        const result = checkCurrentExercise();
        if (!result.handled) return;

        const { correct } = result;
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

    const handleReorderToggle = (word, index, source) => {
        if (isChecking) return;
        speak(word);
        handleSharedReorderToggle(word, index, source);
    };

    const handlePlayAudio = (text) => { if (text) speak(text); };

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
                    {mascotResult ? (
                        <BeKhe expression={passed ? 'wow' : 'oops'} size={88} />
                    ) : (
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
                    )}
                    <h1 style={{ color: passed ? '#F97316' : 'var(--danger-color)', fontSize: 24, margin: 0, fontWeight: 800 }}>
                        {passed
                            ? (isModuleTest ? t('test_quiz_complete') : t('test_passed'))
                            : t('test_not_quite')}
                    </h1>
                    <div style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        <strong style={{ color: passed ? '#F97316' : 'var(--danger-color)' }}>{score}/{exercises.length}</strong> {t('test_correct')} ({pct}%)
                    </div>
                    {mascotResult && (
                        <p style={{ color: 'var(--text-main)', fontSize: 15, lineHeight: 1.5, margin: 0, maxWidth: 320 }}>
                            {mascotResult.text}
                        </p>
                    )}
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                        {passed
                            ? (isModuleTest ? t('test_next_module_unlocked') : t('test_next_unit_unlocked'))
                            : t('test_need_to_pass').replace('{percent}', thresholdPct)}
                    </p>
                    {mascotUnlock && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 320, textAlign: 'left' }}>
                            <BeKhe expression="celebrate" size={48} />
                            <p style={{ color: 'var(--text-main)', fontSize: 14, lineHeight: 1.4, margin: 0 }}>
                                {mascotUnlock.text}
                            </p>
                        </div>
                    )}
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

                {exercise_type !== 'picture_choice' && exercise_type !== 'speak_sentence' && exercise_type !== 'match_pairs' && (
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
                    {['mcq_translate_to_vi', 'mcq_translate_to_en', 'listen_choose'].includes(exercise_type) && (
                        <MCQOptions
                            options={prompt.choices_vi || prompt.choices_en}
                            selectedAnswer={selectedAnswer}
                            correctAnswer={prompt.answer_vi || prompt.answer_en}
                            onSelect={(choice) => {
                                setSelectedAnswer(choice);
                                if (prompt.choices_vi) speak(choice);
                            }}
                            isChecking={isChecking}
                            isCorrect={isCorrect}
                        />
                    )}

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
                            <MCQOptions
                                options={prompt.choices_vi || []}
                                selectedAnswer={selectedAnswer}
                                correctAnswer={prompt.answer_vi}
                                onSelect={(choice) => {
                                    setSelectedAnswer(choice);
                                    speak(choice);
                                }}
                                isChecking={isChecking}
                                isCorrect={isCorrect}
                            />
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
                        <ReorderWords
                            shuffledWords={availableTokens}
                            hintText={prompt.source_text_en || prompt.hint_en || ''}
                            selectedWords={orderedTokens}
                            onToggleWord={handleReorderToggle}
                            isChecking={isChecking}
                            isCorrect={isCorrect}
                            correctAnswer={prompt.answer_vi || prompt.answer_tokens?.join(' ')}
                        />
                    )}

                    {/* Fill in the Blank — MCQ choices */}
                    {exercise_type === 'fill_blank' && (
                        <FillBlankInput
                            sentenceWithBlank={prompt.template_vi || prompt.sentence_with_blank || ''}
                            hintText={prompt.source_text_en || prompt.hint_en || ''}
                            value={selectedAnswer || ''}
                            onChange={setSelectedAnswer}
                            isChecking={isChecking}
                            isCorrect={isCorrect}
                            correctAnswer={prompt.answer_vi}
                            mode="bank"
                            wordBankChoices={prompt.choices_vi || []}
                            onBankSelect={(choice) => {
                                setSelectedAnswer(choice);
                                speak(buildFillBlankSentence(prompt, choice));
                            }}
                        />
                    )}

                    {/* Match Pairs */}
                    {exercise_type === 'match_pairs' && (
                        <MatchPairs
                            key={currentEx.id || `${currentIndex}-${exercise_type}`}
                            pairs={prompt.pairs || []}
                            onComplete={() => {
                                completeMatch();
                                setScore(s => s + 1);
                            }}
                        />
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
                className={`lesson-game__actionbar ${isChecking ? 'lesson-game__actionbar--feedback' : ''}`}
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
