import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, BookA, Loader2, Volume2 } from 'lucide-react';
import speak from '../../utils/speak';
import './DictionaryTab.css';

const MODES = [
    { id: 'en', label: 'EN' },
    { id: 'vi', label: 'VI' },
    { id: 'zh-s', label: '简' },
    { id: 'zh-t', label: '繁' },
    { id: 'all', label: 'All' },
];

const SOURCE_LABELS = {
    'VE': 'English',
    '3-dict-combination': 'Tiếng Việt',
    'CVDICT_Simplified': '简体中文 (Simplified)',
    'CVDICT_Traditional': '繁體中文 (Traditional)',
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
                                        <div className="example-vi-row">
                                            <p className="example-vi">{ex.vietnamese_text}</p>
                                            <button
                                                className="speak-btn speak-btn--sm"
                                                onClick={() => speak(ex.vietnamese_text)}
                                                title="Listen"
                                            >
                                                <Volume2 size={14} />
                                            </button>
                                        </div>
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
    const [localTranslation, setLocalTranslation] = useState('');
    const [translating, setTranslating] = useState(false);
    const [translationError, setTranslationError] = useState(false);
    const suggestTimer = useRef(null);

    const translateLocally = async (text) => {
        setLocalTranslation('');
        setTranslationError(false);
        setTranslating(true);
        try {
            if (!('translation' in self && 'createTranslator' in self.translation)) {
                setTranslationError(true);
                return;
            }

            const canTranslate = await self.translation.canTranslate({
                sourceLanguage: 'vi',
                targetLanguage: 'en',
            });

            if (canTranslate !== 'no') {
                const translator = await self.translation.createTranslator({
                    sourceLanguage: 'vi',
                    targetLanguage: 'en',
                });
                const result = await translator.translate(text);
                setLocalTranslation(result);
            } else {
                setTranslationError(true);
            }
        } catch (err) {
            console.error('Local translation failed:', err);
            setTranslationError(true);
        } finally {
            setTranslating(false);
        }
    };

    // Fetch suggestions (immediate or debounced)
    const fetchSuggestionsImmediate = useCallback(async (val) => {
        if (val.trim().length < 2) { setSuggestions([]); return; }
        try {
            const res = await fetch(`/api/suggest?q=${encodeURIComponent(val.trim())}`);
            if (res.ok) setSuggestions(await res.json());
        } catch { /* silently ignore */ }
    }, []);

    const fetchSuggestions = useCallback((val) => {
        clearTimeout(suggestTimer.current);
        if (val.trim().length < 2) { setSuggestions([]); return; }
        suggestTimer.current = setTimeout(() => fetchSuggestionsImmediate(val), 200);
    }, [fetchSuggestionsImmediate]);

    useEffect(() => {
        fetchSuggestions(query);
    }, [query, fetchSuggestions]);

    useEffect(() => {
        if (allData && !allData.error && searchedWord) {
            const displaySources = getDisplaySources();
            const hasResults = displaySources.length > 0 && displaySources.some(s => s.meanings?.length > 0);

            if (!hasResults && !localTranslation && !translating && !translationError) {
                translateLocally(searchedWord);
            }
        }
    }, [allData, searchedWord, dictMode]);

    const runSearch = async (word) => {
        if (!word.trim()) return;
        setLoading(true);
        setSearchedWord(word.trim());
        setLocalTranslation('');
        setTranslationError(false);
        setTranslating(false);

        try {
            const enc = encodeURIComponent(word.trim());
            const [enRes, zhRes] = await Promise.all([
                fetch(`/api/search?q=${enc}&lang=en`),
                fetch(`/api/search?q=${enc}&lang=zh`),
            ]);
            if (!enRes.ok || !zhRes.ok) throw new Error('Search failed');
            const [enData, zhData] = await Promise.all([enRes.json(), zhRes.json()]);

            const zhSources = zhData.structured ? zhData.data : [];
            const enSources = enData.structured ? enData.data : [];
            const parsedData = {
                word: word.trim(),
                en: enSources.filter(s => s.source_name === 'VE'),
                vi: enSources.filter(s => s.source_name === '3-dict-combination'),
                zhS: zhSources.filter(s => s.source_name === 'CVDICT_Simplified'),
                zhT: zhSources.filter(s => s.source_name === 'CVDICT_Traditional'),
                components: enData.components || null,
            };
            setAllData(parsedData);

            // If no results, refresh suggestions for the searched word so "did you mean" shows
            const hasAny = Object.entries(parsedData).some(([k, v]) =>
                k !== 'word' && k !== 'components' && Array.isArray(v) && v.some(s => s.meanings?.length > 0)
            );
            if (!hasAny) fetchSuggestionsImmediate(word.trim());

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
            case 'vi': return allData.vi;
            case 'zh-s': return allData.zhS;
            case 'zh-t': return allData.zhT;
            case 'all': return [
                ...(allData.en || []), ...(allData.vi || []),
                ...(allData.zhS || []), ...(allData.zhT || []),
            ];
            default: return [];
        }
    };

    const displaySources = getDisplaySources();
    const hasResults = displaySources.length > 0 && displaySources.some(s => s.meanings?.length > 0);
    const firstSourceWithMetrics = displaySources.find(s => s.metrics && (s.metrics.ipa || s.metrics.subt_freq || s.metrics.mi));
    const metrics = firstSourceWithMetrics ? firstSourceWithMetrics.metrics : null;

    return (
        <div className="dictionary-container">
            {/* Scrollable results area */}
            <div className="results-area">
                {allData && allData.word && !allData.error && (
                    <div className="word-heading-card">
                        <div className="word-heading-row">
                            <h1 className="word-heading">{allData.word}</h1>
                            <button
                                className="speak-btn"
                                onClick={() => speak(allData.word)}
                                title="Listen"
                            >
                                <Volume2 size={24} />
                            </button>
                        </div>
                        {metrics && metrics.ipa && (
                            <div className="word-metrics">
                                <span className="metric-badge ipa-badge">/{metrics.ipa}/</span>
                            </div>
                        )}

                    </div>
                )}

                {allData && allData.error && (
                    <div className="no-results">
                        <Loader2 size={32} className="no-results-icon" style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
                        <p>Unable to connect to dictionary server. Make sure it's running on port 3001.</p>
                    </div>
                )}

                {allData && !allData.error && !hasResults && searchedWord && (
                    <div className="no-results no-results-action">
                        <Search size={32} className="no-results-icon" />
                        <p>No definitions found for "<strong>{searchedWord}</strong>" in this dictionary.</p>

                        {suggestions.length > 0 && (
                            <div className="did-you-mean fade-in">
                                <span className="dym-label">Did you mean?</span>
                                <div className="dym-chips">
                                    {suggestions.slice(0, 5).map((s, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            className="dym-chip"
                                            onClick={() => handleSuggestionClick(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {translating && (
                            <div className="local-translation-card translating fade-in">
                                <Loader2 size={24} className="loading-icon" />
                                <span>Translating on-device using Chrome AI...</span>
                            </div>
                        )}

                        {localTranslation && !translating && (
                            <div className="local-translation-card success fade-in">
                                <span className="ai-badge">✨ Chrome AI</span>
                                <h3 className="local-translation-result">{localTranslation}</h3>
                            </div>
                        )}

                        {translationError && !translating && (
                            <div className="fallback-buttons fade-in">
                                <a
                                    href={`https://translate.google.com/?sl=vi&tl=en&text=${encodeURIComponent(searchedWord)}&op=translate`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="fallback-btn fallback-google"
                                >
                                    Translate with Google
                                </a>
                            </div>
                        )}
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

