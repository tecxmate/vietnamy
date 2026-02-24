import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, BookA, Loader2, Volume2 } from 'lucide-react';
import speak from '../../utils/speak';
import './DictionaryTab.css';

const MODES = [
    { id: 'en', label: 'EN' },
    { id: 'vi', label: 'VI' },
    { id: 'hv', label: 'HV' },
    { id: 'ja', label: 'JA' },
    { id: 'fr', label: 'FR' },
    { id: 'zh-s', label: '简' },
    { id: 'zh-t', label: '繁' },
    { id: 'all', label: 'All' },
];

const SOURCE_LABELS = {
    'VE': 'English',
    '3-dict-combination': 'Tiếng Việt',
    'Hán Việt': 'Hán Việt (漢越)',
    'JaViDic_VJ': '日本語 (Japanese)',
    'mtBab_VF': 'Français (French)',
    'mtBabVC_Simplified': '简体中文 (Simplified)',
    'mtBabVC_Traditional': '繁體中文 (Traditional)',
};

// Vietnamese tone detection from diacritics
const TONE_MAP = {
    '\u0300': { name: 'huyền', label: 'falling', color: '#6366f1' },   // grave ̀
    '\u0301': { name: 'sắc', label: 'rising', color: '#ef4444' },      // acute ́
    '\u0303': { name: 'ngã', label: 'broken', color: '#f59e0b' },      // tilde ̃
    '\u0309': { name: 'hỏi', label: 'dipping', color: '#06b6d4' },     // hook ̉
    '\u0323': { name: 'nặng', label: 'heavy', color: '#8b5cf6' },      // dot below ̣
};

function getTones(word) {
    const syllables = word.trim().split(/\s+/);
    return syllables.map(syll => {
        const decomposed = syll.normalize('NFD');
        for (const [mark, tone] of Object.entries(TONE_MAP)) {
            if (decomposed.includes(mark)) return { syllable: syll, ...tone };
        }
        return { syllable: syll, name: 'ngang', label: 'level', color: '#94a3b8' };
    });
}

const TIER_STYLES = {
    'Top 500':  { bg: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', icon: '★' },
    'Top 1K':   { bg: 'rgba(249, 115, 22, 0.12)', color: '#ea580c', icon: '◆' },
    'Top 3K':   { bg: 'rgba(59, 130, 246, 0.10)', color: '#2563eb', icon: '●' },
    'Top 10K':  { bg: 'rgba(107, 114, 128, 0.10)', color: '#6b7280', icon: '○' },
    'Rare':     { bg: 'rgba(107, 114, 128, 0.06)', color: '#9ca3af', icon: '◇' },
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
                hv: enSources.filter(s => s.source_name === 'Hán Việt'),
                ja: enSources.filter(s => s.source_name === 'JaViDic_VJ'),
                fr: enSources.filter(s => s.source_name === 'mtBab_VF'),
                zhS: zhSources.filter(s => s.source_name === 'mtBabVC_Simplified'),
                zhT: zhSources.filter(s => s.source_name === 'mtBabVC_Traditional'),
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
            case 'hv': return allData.hv;
            case 'ja': return allData.ja;
            case 'fr': return allData.fr;
            case 'zh-s': return allData.zhS;
            case 'zh-t': return allData.zhT;
            case 'all': return [
                ...(allData.en || []), ...(allData.vi || []), ...(allData.hv || []),
                ...(allData.ja || []), ...(allData.fr || []),
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

                        {/* Compound word decomposition — only for Hán Việt words */}
                        {allData.components && allData.components.length >= 2 && allData.hv?.some(s => s.meanings?.length > 0) && (
                            <div className="word-decomposition">
                                <span className="decomp-label">Breakdown</span>
                                <div className="decomp-parts">
                                    {allData.components.map((comp, i) => (
                                        <div key={i} className="decomp-part">
                                            <span className="decomp-syllable">{comp.syllable}</span>
                                            {comp.freq_tier && (
                                                <span
                                                    className="decomp-tier"
                                                    style={{ color: TIER_STYLES[comp.freq_tier]?.color }}
                                                >
                                                    {comp.freq_tier}
                                                </span>
                                            )}
                                            {comp.meaning && (
                                                <span className="decomp-meaning">{comp.meaning}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
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

