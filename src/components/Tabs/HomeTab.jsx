import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Flame, BookOpen, Layers, ChevronRight, GraduationCap, BookOpenText, Search, Camera, Image, Mic, Loader2, X, BookA } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { useDong } from '../../context/DongContext';
import { useUser } from '../../context/UserContext';
import { getItems, getUnits, getNodesForUnitWithProgress } from '../../lib/db';
import { getDueItems, getTotalItems } from '../../lib/srs';
import speak from '../../utils/speak';
import './HomeTab.css';
import './DictionaryTab.css';

const EXTRA_LANG_LABELS = {
    ja: 'JA', fr: 'FR', de: 'DE', ru: 'RU', no: 'NO', es: 'ES',
};

const TIPS = [
    { title: 'Six Tones', body: 'Vietnamese has 6 tones. The same syllable "ma" can mean ghost, mother, but, horse, tomb, or rice seedling — depending on the tone!' },
    { title: 'No Conjugation', body: 'Vietnamese verbs never change form. "Tôi ăn", "bạn ăn", "họ ăn" — the verb stays the same regardless of subject or tense.' },
    { title: 'Adjectives After Nouns', body: 'Unlike English, adjectives come AFTER the noun: "cà phê đen" literally means "coffee black".' },
    { title: 'Pronouns = Relationships', body: 'Vietnamese has dozens of pronouns based on age, gender, and relationship. "Anh" (older brother), "chị" (older sister), "em" (younger sibling) are all "you".' },
    { title: 'North vs South', body: 'Northern and Southern Vietnamese sound very different. "V" is pronounced "v" in the North but "y" in the South. "R" is "z" in the North but "r" in the South.' },
    { title: 'Classifiers Matter', body: 'Vietnamese uses classifiers before nouns: "một con chó" (an animal-dog), "một cái bàn" (a thing-table). "Con" for animals, "cái" for objects.' },
    { title: 'Question with "Không?"', body: 'Turn any statement into a yes/no question by adding "không?" at the end: "Bạn khỏe" (you\'re well) → "Bạn khỏe không?" (are you well?).' },
    { title: 'Numbers Are Easy', body: 'Vietnamese numbers are logical: 11 = "mười một" (ten-one), 21 = "hai mươi một" (two-ten-one). No irregular teens!' },
    { title: 'Phở Pronunciation', body: '"Phở" is pronounced "fuh" with a rising tone — not "foe". The hook above (ở) signals a broken rising tone.' },
    { title: '"Đ" vs "D"', body: '"Đ" (with a stroke) sounds like English "d". But plain "D" sounds like "z" in the North and "y" in the South — a common trap for beginners!' },
    { title: 'Time Words, Not Tenses', body: 'Instead of verb tenses, Vietnamese uses time markers: "đã" (past), "đang" (ongoing), "sẽ" (future). "Tôi đã ăn" = "I already ate".' },
    { title: 'The Magic of "Ơi"', body: '"Ơi" is how you call someone\'s attention. "Anh ơi!" (hey, older brother!), "Em ơi!" (hey, younger one!). You\'ll hear it everywhere.' },
    { title: 'Polite Particles', body: '"Ạ" at the end of a sentence makes it polite: "Cảm ơn ạ" (thank you, respectfully). Use it with elders and strangers.' },
    { title: 'TELEX Typing', body: 'Type Vietnamese on any keyboard with TELEX: "a" + "w" = "ă", "o" + "w" = "ơ". Tones: s=sắc, f=huyền, r=hỏi, x=ngã, j=nặng.' },
    { title: '"Xin" = Please / Ask', body: '"Xin chào" literally means "ask hello" — a formal greeting. "Xin lỗi" = "ask pardon" (sorry). "Xin" adds formality to any request.' },
];

const PARTNERS = [
    { name: 'Cà Phê Sài Gòn', tagline: 'Try ordering a cà phê sữa đá', category: 'Coffee', color: '#6F4E37', initial: 'C', emoji: '\u2615' },
    { name: 'Chợ Bến Thành', tagline: 'Practice haggling in Vietnamese', category: 'Market', color: '#E74C3C', initial: 'B', emoji: '\uD83C\uDFEA' },
    { name: 'Bánh Mì House', tagline: 'Order your bánh mì like a local', category: 'Food', color: '#F39C12', initial: 'B', emoji: '\uD83E\uDD56' },
    { name: 'Áo Dài Boutique', tagline: 'Get fitted for your own áo dài', category: 'Fashion', color: '#9B59B6', initial: 'A', emoji: '\uD83D\uDC57' },
    { name: 'Phúc Long Tea', tagline: 'Ask for trà đào cam sả', category: 'Drinks', color: '#27AE60', initial: 'P', emoji: '\uD83C\uDF75' },
    { name: 'Gốm Việt Ceramics', tagline: 'Visit the Bát Tràng pottery village', category: 'Crafts', color: '#3498DB', initial: 'G', emoji: '\uD83C\uDFFA' },
];


function getWordsOfTheDay(items, count = 5) {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const words = items.filter(i => i.item_type === 'word' && i.en);
    if (words.length === 0) return [];
    const start = (dayOfYear * count) % words.length;
    const result = [];
    for (let i = 0; i < Math.min(count, words.length); i++) {
        result.push(words[(start + i) % words.length]);
    }
    return result;
}

function getTodayTips() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const start = (dayOfYear * 3) % TIPS.length;
    const result = [];
    for (let i = 0; i < 3; i++) {
        result.push(TIPS[(start + i) % TIPS.length]);
    }
    return result;
}

function getWeekDots(dailyStreak, lastVisitDate) {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date().getDay();
    const todayIdx = today === 0 ? 6 : today - 1;

    const checked = new Array(7).fill(false);
    if (lastVisitDate) {
        for (let i = 0; i < Math.min(dailyStreak, 7); i++) {
            const idx = todayIdx - i;
            if (idx >= 0) checked[idx] = true;
            else checked[idx + 7] = true;
        }
    }

    return days.map((label, i) => ({ label, checked: checked[i], isToday: i === todayIdx }));
}

const HomeTab = ({ onSearchWord }) => {
    const navigate = useNavigate();
    const { dailyStreak, lastVisitDate, completedNodes } = useDong();
    const { userProfile, updateUserProfile } = useUser();
    const dictMode = userProfile.dictMode || 'en';
    const setDictMode = (mode) => updateUserProfile({ dictMode: mode });
    const visibleDicts = userProfile?.visibleDicts || ['en', 'zh-s', 'zh-t'];
    const activeModes = [
        { id: 'all', label: 'All' },
        { id: 'vi', label: 'VI' },
        ...(visibleDicts.includes('en') ? [{ id: 'en', label: 'EN' }] : []),
        ...(visibleDicts.includes('zh-s') ? [{ id: 'zh-s', label: '简' }] : []),
        ...(visibleDicts.includes('zh-t') ? [{ id: 'zh-t', label: '繁' }] : []),
        ...(visibleDicts.includes('hanviet') ? [{ id: 'hanviet', label: '漢越' }] : []),
        ...['ja', 'fr', 'de', 'ru', 'no', 'es']
            .filter(lc => visibleDicts.includes(lc))
            .map(lc => ({ id: lc, label: EXTRA_LANG_LABELS[lc] })),
    ];
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [listening, setListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const [toggleOverflows, setToggleOverflows] = useState(false);
    const cameraRef = useRef(null);
    const uploadRef = useRef(null);
    const recognitionRef = useRef(null);
    const finalTextRef = useRef('');
    const toggleRef = useRef(null);

    useEffect(() => {
        const el = toggleRef.current;
        if (!el) return;
        const check = () => setToggleOverflows(el.scrollWidth > el.clientWidth + 2);
        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [activeModes.length]);

    const submitSearch = (text) => {
        if (text.trim() && onSearchWord) {
            onSearchWord(text.trim());
            setSearchQuery('');
        }
    };

    const handleOcrFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        setOcrLoading(true);
        setOcrProgress(0);
        try {
            const lang = dictMode === 'zh-s' ? 'chi_sim' : dictMode === 'zh-t' ? 'chi_tra' : 'vie';
            const { data } = await Tesseract.recognize(file, lang, {
                logger: (m) => { if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100)); },
            });
            const text = data.text.trim().replace(/\s+/g, ' ');
            if (text) submitSearch(text);
        } catch (err) {
            console.error('OCR failed:', err);
        } finally {
            setOcrLoading(false);
        }
    };

    const handleVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { alert('Speech recognition is not supported in this browser.'); return; }
        const recognition = new SR();
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
            let final = '', interim = '';
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) final += event.results[i][0].transcript;
                else interim += event.results[i][0].transcript;
            }
            finalTextRef.current = final;
            setInterimText(final + interim);
        };
        recognition.onerror = () => { setListening(false); setInterimText(''); };
        recognition.onend = () => {
            if (finalTextRef.current.trim()) {
                submitSearch(finalTextRef.current.trim());
            }
            setListening(false);
            setInterimText('');
        };
        recognition.start();
    };

    const cancelVoice = () => {
        recognitionRef.current?.abort();
        finalTextRef.current = '';
        setListening(false);
        setInterimText('');
    };

    const items = useMemo(() => getItems(), []);
    const wordsOfDay = useMemo(() => getWordsOfTheDay(items), [items]);
    const tips = useMemo(() => getTodayTips(), []);
    const dueCount = useMemo(() => getDueItems().length, []);
    const totalWords = useMemo(() => getTotalItems(), []);
    const weekDots = useMemo(() => getWeekDots(dailyStreak, lastVisitDate), [dailyStreak, lastVisitDate]);

    const handleContinue = () => {
        const units = getUnits();
        for (const unit of units) {
            const nodes = getNodesForUnitWithProgress(unit.id, completedNodes);
            const activeNode = nodes.find(n => n.status === 'active');
            if (activeNode) {
                if (activeNode.type === 'lesson') navigate(`/lesson/${activeNode.content_ref_id}`);
                else if (activeNode.type === 'skill' && activeNode.skill_content?.type === 'grammar_lesson') navigate(`/grammar-lesson/${activeNode.id}`);
                else if (activeNode.type === 'skill' && activeNode.skill_content?.route) navigate(activeNode.skill_content.route);
                else if (activeNode.type === 'test') navigate(`/test/${activeNode.id}`);
                else navigate(`/lesson/${activeNode.content_ref_id}`);
                return;
            }
        }
    };

    return (
        <div className="home-tab">
            {/* Dictionary Search */}
            <div className="home-dict-search" style={{ position: 'relative' }}>
                <div className={`dictionary-language-toggle-wrapper${toggleOverflows ? ' has-overflow' : ''}`}>
                    <div className="dictionary-language-toggle" ref={toggleRef}>
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
                </div>
                {showLangPicker && (
                    <div className="lang-picker-popup">
                        <div className="lang-picker-header">
                            <span className="lang-picker-title">Search meaning in:</span>
                            <button className="lang-picker-close" onClick={() => setShowLangPicker(false)}>
                                <X size={14} />
                            </button>
                        </div>
                        <div className="lang-picker-grid">
                            {[
                                { v: 'en', l: 'English' }, { v: 'zh-s', l: '简体中文' }, { v: 'zh-t', l: '繁體中文' },
                                { v: 'hanviet', l: '漢越 Hán Việt' },
                                { v: 'ja', l: '日本語' }, { v: 'fr', l: 'Français' }, { v: 'de', l: 'Deutsch' },
                                { v: 'ru', l: 'Русский' }, { v: 'no', l: 'Norsk' }, { v: 'es', l: 'Español' },
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
                <form className="search-form" onSubmit={(e) => { e.preventDefault(); submitSearch(searchQuery); }}>
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Type a Vietnamese word..."
                            value={listening ? interimText : searchQuery}
                            onChange={(e) => !listening && setSearchQuery(e.target.value)}
                            className="search-input"
                            readOnly={listening}
                        />
                        <div className="search-actions-group">
                            <button type="button" className="mode-btn" onClick={() => cameraRef.current?.click()}>
                                <Camera size={18} />
                            </button>
                            <button type="button" className="mode-btn" onClick={() => uploadRef.current?.click()}>
                                <Image size={18} />
                            </button>
                            {listening ? (
                                <button type="button" className="mode-btn" onClick={cancelVoice} style={{ color: 'var(--danger-color)' }}>
                                    <X size={18} />
                                </button>
                            ) : (
                                <button type="button" className="mode-btn" onClick={handleVoice}>
                                    <Mic size={18} />
                                </button>
                            )}
                        </div>
                        <button type="submit" disabled={ocrLoading || (!searchQuery.trim() && !listening)} className="search-button">
                            {ocrLoading ? <Loader2 size={20} className="loading-icon" /> : <Search size={20} />}
                        </button>
                    </div>
                </form>
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleOcrFile} style={{ display: 'none' }} />
                <input ref={uploadRef} type="file" accept="image/*" onChange={handleOcrFile} style={{ display: 'none' }} />
            </div>

            {/* OCR Loading Overlay */}
            {ocrLoading && (
                <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontSize: 14 }}>
                    Recognizing text... {ocrProgress}%
                </div>
            )}

            {/* Combined Streak + Stats Card */}
            <div className="home-streak-card compact">
                <div className="home-streak-row">
                    <div className="home-streak-header">
                        <Flame size={16} color="#FF6B35" fill="#FF6B35" />
                        <span className="home-streak-count">{dailyStreak}</span>
                        <span className="home-streak-label">Daily Streak</span>
                    </div>
                    <div className="home-week-dots">
                        {weekDots.map((d, i) => (
                            <div key={i} className={`home-dot ${d.checked ? 'checked' : ''} ${d.isToday ? 'today' : ''}`}>
                                <div className="home-dot-circle">{d.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="home-streak-divider" />
                <div className="home-streak-stats">
                    <div className="home-progress-stat">
                        <BookOpenText size={16} color="#FFB703" />
                        <span className="home-progress-number">{totalWords}</span>
                        <span className="home-progress-label">Words</span>
                    </div>
                    <div className="home-progress-divider" />
                    <div className="home-progress-stat">
                        <GraduationCap size={16} color="#06D6A0" />
                        <span className="home-progress-number">{completedNodes.size}</span>
                        <span className="home-progress-label">Lessons</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="home-actions">
                <button className="home-action-card home-action-study" onClick={handleContinue}>
                    <BookOpen size={22} />
                    <span>Continue Lesson</span>
                    <ChevronRight size={18} />
                </button>
                {dueCount > 0 && (
                    <button className="home-action-card home-action-review" onClick={() => navigate('/practice/flashcards')}>
                        <Layers size={22} />
                        <span>{dueCount} cards to review</span>
                        <ChevronRight size={18} />
                    </button>
                )}
            </div>

            {/* Words of the Day */}
            {wordsOfDay.length > 0 && (
                <>
                    <div className="home-section-header">Words of the Day</div>
                    <div className="home-tips-scroll">
                        {wordsOfDay.map((word, i) => (
                            <div key={i} className="home-wotd-card">
                                <div className="home-wotd-word">
                                    <span className="home-wotd-vi">{word.vi_text}</span>
                                    <button className="home-speak-btn" onClick={() => speak(word.vi_text)}>
                                        <Volume2 size={16} />
                                    </button>
                                </div>
                                <div className="home-wotd-en">{word.en}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Tips */}
            <div className="home-section-header">
                <span>Tips & Tricks</span>
            </div>
            <div className="home-tips-scroll">
                {tips.map((tip, i) => (
                    <div key={i} className="home-tip-card">
                        <div className="home-tip-title">{tip.title}</div>
                        <div className="home-tip-body">{tip.body}</div>
                    </div>
                ))}
            </div>

            {/* Explore Vietnam */}
            <div className="home-section-header">
                <span>Explore Vietnam</span>
            </div>
            <div className="home-tips-scroll">
                {PARTNERS.map((p, i) => (
                    <div key={i} className="home-partner-card">
                        <div className="home-partner-hero" style={{ backgroundColor: `${p.color}20` }}>
                            <span className="home-partner-emoji">{p.emoji}</span>
                        </div>
                        <div className="home-partner-info">
                            <div className="home-partner-top">
                                <div className="home-partner-logo" style={{ backgroundColor: p.color }}>
                                    {p.initial}
                                </div>
                                <div className="home-partner-badge" style={{ color: p.color, backgroundColor: `${p.color}18` }}>
                                    {p.category}
                                </div>
                            </div>
                            <div className="home-partner-name">{p.name}</div>
                            <div className="home-partner-tagline">{p.tagline}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomeTab;
