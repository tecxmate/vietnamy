import { useState } from 'react';
import { ArrowLeft, Volume2, CheckCircle, XCircle, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import SoundButton from '../../components/SoundButton';
import { playSuccess, playError } from '../../utils/sound';
import speak from '../../utils/speak';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';
import './PracticeShared.css';
import './KinshipFoundation.css';

const KINSHIP_TERMS = [
    {
        vn: 'Bố', en: 'Father', gender: 'male', note: 'Also: Ba (South), Cha (formal)',
        contexts: [
            { tag: 'Family', desc: 'Your father' },
            { tag: 'Self', desc: 'How a father refers to himself when speaking to his children' },
        ]
    },
    {
        vn: 'Mẹ', en: 'Mother', gender: 'female', note: 'Also: Má (South)',
        contexts: [
            { tag: 'Family', desc: 'Your mother' },
            { tag: 'Self', desc: 'How a mother refers to herself when speaking to her children' },
        ]
    },
    {
        vn: 'Anh', en: 'Older Brother', gender: 'male',
        contexts: [
            { tag: 'Family', desc: 'Older brother' },
            { tag: 'Romantic', desc: 'Male partner in a relationship' },
            { tag: 'Social', desc: 'Male peer slightly older than you' },
        ]
    },
    {
        vn: 'Chị', en: 'Older Sister', gender: 'female',
        contexts: [
            { tag: 'Family', desc: 'Older sister' },
            { tag: 'Social', desc: 'Female peer slightly older than you' },
        ]
    },
    {
        vn: 'Em', en: 'Younger Sibling', gender: 'neutral',
        contexts: [
            { tag: 'Family', desc: 'Younger sibling (Em trai = brother, Em gái = sister)' },
            { tag: 'Romantic', desc: 'Female partner (or younger male) in a relationship' },
            { tag: 'Social', desc: 'Peer younger than you' },
            { tag: 'Self', desc: 'How you refer to yourself when speaking to someone older' },
        ]
    },
    {
        vn: 'Con', en: 'Child', gender: 'neutral',
        contexts: [
            { tag: 'Family', desc: 'Son or daughter (Con trai / Con gái)' },
            { tag: 'Social', desc: 'Young person about the age of your child' },
            { tag: 'Self', desc: 'How you refer to yourself when speaking to parents' },
        ]
    },
    {
        vn: 'Ông', en: 'Grandfather', gender: 'male',
        contexts: [
            { tag: 'Family', desc: 'Grandfather (Ông nội = paternal, Ông ngoại = maternal)' },
            { tag: 'Social', desc: 'Elderly man / term of respect for older men' },
            { tag: 'Formal', desc: 'Mr. (formal address)' },
        ]
    },
    {
        vn: 'Bà', en: 'Grandmother', gender: 'female',
        contexts: [
            { tag: 'Family', desc: 'Grandmother (Bà nội = paternal, Bà ngoại = maternal)' },
            { tag: 'Social', desc: 'Elderly woman / term of respect for older women' },
            { tag: 'Formal', desc: 'Mrs. (formal address)' },
        ]
    },
    {
        vn: 'Chồng', en: 'Husband', gender: 'male',
        contexts: [
            { tag: 'Family', desc: 'Your husband' },
        ]
    },
    {
        vn: 'Vợ', en: 'Wife', gender: 'female',
        contexts: [
            { tag: 'Family', desc: 'Your wife' },
        ]
    },
    {
        vn: 'của', en: "'s / of", gender: 'neutral',
        contexts: [
            { tag: 'Grammar', desc: 'Possessive particle used to chain relationships' },
            { tag: 'Example', desc: 'Bố của Mẹ = Mother\'s Father = Ông ngoại' },
        ]
    },
];

const speakTerm = (text) => speak(text, 1, 'vi');

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function TermCard({ term }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`kinship-term-card ${term.gender} ${expanded ? 'expanded' : ''}`}>
            <button
                className="kinship-term-top"
                onClick={() => { speakTerm(term.vn); setExpanded(!expanded); }}
            >
                <div className="kinship-term-vn">
                    {term.vn}
                    <Volume2 size={16} className="kinship-term-speaker" />
                </div>
                <div className="kinship-term-en">{term.en}</div>
                {term.note && !expanded && <div className="kinship-term-note">{term.note}</div>}
                {term.contexts && (
                    <div className="kinship-term-expand-hint">
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                )}
            </button>
            {expanded && term.contexts && (
                <div className="kinship-term-contexts">
                    {term.contexts.map((ctx, i) => (
                        <div key={i} className="kinship-context-row">
                            <span className={`kinship-context-tag ${ctx.tag.toLowerCase()}`}>{ctx.tag}</span>
                            <span className="kinship-context-desc">{ctx.desc}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function KinshipFoundation() {
    const { session, markComplete, goNext, goBack } = usePracticeCompletion();
    const [mode, setMode] = useState('learn'); // learn | quiz | quiz-done
    const [quizState, setQuizState] = useState(null);

    const startQuiz = () => {
        const quizTerms = KINSHIP_TERMS.filter(t => t.vn !== 'của');
        const quizCount = Math.min(6 + session, 10);
        const questions = shuffleArray(quizTerms).slice(0, quizCount).map(term => {
            const distractors = shuffleArray(
                quizTerms.filter(t => t.vn !== term.vn)
            ).slice(0, 3).map(t => t.vn);
            const options = shuffleArray([term.vn, ...distractors]);
            return { term, options };
        });
        setQuizState({ questions, currentIdx: 0, score: 0, feedback: null });
        setMode('quiz');
    };

    const handleQuizAnswer = (answer) => {
        const q = quizState.questions[quizState.currentIdx];
        const isCorrect = answer === q.term.vn;
        if (isCorrect) { playSuccess(); speakTerm(q.term.vn); }
        else playError();
        setQuizState(prev => ({
            ...prev,
            score: isCorrect ? prev.score + 1 : prev.score,
            feedback: { isCorrect, correct: q.term },
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
                    Kinship Terms
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
            {mode === 'quiz' && quizState && quizState.questions[quizState.currentIdx] && (
                <div style={{ padding: '24px 0' }}>
                    <div style={{ height: 16, backgroundColor: 'var(--surface-color)', borderRadius: 15, overflow: 'hidden', marginBottom: 24 }}>
                        <div style={{ width: `${(quizState.currentIdx / quizState.questions.length) * 100}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.3s ease-out', borderRadius: 15 }} />
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: 8 }}>What is the Vietnamese word for...</p>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {quizState.questions[quizState.currentIdx].term.en}?
                        </div>
                    </div>

                    {quizState.feedback && (
                        <div className="practice-feedback-bar" style={{ position: 'relative', marginBottom: 16, animation: 'slideUpResult 0.3s ease-out' }}>
                            <div className={`practice-feedback-msg ${quizState.feedback.isCorrect ? 'correct' : 'incorrect'}`}>
                                <div className={`practice-icon-circle ${quizState.feedback.isCorrect ? 'correct' : 'incorrect'}`}>
                                    {quizState.feedback.isCorrect ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '1.1rem' }}>{quizState.feedback.isCorrect ? 'Correct!' : `It's "${quizState.feedback.correct.vn}"`}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{quizState.feedback.correct.en}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {!quizState.feedback && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {quizState.questions[quizState.currentIdx].options.map((opt, i) => (
                                <button key={i} className="secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: 20, fontSize: 18, borderRadius: 15, borderColor: 'var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-main)' }} onClick={() => handleQuizAnswer(opt)}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Learn Mode */}
            {mode === 'learn' && (
                <>
                    <p className="practice-subtitle" style={{ textAlign: 'center', marginBottom: '20px' }}>
                        Tap a card to hear pronunciation and see all contexts.
                    </p>

                    <div className="kinship-term-grid">
                        {KINSHIP_TERMS.map((term) => (
                            <TermCard key={term.vn} term={term} />
                        ))}
                    </div>

                    <div className="practice-bottom-bar" style={{ justifyContent: 'center' }}>
                        <SoundButton className="practice-action-btn primary" onClick={startQuiz}>
                            Start Quiz
                        </SoundButton>
                    </div>
                </>
            )}
        </div>
    );
}
