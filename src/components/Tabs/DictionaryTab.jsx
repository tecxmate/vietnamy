import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, BookA, Loader2, Volume2, Sparkles, Mic, X, ArrowLeft, Check, Bookmark, Clock, Trash2, Type, ChevronLeft, ChevronDown, BookmarkPlus } from 'lucide-react';
import speak, { preloadSpeak } from '../../utils/speak';
import { useSpeakingState } from '../../hooks/useSpeakingState';

import { useUser } from '../../context/UserContext';
import { isDictWordSaved, toggleDictSavedWord } from '../../lib/dictSavedWords';
import DeckPickerModal from '../DeckPickerModal';
import TappableVietnamese from '../TappableVietnamese';
import WordPopup from '../WordPopup';
import { useT } from '../../lib/i18n';
import './DictionaryTab.css';


const HISTORY_KEY = 'vnme_dict_history';
const MAX_HISTORY = 10;

const getSearchHistory = () => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch { return []; }
};

const addToSearchHistory = (word) => {
    const trimmed = word.trim();
    if (!trimmed) return;
    const history = getSearchHistory().filter(w => w !== trimmed);
    history.unshift(trimmed);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
};

const clearSearchHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
};

// Base modes always available
const BASE_MODES = [
    { id: 'en', label: 'EN', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
    { id: 'vi', label: 'VI', flag: '\uD83C\uDDFB\uD83C\uDDF3' },
    { id: 'zh-s', label: '\u7B80', flag: '\uD83C\uDDE8\uD83C\uDDF3' },
    { id: 'zh-t', label: '\u7E41', flag: '\uD83C\uDDF9\uD83C\uDDFC' },
];

const SOURCE_LABELS = {
    'VE': 'English',
    '3-dict-combination': 'Tiếng Việt',
    'AI_Generated_ZH': '简体中文',
    'AI_Generated_ZH_T': '繁體中文',
    'AI_Generated_EN': 'English',
    'HanViet': '漢越 Hán Việt',
    'Wiktionary': 'Wiktionary',
    'FVDP (GPL)': 'English → Tiếng Việt',
    'TrungViet': '中文 → Tiếng Việt',
    'VietAnh_Stardict': 'Tiếng Việt → English',
};


/** Categorise a source by language for smart sorting */
const getSourceCategory = (name) => {
    if (['AI_Generated_ZH', 'AI_Generated_ZH_T', 'TrungViet', 'HanViet'].includes(name)) return 'zh';
    if (['VE', 'AI_Generated_EN', 'FVDP (GPL)', 'VietAnh_Stardict', 'Wiktionary'].includes(name)) return 'en';
    return 'other';
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

/** Parse VietPhap/PhapViet structured text into sections with examples.
 *  Format: @word\n -french_meaning\n = Vi example +Fr translation\n ...
 */
const parseVietPhap = (text) => {
    const sections = [];
    // Strip the @headword line if present
    const lines = text.replace(/^@[^\n]*\n?/, '').split('\n');

    let currentSection = null;
    for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        if (line.startsWith('-')) {
            // New meaning/sense — extract optional word type prefix like (bot.), {to study}, [adj]
            if (currentSection) sections.push(currentSection);
            const raw_meaning = line.slice(1).trim();
            // Match leading (word_type), {word_type}, or [word_type]
            const typeMatch = raw_meaning.match(/^(\([^)]+\)|\{[^}]+\}|[[][^\]]+\])\s*/);
            const wordType = typeMatch ? typeMatch[1].replace(/^[({[]|[)}\]]$/g, '').trim() : null;
            const definition = typeMatch ? raw_meaning.slice(typeMatch[0].length).trim() : raw_meaning;
            currentSection = { wordType, meaning: definition, examples: [] };
        } else if (line.startsWith('= ') || line.startsWith('=')) {
            // Example line: "= Vi text +Fr text" or "=compound +meaning"
            const content = line.startsWith('= ') ? line.slice(2) : line.slice(1);
            const plusIdx = content.indexOf('+');
            if (plusIdx > 0) {
                const vi = content.slice(0, plusIdx).trim().replace(/_/g, ' ');
                const fr = content.slice(plusIdx + 1).trim();
                if (currentSection) {
                    currentSection.examples.push({ vi, fr });
                } else {
                    // Standalone example (no preceding meaning)
                    if (!sections.length) sections.push({ meaning: '', examples: [] });
                    sections[sections.length - 1].examples.push({ vi, fr });
                }
            } else {
                // Example without + translation
                const vi = content.trim().replace(/_/g, ' ');
                if (currentSection) {
                    currentSection.examples.push({ vi, fr: '' });
                }
            }
        } else {
            // Continuation or other text
            if (currentSection) {
                currentSection.meaning += ' ' + line;
            }
        }
    }
    if (currentSection) sections.push(currentSection);
    return sections;
};

const VOICE_LANGUAGES = [
    { code: 'vi', bcp: 'vi-VN', label: 'Tiếng Việt' },
    { code: 'en', bcp: 'en-US', label: 'English' },
    { code: 'zh-s', bcp: 'zh-CN', label: '简体中文' },
    { code: 'zh-t', bcp: 'zh-TW', label: '繁體中文' },
];

const isStardictSource = (name) => ['TrungViet', 'VietAnh_Stardict'].includes(name);

const renderSources = (sources, convert = null, searchQuery = '', onWordTap = null, uiT = (key) => key) => {
    if (!sources || sources.length === 0) return null;
    const t = (text) => convert ? convert(text) : text;
    return sources.map((src) => (
        <div key={src.source_name} className="source-section">
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
                                                                    <span className="example-vi">{onWordTap ? <TappableVietnamese text={ex.phrase} onWordTap={onWordTap} bold /> : <b>{ex.phrase}</b>}</span>
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
                            </div >
                        ) : isStardictSource(src.source_name) ? (
                            <div className="stardict-entry">
                                {parseVietPhap(meaning.meaning_text).map((section, sIdx) => (
                                    <div key={sIdx} className="meaning-item">
                                        <div className="meaning-header">
                                            {section.wordType && (
                                                <span className="part-of-speech">{section.wordType}</span>
                                            )}
                                            {section.meaning && (
                                                <p className="meaning-text"><strong>{section.meaning}</strong></p>
                                            )}
                                        </div>
                                        {section.examples.length > 0 && (
                                            <div className="examples-list">
                                                {section.examples.map((ex, eIdx) => (
                                                    <div key={eIdx} className="example-item">
                                                        <div className="example-vi-row">
                                                            <p className="example-vi">{onWordTap ? <TappableVietnamese text={ex.vi} onWordTap={onWordTap} /> : ex.vi}</p>
                                                            <button
                                                                className="speak-btn speak-btn--sm"
                                                                onClick={() => speak(ex.vi)}
                                                                title={uiT('dict_listen')}
                                                            >
                                                                <Volume2 size={14} />
                                                            </button>
                                                        </div>
                                                        {ex.fr && (
                                                            <p className="example-en">{ex.fr}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
                        {
                            meaning.examples && meaning.examples.length > 0 && (
                                <div className="examples-list">
                                    {meaning.examples.map((ex, eIdx) => (
                                        <div key={eIdx} className="example-item">
                                            <div className="example-vi-row">
                                                <p className="example-vi">{onWordTap ? <TappableVietnamese text={ex.vietnamese_text} onWordTap={onWordTap} /> : ex.vietnamese_text}</p>
                                                <button
                                                    className="speak-btn speak-btn--sm"
                                                    onClick={() => speak(ex.vietnamese_text)}
                                                    title={uiT('dict_listen')}
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
                            )
                        }

                        {
                            searchQuery.trim().split(' ').length > 2 && (
                                <div className="premium-audio-request">
                                    <div className="premium-audio-info">
                                        <Sparkles size={20} color="#CE82FF" fill="#CE82FF" />
                                        <span>{uiT('dict_need_pronunciation')}</span>
                                    </div>
                                    <button
                                        className="premium-audio-btn"
                                        onClick={() => alert(uiT('dict_human_pronunciation_alert'))}
                                    >
                                        {uiT('dict_order_human_pronunciation')}
                                    </button>
                                </div>
                            )
                        }
                    </div >
                ))}
            </div >
        </div >
    ));
};

const DictionaryTab = ({ pendingInput, clearPendingInput, onNavigateToLibrary }) => {
    const { userProfile, updateUserProfile } = useUser();
    const t = useT();
    const dictMode = userProfile.dictMode || 'en';
    const setDictMode = (mode) => updateUserProfile({ dictMode: mode });
    const [query, setQuery] = useState('');
    const [allData, setAllData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchedWord, setSearchedWord] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [localTranslation, setLocalTranslation] = useState('');
    const [translating, setTranslating] = useState(false);
    const [translationError, setTranslationError] = useState(false);

    // Search history for back navigation
    const searchHistoryRef = useRef([]);
    const [recentSearches, setRecentSearches] = useState(() => getSearchHistory());

    // Save button states
    const [wordSaved, setWordSaved] = useState(false);
    const [showDeckPicker, setShowDeckPicker] = useState(false);

    const [showLangPicker, setShowLangPicker] = useState(false);
    const [toggleOverflows, setToggleOverflows] = useState(false);
    const [sourcesExpanded, setSourcesExpanded] = useState(false);
    const toggleRef = useRef(null);

    // Word popup state
    const [popupWord, setPopupWord] = useState(null); // { word, anchorRect }

    // Voice input states
    const [listening, setListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const [showVoiceLangPicker, setShowVoiceLangPicker] = useState(false);
    const [voiceInputLang, setVoiceInputLang] = useState('vi');
    const finalTextRef = useRef('');

    // Refs
    const suggestTimer = useRef(null);
    const searchTimer = useRef(null);
    const recognitionRef = useRef(null);
    const skipAutoSearch = useRef(false);

    // Build the active MODES list from the temporarily supported dictionary languages.
    const visibleDicts = userProfile?.visibleDicts || ['en', 'zh-s', 'zh-t'];
    const activeModes = [
        { id: 'all', label: t('dict_mode_all') },
        ...(visibleDicts.includes('en') ? [{ id: 'en', label: t('dict_mode_en') }] : []),
        ...(visibleDicts.includes('zh-s') ? [{ id: 'zh-s', label: t('dict_mode_zh_s') }] : []),
        ...(visibleDicts.includes('zh-t') ? [{ id: 'zh-t', label: t('dict_mode_zh_t') }] : []),
    ];

    useEffect(() => {
        const el = toggleRef.current;
        if (!el) return;
        const check = () => setToggleOverflows(el.scrollWidth > el.clientWidth + 2);
        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [activeModes.length]);

    const looksVietnamese = (text) =>
        /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(text);

    const getTranslateLangs = (text) => {
        const nonVi = text && !looksVietnamese(text);
        const langMap = {
            'zh-s': 'zh-CN',
            'zh-t': 'zh-TW',
        };
        const tl = langMap[dictMode] || 'en';
        return nonVi ? { sl: 'auto', tl: 'vi' } : { sl: 'vi', tl };
    };

    const translateLocally = async (text) => {
        setLocalTranslation('');
        setTranslationError(false);
        setTranslating(true);
        const { sl, tl } = getTranslateLangs(text);
        const chromeTarget = tl.startsWith('zh') ? 'zh' : tl;
        try {
            // Try Chrome AI first (skip for same-language correction and auto-detect)
            if (sl !== 'auto' && sl !== tl && 'translation' in self && 'createTranslator' in self.translation) {
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
                getTranslateLangs();
                if (!localTranslation || (localTranslation && !translating)) {
                    // We use a small ref hack or rely on `translateLocally` clearing state to prevent loops.
                    // A safer way is checking if a fresh translation is needed:
                    // We'll just clear the local translation on dictMode change to force a re-fetch.
                    translateLocally(searchedWord);
                }
            }
        }
    }, [allData, searchedWord, dictMode]);

    const wordSpeakState = useSpeakingState(allData?.word || '');

    // Warm the headword clip when a dictionary entry loads, so the listen tap is instant.
    useEffect(() => {
        if (allData?.word && !allData.error) preloadSpeak([allData.word]);
    }, [allData]);

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
        setSourcesExpanded(false);

        try {
            const enc = encodeURIComponent(word.trim());

            const fetches = [
                fetch(`/api/search?q=${enc}&lang=en`),
                fetch(`/api/search?q=${enc}&lang=zh-s`),
            ];
            const responses = await Promise.all(fetches);
            if (responses.some(r => !r.ok)) throw new Error('Search failed');
            const [enData, zhData] = await Promise.all(responses.map(r => r.json()));

            const zhSources = zhData.structured ? zhData.data : [];
            const enSources = enData.structured ? enData.data : [];
            const parsedData = {
                word: word.trim(),
                en: enSources.filter(s => ['VE', 'AI_Generated_EN', 'Wiktionary'].includes(s.source_name)),
                vi: enSources.filter(s => ['3-dict-combination', 'FVDP (GPL)'].includes(s.source_name)),
                zh: zhSources,
                components: enData.components || null,
                hanvietComponents: zhData.hanvietComponents || null,
            };
            setLocalTranslation('');
            setTranslating(false);
            setAllData(parsedData);
            setWordSaved(isDictWordSaved(word.trim()));
            addToSearchHistory(word.trim());
            setRecentSearches(getSearchHistory());

            // If no results, refresh suggestions for the searched word so "did you mean" shows
            const hasAny = Object.entries(parsedData).some(([k, v]) =>
                k !== 'word' && k !== 'components' && k !== 'hanvietComponents' && Array.isArray(v) && v.some(s => s.meanings?.length > 0)
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

    const handleWordTap = useCallback((word, rect, isPhrase = false) => {
        if (!word) { setPopupWord(null); return; }
        setPopupWord({ word, anchorRect: rect, isPhrase });
    }, []);

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
        const filterSpecial = (sources) => sources.filter(s => s.source_name !== 'HanViet' && s.source_name !== 'VietHan');
        switch (dictMode) {
            case 'en': return allData.en || [];
            case 'zh-s': return filterSpecial(allData.zh || []);
            case 'zh-t': return filterSpecial(allData.zh || []);
            case 'all': {
                const all = [
                    ...(visibleDicts.includes('en') ? (allData.en || []) : []),
                    ...((visibleDicts.includes('zh-s') || visibleDicts.includes('zh-t')) ? filterSpecial(allData.zh || []) : []),
                ];
                // Deduplicate by source_name
                const seen = new Set();
                const deduped = all.filter(s => {
                    if (seen.has(s.source_name)) return false;
                    seen.add(s.source_name);
                    return true;
                });

                // Smart sort: prioritize results matching input language
                const isCJK = ch => {
                    const cp = ch.codePointAt(0);
                    return (cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3400 && cp <= 0x4DBF) ||
                        (cp >= 0x20000 && cp <= 0x2A6DF) || (cp >= 0xF900 && cp <= 0xFAFF);
                };
                const queryHasCJK = [...searchedWord].some(isCJK);
                const queryIsEn = /^[A-Za-z\s]+$/.test(searchedWord);

                return deduped.sort((a, b) => {
                    const catA = getSourceCategory(a.source_name);
                    const catB = getSourceCategory(b.source_name);
                    if (queryHasCJK) {
                        if (catA === 'zh' && catB !== 'zh') return -1;
                        if (catA !== 'zh' && catB === 'zh') return 1;
                    } else if (queryIsEn) {
                        if (catA === 'en' && catB !== 'en') return -1;
                        if (catA !== 'en' && catB === 'en') return 1;
                    }
                    return 0;
                });
            }
            default:
                return [];
        }
    };

    const startVoiceWithLang = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert(t('speech_not_supported', 'Speech recognition is not supported in this browser.'));
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        const selectedLang = VOICE_LANGUAGES.find(l => l.code === voiceInputLang);
        recognition.lang = selectedLang?.bcp || 'vi-VN';

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
            finalTextRef.current = final || interim;
            setInterimText(final + interim);
        };
        recognition.onerror = () => { setListening(false); setInterimText(''); };
        recognition.onend = () => {
            const text = finalTextRef.current.trim();
            setListening(false);
            setInterimText('');
            if (text) {
                skipAutoSearch.current = true;
                setQuery(text);
                runSearch(text);
            }
        };
        recognition.start();
    };

    const stopVoice = () => { recognitionRef.current?.stop(); };

    const cancelVoice = () => {
        recognitionRef.current?.abort();
        finalTextRef.current = '';
        setListening(false);
        setInterimText('');
        setShowVoiceLangPicker(false);
    };

    // Save button: first tap = save to default deck, second tap = open deck picker
    const handleSaveTap = () => {
        if (!searchedWord) return;
        if (wordSaved) {
            // Already saved — open deck picker to manage decks
            setShowDeckPicker(true);
        } else {
            // Not saved — save to default deck
            const added = toggleDictSavedWord(searchedWord);
            setWordSaved(added);
        }
    };

    const displaySources = getDisplaySources();
    const hasValidResults = displaySources.length > 0 && displaySources.some(s => s.meanings?.length > 0);
    const firstSourceWithMetrics = displaySources.find(s => s.metrics && (s.metrics.ipa || s.metrics.subt_freq || s.metrics.mi));
    const metrics = firstSourceWithMetrics ? firstSourceWithMetrics.metrics : null;

    return (
        <div className="dictionary-container">
            {/* Scrollable results area */}
            <div className="results-area">
                {/* Recent Searches — shown when idle */}
                {!allData && !loading && (
                    <div className="dict-idle">
                        {recentSearches.length > 0 && (
                            <div className="dict-recent">
                                <div className="dict-recent-header">
                                    <Clock size={14} />
                                    <span>{t('dict_recent_searches')}</span>
                                    <button className="dict-recent-clear" onClick={() => { clearSearchHistory(); setRecentSearches([]); }}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                                <div className="dict-recent-list">
                                    {recentSearches.map((word, i) => (
                                        <button key={i} className="dict-recent-item" onClick={() => handleSuggestionClick(word)}>
                                            {word}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="dict-guide">
                            <div className="dict-guide-item">
                                <div className="dict-guide-icon"><Type size={16} /></div>
                                <p>{t('dict_guide_type')}</p>
                            </div>
                            <div className="dict-guide-item">
                                <div className="dict-guide-icon"><Mic size={16} /></div>
                                <p>{t('dict_guide_mic')}</p>
                            </div>
                            <div className="dict-guide-item">
                                <div className="dict-guide-icon"><BookA size={16} /></div>
                                <p>{t('dict_guide_switch')}</p>
                            </div>
                            <div className="dict-guide-item">
                                <div className="dict-guide-icon"><ChevronLeft size={16} /></div>
                                <p>{t('dict_guide_back')}</p>
                            </div>
                            <div className="dict-guide-item">
                                <div className="dict-guide-icon"><BookmarkPlus size={16} /></div>
                                <p>{t('dict_guide_bookmark')}</p>
                            </div>
                        </div>
                    </div>
                )}

                {allData && allData.word && !allData.error && (
                    <div className="word-heading-card-row">
                        {searchHistoryRef.current.length > 0 && (
                            <button className="back-btn" onClick={goBack} title={t('dict_back')}>
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
                                        title={t('dict_listen')}
                                        aria-busy={wordSpeakState === 'loading'}
                                    >
                                        {wordSpeakState === 'loading'
                                            ? <Loader2 size={24} className="speak-btn-spin" />
                                            : <Volume2 size={24} />}
                                    </button>
                                    <button
                                        className={`dict-save-btn ${wordSaved ? 'saved' : ''}`}
                                        onClick={handleSaveTap}
                                        title={wordSaved ? t('dict_saved_manage') : t('dict_save_word')}
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

                {/* MOCKUP: Contextual Partner Widget */}
                {allData && !allData.error && hasValidResults && (['cà phê', 'cafe', 'phở', 'bánh mì', 'du lịch'].includes(searchedWord.toLowerCase())) && (
                    <div className="partner-widget fade-in" style={{ backgroundColor: 'var(--surface-color)', borderLeft: '4px solid var(--primary-color)', borderRadius: '0 12px 12px 0', padding: '16px 20px', marginBottom: 24, marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <div style={{ flexShrink: 0, marginTop: 2 }}>
                            <Sparkles size={20} color="var(--primary-color)" fill="var(--primary-color)" opacity={0.8} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{t('dict_partner_title')}</div>
                            <div style={{ fontSize: 15, color: 'var(--text-main)', lineHeight: 1.5 }}>
                                {['cà phê', 'cafe'].includes(searchedWord.toLowerCase()) && <span>Vietnam is the world's second-largest coffee producer, famous for its strong Robusta beans often served with sweetened condensed milk. <button className="ghost" style={{ padding: 0, color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600, textDecoration: 'none', display: 'inline' }} onClick={() => onNavigateToLibrary?.('best-cafes')}>Read: Best Cafes in Hanoi & HCMC →</button></span>}
                                {['phở', 'bánh mì'].includes(searchedWord.toLowerCase()) && <span>Street food is the heart of Vietnamese culinary culture. The best dishes are often found at small, family-run stalls rather than large restaurants. <button className="ghost" style={{ padding: 0, color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600, textDecoration: 'none', display: 'inline' }} onClick={() => onNavigateToLibrary?.('street-food-guide')}>Read: A guide to Vietnamese Street food →</button></span>}
                                {searchedWord.toLowerCase() === 'du lịch' && <span>When traveling in Vietnam, having a reliable internet connection makes navigation and translation much easier. <button className="ghost" style={{ padding: 0, color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600, textDecoration: 'none', display: 'inline' }} onClick={() => onNavigateToLibrary?.('vietnam-travel-tech')}>Read: Essential Tech for Vietnam Travel →</button></span>}
                            </div>
                        </div>
                    </div>
                )}

                {allData && allData.error && (
                    <div className="no-results">
                        <Loader2 size={32} className="no-results-icon" style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
                        <p>{t('dict_no_server')}</p>
                    </div>
                )}

                {allData && !allData.error && !hasValidResults && searchedWord && (
                    <div className="no-results no-results-action">
                        {/* We only show the "No definitions found" icon/text if there's ALSO no translation available */}
                        {!localTranslation && !translating && (
                            <>
                                <Search size={32} className="no-results-icon" />
                                <p>{t('dict_no_definition_in_dictionary').replace('{word}', searchedWord)}</p>
                            </>
                        )}


                        {suggestions.length > 0 && (
                            <div className="did-you-mean fade-in">
                                <span className="dym-label">{t('dict_suggest_title')}</span>
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
                                <span>{t('dict_translate_label')}</span>
                            </div>
                        )}

                        {localTranslation && !translating && (
                            <div className="local-translation-card success fade-in">
                                {localTranslation.toLowerCase() !== searchedWord.toLowerCase() && (
                                    <span className="correction-label">{t('dict_correction')}</span>
                                )}
                                <h3
                                    className="local-translation-result"
                                >
                                    {localTranslation}
                                </h3>
                            </div>
                        )}
                    </div>
                )}

                {hasValidResults && (() => {
                    // Traditional now arrives converted from /api/search?lang=zh-t.
                    // Converting again here would double-apply s2t, which is not
                    // idempotent for every character (幺 → 么 → 麼, 苎 → 苧 → 薴).
                    const convert = null;
                    const MAX_VISIBLE = 2;
                    const hasMore = displaySources.length > MAX_VISIBLE;
                    const visible = hasMore && !sourcesExpanded ? displaySources.slice(0, MAX_VISIBLE) : displaySources;
                    const hiddenCount = displaySources.length - MAX_VISIBLE;
                    return (
                        <>
                            {renderSources(visible, convert, '', handleWordTap, t)}
                            {hasMore && !sourcesExpanded && (
                                <button className="sources-expand-btn" onClick={() => setSourcesExpanded(true)}>
                                    <span>{t('dict_show_more_sources').replace('{count}', hiddenCount)}</span>
                                    <ChevronDown size={16} />
                                </button>
                            )}
                            {hasMore && sourcesExpanded && renderSources(displaySources.slice(MAX_VISIBLE), convert, '', handleWordTap, t)}
                        </>
                    );
                })()}
            </div>

            {/* Sticky bottom bar: suggestions → mode toggle → search */}
            <div className="dictionary-bottom-bar">
                <div className="suggestions-wrapper">
                    <div className="suggestions-strip" onScroll={(e) => {
                        e.currentTarget.parentElement.classList.toggle('scrolled-left', e.currentTarget.scrollLeft > 4);
                    }}>
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
                </div>

                <div className={`dictionary-language-toggle-wrapper${toggleOverflows ? ' has-overflow' : ''}`}>
                    <div className="dictionary-language-toggle" ref={toggleRef} onScroll={(e) => e.currentTarget.parentElement.classList.toggle('scrolled-left', e.currentTarget.scrollLeft > 4)}>
                        <button className={`lang-toggle-label${showLangPicker ? ' active' : ''}`} onClick={() => setShowLangPicker(!showLangPicker)}>
                            <BookA size={16} />
                        </button>
                        {activeModes.map(mode => (
                            <button
                                key={mode.id}
                                className={`toggle-btn ${dictMode === mode.id ? 'active' : ''}`}
                                onClick={() => setDictMode(mode.id)}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                    {showLangPicker && (
                        <div className="lang-picker-popup">
                            <div className="lang-picker-header">
                                <span className="lang-picker-title">{t('dict_lang_picker_title')}</span>
                                <button className="lang-picker-close" onClick={() => setShowLangPicker(false)}>
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="lang-picker-grid">
                                {[
                                    { v: 'en', l: t('onboarding_lang_en') }, { v: 'zh-s', l: t('onboarding_lang_zh_s') }, { v: 'zh-t', l: t('onboarding_lang_zh_t') },
                                ].map(lang => (
                                    <button
                                        key={lang.v}
                                        className={`lang-picker-chip ${visibleDicts.includes(lang.v) ? 'active' : ''}`}
                                        onClick={() => {
                                            const next = visibleDicts.includes(lang.v)
                                                ? visibleDicts.filter(l => l !== lang.v)
                                                : [...visibleDicts, lang.v];
                                            updateUserProfile({ visibleDicts: next.length > 0 ? next : ['en'] });
                                        }}
                                    >
                                        {lang.l}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-input-wrapper">
                        <input
                            id="dict-search-input"
                            type="text"
                            placeholder={t('dict_search_placeholder')}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="search-input"
                        />
                        {query && (
                            <button type="button" className="search-clear-btn" onClick={() => { setQuery(''); setAllData(null); setSearchedWord(''); setSuggestions([]); }}>
                                <X size={16} />
                            </button>
                        )}
                        <div className="search-actions-group">
                            <button type="button" className="mode-btn" onClick={() => setShowVoiceLangPicker(true)}>
                                <Mic size={18} />
                            </button>
                        </div>
                        <button type="submit" disabled={loading} className="search-button">
                            {loading ? <Loader2 size={20} className="loading-icon" /> : <Search size={20} />}
                        </button>
                    </div>
                </form>
            </div>

            {/* Voice Language Picker + Listening Modal */}
            {(showVoiceLangPicker || listening) && (
                <div className="voice-overlay" onClick={() => { if (!listening) setShowVoiceLangPicker(false); }}>
                    <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
                        {!listening ? (
                            <>
                                <h3 className="voice-modal-title">{t('dict_searching_voice_title')}</h3>
                                <div className="lang-picker-scroll-wrap">
                                    <div className="lang-picker-grid">
                                        {VOICE_LANGUAGES.map(lang => (
                                            <button
                                                key={lang.code}
                                                className={`lang-picker-btn${voiceInputLang === lang.code ? ' active' : ''}`}
                                                onClick={() => setVoiceInputLang(lang.code)}
                                            >
                                                <span className="lang-picker-name">{lang.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="voice-listening-body">
                                <div className="voice-listening-icon"><Mic size={36} color="var(--primary-color)" /></div>
                                <h3 className="voice-modal-title">{t('listening')}</h3>
                                {interimText && <p className="voice-interim-text">{interimText}</p>}
                            </div>
                        )}
                        <div className="voice-modal-actions">
                            <button className="voice-modal-cancel-btn" onClick={cancelVoice}><X size={16} /> {t('cancel')}</button>
                            {!listening ? (
                                <button className="voice-modal-primary-btn" onClick={startVoiceWithLang}><Mic size={16} /> {t('start_listening')}</button>
                            ) : (
                                <button className="voice-modal-primary-btn" onClick={stopVoice}><Check size={16} /> {t('done')}</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Word Popup */}
            {popupWord && (
                <WordPopup
                    word={popupWord.word}
                    anchorRect={popupWord.anchorRect}
                    dictMode={dictMode}
                    isPhrase={popupWord.isPhrase}
                    onClose={() => setPopupWord(null)}
                    onNavigate={(word) => { setPopupWord(null); handleSuggestionClick(word); }}
                    onSave={(word) => { toggleDictSavedWord(word); setPopupWord(null); }}
                />
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
