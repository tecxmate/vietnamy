import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Volume2 } from 'lucide-react';
import speak from '../../utils/speak';
import { checkVietnameseInput } from '../../utils/fuzzyVietnamese';
import SoundButton from '../SoundButton';
import { playSuccess, playError } from '../../utils/sound';
import TappableVietnamese from '../TappableVietnamese';
import WordPopup from '../WordPopup';

const EMOTION_MAP = {
    friendly: '😊', confident: '😎', attentive: '🤔', satisfied: '😌',
    waiting: '🫤', confused: '😅', nervous: '😰', curious: '🤨',
    pleased: '😄', helpful: '🙂', impatient: '😤'
};

const ScenePerform = ({ config, scene, onComplete }) => {
    const challenges = config.challenges || [];
    const [currentIdx, setCurrentIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [npcReaction, setNpcReaction] = useState(null);

    // Word bank state
    const [orderedTokens, setOrderedTokens] = useState([]);
    const [availableTokens, setAvailableTokens] = useState([]);
    const reactionIndexRef = useRef(0);

    // Fill blank state
    const [fillAnswer, setFillAnswer] = useState(null);

    // Speak state
    const [typedAnswer, setTypedAnswer] = useState('');
    const [speechResult, setSpeechResult] = useState('');

    // Word popup state
    const [popupWord, setPopupWord] = useState(null);

    const currentChallenge = challenges[currentIdx];
    const isFinished = currentIdx >= challenges.length;

    // Initialize word bank when challenge changes
    useEffect(() => {
        if (!currentChallenge) return;
        setSelectedAnswer(null);
        setIsChecking(false);
        setIsCorrect(null);
        setNpcReaction(null);
        setFillAnswer(null);
        setTypedAnswer('');
        setSpeechResult('');
        setPopupWord(null);

        if (currentChallenge.type === 'build_sentence') {
            const answer = currentChallenge.answer_tokens || [];
            const distractors = currentChallenge.distractor_tokens || [];
            const all = [...answer, ...distractors].sort(() => Math.random() - 0.5);
            setAvailableTokens(all);
            setOrderedTokens([]);
        }
    }, [currentIdx]);

    // Auto-play speaker prompt
    useEffect(() => {
        if (currentChallenge?.speaker_prompt?.text_vi) {
            speak(currentChallenge.speaker_prompt.text_vi);
        }
    }, [currentIdx]);

    const getCharacter = (speakerId) => {
        return (scene.characters || []).find(c => c.id === speakerId);
    };

    const handleWordTap = (word, rect, isPhrase = false) => {
        if (!word) { setPopupWord(null); return; }
        setPopupWord({ word, anchorRect: rect, isPhrase });
    };

    const handleCheck = () => {
        if (!currentChallenge || isChecking) return;
        setIsChecking(true);

        let correct = false;
        let reaction = null;

        switch (currentChallenge.type) {
            case 'dialogue_choice': {
                const choice = currentChallenge.choices.find(c => c.text_vi === selectedAnswer);
                correct = choice?.correct || false;
                if (choice?.partial) correct = true;
                if (!correct && choice?.response_vi) {
                    reaction = {
                        speaker: currentChallenge.speaker_prompt.speaker,
                        text_vi: choice.response_vi,
                        text_en: choice.response_en,
                        emotion: choice.response_emotion
                    };
                } else if (correct) {
                    reaction = {
                        speaker: currentChallenge.speaker_prompt.speaker,
                        text_vi: choice?.response_vi || 'Dạ, được ạ!',
                        text_en: choice?.response_en || 'Sure thing!',
                        emotion: choice?.response_emotion || 'pleased'
                    };
                }
                break;
            }
            case 'build_sentence': {
                const userStr = orderedTokens.join(' ');
                const ansStr = (currentChallenge.answer_tokens || []).join(' ');
                correct = userStr === ansStr || userStr.replace(/\s*[.!?]+$/g, '') === ansStr.replace(/\s*[.!?]+$/g, '');
                break;
            }
            case 'fill_response': {
                correct = fillAnswer === currentChallenge.answer;
                break;
            }
            case 'free_speak': {
                const input = speechResult || typedAnswer;
                const accepts = currentChallenge.accept_variations || [currentChallenge.target_vi];
                correct = accepts.some(v => {
                    const result = checkVietnameseInput(input, v);
                    return result.isCorrect;
                });
                break;
            }
        }

        setIsCorrect(correct);
        if (correct) {
            setScore(prev => prev + 1);
            playSuccess();
        } else {
            playError();
            // Pick a wrong-answer NPC reaction if none from choice
            if (!reaction && config.wrong_answer_reactions?.length) {
                reaction = config.wrong_answer_reactions[reactionIndexRef.current % config.wrong_answer_reactions.length];
                reactionIndexRef.current += 1;
            }
        }
        setNpcReaction(reaction);
    };

    const handleNext = () => {
        if (currentIdx < challenges.length - 1) {
            setCurrentIdx(prev => prev + 1);
        } else {
            // Calculate performance tier
            const pct = score / challenges.length;
            const tier = pct >= 0.9 ? 'perfect' : pct >= 0.6 ? 'good' : 'retry';
            onComplete({ score, total: challenges.length, tier });
        }
    };

    const handleWordBankTap = (word) => {
        setOrderedTokens(prev => [...prev, word]);
        speak(word);
    };

    const handleRemoveToken = (idx) => {
        setOrderedTokens(prev => prev.filter((_, i) => i !== idx));
    };

    const canCheck = () => {
        if (!currentChallenge) return false;
        switch (currentChallenge.type) {
            case 'dialogue_choice': return selectedAnswer !== null;
            case 'build_sentence': return orderedTokens.length > 0;
            case 'fill_response': return fillAnswer !== null;
            case 'free_speak': return (speechResult || typedAnswer).trim().length > 0;
            default: return false;
        }
    };

    if (isFinished) return null;

    const prompt = currentChallenge.speaker_prompt;
    const promptChar = prompt ? getCharacter(prompt.speaker) : null;

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Scene beat / dramatic context */}
            {currentChallenge.scene_beat && (
                <div style={{
                    padding: '12px 20px', textAlign: 'center',
                    fontStyle: 'italic', fontSize: 14, color: 'var(--text-muted)',
                    lineHeight: 1.5
                }}>
                    {currentChallenge.scene_beat}
                </div>
            )}

            {/* Content area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* NPC prompt bubble */}
                {prompt && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--surface-color-light)', border: '2px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, flexShrink: 0
                        }}>
                            {promptChar?.emoji || '👤'}
                        </div>
                        <div style={{
                            flex: 1, padding: '12px 14px', borderRadius: 'var(--radius-lg)',
                            backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                                    {promptChar?.name}
                                </span>
                                <span style={{ fontSize: 14 }}>{EMOTION_MAP[prompt.emotion] || ''}</span>
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.4, marginBottom: 4 }}>
                                <TappableVietnamese text={prompt.text_vi} onWordTap={handleWordTap} bold />
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                {prompt.text_en}
                            </div>
                        </div>
                        <button
                            className="ghost"
                            onClick={() => speak(prompt.text_vi)}
                            style={{ padding: 6, color: 'var(--secondary-color)', flexShrink: 0, alignSelf: 'center' }}
                        >
                            <Volume2 size={16} />
                        </button>
                    </div>
                )}

                {/* NPC reaction (after checking) */}
                {npcReaction && (
                    <div style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                        animation: 'slideUp 0.25s ease'
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--surface-color-light)', border: '2px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, flexShrink: 0
                        }}>
                            {getCharacter(npcReaction.speaker)?.emoji || '👤'}
                        </div>
                        <div style={{
                            padding: '10px 14px', borderRadius: 'var(--radius-lg)',
                            backgroundColor: isCorrect ? 'rgba(6,214,160,0.08)' : 'rgba(239,71,111,0.08)',
                            border: `1px solid ${isCorrect ? 'var(--success-color)' : 'var(--danger-color)'}`,
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4 }}>
                                {npcReaction.text_vi} {EMOTION_MAP[npcReaction.emotion] || ''}
                            </div>
                            {npcReaction.text_en && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                    {npcReaction.text_en}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Challenge input area --- */}
                {!isChecking && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                        {/* Dialogue choice */}
                        {currentChallenge.type === 'dialogue_choice' && (
                            currentChallenge.choices.map((choice, idx) => (
                                <button
                                    key={idx}
                                    className="secondary"
                                    style={{
                                        width: '100%', justifyContent: 'flex-start', padding: '14px 16px',
                                        fontSize: 16, borderRadius: 'var(--radius-md)', textAlign: 'left',
                                        borderColor: selectedAnswer === choice.text_vi ? 'var(--lesson-selected-border)' : 'var(--border-color)',
                                        backgroundColor: selectedAnswer === choice.text_vi ? 'var(--lesson-selected-fill)' : 'transparent',
                                        color: selectedAnswer === choice.text_vi ? 'var(--lesson-selected-border)' : 'var(--text-main)',
                                        boxShadow: selectedAnswer === choice.text_vi ? '0 2px 0 var(--lesson-selected-border)' : '0 2px 0 var(--border-color)'
                                    }}
                                    onClick={() => { setSelectedAnswer(choice.text_vi); speak(choice.text_vi); }}
                                >
                                    {choice.text_vi}
                                </button>
                            ))
                        )}

                        {/* Build sentence — word bank */}
                        {currentChallenge.type === 'build_sentence' && (
                            <>
                                {currentChallenge.answer_en && (
                                    <div style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 4 }}>
                                        Say: "{currentChallenge.answer_en}"
                                    </div>
                                )}
                                {/* Answer line */}
                                <div style={{
                                    minHeight: 56, padding: '8px 0', borderBottom: '2px solid var(--border-color)',
                                    display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center'
                                }}>
                                    {orderedTokens.length === 0 && (
                                        <span style={{ color: 'var(--text-muted)', padding: '8px 0' }}>Tap words to build your response</span>
                                    )}
                                    {orderedTokens.map((token, idx) => (
                                        <button
                                            key={idx}
                                            style={{
                                                padding: '8px 12px', backgroundColor: 'var(--surface-color)',
                                                border: '2px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                                                cursor: 'pointer', boxShadow: '0 2px 0 var(--border-color)',
                                                fontSize: 16, fontWeight: 500, color: 'var(--text-main)'
                                            }}
                                            onClick={() => handleRemoveToken(idx)}
                                        >
                                            {token}
                                        </button>
                                    ))}
                                </div>
                                {/* Bank */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                                    {availableTokens.map((word, idx) => {
                                        const usedCount = orderedTokens.filter(w => w === word).length;
                                        const bankBefore = availableTokens.slice(0, idx).filter(w => w === word).length;
                                        const isUsed = bankBefore < usedCount;
                                        return (
                                            <button
                                                key={idx}
                                                style={{
                                                    padding: '8px 12px', borderRadius: 'var(--radius-md)',
                                                    fontSize: 16, fontWeight: 500,
                                                    boxShadow: isUsed ? 'none' : '0 2px 0 var(--border-color)',
                                                    backgroundColor: isUsed ? 'var(--bg-color)' : 'var(--surface-color)',
                                                    border: isUsed ? '2px solid transparent' : '2px solid var(--border-color)',
                                                    color: isUsed ? 'transparent' : 'var(--text-main)',
                                                    cursor: isUsed ? 'default' : 'pointer',
                                                    pointerEvents: isUsed ? 'none' : 'auto',
                                                }}
                                                onClick={() => !isUsed && handleWordBankTap(word)}
                                            >
                                                {word}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* Fill response */}
                        {currentChallenge.type === 'fill_response' && (
                            <>
                                <div style={{
                                    padding: 14, backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                                    border: '2px solid var(--border-color)', fontSize: 18, lineHeight: 1.6
                                }}>
                                    {(currentChallenge.template_vi || '').split('____').map((part, i, arr) => (
                                        <React.Fragment key={i}>
                                            <span>{part}</span>
                                            {i < arr.length - 1 && (
                                                <span style={{
                                                    display: 'inline-block', minWidth: 70,
                                                    borderBottom: '3px solid var(--lesson-selected-border)',
                                                    textAlign: 'center', fontWeight: 700,
                                                    color: 'var(--lesson-selected-border)', padding: '2px 6px',
                                                    backgroundColor: fillAnswer ? 'var(--lesson-selected-fill)' : 'transparent',
                                                    borderRadius: fillAnswer ? 'var(--radius-sm)' : 0,
                                                    cursor: fillAnswer ? 'pointer' : 'default',
                                                }}
                                                onClick={() => fillAnswer && setFillAnswer(null)}
                                                >
                                                    {fillAnswer || '\u00A0\u00A0\u00A0\u00A0'}
                                                </span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                                    {(currentChallenge.choices || []).map((choice, idx) => {
                                        const isUsed = fillAnswer === choice;
                                        return (
                                            <button
                                                key={idx}
                                                style={{
                                                    padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                                    fontSize: 16, fontWeight: 500,
                                                    backgroundColor: isUsed ? 'var(--bg-color)' : 'var(--surface-color)',
                                                    border: isUsed ? '2px solid transparent' : '2px solid var(--border-color)',
                                                    color: isUsed ? 'transparent' : 'var(--text-main)',
                                                    boxShadow: isUsed ? 'none' : '0 2px 0 var(--border-color)',
                                                    cursor: isUsed ? 'default' : 'pointer',
                                                    pointerEvents: isUsed ? 'none' : 'auto',
                                                }}
                                                onClick={() => { setFillAnswer(choice); speak(choice); }}
                                            >
                                                {choice}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* Free speak */}
                        {currentChallenge.type === 'free_speak' && (
                            <>
                                <div style={{
                                    fontSize: 22, fontWeight: 700, textAlign: 'center', padding: 20,
                                    backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)',
                                    border: '2px solid var(--border-color)', lineHeight: 1.4
                                }}>
                                    {currentChallenge.target_vi}
                                </div>
                                <button
                                    className="ghost"
                                    onClick={() => speak(currentChallenge.target_vi)}
                                    style={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary-color)', fontSize: 13 }}
                                >
                                    <Volume2 size={18} /> Listen first
                                </button>
                                <input
                                    type="text"
                                    value={speechResult || typedAnswer}
                                    onChange={(e) => { setSpeechResult(''); setTypedAnswer(e.target.value); }}
                                    placeholder="Type the sentence..."
                                    style={{
                                        width: '100%', padding: 14, fontSize: 16, borderRadius: 'var(--radius-md)',
                                        border: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)',
                                        color: 'var(--text-main)', outline: 'none', boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = 'var(--secondary-color)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom check/continue bar */}
            <div style={{
                padding: '16px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', borderTop: '2px solid var(--border-color)',
                backgroundColor: isChecking ? (isCorrect ? 'var(--lesson-correct-fill)' : 'var(--lesson-error-fill)') : 'var(--surface-color)',
                transition: 'background-color 0.2s', minHeight: 80,
                display: 'flex', flexDirection: 'column', justifyContent: 'center'
            }}>
                {isChecking ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 'var(--radius-full)',
                                backgroundColor: isCorrect ? 'var(--success-color)' : 'var(--lesson-error-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {isCorrect ? <Check size={16} color="white" strokeWidth={3} /> : <X size={16} color="white" strokeWidth={3} />}
                            </div>
                            <span style={{ fontSize: 20, fontWeight: 800, color: isCorrect ? 'var(--success-color)' : 'var(--lesson-error-border)' }}>
                                {isCorrect ? 'Nice!' : 'Not quite'}
                            </span>
                        </div>
                        {!isCorrect && currentChallenge.type === 'build_sentence' && (
                            <div style={{ fontSize: 15, color: 'var(--lesson-error-border)' }}>
                                {(currentChallenge.answer_tokens || []).join(' ')}
                            </div>
                        )}
                        {!isCorrect && currentChallenge.type === 'fill_response' && (
                            <div style={{ fontSize: 15, color: 'var(--lesson-error-border)' }}>
                                {currentChallenge.answer}
                            </div>
                        )}
                        <SoundButton
                            className="shadow-lg"
                            style={{
                                width: '100%', fontSize: 17, fontWeight: 800,
                                borderRadius: 'var(--radius-lg)', border: 'none',
                                textTransform: 'uppercase', letterSpacing: 1,
                                backgroundColor: isCorrect ? 'var(--primary-color)' : 'var(--lesson-error-border)',
                                color: isCorrect ? '#1A1A1A' : '#FFFFFF',
                                boxShadow: isCorrect ? '0 4px 0 var(--primary-color-hover)' : '0 4px 0 var(--error-shadow)'
                            }}
                            onClick={handleNext}
                        >
                            CONTINUE
                        </SoundButton>
                    </div>
                ) : (
                    <SoundButton
                        className="shadow-lg"
                        style={{
                            width: '100%', fontSize: 17, fontWeight: 800,
                            borderRadius: 'var(--radius-lg)', border: 'none',
                            textTransform: 'uppercase', letterSpacing: 1,
                            backgroundColor: canCheck() ? 'var(--primary-color)' : 'var(--lesson-check-disabled-bg)',
                            color: canCheck() ? '#1A1A1A' : 'var(--lesson-check-disabled-text)',
                            boxShadow: canCheck() ? '0 4px 0 var(--primary-color-hover)' : 'none',
                        }}
                        onClick={handleCheck}
                    >
                        CHECK
                    </SoundButton>
                )}
            </div>

            {/* Word Popup */}
            {popupWord && (
                <WordPopup
                    word={popupWord.word}
                    anchorRect={popupWord.anchorRect}
                    isPhrase={popupWord.isPhrase}
                    onClose={() => setPopupWord(null)}
                    onNavigate={() => setPopupWord(null)}
                    onSave={() => setPopupWord(null)}
                />
            )}
        </div>
    );
};

export default ScenePerform;
