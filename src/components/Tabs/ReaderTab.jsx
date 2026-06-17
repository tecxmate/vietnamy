import React, { useState } from 'react';
import { ChevronRight, Sparkles, Headphones } from 'lucide-react';
import EXPLAINERS from '../../data/explainerData';
import NarratedReader from './NarratedReader';
import { useT } from '../../lib/i18n';
import './ReaderTab.css';

const LEVEL_META = {
    beginner: { color: '#06D6A0', bg: 'rgba(6,214,160,0.15)' },
    intermediate: { color: '#FFD166', bg: 'rgba(255,209,102,0.15)' },
    advanced: { color: '#EF476F', bg: 'rgba(239,71,111,0.15)' },
};

// Narrated Reader tab — a landing of narrated explainers (slide-synced reader).
// Picking one opens the full-screen NarratedReader; back returns to the list.
export default function ReaderTab() {
    const t = useT();
    const [activeExplainer, setActiveExplainer] = useState(null);

    if (activeExplainer) {
        return <NarratedReader explainer={activeExplainer} onBack={() => setActiveExplainer(null)} />;
    }

    return (
        <div className="reader-tab">
            <div className="reader-tab-header">
                <div className="reader-tab-header-icon"><Headphones size={26} /></div>
                <div className="reader-tab-header-text">
                    <h2 className="reader-tab-title">{t('reader_tab_title')}</h2>
                    <p className="reader-tab-subtitle">{t('reader_tab_subtitle')}</p>
                </div>
            </div>

            <div className="reader-tab-list">
                {EXPLAINERS.map((exp) => {
                    const lvl = LEVEL_META[exp.level] || LEVEL_META.beginner;
                    const lvlLabel = exp.level ? exp.level[0].toUpperCase() + exp.level.slice(1) : '';
                    return (
                        <button key={exp.id} className="reader-card" onClick={() => setActiveExplainer(exp)}>
                            <div className="reader-card-img">
                                <img src={exp.image} alt={exp.title_en} loading="lazy" />
                                <span className="reader-card-badge"><Sparkles size={11} /> {t('reader_card_narrated')}</span>
                            </div>
                            <div className="reader-card-body">
                                <h3 className="reader-card-title">{exp.title_vi}</h3>
                                <p className="reader-card-subtitle">{exp.title_en}</p>
                                <div className="reader-card-meta">
                                    <span className="reader-card-level" style={{ color: lvl.color, background: lvl.bg }}>{lvlLabel}</span>
                                    <span className="reader-card-dot">·</span>
                                    <span>{t('narrated_slide_count').replace('{count}', (exp.slides || []).length)}</span>
                                    {exp.readingTimeMins && (
                                        <>
                                            <span className="reader-card-dot">·</span>
                                            <span>~{exp.readingTimeMins} min</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <ChevronRight size={18} className="reader-card-chev" />
                        </button>
                    );
                })}

                {EXPLAINERS.length === 0 && (
                    <div className="reader-tab-empty">
                        <Headphones size={40} />
                        <p>{t('reader_tab_empty')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
