import React, { useState, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import { FAMILY_MEMBERS } from '../../data/kinshipData';
import { calculatePronoun } from '../../utils/pronounLogic';
import { ArrowLeft, CheckCircle, XCircle, Trophy, Delete, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PronounsPractice.css';
import SoundButton from '../../components/SoundButton';
import './PracticeShared.css';
import { playSuccess, playError } from '../../utils/sound';
import { usePracticeCompletion } from '../../hooks/usePracticeCompletion';

// ─── Relationship Chain Resolver ────────────────────────────────────
// Each state represents "who am I currently pointing at" relative to self.
// Transitions: given current state + button pressed → new state.
const TRANSITIONS = {
    'self': {
        'Bố': 'father', 'Mẹ': 'mother',
        'Anh': 'older_brother', 'Chị': 'older_sister',
        'Em trai': 'younger_brother', 'Em gái': 'younger_sister',
        'Con trai': 'son', 'Con gái': 'daughter',
        'Chồng': 'husband', 'Vợ': 'wife',
    },
    'father': {
        'Bố': 'paternal_grandfather', 'Mẹ': 'paternal_grandmother',
        'Anh': 'father_older_brother', 'Chị': 'father_older_sister',
        'Em trai': 'father_younger_brother', 'Em gái': 'father_younger_sister',
        'Vợ': 'mother',
    },
    'mother': {
        'Bố': 'maternal_grandfather', 'Mẹ': 'maternal_grandmother',
        'Anh': 'mother_older_brother', 'Chị': 'mother_older_sister',
        'Em trai': 'mother_younger_brother', 'Em gái': 'mother_younger_sister',
        'Chồng': 'father',
    },
    'older_brother': {
        'Vợ': 'chi_dau',
        'Con trai': 'chau_trai_anh', 'Con gái': 'chau_gai_anh',
        'Bố': 'father', 'Mẹ': 'mother',
    },
    'older_sister': {
        'Chồng': 'anh_re',
        'Con trai': 'chau_trai_chi', 'Con gái': 'chau_gai_chi',
        'Bố': 'father', 'Mẹ': 'mother',
    },
    'younger_brother': {
        'Vợ': 'em_dau',
        'Con trai': 'chau_trai_em', 'Con gái': 'chau_gai_em',
        'Bố': 'father', 'Mẹ': 'mother',
    },
    'younger_sister': {
        'Chồng': 'em_re',
        'Con trai': 'chau_trai_em', 'Con gái': 'chau_gai_em',
        'Bố': 'father', 'Mẹ': 'mother',
    },
    'husband': {
        'Bố': 'bo_chong', 'Mẹ': 'me_chong',
        'Anh': 'anh_chong', 'Chị': 'chi_chong',
        'Em trai': 'em_trai_chong', 'Em gái': 'em_gai_chong',
    },
    'wife': {
        'Bố': 'bo_vo', 'Mẹ': 'me_vo',
        'Anh': 'anh_vo', 'Chị': 'chi_vo',
        'Em trai': 'em_trai_vo', 'Em gái': 'em_gai_vo',
    },
    'son': {
        'Vợ': 'con_dau',
        'Con trai': 'chau_noi_trai', 'Con gái': 'chau_noi_gai',
    },
    'daughter': {
        'Chồng': 'con_re',
        'Con trai': 'chau_ngoai_trai', 'Con gái': 'chau_ngoai_gai',
    },
    'paternal_grandfather': {
        'Bố': 'cu_noi', 'Mẹ': 'cu_ba_noi',
    },
    'maternal_grandfather': {
        'Bố': 'cu_ngoai', 'Mẹ': 'cu_ba_ngoai',
    },
    'father_older_brother': {
        'Vợ': 'bac_gai',
        'Con trai': 'anh_ho_bac', 'Con gái': 'chi_ho_bac',
    },
    'father_younger_brother': {
        'Vợ': 'thim',
        'Con trai': 'em_ho_chu', 'Con gái': 'em_ho_chu_gai',
    },
    'father_younger_sister': {
        'Chồng': 'duong',
        'Con trai': 'em_ho_co', 'Con gái': 'em_ho_co_gai',
    },
    'mother_older_brother': {
        'Vợ': 'mo_cau',
        'Con trai': 'anh_ho_cau', 'Con gái': 'chi_ho_cau',
    },
    'mother_younger_brother': {
        'Vợ': 'mo_cau',
        'Con trai': 'em_ho_cau', 'Con gái': 'em_ho_cau_gai',
    },
    'mother_older_sister': {
        'Chồng': 'duong_di',
        'Con trai': 'anh_ho_di', 'Con gái': 'chi_ho_di',
    },
    'mother_younger_sister': {
        'Chồng': 'duong_di',
        'Con trai': 'em_ho_di', 'Con gái': 'em_ho_di_gai',
    },
};

const RESULTS = {
    'father': { term: 'Bố / Ba', en: 'Father' },
    'mother': { term: 'Mẹ / Má', en: 'Mother' },
    'older_brother': { term: 'Anh (trai)', en: 'Older Brother' },
    'older_sister': { term: 'Chị (gái)', en: 'Older Sister' },
    'younger_brother': { term: 'Em trai', en: 'Younger Brother' },
    'younger_sister': { term: 'Em gái', en: 'Younger Sister' },
    'son': { term: 'Con trai', en: 'Son' },
    'daughter': { term: 'Con gái', en: 'Daughter' },
    'husband': { term: 'Chồng', en: 'Husband' },
    'wife': { term: 'Vợ', en: 'Wife' },
    'paternal_grandfather': { term: 'Ông nội', en: 'Paternal Grandfather' },
    'paternal_grandmother': { term: 'Bà nội', en: 'Paternal Grandmother' },
    'maternal_grandfather': { term: 'Ông ngoại', en: 'Maternal Grandfather' },
    'maternal_grandmother': { term: 'Bà ngoại', en: 'Maternal Grandmother' },
    'father_older_brother': { term: 'Bác (trai)', en: 'Uncle (Father\'s older brother)' },
    'father_older_sister': { term: 'Bác (gái)', en: 'Aunt (Father\'s older sister)', south: { term: 'Cô', en: 'Aunt (Father\'s older sister)' } },
    'father_younger_brother': { term: 'Chú', en: 'Uncle (Father\'s younger brother)' },
    'father_younger_sister': { term: 'Cô', en: 'Aunt (Father\'s younger sister)' },
    'mother_older_brother': { term: 'Bác', en: 'Uncle (Mother\'s older brother)', south: { term: 'Cậu', en: 'Uncle (Mother\'s older brother)' } },
    'mother_younger_brother': { term: 'Cậu', en: 'Uncle (Mother\'s brother)' },
    'mother_older_sister': { term: 'Bác', en: 'Aunt (Mother\'s older sister)', south: { term: 'Dì', en: 'Aunt (Mother\'s older sister)' } },
    'mother_younger_sister': { term: 'Dì', en: 'Aunt (Mother\'s sister)' },
    'chi_dau': { term: 'Chị dâu', en: 'Sister-in-law (older brother\'s wife)' },
    'anh_re': { term: 'Anh rể', en: 'Brother-in-law (older sister\'s husband)' },
    'em_dau': { term: 'Em dâu', en: 'Sister-in-law (younger brother\'s wife)' },
    'em_re': { term: 'Em rể', en: 'Brother-in-law (younger sister\'s husband)' },
    'bo_chong': { term: 'Bố chồng', en: 'Father-in-law (husband\'s father)' },
    'me_chong': { term: 'Mẹ chồng', en: 'Mother-in-law (husband\'s mother)' },
    'bo_vo': { term: 'Bố vợ / Nhạc phụ', en: 'Father-in-law (wife\'s father)' },
    'me_vo': { term: 'Mẹ vợ / Nhạc mẫu', en: 'Mother-in-law (wife\'s mother)' },
    'anh_chong': { term: 'Anh chồng', en: 'Husband\'s older brother' },
    'chi_chong': { term: 'Chị chồng', en: 'Husband\'s older sister' },
    'em_trai_chong': { term: 'Em chồng (trai)', en: 'Husband\'s younger brother' },
    'em_gai_chong': { term: 'Em chồng (gái)', en: 'Husband\'s younger sister' },
    'anh_vo': { term: 'Anh vợ', en: 'Wife\'s older brother' },
    'chi_vo': { term: 'Chị vợ', en: 'Wife\'s older sister' },
    'em_trai_vo': { term: 'Em vợ (trai)', en: 'Wife\'s younger brother' },
    'em_gai_vo': { term: 'Em vợ (gái)', en: 'Wife\'s younger sister' },
    'con_dau': { term: 'Con dâu', en: 'Daughter-in-law' },
    'con_re': { term: 'Con rể', en: 'Son-in-law' },
    'chau_noi_trai': { term: 'Cháu nội (trai)', en: 'Grandson (paternal)' },
    'chau_noi_gai': { term: 'Cháu nội (gái)', en: 'Granddaughter (paternal)' },
    'chau_ngoai_trai': { term: 'Cháu ngoại (trai)', en: 'Grandson (maternal)' },
    'chau_ngoai_gai': { term: 'Cháu ngoại (gái)', en: 'Granddaughter (maternal)' },
    'chau_trai_anh': { term: 'Cháu trai', en: 'Nephew (older brother\'s son)' },
    'chau_gai_anh': { term: 'Cháu gái', en: 'Niece (older brother\'s daughter)' },
    'chau_trai_chi': { term: 'Cháu trai', en: 'Nephew (older sister\'s son)' },
    'chau_gai_chi': { term: 'Cháu gái', en: 'Niece (older sister\'s daughter)' },
    'chau_trai_em': { term: 'Cháu trai', en: 'Nephew (younger sibling\'s son)' },
    'chau_gai_em': { term: 'Cháu gái', en: 'Niece (younger sibling\'s daughter)' },
    'bac_gai': { term: 'Bác gái', en: 'Uncle\'s wife (father\'s older brother)' },
    'thim': { term: 'Thím', en: 'Uncle\'s wife (Chú\'s wife)' },
    'duong': { term: 'Dượng', en: 'Aunt\'s husband (Cô\'s husband)' },
    'mo_cau': { term: 'Mợ', en: 'Uncle\'s wife (Cậu\'s wife)' },
    'duong_di': { term: 'Dượng', en: 'Aunt\'s husband (Dì\'s husband)' },
    'cu_noi': { term: 'Cụ ông nội', en: 'Great-grandfather (paternal)' },
    'cu_ba_noi': { term: 'Cụ bà nội', en: 'Great-grandmother (paternal)' },
    'cu_ngoai': { term: 'Cụ ông ngoại', en: 'Great-grandfather (maternal)' },
    'cu_ba_ngoai': { term: 'Cụ bà ngoại', en: 'Great-grandmother (maternal)' },
    'anh_ho_bac': { term: 'Anh họ', en: 'Older male cousin (Bác\'s side)' },
    'chi_ho_bac': { term: 'Chị họ', en: 'Older female cousin (Bác\'s side)' },
    'em_ho_chu': { term: 'Em họ (trai)', en: 'Younger male cousin (Chú\'s side)' },
    'em_ho_chu_gai': { term: 'Em họ (gái)', en: 'Younger female cousin (Chú\'s side)' },
    'em_ho_co': { term: 'Em họ (trai)', en: 'Younger male cousin (Cô\'s side)' },
    'em_ho_co_gai': { term: 'Em họ (gái)', en: 'Younger female cousin (Cô\'s side)' },
    'anh_ho_cau': { term: 'Anh họ', en: 'Older male cousin (Cậu\'s side)' },
    'chi_ho_cau': { term: 'Chị họ', en: 'Older female cousin (Cậu\'s side)' },
    'em_ho_cau': { term: 'Em họ (trai)', en: 'Younger male cousin (Cậu\'s side)' },
    'em_ho_cau_gai': { term: 'Em họ (gái)', en: 'Younger female cousin (Cậu\'s side)' },
    'anh_ho_di': { term: 'Anh họ', en: 'Older male cousin (Dì\'s side)' },
    'chi_ho_di': { term: 'Chị họ', en: 'Older female cousin (Dì\'s side)' },
    'em_ho_di': { term: 'Em họ (trai)', en: 'Younger male cousin (Dì\'s side)' },
    'em_ho_di_gai': { term: 'Em họ (gái)', en: 'Younger female cousin (Dì\'s side)' },
};

// Calculator button definitions
const CALC_BUTTONS = [
    { label: 'Chồng', key: 'Chồng', type: 'relation' },
    { label: 'Vợ', key: 'Vợ', type: 'relation' },
    { label: 'Bố', key: 'Bố', type: 'relation' },
    { label: 'Mẹ', key: 'Mẹ', type: 'relation' },
    { label: 'Anh', key: 'Anh', type: 'relation' },
    { label: 'Chị', key: 'Chị', type: 'relation' },
    { label: 'Em ♂', key: 'Em trai', type: 'relation' },
    { label: 'Em ♀', key: 'Em gái', type: 'relation' },
    { label: 'Con ♂', key: 'Con trai', type: 'relation' },
    { label: 'Con ♀', key: 'Con gái', type: 'relation' },
    { label: 'của', key: 'của', type: 'operator' },
    { label: '=', key: '=', type: 'equals' },
];

function resolveChain(chain, region = 'north') {
    // Extract relation terms (skip "của")
    const steps = chain.filter(s => s !== 'của');
    if (steps.length === 0) return null;

    // Vietnamese "X của Y" = Y's X, so resolve right-to-left:
    // "Bố của Mẹ" = Mother's Father → start at Mẹ, then Bố
    const reversed = [...steps].reverse();

    let state = 'self';
    for (const step of reversed) {
        const nextState = TRANSITIONS[state]?.[step];
        if (!nextState) {
            return { term: '?', en: 'Unknown combination. Try different terms!' };
        }
        state = nextState;
    }

    const entry = RESULTS[state];
    if (!entry) return { term: '?', en: 'Unknown relationship' };
    // Use regional variant if available
    if (region === 'south' && entry.south) return entry.south;
    return { term: entry.term, en: entry.en };
}

// TTS helper
function speakVietnamese(text) {
    if (!text || text === '?') return;
    // Clean term for TTS (take first option if slash-separated)
    const clean = text.split('/')[0].trim().replace(/\s*\(.*?\)\s*/g, '');
    try {
        const audio = new Audio(`/api/tts?text=${encodeURIComponent(clean)}&lang=vi`);
        audio.play().catch(() => {
            // Fallback to browser TTS
            const utterance = new SpeechSynthesisUtterance(clean);
            utterance.lang = 'vi-VN';
            speechSynthesis.speak(utterance);
        });
    } catch {
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = 'vi-VN';
        speechSynthesis.speak(utterance);
    }
}

export default function PronounsPractice({ members: memberIds = null, title = 'Kinship & Pronouns', showQuiz = false }) {
    const { userProfile } = useUser();
    const { markComplete, goNext } = usePracticeCompletion();
    const [chain, setChain] = useState([]);
    const [result, setResult] = useState(null);
    const [region, setRegion] = useState('north'); // north | south
    const [mode, setMode] = useState('explore'); // explore | quiz | quiz-done
    const [quizState, setQuizState] = useState(null);

    const filteredMembers = useMemo(() =>
        memberIds ? FAMILY_MEMBERS.filter(m => memberIds.includes(m.id) || m.relationType === 'self') : FAMILY_MEMBERS,
        [memberIds]
    );

    // ─── Calculator Logic ───────────────────────────────────────
    const handleButton = (btn) => {
        if (btn.key === '=') {
            if (chain.length === 0) return;
            const resolved = resolveChain(chain, region);
            setResult(resolved);
            if (resolved && resolved.term !== '?') playSuccess();
            else playError();
            return;
        }

        // After showing result, pressing a relation starts fresh
        if (result) {
            if (btn.type === 'relation') {
                setChain([btn.key]);
                setResult(null);
                return;
            }
            if (btn.key === 'của') {
                // Continue chaining from result
                setResult(null);
                setChain(prev => [...prev, 'của']);
                return;
            }
            return;
        }

        if (btn.key === 'của') {
            // Only add "của" after a relation term
            if (chain.length > 0 && chain[chain.length - 1] !== 'của') {
                setChain(prev => [...prev, 'của']);
            }
        } else {
            // Relation button
            if (chain.length === 0 || chain[chain.length - 1] === 'của') {
                setChain(prev => [...prev, btn.key]);
            } else {
                // Auto-insert "của" between consecutive relations
                setChain(prev => [...prev, 'của', btn.key]);
            }
        }
    };

    const handleClear = () => {
        setChain([]);
        setResult(null);
    };

    const handleBackspace = () => {
        if (result) {
            setResult(null);
            return;
        }
        setChain(prev => prev.slice(0, -1));
    };

    // Format chain for display
    const displayText = chain.map(s => {
        if (s === 'của') return 'của';
        if (s === 'Em trai') return 'Em♂';
        if (s === 'Em gái') return 'Em♀';
        if (s === 'Con trai') return 'Con♂';
        if (s === 'Con gái') return 'Con♀';
        return s;
    }).join(' ');

    // ─── Quiz Logic ─────────────────────────────────────────────
    const shuffleArray = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    const startQuiz = () => {
        const quizMembers = filteredMembers.filter(m => m.relationType !== 'self');
        const questions = shuffleArray(quizMembers).slice(0, Math.min(8, quizMembers.length)).map(member => {
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

    const handleQuizAnswer = (answer) => {
        const q = quizState.questions[quizState.currentIdx];
        const isCorrect = answer === q.correct.targetPronoun;
        if (isCorrect) playSuccess(); else playError();
        setQuizState(prev => ({
            ...prev,
            score: isCorrect ? prev.score + 1 : prev.score,
            feedback: { isCorrect, correct: q.correct },
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
        <div className="practice-layout" style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: mode === 'explore' ? 0 : undefined }}>
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <Link to="/practice" style={{ color: 'var(--text-main)', display: 'flex' }}>
                        <ArrowLeft size={24} />
                    </Link>
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
            {mode === 'quiz' && quizState && quizState.questions[quizState.currentIdx] && (
                <div style={{ padding: '24px', maxWidth: 500, margin: '0 auto' }}>
                    <div style={{ height: 16, backgroundColor: 'var(--surface-color)', borderRadius: 15, overflow: 'hidden', marginBottom: 24 }}>
                        <div style={{ width: `${(quizState.currentIdx / quizState.questions.length) * 100}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.3s ease-out', borderRadius: 15 }} />
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: 8 }}>How do you address your...</p>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {quizState.questions[quizState.currentIdx].member.label}?
                        </div>
                    </div>

                    {quizState.feedback && (
                        <div className="practice-feedback-bar" style={{ position: 'relative', marginBottom: 16, animation: 'slideUpResult 0.3s ease-out' }}>
                            <div className={`practice-feedback-msg ${quizState.feedback.isCorrect ? 'correct' : 'incorrect'}`}>
                                <div className={`practice-icon-circle ${quizState.feedback.isCorrect ? 'correct' : 'incorrect'}`}>
                                    {quizState.feedback.isCorrect ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '1.1rem' }}>{quizState.feedback.isCorrect ? 'Correct!' : `It's "${quizState.feedback.correct.targetPronoun}"`}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{quizState.feedback.correct.explanation}</span>
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

            {/* Calculator Mode */}
            {mode === 'explore' && (
                <div className="calc-container">
                    {/* Region Toggle */}
                    <div className="calc-region-toggle">
                        <button
                            className={`calc-region-btn ${region === 'north' ? 'active' : ''}`}
                            onClick={() => { setRegion('north'); setResult(null); }}
                        >
                            Bắc
                        </button>
                        <button
                            className={`calc-region-btn ${region === 'south' ? 'active' : ''}`}
                            onClick={() => { setRegion('south'); setResult(null); }}
                        >
                            Nam
                        </button>
                    </div>

                    {/* Display */}
                    <div className="calc-display">
                        <div className="calc-display-chain">
                            {displayText || '\u00A0'}
                        </div>
                        {result && (
                            <div className={`calc-display-result ${result.term === '?' ? 'unknown' : ''}`}>
                                <div className="calc-result-term">
                                    {result.term}
                                    {result.term !== '?' && (
                                        <button
                                            className="calc-speak-btn"
                                            onClick={() => speakVietnamese(result.term)}
                                        >
                                            <Volume2 size={22} />
                                        </button>
                                    )}
                                </div>
                                <div className="calc-result-en">{result.en}</div>
                            </div>
                        )}
                    </div>

                    {/* Action Row: AC + Backspace */}
                    <div className="calc-action-row">
                        <button className="calc-btn action" onClick={handleClear}>AC</button>
                        <button className="calc-btn action" onClick={handleBackspace}>
                            <Delete size={20} />
                        </button>
                    </div>

                    {/* Keypad Grid */}
                    <div className="calc-keypad">
                        {CALC_BUTTONS.map((btn) => (
                            <button
                                key={btn.key}
                                className={`calc-btn ${btn.type}`}
                                onClick={() => handleButton(btn)}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    {showQuiz && (
                        <div style={{ padding: '16px 0' }}>
                            <SoundButton className="practice-action-btn primary" style={{ width: '100%' }} onClick={startQuiz}>
                                Start Quiz
                            </SoundButton>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
