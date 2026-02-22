import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, ChevronDown } from 'lucide-react';
import grammarBank from '../../data/vn_grammar_bank.json';
import speak from '../../utils/speak';
import '../Practice/PracticeShared.css';
import './Grammar.css';

const GrammarDetail = () => {
    const { level, index } = useParams();
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);

    const items = grammarBank.items.filter(i => i.level === level);
    const item = items[Number(index)];

    if (!item) {
        return (
            <div className="practice-layout">
                <header className="practice-header">
                    <h1 className="practice-header-title">
                        <ArrowLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                        Not Found
                    </h1>
                </header>
                <div className="grammar-error">Pattern not found.</div>
            </div>
        );
    }

    const { title, pattern, example, details, faqs, extracted_patterns } = item;
    const hasError = details?.error;

    // Filter FAQs to only those with both question and answer, and reasonable length
    const validFaqs = (faqs || []).filter(f => f.question && f.answer && f.question.length < 200);

    return (
        <div className="practice-layout">
            <header className="practice-header">
                <h1 className="practice-header-title">
                    <ArrowLeft size={24} onClick={() => navigate(`/grammar/${level}`)} style={{ cursor: 'pointer' }} />
                    {title}
                </h1>
            </header>

            <div className="grammar-detail">
                {/* Main pattern pill */}
                <div className="grammar-detail-pattern">
                    <span className="grammar-pattern-pill">{pattern}</span>
                </div>

                {/* Example with TTS */}
                <div className="grammar-detail-example">
                    <p>{example}</p>
                    <button onClick={() => speak(example)} aria-label="Listen">
                        <Volume2 size={22} />
                    </button>
                </div>

                {/* Extra extracted patterns */}
                {extracted_patterns && extracted_patterns.length > 0 && (
                    <>
                        <p className="grammar-section-heading">Related Patterns</p>
                        <div className="grammar-extra-patterns">
                            {extracted_patterns.map((ep, i) => (
                                <span key={i} className="grammar-pattern-pill">{ep}</span>
                            ))}
                        </div>
                    </>
                )}

                {/* Headings outline */}
                {details?.headings && details.headings.length > 0 && (
                    <>
                        <p className="grammar-section-heading">Sections</p>
                        <div className="grammar-headings-list">
                            {details.headings.map((h, i) => (
                                <span key={i} data-tag={h.tag}>{h.text}</span>
                            ))}
                        </div>
                    </>
                )}

                {/* Full text */}
                {details?.full_text && !hasError && (
                    <>
                        <p className="grammar-section-heading">Full Explanation</p>
                        <div className="grammar-full-text">{details.full_text}</div>
                    </>
                )}

                {hasError && (
                    <div className="grammar-error">
                        Detail content unavailable for this pattern.
                    </div>
                )}

                {/* FAQs */}
                {validFaqs.length > 0 && (
                    <>
                        <p className="grammar-section-heading">FAQs</p>
                        <div className="grammar-faq-list">
                            {validFaqs.map((faq, i) => (
                                <div key={i} className="grammar-faq-item">
                                    <button
                                        className="grammar-faq-question"
                                        aria-expanded={openFaq === i}
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    >
                                        {faq.question}
                                        <ChevronDown size={16} />
                                    </button>
                                    {openFaq === i && (
                                        <div className="grammar-faq-answer">{faq.answer}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default GrammarDetail;
