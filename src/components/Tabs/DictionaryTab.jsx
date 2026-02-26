import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, BookA, Loader2, Volume2, Camera, Sparkles } from 'lucide-react';
import { Converter } from 'opencc-js';
import speak from '../../utils/speak';
import './DictionaryTab.css';

const s2t = Converter({ from: 'cn', to: 'tw' });

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
    'AI_Generated_ZH': '越中繁體',
    'AI_Generated_ZH_T': '中文釋義',
    'AI_Generated_EN': 'English (AI)',
    'HanViet': '漢越詞典',
    'Wiktionary': 'Wiktionary',
    'FVDP (GPL)': 'FVDP (EN-VI)',
};


/** Parse FVDP HTML blob into structured sections */
const parseFVDP = (html) => {
    const sections = [];
    // Split on POS headers: <i>danh từ</i><br><ul> — the <ul> distinguishes
    // real POS headers from example translations like <i>thần rượu</i><br>
    const parts = html.split(/(?=<i>[^<]{2,40}<\/i><br><ul>)/);
    for (const part of parts) {
        if (!part.trim()) continue;
        const posMatch = part.match(/^<i>([^<]+)<\/i><br><ul>/);
        const pos = posMatch ? posMatch[1] : null;
        const body = posMatch ? part.slice(posMatch[0].length) : part;

        const defs = [];
        const cleaned = body
            .replace(/<\/?ul>/g, '')
            .replace(/!([^<\n]+)/g, '<li class="idiom">$1</li>');

        const items = cleaned.split(/<li[^>]*>/);
        for (const item of items) {
            if (!item.trim()) continue;
            const text = item.replace(/<\/li>/, '').trim();
            if (!text) continue;

            // Split definition from its trailing examples
            const defParts = text.split(/<br>/);
            const mainDef = defParts[0]?.trim();
            const examples = [];
            for (let i = 1; i < defParts.length; i++) {
                const exMatch = defParts[i].match(/<b>([^<]+)<\/b>:\s*<i>([^<]+)<\/i>/);
                if (exMatch) examples.push({ phrase: exMatch[1], meaning: exMatch[2] });
            }
            const cleanDef = mainDef?.replace(/<[^>]+>/g, '').trim();
            if (cleanDef) defs.push({ text: cleanDef, examples });
        }
        if (defs.length > 0) sections.push({ pos, defs });
    }
    return sections;
};

const isFVDP = (sourceName) => sourceName === 'FVDP (GPL)';

const renderSources = (sources, convert = null, searchQuery = '') => {
    if (!sources || sources.length === 0) return null;
    const t = (text) => convert ? convert(text) : text;
    return sources.map((src, srcIdx) => (
        <div key={srcIdx} className="source-section">
            <div className="source-header">
                <BookA size={16} />
                <span className="source-name">{SOURCE_LABELS[convert ? src.source_name + '_T' : src.source_name] || SOURCE_LABELS[src.source_name] || src.source_name}</span>
            </div>
            <div className="meanings-list">
                {src.meanings.map((meaning, mIdx) => (
                    <div key={mIdx} className="meaning-item">
                        {isFVDP(src.source_name) ? (
                            <div className="fvdp-entry">
                                {parseFVDP(meaning.meaning_text).map((section, sIdx) => (
                                    <div key={sIdx} className="fvdp-section">
                                        {section.pos && <span className="part-of-speech">{section.pos}</span>}
                                        <ol className="fvdp-defs">
                                            {section.defs.map((def, dIdx) => (
                                                <li key={dIdx}>
                                                    <span>{t(def.text)}</span>
                                                    {def.examples.length > 0 && (
                                                        <div className="fvdp-examples">
                                                            {def.examples.map((ex, eIdx) => (
                                                                <div key={eIdx} className="example-item">
                                                                    <span className="example-vi"><b>{ex.phrase}</b></span>
                                                                    <span className="example-en"> {t(ex.meaning)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="meaning-header">
                                {meaning.part_of_speech && (
                                    <span className="part-of-speech">{meaning.part_of_speech}</span>
                                )}
                                <p className="meaning-text">{t(meaning.meaning_text)}</p>
                            </div>
                        )}
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
                                            <p className="example-en">{t(ex.english_text)}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchQuery.trim().split(' ').length > 2 && (
                            <div className="premium-audio-request">
                                <div className="premium-audio-info">
                                    <Sparkles size={20} color="#CE82FF" fill="#CE82FF" />
                                    <span>Need to sound perfect?</span>
                                </div>
                                <button
                                    className="premium-audio-btn"
                                    onClick={() => alert("MOCKUP: This would charge $1 or ₫5000 to send this sentence to a native Vietnamese speaker for a perfect, custom audio recording within 24 hours.")}
                                >
                                    Order Human Pronunciation
                                </button>
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
                en: enSources.filter(s => ['VE', 'AI_Generated_EN', 'Wiktionary', 'FVDP (GPL)'].includes(s.source_name)),
                vi: enSources.filter(s => ['3-dict-combination'].includes(s.source_name)),
                zh: zhSources,
                components: enData.components || null,
                hanvietComponents: zhData.hanvietComponents || null,
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
            case 'zh-s': return allData.zh || [];
            case 'zh-t': return allData.zh || [];
            case 'all': return [
                ...(allData.en || []), ...(allData.vi || []),
                ...(allData.zh || []),
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

                {hasResults && (dictMode === 'zh-s' || dictMode === 'zh-t' || dictMode === 'all') && allData?.hanvietComponents && (
                    <div className="hanviet-decomposition">
                        <div className="source-header">
                            <BookA size={16} />
                            <span className="source-name">漢越 HanViet</span>
                        </div>
                        <div className="hanviet-cards">
                            {allData.hanvietComponents.map((comp, i) => {
                                // Pick the best entry: prefer one with a gloss, skip rare chars
                                const best = comp.entries.find(e => e.gloss) || comp.entries[0];
                                if (!best) return null;
                                const chinese = dictMode === 'zh-t' ? s2t(best.chinese) : best.chinese;
                                return (
                                    <div key={i} className="hanviet-card">
                                        <div className="hanviet-card-vi">{comp.syllable}</div>
                                        <div className="hanviet-card-zh">{chinese}</div>
                                        {best.pinyin && <div className="hanviet-card-pinyin">{best.pinyin}</div>}
                                        {best.gloss && <div className="hanviet-card-gloss">{dictMode === 'zh-t' ? s2t(best.gloss) : best.gloss}</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {hasResults && renderSources(displaySources, dictMode === 'zh-t' ? s2t : null)}
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
                        <button type="button" className="camera-btn" onClick={() => alert('Camera OCR Mockup')} title="OCR Scanner">
                            <Camera size={20} />
                        </button>
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
