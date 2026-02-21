import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, BookA, Loader2 } from 'lucide-react';
import './DictionaryTab.css';

const MODES = [
    { id: 'en', label: 'EN' },
    { id: 'zh-s', label: '简' },
    { id: 'zh-t', label: '繁' },
    { id: 'all', label: 'All' },
];

const SOURCE_LABELS = {
    'mtBabVC_Simplified': '简体中文 (Simplified)',
    'mtBabVC_Traditional': '繁體中文 (Traditional)',
};

const renderSources = (sources) => {
    if (!sources || sources.length === 0) return null;
    return sources.map((src, srcIdx) => (
        <div key={srcIdx} className="source-section">
            <div className="source-header">
                <BookA size={16} />
                <span className="source-name">{SOURCE_LABELS[src.source_name] || src.source_name}</span>
            </div>
            <div className="meanings-list">
                {src.meanings.map((meaning, mIdx) => (
                    <div key={mIdx} className="meaning-item">
                        <div className="meaning-header">
                            {meaning.part_of_speech && (
                                <span className="part-of-speech">{meaning.part_of_speech}</span>
                            )}
                            <p className="meaning-text">{meaning.meaning_text}</p>
                        </div>
                        {meaning.examples && meaning.examples.length > 0 && (
                            <div className="examples-list">
                                {meaning.examples.map((ex, eIdx) => (
                                    <div key={eIdx} className="example-item">
                                        <p className="example-vi">{ex.vietnamese_text}</p>
                                        {ex.english_text && (
                                            <p className="example-en">{ex.english_text}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    ));
};

const DictionaryTab = () => {
    const [query, setQuery] = useState('');
    const [allData, setAllData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchedWord, setSearchedWord] = useState('');
    const [dictMode, setDictMode] = useState('en');
    const [suggestions, setSuggestions] = useState([]);
    const suggestTimer = useRef(null);

    // Debounced suggest fetch
    const fetchSuggestions = useCallback((val) => {
        clearTimeout(suggestTimer.current);
        if (val.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        suggestTimer.current = setTimeout(async () => {
            try {
                const res = await fetch(`http://localhost:3001/api/suggest?q=${encodeURIComponent(val.trim())}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                }
            } catch {
                // silently ignore
            }
        }, 300);
    }, []);

    useEffect(() => {
        fetchSuggestions(query);
    }, [query, fetchSuggestions]);

    const runSearch = async (word) => {
        if (!word.trim()) return;
        setLoading(true);
        setSearchedWord(word.trim());

        try {
            const enc = encodeURIComponent(word.trim());
            const [enRes, zhRes] = await Promise.all([
                fetch(`http://localhost:3001/api/search?q=${enc}&lang=en`),
                fetch(`http://localhost:3001/api/search?q=${enc}&lang=zh`),
            ]);
            if (!enRes.ok || !zhRes.ok) throw new Error('Search failed');
            const [enData, zhData] = await Promise.all([enRes.json(), zhRes.json()]);

            const zhSources = zhData.structured ? zhData.data : [];
            setAllData({
                word: word.trim(),
                en: enData.structured ? enData.data : [],
                zhS: zhSources.filter(s => s.source_name === 'mtBabVC_Simplified'),
                zhT: zhSources.filter(s => s.source_name === 'mtBabVC_Traditional'),
            });
        } catch (err) {
            console.error('Dictionary search error:', err);
            setAllData({ word: word.trim(), error: true });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        await runSearch(query);
    };

    const handleSuggestionClick = (word) => {
        setQuery(word);
        runSearch(word);
    };

    const getDisplaySources = () => {
        if (!allData || allData.error) return [];
        switch (dictMode) {
            case 'en': return allData.en;
            case 'zh-s': return allData.zhS;
            case 'zh-t': return allData.zhT;
            case 'all': return [...(allData.en || []), ...(allData.zhS || []), ...(allData.zhT || [])];
            default: return [];
        }
    };

    const displaySources = getDisplaySources();
    const hasResults = displaySources.length > 0 && displaySources.some(s => s.meanings?.length > 0);

    return (
        <div className="dictionary-container">
            {/* Scrollable results area */}
            <div className="results-area">
                {allData && allData.word && !allData.error && (
                    <h1 className="word-heading">{allData.word}</h1>
                )}

                {allData && allData.error && (
                    <div className="no-results">
                        <p>Unable to connect to dictionary server. Make sure it's running on port 3001.</p>
                    </div>
                )}

                {allData && !allData.error && !hasResults && searchedWord && (
                    <div className="no-results">
                        <p>No definitions found for "<strong>{searchedWord}</strong>" in this dictionary.</p>
                    </div>
                )}

                {hasResults && renderSources(displaySources)}
            </div>

            {/* Sticky bottom bar: suggestions → mode toggle → search */}
            <div className="dictionary-bottom-bar">
                <div className="suggestions-strip">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            className="suggestion-chip"
                            onClick={() => handleSuggestionClick(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div className="dictionary-language-toggle">
                    {MODES.map(mode => (
                        <button
                            key={mode.id}
                            className={`toggle-btn ${dictMode === mode.id ? 'active' : ''}`}
                            onClick={() => setDictMode(mode.id)}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Type a Vietnamese word..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="search-input"
                        />
                        <button type="submit" disabled={loading} className="search-button">
                            {loading ? <Loader2 size={20} className="loading-icon" /> : <Search size={20} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DictionaryTab;

