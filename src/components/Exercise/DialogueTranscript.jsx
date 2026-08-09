import React, { useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';

/**
 * DialogueTranscript — a chat-style view of an authored conversation with one
 * turn hidden.
 *
 * Speakers alternate sides so the learner can see the shape of the exchange at a
 * glance; the missing turn keeps its side and shows the selected answer as it is
 * chosen, so the conversation reads as a whole while being answered.
 */
export default function DialogueTranscript({ lines = [], selectedAnswer, isChecking, isCorrect, onPlay }) {
    // First speaker to appear anchors the left column; everyone else sits right.
    const leftSpeaker = lines[0]?.speaker;

    // The transcript scrolls internally so the answer choices stay on screen; make
    // sure the gap the learner has to fill is the part they land on.
    const blankRef = useRef(null);
    useEffect(() => {
        blankRef.current?.scrollIntoView({ block: 'nearest' });
    }, [lines]);

    return (
        <div className="dialogue-transcript">
            {lines.map((line, i) => {
                const isLeft = line.speaker === leftSpeaker;
                const filled = line.isBlank ? selectedAnswer : line.vi_text;

                let stateClass = '';
                if (line.isBlank) {
                    if (isChecking) stateClass = isCorrect ? ' is-correct' : ' is-wrong';
                    else if (selectedAnswer) stateClass = ' is-filled';
                    else stateClass = ' is-empty';
                }

                return (
                    <div
                        key={i}
                        ref={line.isBlank ? blankRef : undefined}
                        className={`dialogue-transcript__row${isLeft ? '' : ' is-right'}`}
                    >
                        <span className="dialogue-transcript__speaker">{line.speaker}</span>
                        <div className={`dialogue-transcript__bubble${line.isBlank ? ' is-blank' : ''}${stateClass}`}>
                            {filled ? (
                                <>
                                    <span className="dialogue-transcript__vi">{filled}</span>
                                    {line.en_text && (
                                        <span className="dialogue-transcript__en">{line.en_text}</span>
                                    )}
                                    {!line.isBlank && onPlay && (
                                        <button
                                            type="button"
                                            className="dialogue-transcript__audio"
                                            aria-label={`Play: ${line.vi_text}`}
                                            onClick={() => onPlay(line.vi_text)}
                                        >
                                            <Volume2 size={16} />
                                        </button>
                                    )}
                                </>
                            ) : (
                                <span className="dialogue-transcript__placeholder">?</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
