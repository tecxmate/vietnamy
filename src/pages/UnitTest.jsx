import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Heart, Check, Trophy, Volume2, ChevronRight } from 'lucide-react';
import { getNodeById, getExercisesForUnit, getExercisesForNode, getNextNode, getNodeRoute } from '../lib/db';
import { useDong } from '../context/DongContext';
import speak from '../utils/speak';
import { loadSettings } from '../components/TopBar';
import { checkVietnameseInput } from '../utils/fuzzyVietnamese';
import { playSuccess, playError } from '../utils/sound';
import SoundButton from '../components/SoundButton';

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
    const dongCtx = useDong();

    const [exercises, setExercises] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const testMode = loadSettings().testMode === true;
    const hearts = testMode ? Infinity : dongCtx.hearts;
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);
    const [unitTitle, setUnitTitle] = useState('');

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

    useEffect(() => {
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
    }, [nodeId, navigate]);

    const passed = exercises.length > 0 && (score / exercises.length) >= PASS_THRESHOLD;

    useEffect(() => {
        if (isFinished && !rewardGivenRef.current && passed) {
            rewardGivenRef.current = true;
            dongCtx.completeNode(nodeId, { immediate: true, isTest: true });
        }
    }, [isFinished, passed]);

    const currentEx = exercises[currentIndex];
    const progress = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0;

    useEffect(() => {
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
                if (p.audio_text) setTimeout(() => speak(p.audio_text), 300);
            } else if (et === 'mcq_translate_to_en') {
                if (p.source_text_vi) setTimeout(() => speak(p.source_text_vi), 300);
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
    }, [currentIndex, currentEx]);

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
        if (correct) { playSuccess(); setScore(s => s + 1); }
        else { playError(); if (!testMode) dongCtx.loseHeart(); }
    };

    const handleNext = () => {
        if (hearts === 0) { navigate('/', { state: { tab: 'study' } }); return; }
        if (currentIndex < exercises.length - 1) setCurrentIndex(i => i + 1);
        else setIsFinished(true);
    };

    const handleSkip = () => {
        if (!testMode) return;
        setScore(s => s + 1);
        if (currentIndex < exercises.length - 1) setCurrentIndex(i => i + 1);
        else setIsFinished(true);
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
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
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
                            ? (isModuleTest ? 'Quiz Complete!' : 'Test Passed!')
                            : 'Not Quite!'}
                    </h1>
                    <div style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        <strong style={{ color: passed ? '#F97316' : 'var(--danger-color)' }}>{score}/{exercises.length}</strong> correct ({pct}%)
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                        {passed
                            ? (isModuleTest ? 'Next module unlocked!' : 'Next unit unlocked!')
                            : `You need ${thresholdPct}% to pass. Review the lesson and try again!`}
                    </p>
                </div>
                <div style={{ padding: '24px 16px', borderTop: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 140, justifyContent: 'center' }}>
                    {passed ? (
                        <>
                            {nextNodeRoute && (
                                <button className="ghost" onClick={() => navigate('/', { state: { tab: 'study' } })} style={{ width: '100%', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    Back to Roadmap
                                </button>
                            )}
                            <SoundButton className="primary w-full shadow-lg" onClick={() => navigate(nextNodeRoute || '/')} style={{ fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                CONTINUE {nextNodeRoute && <ChevronRight size={20} />}
                            </SoundButton>
                        </>
                    ) : (
                        <>
                            <button className="ghost" onClick={() => navigate('/', { state: { tab: 'study' } })} style={{ width: '100%', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Back to Roadmap
                            </button>
                            <SoundButton
                                className="primary w-full shadow-lg"
                                style={{ fontSize: 18, backgroundColor: 'var(--danger-color)', boxShadow: '0 4px 0 #B52F4E' }}
                                onClick={() => navigate(0)}
                            >
                                TRY AGAIN
                            </SoundButton>
                        </>
                    )}
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
            <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <h2 style={{ fontSize: 24, margin: 0 }}>{prompt.instruction}</h2>

                {exercise_type !== 'picture_choice' && exercise_type !== 'speak_sentence' && (
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(249,115,22,0.2)', border: '2px solid #F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 28 }}>
                            &#127942;
                        </div>

                        {['listen_choose', 'listen_type'].includes(exercise_type) ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, alignSelf: 'center' }}>
                                <button
                                    className="secondary"
                                    style={{ width: 64, height: 64, borderRadius: 16, color: '#F97316', borderColor: '#F97316', boxShadow: '0 4px 0 #C2410C' }}
                                    onClick={() => handlePlayAudio(audioText)}
                                >
                                    <Volume2 size={32} />
                                </button>
                                {exercise_type === 'listen_type' && (
                                    <button
                                        className="secondary"
                                        style={{ width: 48, height: 48, borderRadius: 12, color: 'var(--text-muted)', borderColor: 'var(--border-color)', boxShadow: '0 3px 0 var(--border-color)', fontSize: 20 }}
                                        onClick={() => speak(audioText, 0.7)}
                                    >
                                        🐢
                                    </button>
                                )}
                                {exercise_type === 'listen_choose' && audioText && <span style={{ fontSize: 16, color: 'var(--text-muted)', fontStyle: 'italic' }}>{audioText}</span>}
                            </div>
                        ) : (
                            <div style={{ flex: 1, padding: 16, backgroundColor: 'var(--surface-color)', borderRadius: 16, border: '2px solid var(--border-color)', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: -10, top: 20, width: 20, height: 20, backgroundColor: 'var(--surface-color)', borderLeft: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)', transform: 'rotate(45deg)' }} />
                                <span style={{ fontSize: 18, position: 'relative', zIndex: 2 }}>{prompt.source_text_en || prompt.source_text_vi || prompt.template_vi || "Translate this"}</span>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                            <div style={{ minHeight: 70, padding: '10px 0', borderBottom: '2px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24, alignItems: 'center' }}>
                                {orderedTokens.length === 0 && <span style={{ color: 'var(--text-muted)', padding: '10px 0', width: '100%' }}>Tap words below to build the sentence</span>}
                                {orderedTokens.map((token, idx) => (
                                    <button key={idx} style={{ padding: '10px 16px', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', borderRadius: 12, cursor: isChecking ? 'default' : 'pointer', boxShadow: '0 2px 0 var(--border-color)', fontSize: 17, fontWeight: 500, color: 'var(--text-main)' }} onClick={() => { handleRemoveOrderedWord(idx); speak(token); }}>
                                        {token}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
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
                                            onClick={() => { if (!isChecking) { setSelectedAnswer(choice); speak(choice); } }}
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>
            {/* Top bar */}
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <button className="ghost" onClick={() => navigate('/', { state: { tab: 'study' } })} style={{ padding: 8 }}>
                    <X size={24} color="var(--text-muted)" />
                </button>
                <div style={{ flex: 1, height: 16, backgroundColor: 'var(--surface-color)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#F97316', transition: 'width 0.3s ease-out', borderRadius: 8 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger-color)', fontWeight: 700 }}>
                    <Heart size={24} fill="var(--danger-color)" /> {testMode ? '∞' : hearts}
                </div>
            </div>

            {/* Main content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {hearts === 0 ? (
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: 32, color: 'var(--danger-color)' }}>Out of Hearts!</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Keep practicing to earn more.</p>
                        </div>
                    ) : renderExercise()}
                </div>
            </div>

            {/* Bottom check bar */}
            <div style={{
                padding: '24px 16px',
                borderTop: '2px solid var(--border-color)',
                backgroundColor: isChecking ? (isCorrect ? 'rgba(6, 214, 160, 0.1)' : 'rgba(239, 71, 111, 0.1)') : 'var(--surface-color)',
                transition: 'background-color 0.2s',
                minHeight: 140,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                {isChecking ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: isCorrect ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isCorrect ? <Check size={20} color="#1A1A1A" strokeWidth={3} /> : <X size={20} color="white" strokeWidth={3} />}
                            </div>
                            <h3 style={{ margin: 0, fontSize: 24, color: isCorrect ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                {isCorrect ? (fuzzyHint ? 'Good! Try with diacritics:' : 'Nicely done!') : 'Correct solution:'}
                            </h3>
                        </div>
                        {!isCorrect && (
                            <div style={{ fontSize: 18, color: 'var(--danger-color)' }}>
                                {currentEx?.prompt?.answer_vi || currentEx?.prompt?.answer_en || (currentEx?.prompt?.answer_tokens && currentEx.prompt.answer_tokens.join(' '))}
                            </div>
                        )}
                        {isCorrect && fuzzyHint && (
                            <div style={{ fontSize: 18, color: 'var(--success-color)', fontWeight: 600 }}>{fuzzyHint}</div>
                        )}
                        <SoundButton
                            className="primary shadow-lg"
                            style={{
                                width: '100%', fontSize: 18,
                                backgroundColor: isCorrect ? 'var(--success-color)' : 'var(--danger-color)',
                                color: isCorrect ? '#1A1A1A' : 'white',
                                boxShadow: isCorrect ? '0 4px 0 #05A67D' : '0 4px 0 #B52F4E'
                            }}
                            onClick={handleNext}
                        >
                            CONTINUE
                        </SoundButton>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 10 }}>
                        <SoundButton
                            className={`${canCheck() ? 'primary' : 'disabled'} shadow-lg`}
                            style={{ flex: 1, fontSize: 18, opacity: canCheck() ? 1 : 0.5, backgroundColor: '#F97316', boxShadow: '0 4px 0 #C2410C' }}
                            onClick={handleCheck}
                        >
                            CHECK
                        </SoundButton>
                        {testMode && (
                            <button
                                className="shadow-lg"
                                style={{ padding: '0 20px', fontSize: 14, fontWeight: 700, backgroundColor: 'var(--warning-color)', color: '#1A1A1A', borderRadius: 12, border: 'none', boxShadow: '0 4px 0 #c77b00' }}
                                onClick={handleSkip}
                            >
                                SKIP
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnitTest;
