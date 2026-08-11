import { useState, useMemo, useCallback, useEffect } from 'react';
import { Check, X, Trophy, RotateCw } from 'lucide-react';
import { useTTS } from '../../hooks/useTTS';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';
import { useEnterKey } from '../../hooks/useEnterKey';
import { playSuccess, playError } from '../../utils/sound';
import { PracticeShell, AudioButton, OptionGrid, FeedbackBar, FeedbackMessage, PrimaryButton, ExerciseColumn } from '../../components/practice/PracticeKit';
import { ProgressBar } from '../../components/Exercise';
import './DrillPractice.css';

const CMS_KEY_PREFIX = 'vnme_cms_drill_';

// Shuffle helper
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

/**
 * Generic drill practice engine.
 *
 * Props:
 *  - data: drill JSON object (id, title, description, questions[])
 *  - questionCount: how many questions per session (default: 10)
 *
 * Supports question types: mcq, fill_blank, listen_pick
 * All data comes from JSON — editable via admin CMS.
 * Renders through the shared PracticeKit primitives (modern look).
 */
export default function DrillPractice({ data, questionCount = 10 }) {
    const { speak } = useTTS();
    const { session, markComplete, goNext, goBack } = usePracticeCompletion();

    // Load CMS overrides from localStorage (if teacher edited the content).
    // A corrupt or questionless override falls back to the bundled data —
    // otherwise one bad admin edit white-screens the drill until storage is cleared.
    const drillData = useMemo(() => {
        try {
            const stored = localStorage.getItem(CMS_KEY_PREFIX + data.id);
            const parsed = stored ? JSON.parse(stored) : null;
            return parsed?.questions?.length ? parsed : data;
        } catch {
            return data;
        }
    }, [data]);

    const [phase, setPhase] = useState('intro'); // intro | drill | summary
    const [questions, setQuestions] = useState([]);
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const [mistakes, setMistakes] = useState([]);
    const [playToken, setPlayToken] = useState(0);

    const startDrill = useCallback(() => {
        const shuffled = shuffle(drillData.questions);
        // Scale question count by session: +25% per session
        const scaledCount = Math.round(questionCount * (1 + session * 0.25));
        const count = Math.min(scaledCount, shuffled.length);
        // Shuffle options within each question too
        const prepared = shuffled.slice(0, count).map(q => ({
            ...q,
            options: shuffle(q.options)
        }));
        setQuestions(prepared);
        setQIndex(0);
        setSelected(null);
        setShowFeedback(false);
        setScore(0);
        setMistakes([]);
        setPhase('drill');
    }, [drillData, questionCount, session]);

    const currentQ = questions[qIndex] || null;

    const playAudio = useCallback((text) => {
        if (text) { speak(text); setPlayToken(t => t + 1); }
    }, [speak]);

    const handleSelect = useCallback((option) => {
        if (showFeedback) return;
        setSelected(option);
    }, [showFeedback]);

    const handleCheck = useCallback(() => {
        if (!selected || !currentQ) return;
        const isCorrect = selected === currentQ.correct;
        if (isCorrect) {
            playSuccess();
            setScore(s => s + 1);
        } else {
            playError();
            setMistakes(m => [...m, { ...currentQ, userAnswer: selected }]);
        }
        setShowFeedback(true);
    }, [selected, currentQ]);

    const handleNext = useCallback(() => {
        if (qIndex + 1 >= questions.length) {
            markComplete();
            setPhase('summary');
        } else {
            setQIndex(i => i + 1);
            setSelected(null);
            setShowFeedback(false);
        }
    }, [qIndex, questions.length, markComplete]);

    // Auto-play the prompt audio when a listen_pick question appears.
    useEffect(() => {
        if (phase !== 'drill') return;
        const q = questions[qIndex];
        const audio = q && (q.audioKey ?? q.audio);
        if (q?.type === 'listen_pick' && audio) {
            const t = setTimeout(() => playAudio(audio), 350);
            return () => clearTimeout(t);
        }
    }, [phase, qIndex, questions, playAudio]);

    // Enter → Check (when an option is picked) / Continue (after feedback).
    useEnterKey(() => {
        if (phase !== 'drill') return;
        if (!showFeedback && selected) handleCheck();
        else if (showFeedback) handleNext();
    });

    // ─── Intro Screen ──────────────────────────────────────────────
    if (phase === 'intro') {
        return (
            <PracticeShell onClose={goBack}>
                <div style={{ padding: '40px 24px 140px', textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>{drillData.title}</h1>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>{drillData.intro || drillData.description}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {Math.min(questionCount, drillData.questions.length)} questions per session
                    </p>
                </div>
                <FeedbackBar><PrimaryButton onClick={startDrill}>Start Practice</PrimaryButton></FeedbackBar>
            </PracticeShell>
        );
    }

    // ─── Summary Screen ────────────────────────────────────────────
    if (phase === 'summary') {
        const pct = Math.round((score / questions.length) * 100);
        return (
            <PracticeShell onClose={goBack}>
                <div style={{ padding: '32px 24px 170px', textAlign: 'center' }}>
                    <Trophy size={64} color="#FFD166" style={{ marginBottom: 16 }} />
                    <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 16px' }}>Practice Complete!</h1>
                    <div className="drill-score-display">
                        <div className="drill-score-circle" data-pct={pct}>
                            <span className="drill-score-number">{pct}%</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                            {score} / {questions.length} correct
                        </p>
                    </div>

                    {mistakes.length > 0 && (
                        <div className="drill-mistakes-review">
                            <h3 style={{ marginBottom: 12, color: 'var(--text-main)' }}>Review Mistakes</h3>
                            {mistakes.map((m, i) => (
                                <div key={i} className="drill-mistake-card">
                                    <p className="drill-mistake-q">{m.prompt}</p>
                                    <p className="drill-mistake-wrong">
                                        <X size={14} /> Your answer: {m.userAnswer}
                                    </p>
                                    <p className="drill-mistake-correct">
                                        <Check size={14} /> Correct: {m.correct}
                                    </p>
                                    {m.explanation && (
                                        <p className="drill-mistake-explain">{m.explanation}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <FeedbackBar>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <PrimaryButton onClick={goNext}>Next</PrimaryButton>
                        <button onClick={startDrill} style={{ padding: 14, borderRadius: 12, border: '2px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <RotateCw size={16} /> Try Again
                        </button>
                    </div>
                </FeedbackBar>
            </PracticeShell>
        );
    }

    // ─── Drill Screen ──────────────────────────────────────────────
    const isCorrect = selected === currentQ?.correct;
    const audioKey = currentQ && (currentQ.audioKey ?? currentQ.audio);

    return (
        <PracticeShell onClose={goBack}>
            <ExerciseColumn top={
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Question {qIndex + 1}/{questions.length}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#06D6A0' }}>Score {score}</span>
                    </div>
                    <ProgressBar progress={questions.length ? qIndex / questions.length : 0} />
                </>
            }>
                <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 600, color: 'var(--text-main)', margin: '0 0 14px' }}>{currentQ?.prompt}</p>
                {currentQ?.type === 'listen_pick' && audioKey && (
                    <div style={{ marginBottom: 20 }}><AudioButton onClick={() => playAudio(audioKey)} playToken={playToken} /></div>
                )}
                <OptionGrid
                    options={currentQ?.options || []} cols={2}
                    keyOf={(_, i) => i}
                    isCorrect={(o) => o === currentQ?.correct}
                    isSelected={(o) => o === selected}
                    revealed={showFeedback}
                    onPick={handleSelect}
                >
                    {(opt) => <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>{opt}</span>}
                </OptionGrid>

            </ExerciseColumn>

            <FeedbackBar>
                {showFeedback && (
                    <FeedbackMessage correct={isCorrect}>
                        <strong>{isCorrect ? 'Correct!' : 'Not quite'}</strong>{currentQ?.explanation ? ` — ${currentQ.explanation}` : ''}
                    </FeedbackMessage>
                )}
                {!showFeedback ? (
                    <PrimaryButton onClick={handleCheck} disabled={!selected}>Check</PrimaryButton>
                ) : (
                    <PrimaryButton onClick={handleNext}>{qIndex + 1 >= questions.length ? 'See Results' : 'Continue'}</PrimaryButton>
                )}
            </FeedbackBar>
        </PracticeShell>
    );
}
