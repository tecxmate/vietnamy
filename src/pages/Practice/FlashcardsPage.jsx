import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen, Layers, BookmarkCheck, Plus, Trash2, ChevronRight,
    ChevronLeft, Play, Volume2, X, Check, RotateCw, Search,
} from 'lucide-react';
import VocabImage from '../../components/VocabImage';
import VOCAB_WORDS, { CATEGORIES } from '../../data/vocabWords';
import {
    getSavedWordIds, toggleSavedWord,
    getCustomDecks, createCustomDeck, deleteCustomDeck,
    addWordToDeck, removeWordFromDeck,
} from '../../lib/vocabLibrary';
import speak from '../../utils/speak';
import './FlashcardsPage.css';

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Build pre-saved decks from vocabWords categories
const PRE_SAVED_DECKS = CATEGORIES.filter(c => c.key !== 'all').map(cat => ({
    id: `preset_${cat.key}`,
    type: 'preset',
    name: `${cat.emoji} ${cat.label}`,
    emoji: cat.emoji,
    words: VOCAB_WORDS.filter(w => w.category === cat.key),
}));


// ═══════════════════════════════════════════════════════════════
// My Decks — default view
// ═══════════════════════════════════════════════════════════════
function MyDecksView({ onSelectDeck, onStudyDeck }) {
    const [savedIds, setSavedIds] = useState(() => getSavedWordIds());
    const [customDecks, setCustomDecks] = useState(() => getCustomDecks());
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');

    const savedWords = useMemo(
        () => VOCAB_WORDS.filter(w => savedIds.includes(w.id)),
        [savedIds]
    );

    const handleCreate = () => {
        if (!newName.trim()) return;
        const deck = createCustomDeck(newName.trim());
        setCustomDecks(getCustomDecks());
        setNewName('');
        setShowCreate(false);
    };

    const handleDelete = (e, deckId) => {
        e.stopPropagation();
        deleteCustomDeck(deckId);
        setCustomDecks(getCustomDecks());
    };

    const resolveCustomWords = (deck) =>
        VOCAB_WORDS.filter(w => deck.wordIds.includes(w.id));

    return (
        <div className="vlib-container">
            <div className="vlib-header">
                <h2 className="vlib-title">My Decks</h2>
                <button className="vlib-add-btn" onClick={() => setShowCreate(true)}>
                    <Plus size={16} /> New Deck
                </button>
            </div>

            {/* Create deck modal */}
            {showCreate && (
                <div className="vlib-modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="vlib-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="vlib-modal-title">Create New Deck</h3>
                        <input
                            type="text"
                            className="vlib-input"
                            placeholder="Deck name..."
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            autoFocus
                        />
                        <div className="vlib-modal-actions">
                            <button className="vlib-btn primary" onClick={handleCreate} disabled={!newName.trim()}>Create</button>
                            <button className="vlib-btn ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Saved Words */}
            {savedWords.length > 0 && (
                <button
                    className="vlib-deck-card"
                    onClick={() => onSelectDeck({ id: 'saved', type: 'saved', name: 'Saved Words', words: savedWords })}
                >
                    <div className="vlib-deck-icon saved"><BookmarkCheck size={22} /></div>
                    <div className="vlib-deck-info">
                        <span className="vlib-deck-name">Saved Words</span>
                        <span className="vlib-deck-count">{savedWords.length} words</span>
                    </div>
                    <div className="vlib-deck-actions-inline">
                        <button className="vlib-study-chip" onClick={e => { e.stopPropagation(); onStudyDeck({ id: 'saved', type: 'saved', name: 'Saved Words', words: savedWords }); }}>
                            <Play size={14} /> Study
                        </button>
                        <ChevronRight size={18} className="vlib-chevron" />
                    </div>
                </button>
            )}

            {/* Pre-saved Decks */}
            <div className="vlib-section-label">Pre-built Decks</div>
            {PRE_SAVED_DECKS.map(deck => (
                <button
                    key={deck.id}
                    className="vlib-deck-card"
                    onClick={() => onSelectDeck(deck)}
                >
                    <div className="vlib-deck-icon preset"><BookOpen size={22} /></div>
                    <div className="vlib-deck-info">
                        <span className="vlib-deck-name">{deck.name}</span>
                        <span className="vlib-deck-count">{deck.words.length} words</span>
                    </div>
                    <div className="vlib-deck-actions-inline">
                        <button className="vlib-study-chip" onClick={e => { e.stopPropagation(); onStudyDeck(deck); }}>
                            <Play size={14} /> Study
                        </button>
                        <ChevronRight size={18} className="vlib-chevron" />
                    </div>
                </button>
            ))}

            {/* Custom Decks */}
            {customDecks.length > 0 && (
                <>
                    <div className="vlib-section-label">Custom Decks</div>
                    {customDecks.map(deck => {
                        const words = resolveCustomWords(deck);
                        return (
                            <button
                                key={deck.id}
                                className="vlib-deck-card"
                                onClick={() => onSelectDeck({ ...deck, type: 'custom', words })}
                            >
                                <div className="vlib-deck-icon custom"><Layers size={22} /></div>
                                <div className="vlib-deck-info">
                                    <span className="vlib-deck-name">{deck.name}</span>
                                    <span className="vlib-deck-count">{words.length} words</span>
                                </div>
                                <div className="vlib-deck-actions-inline">
                                    {words.length > 0 && (
                                        <button className="vlib-study-chip" onClick={e => { e.stopPropagation(); onStudyDeck({ ...deck, type: 'custom', words }); }}>
                                            <Play size={14} /> Study
                                        </button>
                                    )}
                                    <button className="vlib-delete-chip" onClick={e => handleDelete(e, deck.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                    <ChevronRight size={18} className="vlib-chevron" />
                                </div>
                            </button>
                        );
                    })}
                </>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Deck Detail
// ═══════════════════════════════════════════════════════════════
function DeckDetailView({ deck, onBack, onStudy }) {
    const [savedIds, setSavedIds] = useState(() => getSavedWordIds());
    const [customDecks, setCustomDecks] = useState(() => getCustomDecks());
    const [showPicker, setShowPicker] = useState(false);
    const [pickerFilter, setPickerFilter] = useState('all');
    const [pickerSearch, setPickerSearch] = useState('');

    // Resolve live word list
    const words = useMemo(() => {
        if (deck.type === 'saved') {
            return VOCAB_WORDS.filter(w => savedIds.includes(w.id));
        }
        if (deck.type === 'custom') {
            const live = customDecks.find(d => d.id === deck.id);
            return live ? VOCAB_WORDS.filter(w => live.wordIds.includes(w.id)) : [];
        }
        return deck.words; // preset
    }, [deck, savedIds, customDecks]);

    const isEditable = deck.type === 'saved' || deck.type === 'custom';

    const handleRemoveWord = (wordId) => {
        if (deck.type === 'saved') {
            toggleSavedWord(wordId);
            setSavedIds(getSavedWordIds());
        } else if (deck.type === 'custom') {
            removeWordFromDeck(deck.id, wordId);
            setCustomDecks(getCustomDecks());
        }
    };

    const handleAddWord = (wordId) => {
        if (deck.type === 'custom') {
            addWordToDeck(deck.id, wordId);
            setCustomDecks(getCustomDecks());
        } else if (deck.type === 'saved') {
            if (!savedIds.includes(wordId)) {
                toggleSavedWord(wordId);
                setSavedIds(getSavedWordIds());
            }
        }
    };

    // Picker filtered words
    const pickerWords = useMemo(() => {
        const currentIds = new Set(words.map(w => w.id));
        let pool = VOCAB_WORDS.filter(w => !currentIds.has(w.id));
        if (pickerFilter !== 'all') pool = pool.filter(w => w.category === pickerFilter);
        if (pickerSearch.trim()) {
            const q = pickerSearch.toLowerCase();
            pool = pool.filter(w => w.vietnamese.toLowerCase().includes(q) || w.english.toLowerCase().includes(q));
        }
        return pool;
    }, [words, pickerFilter, pickerSearch]);

    return (
        <div className="vlib-container">
            <div className="vlib-detail-header">
                <button className="vlib-back-btn" onClick={onBack}>
                    <ChevronLeft size={20} /> Back
                </button>
                <h2 className="vlib-detail-title">{deck.name}</h2>
                {words.length > 0 && (
                    <button className="vlib-study-btn" onClick={() => onStudy({ ...deck, words })}>
                        <Play size={16} /> Study
                    </button>
                )}
            </div>

            {isEditable && (
                <button className="vlib-add-word-btn" onClick={() => setShowPicker(true)}>
                    <Plus size={16} /> Add Words
                </button>
            )}

            {/* Word picker modal */}
            {showPicker && (
                <div className="vlib-modal-overlay" onClick={() => setShowPicker(false)}>
                    <div className="vlib-modal vlib-picker-modal" onClick={e => e.stopPropagation()}>
                        <div className="vlib-picker-header">
                            <h3 className="vlib-modal-title">Add Words</h3>
                            <button className="vlib-close-btn" onClick={() => setShowPicker(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="vlib-picker-search">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search words..."
                                value={pickerSearch}
                                onChange={e => setPickerSearch(e.target.value)}
                            />
                        </div>

                        <div className="vlib-picker-pills">
                            {CATEGORIES.map(c => (
                                <button
                                    key={c.key}
                                    className={`vlib-pill ${pickerFilter === c.key ? 'active' : ''}`}
                                    onClick={() => setPickerFilter(c.key)}
                                >
                                    {c.emoji} {c.label}
                                </button>
                            ))}
                        </div>

                        <div className="vlib-picker-list">
                            {pickerWords.length === 0 && (
                                <p className="vlib-picker-empty">No more words to add in this category.</p>
                            )}
                            {pickerWords.map(word => (
                                <button key={word.id} className="vlib-picker-row" onClick={() => handleAddWord(word.id)}>
                                    <span className="vlib-picker-emoji">{word.emoji}</span>
                                    <div className="vlib-picker-text">
                                        <span className="vlib-picker-vn">{word.vietnamese}</span>
                                        <span className="vlib-picker-en">{word.english}</span>
                                    </div>
                                    <Plus size={16} className="vlib-picker-add" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Word list */}
            <div className="vlib-word-list">
                {words.length === 0 && (
                    <div className="vlib-empty">
                        <Layers size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                        <p>No words yet. Tap "Add Words" to get started!</p>
                    </div>
                )}
                {words.map(word => (
                    <div key={word.id} className="vlib-word-row">
                        <div className="vlib-word-thumb">
                            <VocabImage word={word} alt={word.english} />
                        </div>
                        <div className="vlib-word-text">
                            <span className="vlib-word-vn">{word.vietnamese}</span>
                            <span className="vlib-word-en">{word.english}</span>
                        </div>
                        <button className="vlib-speak-btn" onClick={() => speak(word.vietnamese)}>
                            <Volume2 size={14} />
                        </button>
                        {isEditable && (
                            <button className="vlib-remove-btn" onClick={() => handleRemoveWord(word.id)}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Flashcard Test
// ═══════════════════════════════════════════════════════════════
function FlashcardTestView({ deck, onBack }) {
    const [cards] = useState(() => shuffle(deck.words));
    const [index, setIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [results, setResults] = useState({}); // { wordId: 'know' | 'unknown' }
    const [phase, setPhase] = useState('test'); // 'test' | 'score' | 'retry'
    const [retryCards, setRetryCards] = useState([]);
    const [retryIndex, setRetryIndex] = useState(0);
    const [retryRevealed, setRetryRevealed] = useState(false);
    const [swipeDir, setSwipeDir] = useState(null);
    const touchStartX = useRef(null);

    const isRetry = phase === 'retry';
    const activeCards = isRetry ? retryCards : cards;
    const activeIndex = isRetry ? retryIndex : index;
    const activeRevealed = isRetry ? retryRevealed : revealed;
    const card = activeCards[activeIndex];
    const total = activeCards.length;

    const toggleFlip = () => {
        if (isRetry) setRetryRevealed(r => !r);
        else setRevealed(r => !r);
        // Speak Vietnamese when flipping to revealed side
        if (!activeRevealed && card) speak(card.vietnamese);
    };

    const advance = (verdict) => {
        setSwipeDir(verdict === 'know' ? 'right' : 'left');
        setTimeout(() => {
            setSwipeDir(null);
            if (!isRetry) {
                setResults(prev => ({ ...prev, [card.id]: verdict }));
            }
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

    // Keyboard support
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
    const scoreOf100 = cards.length > 0 ? Math.round((knownCount / cards.length) * 100) : 0;
    const unknownWords = cards.filter(c => results[c.id] === 'unknown');

    const handleRetry = () => {
        setRetryCards(shuffle(unknownWords));
        setRetryIndex(0);
        setRetryRevealed(false);
        setPhase('retry');
    };

    // ─── Score Screen ────────────────────────────────────────────
    if (phase === 'score') {
        return (
            <div className="vlib-container vlib-fc-container">
                <div className="vlib-fc-header">
                    <button className="vlib-back-btn" onClick={onBack}>
                        <ChevronLeft size={20} /> Done
                    </button>
                    <span className="vlib-fc-deck-name">{deck.name}</span>
                </div>
                <div className="vlib-score-screen">
                    <div className="vlib-score-circle">
                        <span className="vlib-score-number">{scoreOf100}</span>
                        <span className="vlib-score-label">/ 100</span>
                    </div>
                    <h2 className="vlib-score-title">
                        {scoreOf100 >= 90 ? 'Excellent!' : scoreOf100 >= 70 ? 'Great job!' : scoreOf100 >= 50 ? 'Good effort!' : 'Keep practicing!'}
                    </h2>
                    <div className="vlib-score-stats">
                        <div className="vlib-stat know"><Check size={16} /> {knownCount} Known</div>
                        <div className="vlib-stat unknown"><X size={16} /> {unknownCount} Don't know</div>
                    </div>
                    {unknownWords.length > 0 && (
                        <button className="vlib-btn primary vlib-retry-btn" onClick={handleRetry}>
                            <RotateCw size={16} /> Practice {unknownWords.length} again
                        </button>
                    )}
                    <button className="vlib-btn ghost" onClick={onBack}>Back to Decks</button>
                </div>
            </div>
        );
    }

    if (!card) return null;

    // ─── Card Screen ─────────────────────────────────────────────
    return (
        <div className="vlib-container vlib-fc-container">
            <div className="vlib-fc-header">
                <button className="vlib-back-btn" onClick={onBack}>
                    <ChevronLeft size={20} />
                </button>
                <span className="vlib-fc-deck-name">{deck.name}</span>
                <span className="vlib-fc-counter">{activeIndex + 1} / {total}</span>
            </div>

            <div className="vlib-fc-progress">
                <div className="vlib-fc-progress-fill" style={{ width: `${((activeIndex + 1) / total) * 100}%` }} />
            </div>

            <div className="vlib-fc-zone">
                <div className={`vlib-zone-label left ${swipeDir === 'left' ? 'active' : ''}`}>
                    <X size={22} />
                </div>

                <div
                    className={`vlib-fc-card ${activeRevealed ? 'revealed' : ''} ${swipeDir ? `swipe-${swipeDir}` : ''}`}
                    onClick={toggleFlip}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                >
                    <div className="vlib-fc-card-inner">
                        <div className="vlib-fc-front">
                            <div className="vlib-fc-img-wrap">
                                <VocabImage word={card} alt="" />
                            </div>
                            <span className="vlib-fc-english">{card.english}</span>
                            <span className="vlib-fc-tap">tap to flip</span>
                        </div>
                        <div className="vlib-fc-back">
                            <div className="vlib-fc-img-wrap small">
                                <VocabImage word={card} alt="" />
                            </div>
                            <span className="vlib-fc-vietnamese">{card.vietnamese}</span>
                            <span className="vlib-fc-meaning">{card.english}</span>
                            {card.example && <span className="vlib-fc-example">"{card.example}"</span>}
                        </div>
                    </div>
                </div>

                <div className={`vlib-zone-label right ${swipeDir === 'right' ? 'active' : ''}`}>
                    <Check size={22} />
                </div>
            </div>

            <div className="vlib-fc-actions">
                <button className="vlib-fc-btn dont-know" onClick={() => advance('unknown')}>
                    <X size={22} /> Don't know
                </button>
                <button className="vlib-fc-btn know" onClick={() => advance('know')}>
                    <Check size={22} /> Know
                </button>
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════
export default function FlashcardsPage() {
    const [view, setView] = useState('decks'); // 'decks' | 'detail' | 'test'
    const [activeDeck, setActiveDeck] = useState(null);

    const handleSelectDeck = (deck) => { setActiveDeck(deck); setView('detail'); };
    const handleStudyDeck = (deck) => { setActiveDeck(deck); setView('test'); };
    const handleBack = () => { setView('decks'); setActiveDeck(null); };
    const handleBackFromTest = () => { setView('detail'); };

    // Top-level back to Practice (only on decks view)
    const header = view === 'decks' ? (
        <div style={{ padding: 'var(--spacing-3) var(--spacing-4)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
            <Link to="/practice" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                <ChevronLeft size={20} /> Practice
            </Link>
        </div>
    ) : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
            {header}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {view === 'test' && activeDeck ? (
                    <FlashcardTestView deck={activeDeck} onBack={handleBackFromTest} />
                ) : view === 'detail' && activeDeck ? (
                    <DeckDetailView deck={activeDeck} onBack={handleBack} onStudy={handleStudyDeck} />
                ) : (
                    <MyDecksView onSelectDeck={handleSelectDeck} onStudyDeck={handleStudyDeck} />
                )}
            </div>
        </div>
    );
}
