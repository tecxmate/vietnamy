import React, { useState } from 'react';
import { Volume2, ChevronRight, RotateCcw } from 'lucide-react';
import speak from '../../utils/speak';
import SoundButton from '../SoundButton';
import TappableVietnamese from '../TappableVietnamese';
import WordPopup from '../WordPopup';

const EMOTION_MAP = {
    friendly: '😊', confident: '😎', attentive: '🤔', satisfied: '😌',
    waiting: '🫤', confused: '😅', nervous: '😰', curious: '🤨',
    pleased: '😄', helpful: '🙂', impatient: '😤'
};

const DialogueBubble = ({ line, character, isPlayer, onWordTap }) => {
    const emotion = EMOTION_MAP[line.emotion] || '';

    return (
        <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            flexDirection: isPlayer ? 'row-reverse' : 'row',
            animation: 'slideUp 0.25s ease'
        }}>
            {/* Avatar */}
            <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--surface-color-light)', border: '2px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0
            }}>
                {character?.emoji || '👤'}
            </div>

            {/* Bubble */}
            <div style={{
                flex: 1, maxWidth: '80%', padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isPlayer ? 'rgba(255,183,3,0.1)' : 'var(--surface-color)',
                border: isPlayer ? '1px solid rgba(255,183,3,0.2)' : '1px solid var(--border-color)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                        {character?.name || 'Unknown'}
                    </span>
                    {emotion && <span style={{ fontSize: 14 }}>{emotion}</span>}
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.5, marginBottom: 4 }}>
                    <TappableVietnamese text={line.text_vi} onWordTap={onWordTap} bold />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {line.text_en}
                </div>
                {line.grammar_highlight && (
                    <div style={{
                        marginTop: 8, padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255,183,3,0.08)', border: '1px solid rgba(255,183,3,0.15)',
                        fontSize: 12, color: 'var(--primary-color)', fontWeight: 600,
                        fontFamily: 'monospace'
                    }}>
                        Pattern: {line.grammar_highlight}
                    </div>
                )}
            </div>

            {/* Audio button */}
            <button
                className="ghost"
                onClick={(e) => { e.stopPropagation(); speak(line.text_vi); }}
                style={{ padding: 6, color: 'var(--secondary-color)', flexShrink: 0, alignSelf: 'center' }}
            >
                <Volume2 size={16} />
            </button>
        </div>
    );
};

const SceneObserve = ({ config, scene, onComplete }) => {
    const [visibleLines, setVisibleLines] = useState(1);
    const [popupWord, setPopupWord] = useState(null);
    const script = config.script || [];
    const allVisible = visibleLines >= script.length;

    const getCharacter = (speakerId) => {
        return (scene.characters || []).find(c => c.id === speakerId);
    };

    const handleWordTap = (word, rect, isPhrase = false) => {
        if (!word) { setPopupWord(null); return; }
        setPopupWord({ word, anchorRect: rect, isPhrase });
    };

    const handleAdvance = () => {
        setPopupWord(null);
        if (!allVisible) {
            setVisibleLines(prev => prev + 1);
            // Auto-play audio for new line
            const nextLine = script[visibleLines];
            if (nextLine) speak(nextLine.text_vi);
        }
    };

    const handleReplay = () => {
        setPopupWord(null);
        setVisibleLines(1);
        speak(script[0]?.text_vi);
    };

    // Auto-play first line
    React.useEffect(() => {
        if (script[0]) speak(script[0].text_vi);
    }, []);

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Instruction */}
            <div style={{ padding: '12px 20px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                    {config.instruction}
                </p>
            </div>

            {/* Dialogue area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {script.slice(0, visibleLines).map((line, i) => (
                    <DialogueBubble
                        key={i}
                        line={line}
                        character={getCharacter(line.speaker)}
                        isPlayer={line.speaker === 'player'}
                        onWordTap={handleWordTap}
                    />
                ))}
            </div>

            {/* Bottom controls */}
            <div style={{
                padding: '16px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', borderTop: '2px solid var(--border-color)',
                backgroundColor: 'var(--surface-color)', minHeight: 80,
                display: 'flex', alignItems: 'center', gap: 10
            }}>
                {allVisible ? (
                    <>
                        <button
                            className="ghost"
                            onClick={handleReplay}
                            style={{ padding: 10, color: 'var(--text-muted)' }}
                        >
                            <RotateCcw size={20} />
                        </button>
                        <SoundButton
                            className="primary shadow-lg"
                            style={{ flex: 1, fontSize: 17 }}
                            onClick={onComplete}
                        >
                            YOUR TURN <ChevronRight size={18} />
                        </SoundButton>
                    </>
                ) : (
                    <SoundButton
                        className="primary shadow-lg"
                        style={{ flex: 1, fontSize: 17 }}
                        onClick={handleAdvance}
                    >
                        {visibleLines === 0 ? 'START' : 'NEXT'} <ChevronRight size={18} />
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

export default SceneObserve;
