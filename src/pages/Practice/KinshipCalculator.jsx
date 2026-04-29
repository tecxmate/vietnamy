import { useState } from 'react';
import { ArrowLeft, Delete, Volume2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './PronounsPractice.css';
import { playSuccess, playError } from '../../utils/sound';
import speak from '../../utils/speak';

// ─── Relationship Chain Resolver ────────────────────────────────────
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
    const steps = chain.filter(s => s !== 'của');
    if (steps.length === 0) return null;
    const reversed = [...steps].reverse();
    let state = 'self';
    for (const step of reversed) {
        const nextState = TRANSITIONS[state]?.[step];
        if (!nextState) return { term: '?', en: 'Unknown combination. Try different terms!' };
        state = nextState;
    }
    const entry = RESULTS[state];
    if (!entry) return { term: '?', en: 'Unknown relationship' };
    if (region === 'south' && entry.south) return entry.south;
    return { term: entry.term, en: entry.en };
}

const speakVietnamese = (text) => {
    if (!text || text === '?') return;
    const clean = text.split('/')[0].trim().replace(/\s*\(.*?\)\s*/g, '');
    speak(clean, 1, 'vi');
};

export default function KinshipCalculator() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const nodeId = searchParams.get('nodeId');
    const goBack = () => navigate('/', { state: { tab: nodeId ? 'study' : 'practice' } });
    const [chain, setChain] = useState([]);
    const [result, setResult] = useState(null);
    const [region, setRegion] = useState('north');

    const handleButton = (btn) => {
        if (btn.key === '=') {
            if (chain.length === 0) return;
            const resolved = resolveChain(chain, region);
            setResult(resolved);
            if (resolved && resolved.term !== '?') playSuccess();
            else playError();
            return;
        }

        if (result) {
            if (btn.type === 'relation') {
                setChain([btn.key]);
                setResult(null);
                return;
            }
            if (btn.key === 'của') {
                setResult(null);
                setChain(prev => [...prev, 'của']);
                return;
            }
            return;
        }

        if (btn.key === 'của') {
            if (chain.length > 0 && chain[chain.length - 1] !== 'của') {
                setChain(prev => [...prev, 'của']);
            }
        } else {
            if (chain.length === 0 || chain[chain.length - 1] === 'của') {
                setChain(prev => [...prev, btn.key]);
            } else {
                setChain(prev => [...prev, 'của', btn.key]);
            }
        }
    };

    const handleClear = () => { setChain([]); setResult(null); };
    const handleBackspace = () => {
        if (result) { setResult(null); return; }
        setChain(prev => prev.slice(0, -1));
    };

    const displayText = chain.map(s => {
        if (s === 'của') return 'của';
        if (s === 'Em trai') return 'Em♂';
        if (s === 'Em gái') return 'Em♀';
        if (s === 'Con trai') return 'Con♂';
        if (s === 'Con gái') return 'Con♀';
        return s;
    }).join(' ');

    return (
        <div className="practice-layout" style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: 0 }}>
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <button onClick={goBack} style={{ color: 'var(--text-main)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <ArrowLeft size={24} />
                    </button>
                    Kinship Calculator
                </h1>
            </div>

            <div className="calc-container">
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

                <div className="calc-action-row">
                    <button className="calc-btn action" onClick={handleClear}>AC</button>
                    <button className="calc-btn action" onClick={handleBackspace}>
                        <Delete size={20} />
                    </button>
                </div>

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
            </div>
        </div>
    );
}
