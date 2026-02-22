import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, ChevronDown } from 'lucide-react';
import { getGrammarItems } from '../../lib/grammarDB';
import speak from '../../utils/speak';
import '../Practice/PracticeShared.css';
import './Grammar.css';

const GrammarDetail = () => {
    const { level, index } = useParams();
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);

    const items = getGrammarItems().filter(i => i.level === level);
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

    const { title, pattern, example, sections, faqs, extracted_patterns, error: hasError } = item;

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
                {example?.vi && (
                    <div className="grammar-detail-example">
                        <div>
                            <p>{example.vi}</p>
                            {example.en && <p className="grammar-example-en">{example.en}</p>}
                        </div>
                        <button onClick={() => speak(example.vi)} aria-label="Listen">
                            <Volume2 size={22} />
                        </button>
                    </div>
                )}

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

                {/* Sections */}
                {sections && sections.length > 0 && !hasError && (
                    <>
                        <p className="grammar-section-heading">Sections</p>
                        <div className="grammar-sections">
                            {sections.map((sec, i) => (
                                <div key={i} className="grammar-section-card">
                                    {sec.heading && (
                                        <h3 className="grammar-section-title">{sec.heading}</h3>
                                    )}

                                    {sec.explanation && (
                                        <p className="grammar-section-explanation">{sec.explanation}</p>
                                    )}

                                    {sec.pattern && (
                                        <div className="grammar-section-pattern">
                                            <span className="grammar-pattern-pill">{sec.pattern}</span>
                                        </div>
                                    )}

                                    {sec.note && (
                                        <p className="grammar-section-note">{sec.note}</p>
                                    )}

                                    {sec.examples && sec.examples.length > 0 && (
                                        <div className="grammar-section-examples">
                                            {sec.examples.map((ex, j) => (
                                                <div key={j} className="grammar-example-row">
                                                    <div className="grammar-example-vi">
                                                        <span>{ex.vi}</span>
                                                        {ex.vi && (
                                                            <button
                                                                className="grammar-example-speak"
                                                                onClick={() => speak(ex.vi)}
                                                                aria-label="Listen"
                                                            >
                                                                <Volume2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {ex.en && <div className="grammar-example-en">{ex.en}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
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
