import React, { useState, useMemo } from 'react';
import { ChevronLeft, Volume2, BookOpen, BookOpenText, ChevronRight, Dumbbell, Music, Users, Hash, PenTool, Type, Keyboard, Layers, Plus, Trash2, BookmarkCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ARTICLES, { ARTICLE_CATEGORIES, ARTICLE_LEVELS } from '../../data/articleData';
import { getGrammarItems } from '../../lib/grammarDB';
import speak from '../../utils/speak';
import {
    getDictSavedWords, toggleDictSavedWord, getDictDecks, createDictDeck, deleteDictDeck,
    removeWordFromDictDeck,
} from '../../lib/dictSavedWords';
import './ReadingLibraryTab.css';

const LEVEL_COLORS = { beginner: '#06D6A0', intermediate: '#FFD166', advanced: '#EF476F' };
const GRAMMAR_LEVEL_COLORS = { A1: '#06D6A0', A2: '#118AB2', B1: '#EF476F' };
const GRAMMAR_LEVELS = ['A1', 'A2', 'B1'];

// ═══════════════════════════════════════════════════════════════
// Library Landing — two module cards
// ═══════════════════════════════════════════════════════════════
function LibraryLanding({ onSelectModule }) {
    const grammarItems = getGrammarItems();
    const grammarCount = grammarItems.length;
    const articleCount = ARTICLES.length;
    const savedWordCount = getDictSavedWords().length;
    const deckCount = getDictDecks().length;

    return (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Grammar card */}
            <button
                onClick={() => onSelectModule('grammar')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    width: '100%', padding: '20px 16px', borderRadius: 16,
                    backgroundColor: 'var(--surface-color)',
                    border: '2px solid rgba(167,139,250,0.3)',
                    cursor: 'pointer', textAlign: 'left',
                }}
            >
                <div style={{
                    width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                    backgroundColor: 'rgba(167,139,250,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <BookOpenText size={28} color="#A78BFA" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-main)' }}>Grammar</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{grammarCount} patterns across {GRAMMAR_LEVELS.length} levels</div>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
            </button>

            {/* Readings card */}
            <button
                onClick={() => onSelectModule('readings')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    width: '100%', padding: '20px 16px', borderRadius: 16,
                    backgroundColor: 'var(--surface-color)',
                    border: '2px solid rgba(28,176,246,0.3)',
                    cursor: 'pointer', textAlign: 'left',
                }}
            >
                <div style={{
                    width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                    backgroundColor: 'rgba(28,176,246,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <BookOpen size={28} color="#1CB0F6" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-main)' }}>Readings</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{articleCount} articles with translations</div>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
            </button>

            {/* Practice card */}
            <button
                onClick={() => onSelectModule('practice')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    width: '100%', padding: '20px 16px', borderRadius: 16,
                    backgroundColor: 'var(--surface-color)',
                    border: '2px solid rgba(6,214,160,0.3)',
                    cursor: 'pointer', textAlign: 'left',
                }}
            >
                <div style={{
                    width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                    backgroundColor: 'rgba(6,214,160,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Dumbbell size={28} color="#06D6A0" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-main)' }}>Practice</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Tones, numbers, flashcards & more</div>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
            </button>

            {/* Vocabulary card */}
            <button
                onClick={() => onSelectModule('vocabulary')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    width: '100%', padding: '20px 16px', borderRadius: 16,
                    backgroundColor: 'var(--surface-color)',
                    border: '2px solid rgba(255,159,67,0.3)',
                    cursor: 'pointer', textAlign: 'left',
                }}
            >
                <div style={{
                    width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                    backgroundColor: 'rgba(255,159,67,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Layers size={28} color="#FF9F43" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-main)' }}>Vocabulary</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        {savedWordCount} saved word{savedWordCount !== 1 ? 's' : ''}{deckCount > 0 ? ` · ${deckCount} deck${deckCount !== 1 ? 's' : ''}` : ''}
                    </div>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
            </button>
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
                <h2 style={{ margin: 0, fontSize: 18 }}>Readings</h2>
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
// Practice Browse View (merged from PracticeTab)
// ═══════════════════════════════════════════════════════════════
const practiceModules = [
    { id: 'tones', title: 'Tone Mastery', icon: <Music size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/tones' },
    { id: 'pronouns', title: 'Pronouns', icon: <Users size={24} className="practice-icon" />, level: 'All Levels', link: '/practice/pronouns' },
    { id: 'numbers', title: 'Numbers', icon: <Hash size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/numbers' },
    { id: 'tonemarks', title: 'Tone Marks', icon: <PenTool size={24} className="practice-icon" />, level: 'Intermediate', link: '/practice/tonemarks' },
    { id: 'vowels', title: 'Vowels', icon: <Type size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/vowels' },
    { id: 'telex', title: 'TELEX Typing', icon: <Keyboard size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/telex' },
    { id: 'flashcards', title: 'Flashcard Decks', icon: <Layers size={24} className="practice-icon" />, level: 'All Levels', link: '/practice/flashcards' },
];

function PracticeBrowseView({ onBack }) {
    return (
        <div style={{ padding: 'var(--spacing-4)', paddingBottom: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-main)', display: 'flex' }}>
                    <ChevronLeft size={24} />
                </button>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Practice</h2>
            </div>

            <div className="practice-grid">
                {practiceModules.map((mod, idx) => (
                    <Link key={idx} to={mod.link}
                        className="practice-card"
                        style={{ textDecoration: 'none', color: 'inherit', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {mod.icon}
                        <h3 style={{ fontSize: 16, margin: 0, marginTop: 12 }}>{mod.title}</h3>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{mod.level}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Vocabulary Browse View
// ═══════════════════════════════════════════════════════════════
function VocabularyBrowseView({ onBack, onSearchWord }) {
    const [savedWords, setSavedWords] = useState(() => getDictSavedWords());
    const [customDecks, setCustomDecks] = useState(() => getDictDecks());
    const [activeDeck, setActiveDeck] = useState(null); // null = deck list, object = viewing a deck
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');

    const handleCreate = () => {
        if (!newName.trim()) return;
        createDictDeck(newName.trim());
        setCustomDecks(getDictDecks());
        setNewName('');
        setShowCreate(false);
    };

    const handleDeleteDeck = (e, deckId) => {
        e.stopPropagation();
        deleteDictDeck(deckId);
        setCustomDecks(getDictDecks());
        if (activeDeck?.id === deckId) setActiveDeck(null);
    };

    const handleRemoveWord = (word) => {
        if (activeDeck) {
            removeWordFromDictDeck(activeDeck.id, word);
            setCustomDecks(getDictDecks());
            setActiveDeck(getDictDecks().find(d => d.id === activeDeck.id) || null);
        }
    };

    // Saved Words detail view
    if (activeDeck?.id === '__saved__') {
        return (
            <div className="vocab-browse">
                <div className="vocab-browse-header">
                    <button onClick={() => { setActiveDeck(null); setSavedWords(getDictSavedWords()); }} className="vocab-back-btn">
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="vocab-browse-title">Saved Words</h2>
                    <span className="vocab-browse-count">{savedWords.length} word{savedWords.length !== 1 ? 's' : ''}</span>
                </div>
                {savedWords.length === 0 ? (
                    <div className="vocab-empty">
                        <BookmarkCheck size={40} />
                        <p>No saved words yet. Use the bookmark button in the dictionary!</p>
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
    if (activeDeck) {
        const deck = customDecks.find(d => d.id === activeDeck.id);
        const words = deck?.words || [];
        return (
            <div className="vocab-browse">
                <div className="vocab-browse-header">
                    <button onClick={() => setActiveDeck(null)} className="vocab-back-btn">
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="vocab-browse-title">{deck?.name || 'Deck'}</h2>
                    <span className="vocab-browse-count">{words.length} word{words.length !== 1 ? 's' : ''}</span>
                </div>
                {words.length === 0 ? (
                    <div className="vocab-empty">
                        <Layers size={40} />
                        <p>No words in this deck yet. Save words from the dictionary!</p>
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

    // Deck list view
    return (
        <div className="vocab-browse">
            <div className="vocab-browse-header">
                <button onClick={onBack} className="vocab-back-btn">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="vocab-browse-title">Vocabulary</h2>
            </div>

            {/* Saved Words deck */}
            <div className="vocab-deck-list">
                <button
                    className="vocab-deck-card"
                    onClick={() => setActiveDeck({ id: '__saved__', name: 'Saved Words' })}
                    disabled={savedWords.length === 0}
                    style={savedWords.length === 0 ? { opacity: 0.5 } : undefined}
                >
                    <div className="vocab-deck-icon saved"><BookmarkCheck size={22} /></div>
                    <div className="vocab-deck-info">
                        <span className="vocab-deck-name">Saved Words</span>
                        <span className="vocab-deck-count">{savedWords.length} word{savedWords.length !== 1 ? 's' : ''}</span>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                </button>

                {customDecks.length > 0 && (
                    <div className="vocab-section-label">My Decks</div>
                )}
                {customDecks.map(deck => (
                    <button
                        key={deck.id}
                        className="vocab-deck-card"
                        onClick={() => setActiveDeck(deck)}
                    >
                        <div className="vocab-deck-icon custom"><Layers size={22} /></div>
                        <div className="vocab-deck-info">
                            <span className="vocab-deck-name">{deck.name}</span>
                            <span className="vocab-deck-count">{deck.words.length} word{deck.words.length !== 1 ? 's' : ''}</span>
                        </div>
                        <button className="vocab-deck-delete" onClick={(e) => handleDeleteDeck(e, deck.id)}>
                            <Trash2 size={16} />
                        </button>
                        <ChevronRight size={18} color="var(--text-muted)" />
                    </button>
                ))}
            </div>

            {/* Create deck */}
            {showCreate ? (
                <div className="vocab-create-form">
                    <input
                        type="text"
                        className="vocab-create-input"
                        placeholder="Deck name..."
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        autoFocus
                    />
                    <div className="vocab-create-actions">
                        <button className="vocab-create-btn primary" onClick={handleCreate} disabled={!newName.trim()}>Create</button>
                        <button className="vocab-create-btn ghost" onClick={() => { setShowCreate(false); setNewName(''); }}>Cancel</button>
                    </div>
                </div>
            ) : (
                <button className="vocab-new-deck-btn" onClick={() => setShowCreate(true)}>
                    <Plus size={16} /> New Deck
                </button>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Main Tab Component
// ═══════════════════════════════════════════════════════════════
export default function ReadingLibraryTab({ onSubtitleChange, onSearchWord }) {
    const [view, setView] = useState('landing');
    const [activeArticle, setActiveArticle] = useState(null);

    const enterReader = (article) => {
        setActiveArticle(article);
        setView('reader');
        onSubtitleChange?.('Tap any sentence to reveal translation');
    };

    const goToLanding = () => {
        setView('landing');
        setActiveArticle(null);
        onSubtitleChange?.(null);
    };

    if (view === 'grammar') return <GrammarBrowseView onBack={goToLanding} />;
    if (view === 'reader' && activeArticle) return <ArticleReaderView article={activeArticle} onBack={() => setView('readings')} />;
    if (view === 'readings') return <ArticleBrowseView onSelectArticle={enterReader} onBack={goToLanding} />;
    if (view === 'practice') return <PracticeBrowseView onBack={goToLanding} />;
    if (view === 'vocabulary') return <VocabularyBrowseView onBack={goToLanding} onSearchWord={onSearchWord} />;

    return <LibraryLanding onSelectModule={(mod) => setView(mod)} />;
}
