import { useState } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import speak from '../../utils/speak';
import './PracticeShared.css';
import './KinshipEngine.css';

const speakTerm = (text) => {
    if (!text) return;
    speak(text.split('/')[0].trim(), 1, 'vi');
};

// ─── Logic Engine ───────────────────────────────────────────
function calculate({ category, generation, side, seniority, gender, region }) {
    // Professional override
    if (category === 'professional') {
        const target = gender === 'male' ? 'Thầy' : 'Cô';
        return {
            target,
            self: 'Em / Con',
            note: `${gender === 'male' ? 'Male' : 'Female'} teacher — always ${target} regardless of age.`,
        };
    }

    // Romantic override
    if (category === 'romantic') {
        return {
            target: gender === 'male' ? 'Anh' : 'Em',
            self: gender === 'male' ? 'Em' : 'Anh',
            note: 'In romantic relationships, the man is typically Anh and the woman is Em.',
        };
    }

    // Formal/stranger
    if (category === 'formal') {
        return {
            target: 'Ông / Bà / Anh / Chị',
            self: 'Tôi',
            note: 'Tôi is the only truly neutral "I". Use Ông/Bà for elders, Anh/Chị for peers.',
        };
    }

    // Stranger — estimate by apparent age
    if (category === 'stranger') {
        if (generation === 'grandparent') {
            return {
                target: gender === 'male' ? 'Ông' : 'Bà',
                self: 'Cháu',
                note: 'Elderly stranger — address as grandparent.',
            };
        }
        if (generation === 'parent') {
            if (seniority === 'older') {
                return {
                    target: 'Bác',
                    self: 'Cháu',
                    note: 'Stranger older than your parents — Bác is gender-neutral here.',
                };
            }
            return {
                target: gender === 'male' ? 'Chú' : 'Cô',
                self: 'Cháu',
                note: `Stranger younger than your parents — ${gender === 'male' ? 'Chú' : 'Cô'}.`,
            };
        }
        if (generation === 'peer') {
            if (seniority === 'older') {
                return {
                    target: gender === 'male' ? 'Anh' : 'Chị',
                    self: 'Em',
                    note: `Peer slightly older — ${gender === 'male' ? 'Anh' : 'Chị'}.`,
                };
            }
            return {
                target: 'Em',
                self: gender === 'male' ? 'Anh' : 'Chị',
                note: 'Peer slightly younger — Em.',
            };
        }
        if (generation === 'child') {
            return {
                target: 'Con / Cháu',
                self: gender === 'male' ? 'Chú / Bác' : 'Cô / Bác',
                note: 'Young stranger — Con or Cháu depending on age gap.',
            };
        }
    }

    // Blood relative
    if (category === 'blood') {
        if (generation === 'grandparent') {
            return {
                target: gender === 'male' ? 'Ông' : 'Bà',
                self: 'Cháu',
                note: gender === 'male'
                    ? `Ông nội (paternal) / Ông ngoại (maternal)`
                    : `Bà nội (paternal) / Bà ngoại (maternal)`,
            };
        }

        if (generation === 'parent_direct') {
            return {
                target: gender === 'male' ? 'Bố / Ba' : 'Mẹ / Má',
                self: 'Con',
                note: gender === 'male' ? 'Your father.' : 'Your mother.',
            };
        }

        if (generation === 'parent') {
            // Extended parent generation — uncles/aunts
            if (side === 'paternal') {
                if (seniority === 'older') {
                    if (region === 'south' && gender === 'female') {
                        return { target: 'Cô', self: 'Cháu', note: 'Father\'s older sister (Southern: Cô).' };
                    }
                    return { target: 'Bác', self: 'Cháu', note: `Father's older ${gender === 'male' ? 'brother' : 'sister'} — Bác (gender-neutral in North).` };
                }
                return {
                    target: gender === 'male' ? 'Chú' : 'Cô',
                    self: 'Cháu',
                    note: gender === 'male' ? 'Father\'s younger brother — Chú.' : 'Father\'s younger sister — Cô.',
                };
            }
            if (side === 'maternal') {
                if (seniority === 'older' && region === 'north') {
                    return { target: 'Bác', self: 'Cháu', note: `Mother's older ${gender === 'male' ? 'brother' : 'sister'} — Bác (Northern dialect).` };
                }
                return {
                    target: gender === 'male' ? 'Cậu' : 'Dì',
                    self: 'Cháu',
                    note: gender === 'male' ? 'Mother\'s brother — Cậu.' : 'Mother\'s sister — Dì.',
                };
            }
        }

        if (generation === 'peer') {
            if (seniority === 'older') {
                return {
                    target: gender === 'male' ? 'Anh' : 'Chị',
                    self: 'Em',
                    note: `Older ${gender === 'male' ? 'brother' : 'sister'}.`,
                };
            }
            return {
                target: 'Em',
                self: gender === 'male' ? 'Anh' : 'Chị',
                note: `Younger ${gender === 'male' ? 'brother' : 'sister'}.`,
            };
        }

        if (generation === 'child') {
            return {
                target: 'Con',
                self: gender === 'male' ? 'Bố' : 'Mẹ',
                note: 'Your child. You refer to yourself as Bố (father) or Mẹ (mother).',
            };
        }
    }

    // In-law
    if (category === 'in_law') {
        if (generation === 'spouse_parent') {
            if (side === 'husband') {
                return {
                    target: gender === 'male' ? 'Bố chồng' : 'Mẹ chồng',
                    self: 'Con',
                    note: `Husband's ${gender === 'male' ? 'father' : 'mother'}.`,
                };
            }
            return {
                target: gender === 'male' ? 'Bố vợ' : 'Mẹ vợ',
                self: 'Con',
                note: `Wife's ${gender === 'male' ? 'father' : 'mother'}.`,
            };
        }
        if (generation === 'spouse_sibling') {
            return {
                target: gender === 'male' ? 'Anh / Em (trai)' : 'Chị / Em (gái)',
                self: 'Em / Anh / Chị',
                note: 'Spouse\'s sibling — use age-based terms as if they were your own sibling.',
            };
        }
        if (generation === 'sibling_spouse') {
            if (seniority === 'older') {
                return {
                    target: gender === 'male' ? 'Anh rể' : 'Chị dâu',
                    self: 'Em',
                    note: gender === 'male' ? 'Older sister\'s husband — Anh rể.' : 'Older brother\'s wife — Chị dâu.',
                };
            }
            return {
                target: gender === 'male' ? 'Em rể' : 'Em dâu',
                self: 'Anh / Chị',
                note: gender === 'male' ? 'Younger sister\'s husband — Em rể.' : 'Younger brother\'s wife — Em dâu.',
            };
        }
        if (generation === 'uncle_aunt_spouse') {
            if (side === 'bac') return { target: 'Bác', self: 'Cháu', note: 'Spouse of Bác — also called Bác.' };
            if (side === 'chu') return { target: 'Thím', self: 'Cháu', note: 'Chú\'s wife — Thím.' };
            if (side === 'co') return { target: 'Dượng', self: 'Cháu', note: 'Cô\'s husband — Dượng.' };
            if (side === 'cau') return { target: 'Mợ', self: 'Cháu', note: 'Cậu\'s wife — Mợ.' };
            if (side === 'di') return { target: 'Dượng', self: 'Cháu', note: 'Dì\'s husband — Dượng.' };
        }
        if (generation === 'child_spouse') {
            return {
                target: gender === 'male' ? 'Con rể' : 'Con dâu',
                self: 'Bố / Mẹ',
                note: gender === 'male' ? 'Daughter\'s husband — Con rể.' : 'Son\'s wife — Con dâu.',
            };
        }
    }

    return { target: '?', self: '?', note: 'Select options above.' };
}

// ─── Option configs per category ────────────────────────────
const GENERATION_OPTIONS = {
    blood: [
        { value: 'grandparent', label: 'Grandparent (+2)' },
        { value: 'parent_direct', label: 'Parent (Direct)' },
        { value: 'parent', label: 'Uncle / Aunt (+1)' },
        { value: 'peer', label: 'Sibling (0)' },
        { value: 'child', label: 'Child (-1)' },
    ],
    stranger: [
        { value: 'grandparent', label: 'Elderly (65+)' },
        { value: 'parent', label: 'Parent\'s age (40-60)' },
        { value: 'peer', label: 'Peer (18-35)' },
        { value: 'child', label: 'Young (<18)' },
    ],
    in_law: [
        { value: 'spouse_parent', label: 'Spouse\'s Parent' },
        { value: 'spouse_sibling', label: 'Spouse\'s Sibling' },
        { value: 'sibling_spouse', label: 'Sibling\'s Spouse' },
        { value: 'uncle_aunt_spouse', label: 'Uncle/Aunt\'s Spouse' },
        { value: 'child_spouse', label: 'Child\'s Spouse' },
    ],
};

const SIDE_OPTIONS_BLOOD = [
    { value: 'paternal', label: 'Nội (Paternal)' },
    { value: 'maternal', label: 'Ngoại (Maternal)' },
];

const SIDE_OPTIONS_INLAW_PARENT = [
    { value: 'husband', label: 'Husband\'s side' },
    { value: 'wife', label: 'Wife\'s side' },
];

const SIDE_OPTIONS_UNCLE_SPOUSE = [
    { value: 'bac', label: 'Spouse of Bác' },
    { value: 'chu', label: 'Wife of Chú → Thím' },
    { value: 'co', label: 'Husband of Cô → Dượng' },
    { value: 'cau', label: 'Wife of Cậu → Mợ' },
    { value: 'di', label: 'Husband of Dì → Dượng' },
];

export default function KinshipEngine() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const nodeId = searchParams.get('nodeId');
    const goBack = () => navigate('/', { state: { tab: nodeId ? 'study' : 'practice' } });
    const [category, setCategory] = useState('blood');
    const [generation, setGeneration] = useState('parent_direct');
    const [side, setSide] = useState('paternal');
    const [seniority, setSeniority] = useState('older');
    const [gender, setGender] = useState('male');
    const [region, setRegion] = useState('north');

    const result = calculate({ category, generation, side, seniority, gender, region });

    const showGeneration = ['blood', 'stranger', 'in_law'].includes(category);
    const genOptions = GENERATION_OPTIONS[category] || [];

    const showSide = (category === 'blood' && generation === 'parent')
        || (category === 'in_law' && generation === 'spouse_parent');
    const showUncleSpouseSide = category === 'in_law' && generation === 'uncle_aunt_spouse';

    const showSeniority = (category === 'blood' && ['parent', 'peer'].includes(generation))
        || (category === 'stranger' && generation === 'parent')
        || (category === 'stranger' && generation === 'peer')
        || (category === 'in_law' && generation === 'sibling_spouse');

    const showGender = category !== 'formal'
        && !(category === 'blood' && generation === 'child')
        && !(category === 'in_law' && generation === 'uncle_aunt_spouse');

    const showRegion = category === 'blood' && generation === 'parent';

    return (
        <div className="practice-layout" style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <button onClick={goBack} style={{ color: 'var(--text-main)', display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <ArrowLeft size={24} />
                    </button>
                    Pronoun Engine
                </h1>
            </div>

            <p className="practice-subtitle" style={{ textAlign: 'center', marginBottom: '20px' }}>
                Select the relationship context to find the correct pronoun.
            </p>

            <div className="engine-form">
                {/* Category */}
                <div className="engine-field">
                    <label className="engine-label">Context</label>
                    <div className="engine-chips">
                        {[
                            { value: 'blood', label: 'Family' },
                            { value: 'in_law', label: 'In-Law' },
                            { value: 'stranger', label: 'Stranger' },
                            { value: 'romantic', label: 'Romantic' },
                            { value: 'professional', label: 'Teacher' },
                            { value: 'formal', label: 'Formal' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                className={`engine-chip ${category === opt.value ? 'active' : ''}`}
                                onClick={() => { setCategory(opt.value); setGeneration(GENERATION_OPTIONS[opt.value]?.[0]?.value || 'parent'); }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generation */}
                {showGeneration && genOptions.length > 0 && (
                    <div className="engine-field">
                        <label className="engine-label">Generation</label>
                        <div className="engine-chips">
                            {genOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    className={`engine-chip ${generation === opt.value ? 'active' : ''}`}
                                    onClick={() => setGeneration(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Side of family */}
                {showSide && (
                    <div className="engine-field">
                        <label className="engine-label">Side</label>
                        <div className="engine-chips">
                            {(category === 'in_law' ? SIDE_OPTIONS_INLAW_PARENT : SIDE_OPTIONS_BLOOD).map(opt => (
                                <button
                                    key={opt.value}
                                    className={`engine-chip ${side === opt.value ? 'active' : ''}`}
                                    onClick={() => setSide(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Uncle/Aunt spouse side */}
                {showUncleSpouseSide && (
                    <div className="engine-field">
                        <label className="engine-label">Which relative's spouse?</label>
                        <div className="engine-chips">
                            {SIDE_OPTIONS_UNCLE_SPOUSE.map(opt => (
                                <button
                                    key={opt.value}
                                    className={`engine-chip ${side === opt.value ? 'active' : ''}`}
                                    onClick={() => setSide(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Seniority */}
                {showSeniority && (
                    <div className="engine-field">
                        <label className="engine-label">Seniority</label>
                        <div className="engine-chips">
                            <button className={`engine-chip ${seniority === 'older' ? 'active' : ''}`} onClick={() => setSeniority('older')}>Older</button>
                            <button className={`engine-chip ${seniority === 'younger' ? 'active' : ''}`} onClick={() => setSeniority('younger')}>Younger</button>
                        </div>
                    </div>
                )}

                {/* Gender */}
                {showGender && (
                    <div className="engine-field">
                        <label className="engine-label">Gender</label>
                        <div className="engine-chips">
                            <button className={`engine-chip ${gender === 'male' ? 'active' : ''}`} onClick={() => setGender('male')}>Male</button>
                            <button className={`engine-chip ${gender === 'female' ? 'active' : ''}`} onClick={() => setGender('female')}>Female</button>
                        </div>
                    </div>
                )}

                {/* Region */}
                {showRegion && (
                    <div className="engine-field">
                        <label className="engine-label">Dialect</label>
                        <div className="engine-chips">
                            <button className={`engine-chip ${region === 'north' ? 'active' : ''}`} onClick={() => setRegion('north')}>Bắc (North)</button>
                            <button className={`engine-chip ${region === 'south' ? 'active' : ''}`} onClick={() => setRegion('south')}>Nam (South)</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Result */}
            <div className="engine-result">
                <div className="engine-result-row">
                    <div className="engine-result-side">
                        <span className="engine-result-label">You call them</span>
                        <span className="engine-result-term">{result.target}</span>
                    </div>
                    <div className="engine-result-divider" />
                    <div className="engine-result-side">
                        <span className="engine-result-label">You call yourself</span>
                        <span className="engine-result-term self">{result.self}</span>
                    </div>
                </div>
                {result.target !== '?' && (
                    <button className="engine-speak-btn" onClick={() => speakTerm(result.target)}>
                        <Volume2 size={18} />
                    </button>
                )}
                <div className="engine-result-note">{result.note}</div>
            </div>
        </div>
    );
}
