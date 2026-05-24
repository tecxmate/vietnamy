import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, Volume2, BookOpen, ChevronRight, Layers, Plus, Trash2, BookmarkCheck, Play, X, Check, RotateCw, ArrowUpDown, ListFilter, Clock, SortAsc, SortDesc, LayoutList, LayoutGrid, Trophy, Flame, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ARTICLES, { ARTICLE_CATEGORIES, ARTICLE_LEVELS } from '../../data/articleData';
import VOCAB_WORDS, { CATEGORIES as VOCAB_CATEGORIES } from '../../data/vocabWords';
import speak from '../../utils/speak';
import VocabImage from '../VocabImage';
import { getDueItems, recordReview, getTotalItems } from '../../lib/srs';
import { playSuccess, playError } from '../../utils/sound';

import { useUser } from '../../context/UserContext';
import TappableVietnamese from '../TappableVietnamese';
import WordPopup from '../WordPopup';
import { lookupWords } from '../../lib/dictionaryLookup';
import { Converter } from 'opencc-js';
import {
    getDictSavedWords, toggleDictSavedWord, getDictDecks, createDictDeck,
    removeWordFromDictDeck,
} from '../../lib/dictSavedWords';
import { useT } from '../../lib/i18n';
import './ReadingLibraryTab.css';

const LEVEL_COLORS = { beginner: '#06D6A0', intermediate: '#FFD166', advanced: '#EF476F' };

// ═══════════════════════════════════════════════════════════════
// Content type configs for the tag filter system
// ═══════════════════════════════════════════════════════════════
const CONTENT_TYPES = {
    readings: { labelKey: 'library_readings', icon: BookOpen, color: '#1CB0F6', bg: 'rgba(28,176,246,0.15)', border: 'rgba(28,176,246,0.3)' },
    vocabulary: { labelKey: 'library_vocabulary', icon: Layers, color: '#FF9F43', bg: 'rgba(255,159,67,0.15)', border: 'rgba(255,159,67,0.3)' },
};

const SUB_TAGS = {
    readings: [
        { id: 'Culture', key: 'library_tag_culture' },
        { id: 'Food', key: 'library_tag_food' },
        { id: 'Travel', key: 'library_tag_travel' },
        { id: 'Daily Life', key: 'library_tag_daily_life' },
        { id: 'History', key: 'library_tag_history' },
        { id: 'Business', key: 'library_tag_business' },
    ],
    vocabulary: [
        { id: 'Saved', key: 'library_tag_saved' },
        { id: 'Custom Decks', key: 'library_tag_custom_decks' },
        { id: 'Pre-built', key: 'library_tag_prebuilt' },
    ],
};

const SORT_OPTIONS = [
    { key: 'recent', labelKey: 'library_sort_recent' },
    { key: 'name', labelKey: 'library_sort_name' },
    { key: 'level', labelKey: 'library_sort_level' },
];

const READING_LEVEL_META = {
    beginner: { color: '#06D6A0', bg: 'rgba(6,214,160,0.15)' },
    intermediate: { color: '#FFD166', bg: 'rgba(255,209,102,0.15)' },
    advanced: { color: '#EF476F', bg: 'rgba(239,71,111,0.15)' },
};
const s2t = Converter({ from: 'cn', to: 'tw' });

const toTraditionalIfNeeded = (text, lang) => {
    if (lang !== 'zh-t') return text || '';
    return s2t(text || '');
};

// Build a unified content list from all sources (mockup timestamps)
function libraryCount(t, count, singularKey = 'library_word_singular', pluralKey = 'library_word_plural') {
    return `${count} ${t(count === 1 ? singularKey : pluralKey)}`;
}

function buildLibraryItems(t) {
    const items = [];
    const now = Date.now();

    // Reading articles
    ARTICLES.forEach((art, i) => {
        const catLabel = art.category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const lvlMeta = READING_LEVEL_META[art.level] || READING_LEVEL_META.beginner;
        const createdAt = typeof art.createdAt === 'number' ? art.createdAt : (now - (i + 1) * 86400000 * 5);
        items.push({
            id: `reading-${art.id}`,
            type: 'readings',
            subTag: catLabel,
            title: art.title_en,
            subtitle: t('library_article_meta')
                .replace('{minutes}', art.readingTimeMins)
                .replace('{category}', catLabel),
            itemIcon: BookOpen,
            itemColor: lvlMeta.color,
            itemBg: lvlMeta.bg,
            action: { type: 'openArticle', article: art },
            createdAt,
            sortName: art.title_en,
            levelOrder: ['beginner', 'intermediate', 'advanced'].indexOf(art.level),
        });
    });

    // Vocabulary decks
    // SRS Review
    const dueCount = getDueItems().length;
    items.push({
        id: 'vocab-srs',
        type: 'vocabulary',
        subTag: 'Saved',
        title: t('library_srs_review'),
        subtitle: dueCount > 0 ? t('library_words_due').replace('{count}', dueCount) : t('library_all_caught_up'),
        itemIcon: Flame,
        itemColor: '#FF5722',
        itemBg: 'rgba(255,87,34,0.15)',
        action: { type: 'vocabDeck', deckId: '__srs__' },
        createdAt: now,
        sortName: '!SRS Review',
        levelOrder: -1,
    });
    const savedWords = getDictSavedWords();
    if (savedWords.length > 0) {
        items.push({
            id: 'vocab-saved',
            type: 'vocabulary',
            subTag: 'Saved',
            title: t('library_saved_words'),
            subtitle: libraryCount(t, savedWords.length),
            itemIcon: BookmarkCheck,
            itemColor: '#06D6A0',
            itemBg: 'rgba(6,214,160,0.15)',
            action: { type: 'vocabDeck', deckId: '__saved__' },
            createdAt: now - 86400000,
            sortName: 'Saved Words',
            levelOrder: 0,
        });
    }
    getDictDecks().forEach((deck, i) => {
        items.push({
            id: `vocab-deck-${deck.id}`,
            type: 'vocabulary',
            subTag: 'Custom Decks',
            title: deck.name,
            subtitle: libraryCount(t, deck.words?.length || 0),
            itemIcon: Layers,
            itemColor: '#FF9F43',
            itemBg: 'rgba(255,159,67,0.15)',
            action: { type: 'vocabDeck', deckId: deck.id },
            createdAt: now - (i + 2) * 86400000 * 3,
            sortName: deck.name,
            levelOrder: 1,
        });
    });

    VOCAB_CATEGORIES.filter(c => c.key !== 'all').forEach((cat, i) => {
        items.push({
            id: `vocab-preset-${cat.key}`,
            type: 'vocabulary',
            subTag: 'Pre-built',
            title: cat.label,
            subtitle: libraryCount(t, VOCAB_WORDS.filter(w => w.category === cat.key).length),
            itemIcon: Layers,
            itemColor: '#3B82F6',
            itemBg: 'rgba(59,130,246,0.15)',
            action: { type: 'vocabDeck', deckId: `preset_${cat.key}` },
            createdAt: now - (i + 5) * 86400000 * 10,
            sortName: cat.label,
            levelOrder: 2,
        });
    });

    return items;
}

// ═══════════════════════════════════════════════════════════════
// Library Landing — Spotify-style nested tag filter + sort
// ═══════════════════════════════════════════════════════════════
function LibraryLanding({ onSelectModule, onOpenArticle }) {
    const navigate = useNavigate();
    const t = useT();
    const [activeType, setActiveType] = useState(() => {
        try { return localStorage.getItem('vnme_lib_type') || 'readings'; } catch { return 'readings'; }
    });
    const [activeSubTag, setActiveSubTag] = useState(null);
    const [sortBy, setSortBy] = useState('recent');
    const [sortAsc, setSortAsc] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

    const allItems = useMemo(() => buildLibraryItems(t), [t]);

    const filtered = useMemo(() => {
        let list = allItems;
        if (activeType) list = list.filter(i => i.type === activeType);
        if (activeSubTag) list = list.filter(i => i.subTag === activeSubTag);

        list = [...list].sort((a, b) => {
            if (sortBy === 'recent') return b.createdAt - a.createdAt;
            if (sortBy === 'name') return a.sortName.localeCompare(b.sortName);
            if (sortBy === 'level') return a.levelOrder - b.levelOrder;
            return 0;
        });
        if (sortAsc && sortBy === 'recent') list.reverse();
        if (sortBy === 'name' && !sortAsc) list.reverse();

        return list;
    }, [allItems, activeType, activeSubTag, sortBy, sortAsc]);

    const toggleType = (type) => {
        setActiveType(type);
        setActiveSubTag(null);
        try { localStorage.setItem('vnme_lib_type', type); } catch { /* */ }
    };

    const toggleSubTag = (tag) => {
        setActiveSubTag(activeSubTag === tag ? null : tag);
    };

    const cycleSortBy = () => {
        const idx = SORT_OPTIONS.findIndex(o => o.key === sortBy);
        setSortBy(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].key);
    };

    const handleItemClick = (item) => {
        // Direct route navigation (practice, grammar)
        if (item.route) {
            navigate(item.route);
            return;
        }
        // Open article reader directly
        if (item.action?.type === 'openArticle') {
            onOpenArticle(item.action.article);
            return;
        }
        // Open a specific vocab deck directly
        if (item.action?.type === 'vocabDeck') {
            onSelectModule({ view: 'vocabulary', deckId: item.action.deckId });
            return;
        }
        // Internal view navigation (vocabulary)
        if (item.action?.type === 'view') {
            onSelectModule(item.action.view);
            return;
        }
        // Fallback: open the type's browse view
        onSelectModule(item.type);
    };

    return (
        <div className="lib-landing">
            {/* ── Sub-tag row (top, shows when a type is selected) ── */}
            {activeType && SUB_TAGS[activeType] && (
                <div className="lib-filter-row lib-subtag-row">
                    {SUB_TAGS[activeType].map(tag => {
                        const typeCfg = CONTENT_TYPES[activeType];
                        const isActive = activeSubTag === tag.id;
                        return (
                            <button
                                key={tag.id}
                                className={`lib-tag-chip lib-subtag ${isActive ? 'active' : ''}`}
                                style={isActive ? { backgroundColor: typeCfg.bg, borderColor: typeCfg.color, color: typeCfg.color } : {}}
                                onClick={() => toggleSubTag(tag.id)}
                            >
                                {t(tag.key)}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Sort bar ── */}
            <div className="lib-sort-bar">
                <button className="lib-sort-btn" onClick={cycleSortBy}>
                    <ArrowUpDown size={14} />
                    {t(SORT_OPTIONS.find(o => o.key === sortBy)?.labelKey || 'library_sort_recent')}
                </button>
                <button
                    className="lib-sort-dir-btn"
                    onClick={() => setSortAsc(!sortAsc)}
                    title={sortAsc ? t('library_sort_ascending') : t('library_sort_descending')}
                >
                    {sortAsc ? <SortAsc size={16} /> : <SortDesc size={16} />}
                </button>
                <span className="lib-result-count">{t('library_items_count').replace('{count}', filtered.length)}</span>
                <button
                    className="lib-view-toggle"
                    onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
                    title={viewMode === 'list' ? t('library_grid_view') : t('library_list_view')}
                >
                    {viewMode === 'list' ? <LayoutGrid size={16} /> : <LayoutList size={16} />}
                </button>
            </div>

            {/* ── Content ── */}
            <div className={viewMode === 'grid' ? 'lib-content-grid' : 'lib-content-list'}>
                {activeType === 'vocabulary' && (() => {
                    const c = CONTENT_TYPES.vocabulary.color;
                    return viewMode === 'grid' ? (
                        <button className="lib-grid-card lib-card-dashed" style={{ borderColor: c }} onClick={() => onSelectModule({ view: 'vocabulary', deckId: '__create__' })}>
                            <div className="lib-grid-icon lib-icon-dashed" style={{ borderColor: c }}><Plus size={28} color={c} /></div>
                            <div className="lib-grid-title" style={{ color: c }}>{t('library_new_deck')}</div>
                            <div className="lib-grid-subtitle">{t('library_create_custom_deck_short')}</div>
                        </button>
                    ) : (
                        <button className="lib-content-card lib-card-dashed" style={{ borderColor: c }} onClick={() => onSelectModule({ view: 'vocabulary', deckId: '__create__' })}>
                            <div className="lib-card-icon lib-icon-dashed" style={{ borderColor: c }}><Plus size={22} color={c} /></div>
                            <div className="lib-card-info">
                                <div className="lib-card-title" style={{ color: c }}>{t('library_new_deck')}</div>
                                <div className="lib-card-subtitle">{t('library_create_custom_deck')}</div>
                            </div>
                        </button>
                    );
                })()}
                {filtered.map(item => {
                    const cfg = CONTENT_TYPES[item.type];
                    const Icon = item.itemIcon || cfg.icon;
                    const iconColor = cfg.color;
                    const iconBg = cfg.bg;

                    if (viewMode === 'grid') {
                        return (
                            <button
                                key={item.id}
                                className="lib-grid-card"
                                style={{ borderColor: `${cfg.color}30` }}
                                onClick={() => handleItemClick(item)}
                            >
                                <div className="lib-grid-icon" style={{ backgroundColor: iconBg }}>
                                    <Icon size={28} color={iconColor} />
                                </div>
                                <div className="lib-grid-title">{item.title}</div>
                                <div className="lib-grid-subtitle">{item.subtitle}</div>
                                {!activeType && (
                                    <span className="lib-card-type-badge" style={{ color: cfg.color, backgroundColor: cfg.bg, marginTop: 6 }}>
                                        {t(cfg.labelKey)}
                                    </span>
                                )}
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            className="lib-content-card"
                            style={{ borderColor: `${cfg.color}30` }}
                            onClick={() => handleItemClick(item)}
                        >
                            <div className="lib-card-icon" style={{ backgroundColor: iconBg }}>
                                <Icon size={22} color={iconColor} />
                            </div>
                            <div className="lib-card-info">
                                <div className="lib-card-title">{item.title}</div>
                                <div className="lib-card-subtitle">{item.subtitle}</div>
                            </div>
                            <div className="lib-card-meta">
                                {!activeType && (
                                    <span className="lib-card-type-badge" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                                        {t(cfg.labelKey)}
                                    </span>
                                )}
                                <ChevronRight size={16} color="var(--text-muted)" />
                            </div>
                        </button>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="lib-empty-state">
                        <ListFilter size={32} />
                        <p>{t('library_no_items')}</p>
                    </div>
                )}
            </div>

            {/* ── Primary type bar — floating pill ── */}
            <div id="library-tag-bar" className="lib-type-bar">
                {Object.entries(CONTENT_TYPES).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const isActive = activeType === key;
                    return (
                        <button
                            key={key}
                            className={`lib-type-btn ${isActive ? 'active' : ''}`}
                            style={isActive ? { color: cfg.color } : {}}
                            onClick={() => toggleType(key)}
                        >
                            <Icon size={20} />
                            <span>{t(cfg.labelKey)}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Grammar Browse View (moved from GrammarTab)
// ═══════════════════════════════════════════════════════════════
function GrammarBrowseView({ onBack }) {
    const navigate = useNavigate();
    const allItems = getGrammarItems();
    const grouped = allItems.reduce((acc, item) => {
        acc[item.level] = acc[item.level] || [];
        acc[item.level].push(item);
        return acc;
    }, {});

    return (
        <div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-main)' }}>
                    <ChevronLeft size={24} />
                </button>
                <h2 style={{ margin: 0, fontSize: 18 }}>Grammar</h2>
            </div>
            <div className="grammar-level-cards">
                {GRAMMAR_LEVELS.map(level => {
                    const items = grouped[level] || [];
                    const samples = items.slice(0, 3).map(i => i.title);
                    return (
                        <div
                            key={level}
                            className="grammar-level-card"
                            style={{ '--accent': GRAMMAR_LEVEL_COLORS[level] }}
                            onClick={() => navigate(`/grammar/${level}`)}
                        >
                            <div className="grammar-level-card-header">
                                <span className="grammar-level-badge" style={{ color: GRAMMAR_LEVEL_COLORS[level] }}>
                                    {level}
                                </span>
                                <span className="grammar-level-count">
                                    {items.length} patterns <ChevronRight size={14} />
                                </span>
                            </div>
                            <div className="grammar-level-samples">
                                {samples.map((s, i) => (
                                    <span key={i} className="grammar-level-sample">{s}</span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Article Browse View
// ═══════════════════════════════════════════════════════════════
function ArticleBrowseView({ onSelectArticle, onBack }) {
    const t = useT();
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
            <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-main)' }}>
                    <ChevronLeft size={24} />
                </button>
                <h2 style={{ margin: 0, fontSize: 18 }}>{t('library_readings')}</h2>
            </div>

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
                    <p>{t('library_no_articles')}</p>
                </div>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Article Card
// ═══════════════════════════════════════════════════════════════
function ArticleCard({ article, onSelect }) {
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
    const t = useT();
    const { userProfile } = useUser();
    const [revealedSet, setRevealedSet] = useState(new Set());
    const [translationLang, setTranslationLang] = useState(() => {
        try {
            const savedLang = localStorage.getItem('vnme_reading_translation_lang');
            if (savedLang === 'en' || savedLang === 'zh-s' || savedLang === 'zh-t') return savedLang;
            if (savedLang === 'zh') return 'zh-s';
        } catch { }
        return 'en';
    });
    const [copiedCode, setCopiedCode] = useState(false);

    const toggleReveal = (idx) => {
        setRevealedSet(prev => {
            const next = new Set(prev);
            next.has(idx) ? next.delete(idx) : next.add(idx);
            return next;
        });
    };

    const [popupWord, setPopupWord] = useState(null);

    const handleWordTap = (word, rect, isPhrase = false) => {
        if (!word) { setPopupWord(null); return; }
        setPopupWord({ word, anchorRect: rect, isPhrase });
    };

    const handleSpeak = (text, e) => {
        e.stopPropagation();
        speak(text);
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const setAndPersistLang = (lang) => {
        setTranslationLang(lang);
        try {
            localStorage.setItem('vnme_reading_translation_lang', lang);
        } catch { }
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
                            onClick={() => setAndPersistLang('en')}
                        >
                            EN
                        </button>
                        <button
                            className={`rlib-lang-btn ${translationLang === 'zh-s' ? 'active' : ''}`}
                            onClick={() => setAndPersistLang('zh-s')}
                        >
                            <span className="rlib-lang-full">简体</span>
                            <span className="rlib-lang-short">简</span>
                        </button>
                        <button
                            className={`rlib-lang-btn ${translationLang === 'zh-t' ? 'active' : ''}`}
                            onClick={() => setAndPersistLang('zh-t')}
                        >
                            <span className="rlib-lang-full">繁體</span>
                            <span className="rlib-lang-short">繁</span>
                        </button>
                    </div>
                </div>
                <p className="rlib-reader-title-en">
                    {translationLang === 'en' ? article.title_en : toTraditionalIfNeeded(article.title_zh, translationLang)}
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
                                <span className="rlib-sentence-vi">
                                    <TappableVietnamese text={s.vi} onWordTap={handleWordTap} />
                                </span>
                                <button
                                    className="speak-btn"
                                    onClick={(e) => handleSpeak(s.vi, e)}
                                >
                                    <Volume2 size={18} />
                                </button>
                            </div>
                            {isRevealed && (
                                <div className="rlib-translation">
                                    {translationLang === 'en' ? s.en : toTraditionalIfNeeded(s.zh, translationLang)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Word Popup */}
            {popupWord && (
                <WordPopup
                    word={popupWord.word}
                    anchorRect={popupWord.anchorRect}
                    dictMode={translationLang === 'en' ? 'en' : translationLang}
                    isPhrase={popupWord.isPhrase}
                    onClose={() => setPopupWord(null)}
                    onNavigate={() => setPopupWord(null)}
                    onSave={(word) => { toggleDictSavedWord(word); setPopupWord(null); }}
                />
            )}

            {/* Partner CTA Section */}
            {(article.partnerCta && userProfile?.isDeveloperMode) && (
                <div className="rlib-partner-cta">
                    <img
                        src={article.partnerCta.img}
                        alt="Partner"
                        className="rlib-cta-img"
                    />
                    <div className="rlib-cta-content">
                        <h3 className="rlib-cta-title">
                            {translationLang === 'en' ? article.partnerCta.title_en : toTraditionalIfNeeded(article.partnerCta.title_zh, translationLang)}
                        </h3>
                        <p className="rlib-cta-desc">
                            {translationLang === 'en' ? article.partnerCta.desc_en : toTraditionalIfNeeded(article.partnerCta.desc_zh, translationLang)}
                        </p>

                        <div className="rlib-cta-actions">
                            <div className="rlib-cta-code-box">
                                <span className="rlib-cta-code-label">{t('dict_partner_code')}</span>
                                <span className="rlib-cta-code-val">{article.partnerCta.code}</span>
                                <button
                                    className={`rlib-cta-copy-btn ${copiedCode ? 'copied' : ''}`}
                                    onClick={() => handleCopyCode(article.partnerCta.code)}
                                >
                                    {copiedCode ? t('copied') : t('copy')}
                                </button>
                            </div>

                            <a
                                href={article.partnerCta.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rlib-cta-link-btn"
                                style={{
                                    backgroundColor: article.partnerCta.theme || 'var(--primary-color)',
                                    boxShadow: `0 4px 0 ${article.partnerCta.themeDark || '#E5A503'}`,
                                    color: '#fff'
                                }}
                            >
                                {t('library_get_discount').replace('{discount}', translationLang === 'en' ? article.partnerCta.discount_en : toTraditionalIfNeeded(article.partnerCta.discount_zh, translationLang))}
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Pre-built vocab decks
// ═══════════════════════════════════════════════════════════════
const PRE_BUILT_DECKS = VOCAB_CATEGORIES.filter(c => c.key !== 'all').map(cat => ({
    id: `preset_${cat.key}`,
    type: 'preset',
    name: cat.label,
    emoji: cat.emoji,
    words: VOCAB_WORDS.filter(w => w.category === cat.key).map(w => w.vietnamese),
}));

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ═══════════════════════════════════════════════════════════════
// Flashcard Study View — all cards are plain Vietnamese word strings
// ═══════════════════════════════════════════════════════════════
function FlashcardStudyView({ deckName, cards, onBack }) {
    const t = useT();
    const [shuffled] = useState(() => shuffle(cards));
    const [index, setIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [results, setResults] = useState({});
    const [phase, setPhase] = useState('test');
    const [retryCards, setRetryCards] = useState([]);
    const [retryIndex, setRetryIndex] = useState(0);
    const [retryRevealed, setRetryRevealed] = useState(false);
    const [swipeDir, setSwipeDir] = useState(null);
    const [dictInfo, setDictInfo] = useState(new Map());
    const touchStartX = useRef(null);

    // Fetch dictionary definitions for all cards
    useEffect(() => {
        lookupWords(cards).then(info => setDictInfo(info));
    }, [cards]);

    const isRetry = phase === 'retry';
    const activeCards = isRetry ? retryCards : shuffled;
    const activeIndex = isRetry ? retryIndex : index;
    const activeRevealed = isRetry ? retryRevealed : revealed;
    const card = activeCards[activeIndex];
    const total = activeCards.length;

    const toggleFlip = () => {
        if (isRetry) setRetryRevealed(r => !r);
        else setRevealed(r => !r);
        if (!activeRevealed && card) speak(card);
    };

    const advance = (verdict) => {
        const cardKey = card;
        setSwipeDir(verdict === 'know' ? 'right' : 'left');
        setTimeout(() => {
            setSwipeDir(null);
            if (!isRetry) setResults(prev => ({ ...prev, [cardKey]: verdict }));
            if (activeIndex < total - 1) {
                if (isRetry) { setRetryIndex(i => i + 1); setRetryRevealed(false); }
                else { setIndex(i => i + 1); setRevealed(false); }
            } else {
                setPhase('score');
            }
        }, 200);
    };

    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (dx > 60) advance('know');
        else if (dx < -60) advance('unknown');
        else if (Math.abs(dx) < 15) toggleFlip();
    };

    useEffect(() => {
        const onKey = (e) => {
            if (phase === 'score') return;
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleFlip(); }
            else if (e.key === 'ArrowRight') advance('know');
            else if (e.key === 'ArrowLeft') advance('unknown');
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    const knownCount = Object.values(results).filter(v => v === 'know').length;
    const unknownCount = Object.values(results).filter(v => v === 'unknown').length;
    const scoreOf100 = shuffled.length > 0 ? Math.round((knownCount / shuffled.length) * 100) : 0;
    const unknownCards = shuffled.filter(c => results[c] === 'unknown');

    const handleRetry = () => {
        setRetryCards(shuffle(unknownCards));
        setRetryIndex(0);
        setRetryRevealed(false);
        setPhase('retry');
    };

    if (phase === 'score') {
        return (
            <div className="fc-study-container">
                <div className="fc-study-header">
                    <button className="vocab-back-btn" onClick={onBack}><ChevronLeft size={20} /> {t('done')}</button>
                    <span className="fc-study-name">{deckName}</span>
                </div>
                <div className="fc-score-screen">
                    <div className="fc-score-circle">
                        <span className="fc-score-number">{scoreOf100}</span>
                        <span className="fc-score-label">/ 100</span>
                    </div>
                    <h2 className="fc-score-title">
                        {scoreOf100 >= 90 ? t('library_score_excellent') : scoreOf100 >= 70 ? t('library_score_great') : scoreOf100 >= 50 ? t('library_score_good_effort') : t('library_score_keep_practicing')}
                    </h2>
                    <div className="fc-score-stats">
                        <div className="fc-stat know"><Check size={16} /> {knownCount} {t('library_known')}</div>
                        <div className="fc-stat unknown"><X size={16} /> {unknownCount} {t('library_dont_know')}</div>
                    </div>
                    {unknownCards.length > 0 && (
                        <button className="fc-retry-btn" onClick={handleRetry}>
                            <RotateCw size={16} /> {t('library_practice_again').replace('{count}', unknownCards.length)}
                        </button>
                    )}
                    <button className="fc-back-btn" onClick={onBack}>{t('library_back_to_decks')}</button>
                </div>
            </div>
        );
    }

    if (!card) return null;

    return (
        <div className="fc-study-container">
            <div className="fc-study-header">
                <button className="vocab-back-btn" onClick={onBack}><ChevronLeft size={20} /></button>
                <span className="fc-study-name">{deckName}</span>
                <span className="fc-study-counter">{activeIndex + 1} / {total}</span>
            </div>
            <div className="fc-progress-bar">
                <div className="fc-progress-fill" style={{ width: `${((activeIndex + 1) / total) * 100}%` }} />
            </div>
            <div className="fc-card-zone">
                <div className={`fc-zone-label left ${swipeDir === 'left' ? 'active' : ''}`}><X size={22} /></div>
                <div
                    className={`fc-card ${activeRevealed ? 'revealed' : ''} ${swipeDir ? `swipe-${swipeDir}` : ''}`}
                    onClick={toggleFlip}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                >
                    <div className="fc-card-inner">
                        <div className="fc-card-front">
                            <span className="fc-card-vi" style={{ fontSize: 32 }}>{card}</span>
                            <span className="fc-card-tap">{t('library_tap_to_reveal')}</span>
                        </div>
                        <div className="fc-card-back">
                            <span className="fc-card-vi">{card}</span>
                            <button className="fc-card-listen" onClick={(e) => { e.stopPropagation(); speak(card); }}>
                                <Volume2 size={18} /> {t('listen')}
                            </button>
                            <div className="fc-card-divider" />
                            {dictInfo.get(card) ? (
                                <>
                                    <span className="fc-card-en">{dictInfo.get(card).definition}</span>
                                    {dictInfo.get(card).tags?.length > 0 && (
                                        <div className="fc-card-tags">
                                            {[...new Set(dictInfo.get(card).tags)].slice(0, 3).map((tag, i) => (
                                                <span key={i} className="fc-card-tag">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <span className="fc-card-hint">{t('library_did_you_know')}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className={`fc-zone-label right ${swipeDir === 'right' ? 'active' : ''}`}><Check size={22} /></div>
            </div>
            <div className="fc-actions">
                <button className="fc-btn dont-know" onClick={() => advance('unknown')}>
                    <X size={22} /> {t('library_dont_know')}
                </button>
                <button className="fc-btn know" onClick={() => advance('know')}>
                    <Check size={22} /> {t('library_know')}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Vocab Quiz View — multiple-choice quiz from any word list
// ═══════════════════════════════════════════════════════════════
const quizShuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function VocabQuizView({ deckName, words, onBack }) {
    const t = useT();
    const [questions] = useState(() => {
        const pool = VOCAB_WORDS;
        const deckWords = pool.filter(w => words.includes(w.vietnamese));
        const shuffled = quizShuffle(deckWords).slice(0, 15);
        return shuffled.map(word => {
            const correct = word.vietnamese;
            const distractors = quizShuffle(pool.filter(w => w.vietnamese !== correct).map(w => w.vietnamese)).slice(0, 3);
            return { word, question: t('library_quiz_question'), correct, options: quizShuffle([correct, ...distractors]) };
        });
    });
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [feedback, setFeedback] = useState('idle');
    const [score, setScore] = useState(0);
    // eslint-disable-next-line no-unused-vars
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [showSummary, setShowSummary] = useState(false);

    const total = questions.length;
    const currentQ = questions[qIndex];
    const progress = total > 0 ? (qIndex / total) * 100 : 0;

    const handleCheck = useCallback(() => {
        if (!selected || !currentQ) return;
        const isCorrect = selected === currentQ.correct;
        if (isCorrect) {
            playSuccess();
            setFeedback('correct');
            setScore(s => s + 1);
            setStreak(s => { const n = s + 1; setBestStreak(b => Math.max(b, n)); return n; });
            speak(currentQ.word.vietnamese);
        } else {
            playError();
            setFeedback('incorrect');
            setStreak(0);
        }
    }, [selected, currentQ]);

    const handleContinue = useCallback(() => {
        if (qIndex < total - 1) {
            setQIndex(i => i + 1);
            setSelected(null);
            setFeedback('idle');
        } else {
            setShowSummary(true);
        }
    }, [qIndex, total]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Enter' || showSummary) return;
            if (feedback === 'idle' && selected) handleCheck();
            else if (feedback !== 'idle') handleContinue();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [feedback, selected, handleCheck, handleContinue, showSummary]);

    if (total === 0) {
        return (
            <div className="fc-study-container">
                <div className="fc-study-header">
                    <button className="vocab-back-btn" onClick={onBack}><ChevronLeft size={20} /> {t('dict_back')}</button>
                    <span className="fc-study-name">{deckName} — {t('roadmap_type_quiz')}</span>
                </div>
                <div className="fc-score-screen">
                    <p style={{ color: 'var(--text-muted)' }}>{t('library_not_enough_words')}</p>
                    <button className="fc-back-btn" onClick={onBack}>{t('library_back_to_decks')}</button>
                </div>
            </div>
        );
    }

    if (showSummary) {
        const pct = Math.round((score / total) * 100);
        let msg = t('library_score_keep_practicing');
        if (pct >= 90) msg = t('library_vocab_master');
        else if (pct >= 70) msg = t('library_great_memory');
        else if (pct >= 50) msg = t('library_good_progress');
        return (
            <div className="fc-study-container">
                <div className="fc-study-header">
                    <button className="vocab-back-btn" onClick={onBack}><ChevronLeft size={20} /> {t('done')}</button>
                    <span className="fc-study-name">{deckName} — {t('roadmap_type_quiz')}</span>
                </div>
                <div className="fc-score-screen">
                    <Trophy size={48} style={{ color: 'var(--primary-color)', marginBottom: 12 }} />
                    <div className="fc-score-circle">
                        <span className="fc-score-number">{score}</span>
                        <span className="fc-score-label">/ {total}</span>
                    </div>
                    <h2 className="fc-score-title">{msg}</h2>
                    <div className="fc-score-stats">
                        <div className="fc-stat know"><Check size={16} /> {score} {t('stat_correct')}</div>
                        <div className="fc-stat unknown"><X size={16} /> {total - score} {t('library_wrong')}</div>
                    </div>
                    {bestStreak > 1 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('library_best_streak').replace('{count}', bestStreak)}</p>}
                    <button className="fc-back-btn" onClick={onBack}>{t('library_back_to_decks')}</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fc-study-container">
            <div className="fc-study-header">
                <button className="vocab-back-btn" onClick={onBack}><ChevronLeft size={20} /></button>
                <span className="fc-study-name">{deckName} — {t('roadmap_type_quiz')}</span>
                <span className="fc-study-counter">{qIndex + 1} / {total}</span>
            </div>
            <div className="fc-progress-bar">
                <div className="fc-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="vq-quiz-area">
                {currentQ.word.image && (
                    <div className="vq-quiz-image">
                        <VocabImage word={currentQ.word} alt="quiz" />
                    </div>
                )}
                <div className="vq-quiz-hint">{currentQ.word.english}</div>
                <div className="vq-quiz-question">{currentQ.question}</div>
                <div className="vq-quiz-options">
                    {currentQ.options.map((opt, i) => {
                        let cls = 'vq-option';
                        if (feedback !== 'idle') {
                            if (opt === currentQ.correct) cls += ' correct';
                            else if (opt === selected) cls += ' wrong';
                            else cls += ' dim';
                        } else if (opt === selected) cls += ' selected';
                        return (
                            <button key={i} className={cls} onClick={() => feedback === 'idle' && setSelected(opt)}>{opt}</button>
                        );
                    })}
                </div>
                <div className="vq-quiz-bottom">
                    {feedback === 'idle' ? (
                        <button className={`vq-action-btn ${selected ? 'primary' : 'disabled'}`} onClick={handleCheck} disabled={!selected}>{t('check_upper')}</button>
                    ) : (
                        <button className={`vq-action-btn ${feedback === 'correct' ? 'success' : 'danger'}`} onClick={handleContinue}>
                            {feedback === 'correct' ? t('feedback_correct') : `${t('library_wrong')} — ${currentQ.correct}`} — {t('continue')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Vocab SRS Review View — spaced repetition review
// ═══════════════════════════════════════════════════════════════
function VocabReviewView({ onBack }) {
    const t = useT();
    const [dueItems] = useState(() => getDueItems());
    const totalSRS = getTotalItems();
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [feedback, setFeedback] = useState('idle');
    const [score, setScore] = useState(0);
    const [showSummary, setShowSummary] = useState(false);

    const questions = useMemo(() => {
        if (dueItems.length === 0) return [];
        const items = quizShuffle(dueItems).slice(0, 15);
        return items.map(item => {
            const distractors = quizShuffle(
                VOCAB_WORDS.filter(w => w.vietnamese !== item.vietnamese).map(w => w.vietnamese)
            ).slice(0, 3);
            return {
                item,
                question: t('library_review_question').replace('{word}', item.english),
                correct: item.vietnamese,
                options: quizShuffle([item.vietnamese, ...distractors]),
            };
        });
    }, [dueItems]);

    if (dueItems.length === 0) {
        return (
            <div className="fc-study-container">
                <div className="fc-study-header">
                    <button className="vocab-back-btn" onClick={onBack}><ChevronLeft size={20} /> {t('dict_back')}</button>
                    <span className="fc-study-name">{t('library_srs_review')}</span>
                </div>
                <div className="fc-score-screen">
                    <Check size={48} style={{ color: 'var(--success-color)', marginBottom: 12 }} />
                    <h2 className="fc-score-title">{t('library_all_caught_up')}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                        {totalSRS > 0
                            ? t('library_review_deck_count').replace('{count}', totalSRS)
                            : t('library_review_empty_help')}
                    </p>
                    <button className="fc-back-btn" onClick={onBack}>{t('library_back_to_decks')}</button>
                </div>
            </div>
        );
    }

    if (showSummary) {
        return (
            <div className="fc-study-container">
                <div className="fc-study-header">
                    <button className="vocab-back-btn" onClick={onBack}><ChevronLeft size={20} /> {t('done')}</button>
                    <span className="fc-study-name">{t('library_srs_review')}</span>
                </div>
                <div className="fc-score-screen">
                    <Trophy size={48} style={{ color: 'var(--primary-color)', marginBottom: 12 }} />
                    <div className="fc-score-circle">
                        <span className="fc-score-number">{score}</span>
                        <span className="fc-score-label">/ {questions.length}</span>
                    </div>
                    <h2 className="fc-score-title">{t('library_review_complete')}</h2>
                    <button className="fc-back-btn" onClick={onBack}>{t('library_back_to_decks')}</button>
                </div>
            </div>
        );
    }

    const currentQ = questions[qIndex];
    if (!currentQ) return null;
    const progress = (qIndex / questions.length) * 100;

    const handleCheck = () => {
        if (!selected) return;
        const isCorrect = selected === currentQ.correct;
        recordReview(currentQ.item.itemId, isCorrect);
        if (isCorrect) {
            playSuccess();
            setFeedback('correct');
            setScore(s => s + 1);
            speak(currentQ.item.vietnamese);
        } else {
            playError();
            setFeedback('incorrect');
        }
    };

    const handleContinue = () => {
        if (qIndex < questions.length - 1) {
            setQIndex(i => i + 1);
            setSelected(null);
            setFeedback('idle');
        } else {
            setShowSummary(true);
        }
    };

    return (
        <div className="fc-study-container">
            <div className="fc-study-header">
                <button className="vocab-back-btn" onClick={onBack}><ChevronLeft size={20} /></button>
                <span className="fc-study-name">{t('library_srs_review')}</span>
                <span className="fc-study-counter">{qIndex + 1} / {questions.length}</span>
            </div>
            <div className="fc-progress-bar">
                <div className="fc-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="vq-quiz-area">
                <div className="vq-quiz-question">{currentQ.question}</div>
                <div className="vq-quiz-options">
                    {currentQ.options.map((opt, i) => {
                        let cls = 'vq-option';
                        if (feedback !== 'idle') {
                            if (opt === currentQ.correct) cls += ' correct';
                            else if (opt === selected) cls += ' wrong';
                            else cls += ' dim';
                        } else if (opt === selected) cls += ' selected';
                        return (
                            <button key={i} className={cls} onClick={() => feedback === 'idle' && setSelected(opt)}>{opt}</button>
                        );
                    })}
                </div>
                <div className="vq-quiz-bottom">
                    {feedback === 'idle' ? (
                        <button className={`vq-action-btn ${selected ? 'primary' : 'disabled'}`} onClick={handleCheck} disabled={!selected}>{t('check_upper')}</button>
                    ) : (
                        <button className={`vq-action-btn ${feedback === 'correct' ? 'success' : 'danger'}`} onClick={handleContinue}>
                            {feedback === 'correct' ? t('feedback_correct') : `${t('feedback_correct_answer')}: ${currentQ.correct}`} — {t('continue')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Vocabulary Browse View (combined: dict saved + custom + pre-built)
// ═══════════════════════════════════════════════════════════════
function VocabularyBrowseView({ onBack, onSearchWord, initialDeckId }) {
    const t = useT();
    const [savedWords, setSavedWords] = useState(() => getDictSavedWords());
    const [customDecks, setCustomDecks] = useState(() => getDictDecks());
    const [studyDeck, setStudyDeck] = useState(null);
    const [quizDeck, setQuizDeck] = useState(null);
    const [showCreate, setShowCreate] = useState(initialDeckId === '__create__');
    const [newName, setNewName] = useState('');

    // Resolve initialDeckId into the right view
    const [activeDeck] = useState(() => {
        if (!initialDeckId || initialDeckId === '__srs__' || initialDeckId === '__create__') return null;
        if (initialDeckId === '__saved__') return { id: '__saved__', name: t('library_saved_words') };
        if (initialDeckId.startsWith('preset_')) return { id: initialDeckId, type: 'preset' };
        const custom = getDictDecks().find(d => d.id === initialDeckId);
        if (custom) return { ...custom, type: 'custom' };
        return null;
    });
    const [showReview] = useState(initialDeckId === '__srs__');

    const handleCreate = () => {
        if (!newName.trim()) return;
        createDictDeck(newName.trim());
        setNewName('');
        setShowCreate(false);
        onBack();
    };

    const handleRemoveWord = (word) => {
        if (activeDeck) {
            removeWordFromDictDeck(activeDeck.id, word);
            setCustomDecks(getDictDecks());
        }
    };

    const startStudy = (name, cards) => {
        if (cards.length === 0) return;
        setStudyDeck({ name, cards });
    };

    const startQuiz = (name, words) => {
        if (words.length === 0) return;
        setQuizDeck({ name, words });
    };

    // SRS Review mode
    if (showReview) {
        return <VocabReviewView onBack={onBack} />;
    }

    // Quiz mode
    if (quizDeck) {
        return <VocabQuizView deckName={quizDeck.name} words={quizDeck.words} onBack={() => setQuizDeck(null)} />;
    }

    // Flashcard study mode
    if (studyDeck) {
        return (
            <FlashcardStudyView
                deckName={studyDeck.name}
                cards={studyDeck.cards}
                onBack={() => setStudyDeck(null)}
            />
        );
    }

    // Create deck form
    if (showCreate) {
        return (
            <div className="vocab-browse">
                <div className="vocab-browse-header">
                    <button onClick={onBack} className="vocab-back-btn">
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="vocab-browse-title">{t('library_new_deck')}</h2>
                </div>
                <div className="vocab-create-form" style={{ margin: 16 }}>
                    <input
                        type="text"
                        className="vocab-create-input"
                        placeholder={t('library_deck_name_placeholder')}
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        autoFocus
                    />
                    <div className="vocab-create-actions">
                        <button className="vocab-create-btn primary" onClick={handleCreate} disabled={!newName.trim()}>{t('library_create')}</button>
                        <button className="vocab-create-btn ghost" onClick={onBack}>{t('cancel')}</button>
                    </div>
                </div>
            </div>
        );
    }

    // Saved Words detail view
    if (activeDeck?.id === '__saved__') {
        return (
            <div className="vocab-browse">
                <div className="vocab-browse-header">
                    <button onClick={onBack} className="vocab-back-btn">
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="vocab-browse-title">{t('library_saved_words')}</h2>
                    {savedWords.length > 0 && (
                        <button className="vocab-study-btn" onClick={() => startStudy(t('library_saved_words'), savedWords)}>
                            <Play size={14} /> {t('library_study')}
                        </button>
                    )}
                </div>
                {savedWords.length === 0 ? (
                    <div className="vocab-empty">
                        <BookmarkCheck size={40} />
                        <p>{t('library_no_saved_words')}</p>
                    </div>
                ) : (
                    <div className="vocab-card-list">
                        {savedWords.map((word, i) => (
                            <div key={i} className="vocab-card-row" style={{ borderTop: i > 0 ? '1px solid var(--border-color)' : 'none' }}>
                                <div className="vocab-card-row-text" onClick={() => onSearchWord?.(word)}>
                                    <span className="vocab-card-vi">{word}</span>
                                </div>
                                <button className="vocab-card-speak" onClick={() => speak(word)}>
                                    <Volume2 size={16} />
                                </button>
                                <button className="vocab-card-remove" onClick={() => {
                                    toggleDictSavedWord(word);
                                    setSavedWords(getDictSavedWords());
                                }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Custom deck detail view
    if (activeDeck?.type === 'custom') {
        const deck = customDecks.find(d => d.id === activeDeck.id);
        const words = deck?.words || [];
        return (
            <div className="vocab-browse">
                <div className="vocab-browse-header">
                    <button onClick={onBack} className="vocab-back-btn">
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="vocab-browse-title">{deck?.name || t('library_deck')}</h2>
                    {words.length > 0 && (
                        <button className="vocab-study-btn" onClick={() => startStudy(deck.name, words)}>
                            <Play size={14} /> {t('library_study')}
                        </button>
                    )}
                </div>
                {words.length === 0 ? (
                    <div className="vocab-empty">
                        <Layers size={40} />
                        <p>{t('library_no_words_in_deck')}</p>
                    </div>
                ) : (
                    <div className="vocab-card-list">
                        {words.map((word, i) => (
                            <div key={i} className="vocab-card-row" style={{ borderTop: i > 0 ? '1px solid var(--border-color)' : 'none' }}>
                                <div className="vocab-card-row-text" onClick={() => onSearchWord?.(word)}>
                                    <span className="vocab-card-vi">{word}</span>
                                </div>
                                <button className="vocab-card-speak" onClick={() => speak(word)}>
                                    <Volume2 size={16} />
                                </button>
                                <button className="vocab-card-remove" onClick={() => handleRemoveWord(word)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Pre-built deck detail view
    if (activeDeck?.type === 'preset') {
        const deck = PRE_BUILT_DECKS.find(d => d.id === activeDeck.id);
        if (!deck) return null;
        const deckVocabWords = VOCAB_WORDS.filter(w => deck.words.includes(w.vietnamese));
        return (
            <div className="vocab-browse">
                <div className="vocab-browse-header">
                    <button onClick={onBack} className="vocab-back-btn">
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="vocab-browse-title">{deck.name}</h2>
                    <div className="vocab-header-actions">
                        <button className="vocab-study-btn" onClick={() => startStudy(deck.name, deck.words)}>
                            <Play size={14} /> {t('library_study')}
                        </button>
                        <button className="vocab-study-btn quiz" onClick={() => startQuiz(deck.name, deck.words)}>
                            <Star size={14} /> {t('roadmap_type_quiz')}
                        </button>
                    </div>
                </div>
                <div className="vocab-card-list">
                    {deckVocabWords.map((word, i) => (
                        <div key={i} className="vocab-card-row vocab-card-row-rich" style={{ borderTop: i > 0 ? '1px solid var(--border-color)' : 'none' }}>
                            {word.image && (
                                <div className="vocab-card-thumb">
                                    <VocabImage word={word} alt={word.english} />
                                </div>
                            )}
                            <div className="vocab-card-row-text" onClick={() => onSearchWord?.(word.vietnamese)}>
                                <span className="vocab-card-vi">{word.vietnamese}</span>
                                <span className="vocab-card-en">{word.english}</span>
                                {word.example && <span className="vocab-card-example">{word.example}</span>}
                            </div>
                            <button className="vocab-card-speak" onClick={() => speak(word.vietnamese)}>
                                <Volume2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Fallback — no deck selected
    return (
        <div className="vocab-browse">
            <div className="vocab-browse-header">
                <button onClick={onBack} className="vocab-back-btn">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="vocab-browse-title">{t('library_vocabulary')}</h2>
            </div>
            <div className="vocab-empty">
                <Layers size={40} />
                <p>{t('library_select_deck')}</p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Main Tab Component
// ═══════════════════════════════════════════════════════════════
export default function ReadingLibraryTab({ onSubtitleChange, onSearchWord, pendingArticle, clearPendingArticle, pendingVocabDeck, clearPendingVocabDeck }) {
    const t = useT();
    const [view, setView] = useState('landing');
    const [activeArticle, setActiveArticle] = useState(null);
    const [vocabInitialDeck, setVocabInitialDeck] = useState(null);

    useEffect(() => {
        if (pendingArticle) {
            const articleToOpen = ARTICLES.find(a => a.id === pendingArticle);
            if (articleToOpen) {
                enterReader(articleToOpen);
            }
            clearPendingArticle?.();
        }
    }, [pendingArticle, clearPendingArticle]);

    useEffect(() => {
        if (pendingVocabDeck) {
            setVocabInitialDeck(pendingVocabDeck);
            setView('vocabulary');
            clearPendingVocabDeck?.();
        }
    }, [pendingVocabDeck, clearPendingVocabDeck]);

    const enterReader = (article) => {
        setActiveArticle(article);
        setView('reader');
        onSubtitleChange?.(t('library_reader_subtitle'));
    };

    const goToLanding = () => {
        setView('landing');
        setActiveArticle(null);
        setVocabInitialDeck(null);
        onSubtitleChange?.(null);
    };

    const handleSelectModule = (mod) => {
        if (typeof mod === 'object' && mod.view === 'vocabulary') {
            setVocabInitialDeck(mod.deckId || null);
            setView('vocabulary');
        } else {
            setVocabInitialDeck(null);
            setView(mod);
        }
    };

    if (view === 'reader' && activeArticle) return <ArticleReaderView article={activeArticle} onBack={goToLanding} />;
    if (view === 'vocabulary') return <VocabularyBrowseView onBack={goToLanding} onSearchWord={onSearchWord} initialDeckId={vocabInitialDeck} />;

    return <LibraryLanding onSelectModule={handleSelectModule} onOpenArticle={enterReader} />;
}
