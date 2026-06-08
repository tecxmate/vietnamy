import { useState, useMemo, useEffect, useCallback } from 'react';
import { Check, ChevronRight, GraduationCap, Ear, Trophy, RotateCw } from 'lucide-react';
import { ALPHABET } from '../../data/alphabet';
import speak from '../../utils/speak';
import { playSuccess, playError } from '../../utils/sound';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';
import { useEnterKey } from '../../hooks/useEnterKey';
import { PracticeShell, StepDots, AudioButton, OptionGrid, FeedbackBar, FeedbackMessage, PrimaryButton } from '../../components/practice/PracticeKit';

const QUIZ_COUNT = 8;
const STEPS = [{ id: 'learn', icon: GraduationCap, label: 'Learn' }, { id: 'quiz', icon: Ear, label: 'Quiz' }];
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
const big = (l) => l.split(' ')[0]; // "A a" -> "A"

export default function AlphabetLesson() {
    const { markComplete, goNext, goBack } = usePracticeCompletion();
    const [step, setStep] = useState('learn'); // learn | quiz | done

    return (
        <PracticeShell onClose={goBack} header={<StepDots steps={STEPS} current={step} />}>
            {step === 'learn' && <LearnGrid onDone={() => setStep('quiz')} />}
            {step === 'quiz' && <Quiz onDone={() => setStep('done')} />}
            {step === 'done' && (
                <div style={{ padding: '40px 24px 120px', textAlign: 'center' }}>
                    <Trophy size={72} color="#FFD166" style={{ marginBottom: 16 }} />
                    <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800 }}>Alphabet down!</h2>
                    <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text-muted)' }}>You met all 29 Vietnamese letters. Next: how they sound in real words.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360, margin: '0 auto' }}>
                        <button onClick={() => { markComplete(); goNext(); }} style={{ padding: 14, borderRadius: 12, border: 'none', backgroundColor: '#06D6A0', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Check size={18} /> Continue</button>
                        <button onClick={() => setStep('learn')} style={{ padding: 14, borderRadius: 12, border: '2px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><RotateCw size={18} /> Practice again</button>
                    </div>
                </div>
            )}
        </PracticeShell>
    );
}

function LearnGrid({ onDone }) {
    const [playing, setPlaying] = useState(null);
    useEnterKey(onDone);
    const play = (a) => { setPlaying(a.letter); speak(a.name, 0.7); setTimeout(() => setPlaying(null), 900); };
    return (
        <div style={{ padding: 16, paddingBottom: 120 }}>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 16px' }}>Tap a letter to hear its name.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {ALPHABET.map((a) => (
                    <button key={a.letter} onClick={() => play(a)} style={{
                        padding: '12px 6px', borderRadius: 12, border: `2px solid ${playing === a.letter ? '#1CB0F6' : 'var(--border-color)'}`,
                        backgroundColor: 'var(--surface-color)', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)' }}>{a.letter}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1CB0F6' }}>{a.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.sound}</span>
                    </button>
                ))}
            </div>
            <button onClick={onDone} style={{ width: '100%', marginTop: 18, padding: 14, borderRadius: 12, border: 'none', backgroundColor: '#1CB0F6', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>Start quiz <ChevronRight size={18} /></button>
        </div>
    );
}

function Quiz({ onDone }) {
    const questions = useMemo(() => shuffle(ALPHABET).slice(0, QUIZ_COUNT).map((ans) => ({
        ans,
        options: shuffle([ans, ...shuffle(ALPHABET.filter((l) => l.letter !== ans.letter)).slice(0, 3)]),
    })), []);
    const [qi, setQi] = useState(0);
    const [picked, setPicked] = useState(null);
    const [score, setScore] = useState(0);
    const [playToken, setPlayToken] = useState(0);
    const q = questions[qi];

    const play = useCallback(() => { speak(q.ans.name, 0.7); setPlayToken((t) => t + 1); }, [q]);
    useEffect(() => { const t = setTimeout(play, 350); return () => clearTimeout(t); }, [play]);

    const pick = (opt) => {
        if (picked) return;
        setPicked(opt);
        if (opt.letter === q.ans.letter) { playSuccess(); setScore((s) => s + 1); } else { playError(); }
    };
    const next = () => { if (qi + 1 >= questions.length) { onDone(); return; } setQi(qi + 1); setPicked(null); setPlayToken(0); };
    useEnterKey(() => { if (picked) next(); });
    const correct = picked && picked.letter === q.ans.letter;

    return (
        <div style={{ padding: 16, paddingBottom: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Question {qi + 1}/{questions.length}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#06D6A0' }}>Score {score}</span>
            </div>
            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', margin: '0 0 16px' }}>Listen, then tap the letter you hear.</p>
            <div style={{ marginBottom: 18 }}><AudioButton onClick={play} playToken={playToken} /></div>
            <OptionGrid
                options={q.options} cols={2}
                keyOf={(o) => o.letter}
                isCorrect={(o) => o.letter === q.ans.letter}
                isSelected={(o) => o === picked}
                revealed={!!picked}
                onPick={pick}
            >
                {(opt) => <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)' }}>{big(opt.letter)}</span>}
            </OptionGrid>
            {picked && (
                <FeedbackBar>
                    <FeedbackMessage correct={correct}>
                        {correct ? 'Correct! ' : 'Answer: '}<strong>{big(q.ans.letter)}</strong> · {q.ans.name}
                    </FeedbackMessage>
                    <PrimaryButton onClick={next}>{qi + 1 >= questions.length ? 'Finish' : 'Next'}</PrimaryButton>
                </FeedbackBar>
            )}
        </div>
    );
}
