import { useState, useMemo, useEffect, useCallback } from 'react';
import { Check, ChevronRight, GraduationCap, Ear, Trophy, RotateCw } from 'lucide-react';
import { getAlphabet } from '../../data/alphabet';
import speak from '../../utils/speak';
import { playSuccess, playError } from '../../utils/sound';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';
import { useEnterKey } from '../../hooks/useEnterKey';
import { PracticeShell, StepDots, AudioButton, OptionGrid, FeedbackBar, FeedbackMessage, PrimaryButton, ExerciseColumn } from '../../components/practice/PracticeKit';

const QUIZ_COUNT = 8;
const STEPS = [{ id: 'learn', icon: GraduationCap, label: 'Learn' }, { id: 'quiz', icon: Ear, label: 'Quiz' }];
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
const big = (l) => l.split(' ')[0]; // "A a" -> "A"
const ttsName = (a) => (a.ttsName || a.name).replace(/-/g, ' ');
const ALPHABET = getAlphabet(); // admin override or bundled default

// Break the 29 letters into small groups so they aren't all shown at once.
const VOWEL_SET = new Set(['a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y']);
const isVowel = (a) => VOWEL_SET.has(big(a.letter).toLowerCase());
const VOWELS = ALPHABET.filter(isVowel);
const CONSONANTS = ALPHABET.filter((a) => !isVowel(a));
const GROUPS = [
    { label: 'Vowels', items: VOWELS.slice(0, 6) },
    { label: 'More vowels', items: VOWELS.slice(6) },
    { label: 'Consonants', items: CONSONANTS.slice(0, 9) },
    { label: 'More consonants', items: CONSONANTS.slice(9) },
];

export default function AlphabetLesson() {
    const { markComplete, goNext, goBack } = usePracticeCompletion();
    const [step, setStep] = useState('learn'); // learn | quiz | done

    return (
        <PracticeShell onClose={goBack} header={<StepDots steps={STEPS} current={step} />}>
            {step === 'learn' && <LearnGroups onDone={() => setStep('quiz')} />}
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

function LearnGroups({ onDone }) {
    const [gi, setGi] = useState(0);
    const [playing, setPlaying] = useState(null);
    const group = GROUPS[gi];
    const last = gi + 1 >= GROUPS.length;
    const advance = () => (last ? onDone() : setGi(gi + 1));
    useEnterKey(advance);
    const play = (a) => { setPlaying(a.letter); speak(ttsName(a), 0.7); setTimeout(() => setPlaying(null), 900); };
    return (
        <div style={{ padding: 16, paddingBottom: 120 }}>
            <div style={{ textAlign: 'center', margin: '4px 0 14px' }}>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{group.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Group {gi + 1} of {GROUPS.length} · tap to hear</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {group.items.map((a) => (
                    <button key={a.letter} onClick={() => play(a)} style={{
                        padding: '14px 6px', borderRadius: 12, border: `2px solid ${playing === a.letter ? '#1CB0F6' : 'var(--border-color)'}`,
                        backgroundColor: 'var(--surface-color)', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    }}>
                        <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)' }}>{a.letter}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1CB0F6' }}>{a.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.sound}</span>
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                {gi > 0 && (
                    <button onClick={() => setGi(gi - 1)} style={{ flex: 1, padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 15, fontFamily: 'inherit', border: '2px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Back</button>
                )}
                <button onClick={advance} style={{ flex: 2, padding: 14, borderRadius: 12, border: 'none', backgroundColor: '#1CB0F6', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{last ? 'Start quiz' : 'Continue'} <ChevronRight size={18} /></button>
            </div>
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

    const play = useCallback(() => { speak(ttsName(q.ans), 0.7); setPlayToken((t) => t + 1); }, [q]);
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
        <>
            <ExerciseColumn top={
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Question {qi + 1}/{questions.length}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#06D6A0' }}>Score {score}</span>
                    </div>
                    <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Listen, then tap the letter you hear.</p>
                </>
            }>
                <div style={{ marginBottom: 20 }}><AudioButton onClick={play} playToken={playToken} /></div>
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
            </ExerciseColumn>
            {picked && (
                <FeedbackBar>
                    <FeedbackMessage correct={correct}>
                        {correct ? 'Correct! ' : 'Answer: '}<strong>{big(q.ans.letter)}</strong> · {q.ans.name}
                    </FeedbackMessage>
                    <PrimaryButton onClick={next}>{qi + 1 >= questions.length ? 'Finish' : 'Next'}</PrimaryButton>
                </FeedbackBar>
            )}
        </>
    );
}
