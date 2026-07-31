import React, { useState } from 'react';
import { Volume2, RotateCw } from 'lucide-react';
import speak from '../utils/speak';

// A single new-word flashcard in the LEARN phase. Tap the card to flip between
// the Vietnamese word and its meaning; flipping to the meaning reads the word
// aloud. One card = one step in the lesson progress bar. Give it a `key` that
// changes per step so the flip resets when advancing to the next word.
export default function LearnFlashcard({ word, index, total }) {
    const [flipped, setFlipped] = useState(false);

    const toggle = () => {
        const next = !flipped;
        setFlipped(next);
        if (next) speak(word.vi); // hear the word while reading its meaning
    };

    const faceBase = {
        position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
        display: 'flex', flexDirection: 'column', borderRadius: 20, padding: 24,
        background: 'var(--surface-color)', border: '1px solid var(--border-color)',
        boxShadow: '0 4px 0 var(--tc-navy, rgba(27,26,58,0.14))',
    };

    return (
        <div style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--tc-pink, var(--primary-color))', marginBottom: 14 }}>
                New word · {index + 1} / {total}
            </div>

            <div style={{ perspective: 1200 }}>
                <button
                    onClick={toggle}
                    aria-label={flipped ? 'Show word' : 'Show meaning'}
                    style={{
                        position: 'relative', width: '100%', height: 320, padding: 0, border: 'none',
                        background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        transformStyle: 'preserve-3d', transition: 'transform .5s cubic-bezier(.2,.7,.2,1)',
                        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                >
                    {/* Front — the word */}
                    <div style={{ ...faceBase, textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--tc-navy, #204081)' }}>{word.pos}</span>
                            <span
                                role="button" tabIndex={-1}
                                onClick={(e) => { e.stopPropagation(); speak(word.vi); }}
                                style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--tc-yellow, #FCBD1B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Volume2 size={20} color="#1B1A3A" />
                            </span>
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1 }}>{word.vi}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                            <RotateCw size={14} /> tap to flip
                        </div>
                    </div>

                    {/* Back — the meaning */}
                    <div style={{ ...faceBase, transform: 'rotateY(180deg)', justifyContent: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--tc-teal, #38BA94)', marginBottom: 8 }}>Meaning</div>
                        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: word.example ? 16 : 0 }}>{word.en}</div>
                        {word.example && (
                            <div style={{ paddingLeft: 12, borderLeft: '3px solid var(--tc-teal, #38BA94)' }}>
                                <div style={{ fontSize: 17, fontWeight: 700 }}>{word.example.vi}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{word.example.en}</div>
                            </div>
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
}
