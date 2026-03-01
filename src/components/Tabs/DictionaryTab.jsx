import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, BookA, Loader2, Volume2, Sparkles, Camera, Image, Mic, X, ArrowLeft, Check, Bookmark } from 'lucide-react';
import { Converter } from 'opencc-js';
import Tesseract from 'tesseract.js';
import speak from '../../utils/speak';
import { isDictWordSaved, toggleDictSavedWord } from '../../lib/dictSavedWords';
import DeckPickerModal from '../DeckPickerModal';
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
    'AI_Generated_ZH': '越中简体 VIET > SIMPLIFIED CHINESE',
    'AI_Generated_ZH_T': '越中繁體 VIET > TRADITIONAL CHINESE',
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

const DictionaryTab = ({ pendingInput, clearPendingInput, dictMode: externalDictMode, onDictModeChange }) => {
    const [query, setQuery] = useState('');
    const [allData, setAllData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchedWord, setSearchedWord] = useState('');
    const [dictMode, setDictModeLocal] = useState(externalDictMode || 'en');
    const [suggestions, setSuggestions] = useState([]);
    const [localTranslation, setLocalTranslation] = useState('');
    const [translating, setTranslating] = useState(false);
    const [translationError, setTranslationError] = useState(false);

    // Search history for back navigation
    const searchHistoryRef = useRef([]);

    // Save button states
    const [wordSaved, setWordSaved] = useState(false);
    const [showDeckPicker, setShowDeckPicker] = useState(false);
    const [savePressing, setSavePressing] = useState(false);
    const savePressTimer = useRef(null);
    const saveDidLongPress = useRef(false);

    // Media input states
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [listening, setListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const finalTextRef = useRef('');

    // Refs
    const suggestTimer = useRef(null);
    const searchTimer = useRef(null);
    const cameraInputRef = useRef(null);
    const uploadInputRef = useRef(null);
    const recognitionRef = useRef(null);
    const skipAutoSearch = useRef(false);

    const setDictMode = (mode) => {
        setDictModeLocal(mode);
        onDictModeChange?.(mode);
    };

    const getTranslateLangs = () => {
        if (dictMode === 'zh-s') return { sl: 'vi', tl: 'zh-CN' };
        if (dictMode === 'zh-t') return { sl: 'vi', tl: 'zh-TW' };
        if (dictMode === 'vi') return { sl: 'vi', tl: 'vi' };
        return { sl: 'vi', tl: 'en' };
    };

    const translateLocally = async (text) => {
        setLocalTranslation('');
        setTranslationError(false);
        setTranslating(true);
        const { sl, tl } = getTranslateLangs();
        const chromeTarget = tl.startsWith('zh') ? 'zh' : tl;
        try {
            // Try Chrome AI first (skip for same-language correction)
            if (sl !== tl && 'translation' in self && 'createTranslator' in self.translation) {
                const canTranslate = await self.translation.canTranslate({
                    sourceLanguage: sl,
                    targetLanguage: chromeTarget,
                });
                if (canTranslate !== 'no') {
                    const translator = await self.translation.createTranslator({
                        sourceLanguage: sl,
                        targetLanguage: chromeTarget,
                    });
                    const result = await translator.translate(text);
                    setLocalTranslation(result);
                    return;
                }
            }
            // Fallback to Google Translate via server proxy
            await translateViaServer(text, sl, tl);
        } catch (err) {
            console.error('Chrome AI translation failed, trying server:', err);
            try {
                await translateViaServer(text, sl, tl);
            } catch {
                setTranslationError(true);
            }
        } finally {
            setTranslating(false);
        }
    };

    const translateViaServer = async (text, sl = 'vi', tl = 'en') => {
        const res = await fetch(`/api/translate?text=${encodeURIComponent(text)}&sl=${sl}&tl=${tl}`);
        if (!res.ok) throw new Error('Server translate failed');
        const data = await res.json();
        if (data.translated) {
            setLocalTranslation(data.translated);
        } else {
            setTranslationError(true);
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

    // Auto-search effect with debounce
    useEffect(() => {
        // Skip if this query change came from a direct search (suggestion click, back, etc.)
        if (skipAutoSearch.current) {
            skipAutoSearch.current = false;
            return;
        }

        fetchSuggestions(query);

        clearTimeout(searchTimer.current);

        if (!query.trim()) {
            setAllData(null);
            setSearchedWord('');
            setLoading(false);
            return;
        }

        if (query.trim().length >= 2) {
            searchTimer.current = setTimeout(() => {
                runSearch(query);
            }, 600);
        }
    }, [query, fetchSuggestions]);

    useEffect(() => {
        if (allData && !allData.error && searchedWord) {
            const currentSources = getDisplaySources();
            const validResults = currentSources.length > 0 && currentSources.some(s => s.meanings?.length > 0);

            // Fetch translation if we have no results, OR if the dictMode has changed
            // (meaning we need a translation in a different language)
            if (!validResults && !translating && !translationError) {
                // To avoid an infinite loop, only fetch if the current localTranslation language
                // doesn't match the new target language, or if it isn't set yet.
                // We accomplish this by always firing translateLocally which starts by clearing state.
                const { tl } = getTranslateLangs();
                if (!localTranslation || (localTranslation && !translating)) {
                    // We use a small ref hack or rely on `translateLocally` clearing state to prevent loops.
                    // A safer way is checking if a fresh translation is needed:
                    // We'll just clear the local translation on dictMode change to force a re-fetch.
                    translateLocally(searchedWord);
                }
            }
        }
    }, [allData, searchedWord, dictMode]);

    // Clear local translation when dictMode changes, to force a re-fetch
    useEffect(() => {
        setLocalTranslation('');
    }, [dictMode]);

    // Handle input from BottomNav (OCR / voice)
    useEffect(() => {
        if (pendingInput) {
            skipAutoSearch.current = true;
            setQuery(pendingInput);
            runSearch(pendingInput);
            clearPendingInput();
        }
    }, [pendingInput]);

    const runSearch = async (word) => {
        if (!word.trim()) {
            setAllData(null);
            setSearchedWord('');
            setLoading(false);
            return;
        }

        setLoading(true);
        setSearchedWord(word.trim());
        setTranslationError(false);

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
            setLocalTranslation('');
            setTranslating(false);
            setAllData(parsedData);
            setWordSaved(isDictWordSaved(word.trim()));

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

    const handleSuggestionClick = (word, pushHistory = true) => {
        if (pushHistory && searchedWord && searchedWord !== word) {
            searchHistoryRef.current.push(searchedWord);
        }
        skipAutoSearch.current = true;
        setQuery(word);
        runSearch(word);
    };

    const goBack = () => {
        const prev = searchHistoryRef.current.pop();
        if (prev) {
            handleSuggestionClick(prev, false);
        }
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

    const handleOcrFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        setOcrLoading(true);
        setOcrProgress(0);
        try {
            const getOcrLang = () => {
                if (dictMode === 'zh-s') return 'chi_sim';
                if (dictMode === 'zh-t') return 'chi_tra';
                return 'vie';
            };
            const { data } = await Tesseract.recognize(file, getOcrLang(), {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setOcrProgress(Math.round(m.progress * 100));
                    }
                },
            });
            const text = data.text.trim().replace(/\s+/g, ' ');
            if (text) {
                setQuery(text);
                runSearch(text);
            }
        } catch (err) {
            console.error('OCR failed:', err);
        } finally {
            setOcrLoading(false);
        }
    };

    const handleVoice = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        if (dictMode === 'zh-s') recognition.lang = 'zh-CN';
        else if (dictMode === 'zh-t') recognition.lang = 'zh-TW';
        else recognition.lang = 'vi-VN';

        recognitionRef.current = recognition;
        finalTextRef.current = '';
        setInterimText('');
        setListening(true);

        recognition.onresult = (event) => {
            let final = '';
            let interim = '';
            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript;
                } else {
                    interim += result[0].transcript;
                }
            }
            finalTextRef.current = final;
            setInterimText(final + interim);
        };
        recognition.onerror = () => { setListening(false); setInterimText(''); };
        recognition.onend = () => {
            // Only auto-submit if we weren't cancelled
            if (listening && finalTextRef.current.trim()) {
                confirmVoice();
            }
        };
        recognition.start();
    };

    const confirmVoice = () => {
        recognitionRef.current?.stop();
        const text = (finalTextRef.current || interimText).trim();
        setListening(false);
        setInterimText('');
        if (text) {
            skipAutoSearch.current = true;
            setQuery(text);
            runSearch(text);
        }
    };

    const cancelVoice = () => {
        recognitionRef.current?.abort();
        finalTextRef.current = '';
        setListening(false);
        setInterimText('');
    };

    // Save button: short tap = toggle default saved, long press = open deck picker
    const handleSavePointerDown = () => {
        saveDidLongPress.current = false;
        setSavePressing(true);
        savePressTimer.current = setTimeout(() => {
            saveDidLongPress.current = true;
            setSavePressing(false);
            setShowDeckPicker(true);
        }, 500);
    };

    const handleSavePointerUp = () => {
        clearTimeout(savePressTimer.current);
        setSavePressing(false);
        if (!saveDidLongPress.current && searchedWord) {
            const added = toggleDictSavedWord(searchedWord);
            setWordSaved(added);
        }
    };

    const handleSavePointerCancel = () => {
        clearTimeout(savePressTimer.current);
        setSavePressing(false);
    };

    const displaySources = getDisplaySources();
    const hasValidResults = displaySources.length > 0 && displaySources.some(s => s.meanings?.length > 0);
    const firstSourceWithMetrics = displaySources.find(s => s.metrics && (s.metrics.ipa || s.metrics.subt_freq || s.metrics.mi));
    const metrics = firstSourceWithMetrics ? firstSourceWithMetrics.metrics : null;

    return (
        <div className="dictionary-container">
            {/* Scrollable results area */}
            <div className="results-area">
                {allData && allData.word && !allData.error && (
                    <div className="word-heading-card-row">
                        {searchHistoryRef.current.length > 0 && (
                            <button className="back-btn" onClick={goBack} title="Back">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div className="word-heading-card">
                            <div className="word-heading-row">
                                <h1 className="word-heading">{allData.word}</h1>
                                <div className="word-heading-actions">
                                    <button
                                        className="speak-btn"
                                        onClick={() => speak(allData.word)}
                                        title="Listen"
                                    >
                                        <Volume2 size={24} />
                                    </button>
                                    <button
                                        className={`dict-save-btn ${wordSaved ? 'saved' : ''}${savePressing ? ' pressing' : ''}`}
                                        onPointerDown={handleSavePointerDown}
                                        onPointerUp={handleSavePointerUp}
                                        onPointerCancel={handleSavePointerCancel}
                                        onContextMenu={e => e.preventDefault()}
                                        title={wordSaved ? 'Saved — hold for decks' : 'Save word — hold for decks'}
                                    >
                                        <Bookmark size={22} strokeWidth={2} fill={wordSaved ? 'currentColor' : 'none'} />
                                    </button>
                                </div>
                            </div>
                            {metrics && metrics.ipa && (
                                <div className="word-metrics">
                                    <span className="metric-badge ipa-badge">/{metrics.ipa}/</span>
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {allData && allData.error && (
                    <div className="no-results">
                        <Loader2 size={32} className="no-results-icon" style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
                        <p>Unable to connect to dictionary server. Make sure it's running on port 3001.</p>
                    </div>
                )}

                {allData && !allData.error && !hasValidResults && searchedWord && (
                    <div className="no-results no-results-action">
                        {/* We only show the "No definitions found" icon/text if there's ALSO no translation available */}
                        {!localTranslation && !translating && (
                            <>
                                <Search size={32} className="no-results-icon" />
                                <p>No definitions found for "<strong>{searchedWord}</strong>" in this dictionary.</p>
                            </>
                        )}


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
                                <span>{dictMode === 'vi' ? 'Correcting with Google...' : 'Translating with Google...'}</span>
                            </div>
                        )}

                        {localTranslation && !translating && (
                            <div className="local-translation-card success fade-in">
                                {dictMode === 'vi' && localTranslation.toLowerCase() !== searchedWord.toLowerCase() && (
                                    <span className="correction-label">Did you mean?</span>
                                )}
                                <h3
                                    className={`local-translation-result ${dictMode === 'vi' ? 'clickable' : ''}`}
                                    onClick={dictMode === 'vi' ? () => handleSuggestionClick(localTranslation) : undefined}
                                >
                                    {localTranslation}
                                </h3>
                            </div>
                        )}
                    </div>
                )}

                {(hasValidResults || localTranslation) && (dictMode === 'zh-s' || dictMode === 'zh-t' || dictMode === 'all') && allData?.hanvietComponents && (
                    <div className="hanviet-decomposition">
                        <div className="source-header">
                            <BookA size={16} />
                            <span className="source-name">漢越 Han - Viet</span>
                        </div>
                        {(() => {
                            const best = [];
                            const rest = [];
                            allData.hanvietComponents.forEach((comp, i) => {
                                if (!comp.entries || comp.entries.length === 0) return;
                                comp.entries.forEach((entry, j) => {
                                    const card = { comp, entry, key: `${i}-${j}` };
                                    if (j === 0) best.push(card);
                                    else rest.push(card);
                                });
                            });
                            const renderCard = ({ comp, entry, key }, cls) => {
                                const chinese = dictMode === 'zh-t' ? s2t(entry.chinese) : entry.chinese;
                                return (
                                    <div key={key} className={`hanviet-card ${cls}`} onClick={() => handleSuggestionClick(comp.syllable)}>
                                        <div className="hanviet-card-vi">{comp.syllable}</div>
                                        <div className="hanviet-card-zh">{chinese}</div>
                                        {entry.pinyin && <div className="hanviet-card-pinyin">{entry.pinyin}</div>}
                                        {entry.gloss && <div className="hanviet-card-gloss">{dictMode === 'zh-t' ? s2t(entry.gloss) : entry.gloss}</div>}
                                    </div>
                                );
                            };
                            return (
                                <div className="hanviet-cards">
                                    <div className="hanviet-cards-best">
                                        {best.map(c => renderCard(c, 'hanviet-card--best'))}
                                    </div>
                                    {rest.length > 0 && rest.map(c => renderCard(c, ''))}
                                </div>
                            );
                        })()}
                    </div>
                )}
                {hasValidResults && renderSources(displaySources, dictMode === 'zh-t' ? s2t : null)}
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
                        <div className="search-actions-group">
                            <button type="button" className="mode-btn" onClick={() => cameraInputRef.current?.click()}>
                                <Camera size={18} />
                            </button>
                            <button type="button" className="mode-btn" onClick={() => uploadInputRef.current?.click()}>
                                <Image size={18} />
                            </button>
                            <button type="button" className="mode-btn" onClick={handleVoice}>
                                <Mic size={18} />
                            </button>
                        </div>
                        <button type="submit" disabled={loading} className="search-button">
                            {loading ? <Loader2 size={20} className="loading-icon" /> : <Search size={20} />}
                        </button>
                    </div>
                </form>
            </div>

            {/* Hidden file inputs */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleOcrFile}
                style={{ display: 'none' }}
            />
            <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                onChange={handleOcrFile}
                style={{ display: 'none' }}
            />

            {/* OCR Loading Overlay */}
            {ocrLoading && (
                <div className="ocr-overlay">
                    <div className="ocr-overlay-card">
                        <Loader2 size={32} className="loading-icon" />
                        <span className="ocr-overlay-text">Recognizing text… {ocrProgress}%</span>
                        <div className="ocr-progress-bar">
                            <div className="ocr-progress-fill" style={{ width: `${ocrProgress}%` }} />
                        </div>
                        <button className="ocr-cancel-btn" onClick={() => setOcrLoading(false)}>
                            <X size={16} /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Voice Listening Overlay */}
            {listening && (
                <div className="ocr-overlay" onClick={cancelVoice}>
                    <div className="ocr-overlay-card" onClick={(e) => e.stopPropagation()}>
                        <div className="voice-pulse-ring">
                            <Mic size={32} color="var(--primary-color)" />
                        </div>
                        {interimText ? (
                            <span className="ocr-overlay-text voice-transcript">{interimText}</span>
                        ) : (
                            <span className="ocr-overlay-text">Listening…</span>
                        )}
                        <div className="voice-actions">
                            <button className="ocr-cancel-btn" onClick={(e) => { e.stopPropagation(); cancelVoice(); }}>
                                <X size={16} /> Cancel
                            </button>
                            <button className="voice-confirm-btn" onClick={(e) => { e.stopPropagation(); confirmVoice(); }} disabled={!interimText}>
                                <Check size={16} /> Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deck Picker Modal */}
            {showDeckPicker && searchedWord && (
                <DeckPickerModal
                    word={searchedWord}
                    onClose={() => setShowDeckPicker(false)}
                    onChanged={() => setWordSaved(isDictWordSaved(searchedWord))}
                />
            )}
        </div>
    );
};

export default DictionaryTab;
