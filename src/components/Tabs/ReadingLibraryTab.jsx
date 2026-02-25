import React, { useState, useMemo } from 'react';
import { ChevronLeft, Volume2, BookOpen } from 'lucide-react';
import ARTICLES, { ARTICLE_CATEGORIES, ARTICLE_LEVELS } from '../../data/articleData';
import speak from '../../utils/speak';
import './ReadingLibraryTab.css';

const LEVEL_COLORS = { beginner: '#06D6A0', intermediate: '#FFD166', advanced: '#EF476F' };

// ═══════════════════════════════════════════════════════════════
// Article Browse View
// ═══════════════════════════════════════════════════════════════
function ArticleBrowseView({ onSelectArticle }) {
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [levelFilter, setLevelFilter] = useState('all');

    const filtered = useMemo(() =>
        ARTICLES
            .filter(a => categoryFilter === 'all' || a.category === categoryFilter)
            .filter(a => levelFilter === 'all' || a.level === levelFilter),
        [categoryFilter, levelFilter]
    );

    return (
        <div className="rlib-container">
            {/* Category pills */}
            <div className="rlib-pills-row">
                {ARTICLE_CATEGORIES.map(c => (
                    <button
                        key={c.key}
                        className={`rlib-pill ${categoryFilter === c.key ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(c.key)}
                    >
                        {c.emoji} {c.label}
                    </button>
                ))}
            </div>

            {/* Level pills */}
            <div className="rlib-pills-row">
                {ARTICLE_LEVELS.map(l => (
                    <button
                        key={l.key}
                        className={`rlib-pill secondary ${levelFilter === l.key ? 'active' : ''}`}
                        onClick={() => setLevelFilter(l.key)}
                    >
                        {l.label}
                    </button>
                ))}
            </div>

            {/* Article cards */}
            {filtered.map(article => (
                <ArticleCard
                    key={article.id}
                    article={article}
                    onSelect={() => onSelectArticle(article)}
                />
            ))}

            {filtered.length === 0 && (
                <div className="rlib-empty">
                    <BookOpen size={40} />
                    <p>No articles match your filters.</p>
                </div>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Article Card
// ═══════════════════════════════════════════════════════════════
function ArticleCard({ article, onSelect }) {
    const cat = ARTICLE_CATEGORIES.find(c => c.key === article.category);

    return (
        <button className="rlib-article-card" onClick={onSelect}>
            <div className="rlib-article-img">
                <img src={article.image} alt={article.title_en} loading="lazy" />
            </div>
            <div className="rlib-article-body">
                <h3 className="rlib-article-title">{article.title_vi}</h3>
                <p className="rlib-article-subtitle">{article.title_en}</p>
                <span className="rlib-article-time">~{article.readingTimeMins} min</span>
            </div>
        </button>
    );
}


// ═══════════════════════════════════════════════════════════════
// Article Reader View (tap-to-reveal)
// ═══════════════════════════════════════════════════════════════
function ArticleReaderView({ article, onBack }) {
    const [revealedSet, setRevealedSet] = useState(new Set());
    const [translationLang, setTranslationLang] = useState('en');

    const toggleReveal = (idx) => {
        setRevealedSet(prev => {
            const next = new Set(prev);
            next.has(idx) ? next.delete(idx) : next.add(idx);
            return next;
        });
    };

    const handleSpeak = (text, e) => {
        e.stopPropagation();
        speak(text);
    };

    return (
        <div className="rlib-reader-container">
            {/* Simple back arrow */}
            <div className="rlib-reader-back-row">
                <button className="rlib-back-btn" onClick={onBack}>
                    <ChevronLeft size={20} />
                </button>
            </div>

            {/* Hero image */}
            <img className="rlib-reader-hero" src={article.image} alt={article.title_en} />

            {/* Title block with EN/ZH toggle */}
            <div className="rlib-reader-title-block">
                <div className="rlib-reader-title-row">
                    <h1 className="rlib-reader-title-vi">{article.title_vi}</h1>
                    <div className="rlib-lang-toggle">
                        <button
                            className={`rlib-lang-btn ${translationLang === 'en' ? 'active' : ''}`}
                            onClick={() => setTranslationLang('en')}
                        >EN</button>
                        <button
                            className={`rlib-lang-btn ${translationLang === 'zh' ? 'active' : ''}`}
                            onClick={() => setTranslationLang('zh')}
                        >ZH</button>
                    </div>
                </div>
                <p className="rlib-reader-title-en">
                    {translationLang === 'en' ? article.title_en : article.title_zh}
                </p>
            </div>

            {/* Sentence list */}
            <div className="rlib-sentence-list">
                {article.sentences.map((s, idx) => {
                    const isRevealed = revealedSet.has(idx);
                    return (
                        <div
                            key={idx}
                            className={`rlib-sentence-row ${isRevealed ? 'revealed' : ''}`}
                            onClick={() => toggleReveal(idx)}
                        >
                            <div className="rlib-sentence-vi-row">
                                <span className="rlib-sentence-vi">{s.vi}</span>
                                <button
                                    className="speak-btn"
                                    onClick={(e) => handleSpeak(s.vi, e)}
                                >
                                    <Volume2 size={18} />
                                </button>
                            </div>
                            {isRevealed && (
                                <div className="rlib-translation">
                                    {translationLang === 'en' ? s.en : s.zh}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Main Tab Component
// ═══════════════════════════════════════════════════════════════
export default function ReadingLibraryTab({ onSubtitleChange }) {
    const [view, setView] = useState('browse'); // 'browse' | 'reader'
    const [activeArticle, setActiveArticle] = useState(null);

    const enterReader = (article) => {
        setActiveArticle(article);
        setView('reader');
        onSubtitleChange?.('Tap any sentence to reveal translation');
    };

    const exitReader = () => {
        setView('browse');
        setActiveArticle(null);
        onSubtitleChange?.(null);
    };

    if (view === 'reader' && activeArticle) {
        return (
            <ArticleReaderView
                article={activeArticle}
                onBack={exitReader}
            />
        );
    }

    return (
        <ArticleBrowseView onSelectArticle={enterReader} />
    );
}
