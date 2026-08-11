import { useState, useMemo, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { FAMILY_MEMBERS } from '../../data/kinshipData';
import { calculatePronoun } from '../../utils/pronounLogic';
import { ArrowLeft, Trophy } from 'lucide-react';
import SoundButton from '../../components/SoundButton';
import { OptionGrid, FeedbackBar, FeedbackMessage, ExerciseColumn } from '../../components/practice/PracticeKit';
import { ProgressBar } from '../../components/Exercise';
import './PracticeShared.css';
import { playSuccess, playError } from '../../utils/sound';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default function PronounsPractice({ members: memberIds = null, title = 'Pronouns Quiz' }) {
    const { userProfile } = useUser();
    const { session, markComplete, goNext, goBack } = usePracticeCompletion();
    const [mode, setMode] = useState('quiz');
    const [quizState, setQuizState] = useState(null);

    const filteredMembers = useMemo(() =>
        memberIds ? FAMILY_MEMBERS.filter(m => memberIds.includes(m.id) || m.relationType === 'self') : FAMILY_MEMBERS,
        [memberIds]
    );

    const startQuiz = () => {
        const quizMembers = filteredMembers.filter(m => m.relationType !== 'self');
        const questions = shuffleArray(quizMembers).slice(0, Math.min(6 + session, quizMembers.length)).map(member => {
            const correct = calculatePronoun(userProfile, member);
            const allPronouns = [...new Set(
                quizMembers.map(m => calculatePronoun(userProfile, m)?.targetPronoun).filter(Boolean)
            )];
            const distractors = allPronouns.filter(p => p !== correct.targetPronoun).slice(0, 3);
            const options = shuffleArray([correct.targetPronoun, ...distractors]);
            return { member, correct, options };
        });
        setQuizState({ questions, currentIdx: 0, score: 0, feedback: null });
        setMode('quiz');
    };

    // Auto-start quiz on first render
    useEffect(() => {
        if (!quizState && filteredMembers.length > 1) {
            const quizMembers = filteredMembers.filter(m => m.relationType !== 'self');
            const questions = shuffleArray(quizMembers).slice(0, Math.min(6 + session, quizMembers.length)).map(member => {
                const correct = calculatePronoun(userProfile, member);
                const allPronouns = [...new Set(
                    quizMembers.map(m => calculatePronoun(userProfile, m)?.targetPronoun).filter(Boolean)
                )];
                const distractors = allPronouns.filter(p => p !== correct.targetPronoun).slice(0, 3);
                const options = shuffleArray([correct.targetPronoun, ...distractors]);
                return { member, correct, options };
            });
            setQuizState({ questions, currentIdx: 0, score: 0, feedback: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredMembers]);

    const handleQuizAnswer = (answer) => {
        if (quizState.feedback) return; // already answered — a fast double-tap would advance twice
        const q = quizState.questions[quizState.currentIdx];
        const isCorrect = answer === q.correct.targetPronoun;
        if (isCorrect) playSuccess(); else playError();
        setQuizState(prev => ({
            ...prev,
            score: isCorrect ? prev.score + 1 : prev.score,
            feedback: { isCorrect, correct: q.correct, selected: answer },
        }));
        setTimeout(() => {
            if (quizState.currentIdx < quizState.questions.length - 1) {
                setQuizState(prev => ({ ...prev, currentIdx: prev.currentIdx + 1, feedback: null }));
            } else {
                markComplete();
                setMode('quiz-done');
            }
        }, 1500);
    };

    return (
        <div className="practice-layout" style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <button onClick={goBack} style={{ color: 'var(--text-main)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <ArrowLeft size={24} />
                    </button>
                    {title}
                </h1>
            </div>

            {/* Quiz Done */}
            {mode === 'quiz-done' && quizState && (
                <div className="practice-content-centered" style={{ padding: '48px 24px' }}>
                    <Trophy size={80} style={{ color: 'var(--primary-color)', marginBottom: '24px' }} />
                    <h2 className="practice-title">Quiz Complete!</h2>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-color)', margin: '16px 0' }}>
                        {quizState.score} / {quizState.questions.length}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                        <SoundButton className="practice-action-btn" sound="button" style={{ background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', boxShadow: '0 4px 0 var(--border-color)' }} onClick={startQuiz}>
                            Try Again
                        </SoundButton>
                        <SoundButton className="practice-action-btn primary" onClick={goNext}>
                            Next
                        </SoundButton>
                    </div>
                </div>
            )}

            {/* Quiz Playing */}
            {mode === 'quiz' && quizState && quizState.questions[quizState.currentIdx] && (() => {
                const q = quizState.questions[quizState.currentIdx];
                const fb = quizState.feedback;
                return (
                    <>
                        <ExerciseColumn topOffset={64} top={
                            <>
                                <ProgressBar progress={quizState.currentIdx / quizState.questions.length} />
                                <div style={{ textAlign: 'center', marginTop: 18 }}>
                                    <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 6 }}>How do you address your...</p>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)' }}>{q.member.label}?</div>
                                </div>
                            </>
                        }>
                            <OptionGrid
                                options={q.options} cols={2}
                                keyOf={(_, i) => i}
                                isCorrect={(o) => o === q.correct.targetPronoun}
                                isSelected={(o) => fb && o === fb.selected}
                                revealed={!!fb}
                                onPick={(o) => !fb && handleQuizAnswer(o)}
                            >
                                {(opt) => <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>{opt}</span>}
                            </OptionGrid>
                        </ExerciseColumn>
                        {fb && (
                            <FeedbackBar>
                                <FeedbackMessage correct={fb.isCorrect}>
                                    <strong>{fb.isCorrect ? 'Correct!' : `It's "${fb.correct.targetPronoun}"`}</strong>{fb.correct.explanation ? ` — ${fb.correct.explanation}` : ''}
                                </FeedbackMessage>
                            </FeedbackBar>
                        )}
                    </>
                );
            })()}
        </div>
    );
}
