import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Flame, BookOpen, Layers, ChevronRight, GraduationCap, BookOpenText, Search, Mic, X, Check } from 'lucide-react';
import { useDong } from '../../context/DongContext';
import { useT } from '../../lib/i18n';
import { getItems, getUnits, getNodesForUnitWithProgress } from '../../lib/db';
import { getDueItems, getTotalItems } from '../../lib/srs';
import ARTICLES from '../../data/articleData';
import speak from '../../utils/speak';
import { useUser } from '../../context/UserContext';
import './HomeTab.css';

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
    const { userProfile } = useUser();
    const t = useT();
    const [searchQuery, setSearchQuery] = useState('');
    const [listening, setListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [inputLang, setInputLang] = useState('vi');
    const [copiedCode, setCopiedCode] = useState(null);
    const recognitionRef = useRef(null);
    const finalTextRef = useRef('');

    const partnerCtas = useMemo(() => {
        return ARTICLES.filter(a => a.partnerCta).map(a => a.partnerCta);
    }, []);

    const VOICE_LANGUAGES = [
        { code: 'vi', bcp: 'vi-VN', label: 'Tiếng Việt' },
        { code: 'en', bcp: 'en-US', label: 'English' },
        { code: 'zh-s', bcp: 'zh-CN', label: '中文' },
        { code: 'ja', bcp: 'ja-JP', label: '日本語' },
        { code: 'ko', bcp: 'ko-KR', label: '한국어' },
        { code: 'fr', bcp: 'fr-FR', label: 'Français' },
        { code: 'de', bcp: 'de-DE', label: 'Deutsch' },
        { code: 'es', bcp: 'es-ES', label: 'Español' },
        { code: 'it', bcp: 'it-IT', label: 'Italiano' },
        { code: 'pt', bcp: 'pt-BR', label: 'Português' },
        { code: 'ru', bcp: 'ru-RU', label: 'Русский' },
        { code: 'ar', bcp: 'ar-SA', label: 'العربية' },
        { code: 'hi', bcp: 'hi-IN', label: 'हिन्दी' },
        { code: 'th', bcp: 'th-TH', label: 'ภาษาไทย' },
        { code: 'id', bcp: 'id-ID', label: 'Bahasa Indonesia' },
        { code: 'ms', bcp: 'ms-MY', label: 'Bahasa Melayu' },
        { code: 'tl', bcp: 'fil-PH', label: 'Filipino' },
        { code: 'nl', bcp: 'nl-NL', label: 'Nederlands' },
        { code: 'pl', bcp: 'pl-PL', label: 'Polski' },
        { code: 'uk', bcp: 'uk-UA', label: 'Українська' },
        { code: 'cs', bcp: 'cs-CZ', label: 'Čeština' },
        { code: 'ro', bcp: 'ro-RO', label: 'Română' },
        { code: 'sv', bcp: 'sv-SE', label: 'Svenska' },
        { code: 'no', bcp: 'no-NO', label: 'Norsk' },
        { code: 'da', bcp: 'da-DK', label: 'Dansk' },
        { code: 'fi', bcp: 'fi-FI', label: 'Suomi' },
        { code: 'el', bcp: 'el-GR', label: 'Ελληνικά' },
        { code: 'tr', bcp: 'tr-TR', label: 'Türkçe' },
        { code: 'he', bcp: 'he-IL', label: 'עברית' },
        { code: 'hu', bcp: 'hu-HU', label: 'Magyar' },
        { code: 'bn', bcp: 'bn-BD', label: 'বাংলা' },
        { code: 'ta', bcp: 'ta-IN', label: 'தமிழ்' },
    ];

    const submitSearch = (text) => {
        if (text.trim() && onSearchWord) {
            onSearchWord(text.trim());
            setSearchQuery('');
        }
    };

    const handleVoicePrompt = () => {
        setShowLangPicker(true);
    };

    const startVoiceWithLangs = () => {
        setShowLangPicker(false);
        handleVoice();
    };

    const handleVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { alert('Speech recognition is not supported in this browser.'); return; }
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        const selectedLang = VOICE_LANGUAGES.find(l => l.code === inputLang);
        recognition.lang = selectedLang?.bcp || 'vi-VN';
        recognitionRef.current = recognition;
        finalTextRef.current = '';
        setInterimText('');
        setListening(true);
        recognition.onresult = (event) => {
            let final = '', interim = '';
            for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) final += transcript;
                else interim += transcript;
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
                setSearchQuery(text);
                submitSearch(text);
            }
        };
        recognition.start();
    };

    const stopVoice = () => {
        recognitionRef.current?.stop();
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

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="home-tab">
            {/* Dictionary Search */}
            <div className="home-dict-search">
                <form className="search-form" onSubmit={(e) => { e.preventDefault(); submitSearch(searchQuery); }}>
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <div className="search-actions-group">
                            <button type="button" className="mode-btn" onClick={handleVoicePrompt}>
                                <Mic size={18} />
                            </button>
                        </div>
                        <button type="submit" disabled={!searchQuery.trim()} className="search-button">
                            <Search size={20} />
                        </button>
                    </div>
                </form>
            </div>

            {/* Unified Voice Modal — language picker → listening */}
            {(showLangPicker || listening) && (
                <div className="voice-overlay" onClick={() => { if (!listening) setShowLangPicker(false); }}>
                    <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Top area: language grid or listening indicator */}
                        {!listening ? (
                            <>
                                <h3 className="voice-modal-title">What language will you speak?</h3>
                                <div className="lang-picker-scroll-wrap">
                                    <div className="lang-picker-grid">
                                        {VOICE_LANGUAGES.map(lang => (
                                            <button
                                                key={lang.code}
                                                className={`lang-picker-btn ${inputLang === lang.code ? 'active' : ''}`}
                                                onClick={() => setInputLang(lang.code)}
                                            >
                                                <span className="lang-picker-name">{lang.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="voice-listening-body">
                                <div className="voice-listening-icon">
                                    <Mic size={36} color="var(--primary-color)" />
                                </div>
                                <h3 className="voice-modal-title">Listening...</h3>
                                {interimText && (
                                    <p className="voice-interim-text">{interimText}</p>
                                )}
                            </div>
                        )}

                        {/* Bottom actions — always in same position */}
                        <div className="voice-modal-actions">
                            <button className="voice-modal-cancel-btn" onClick={() => { if (listening) cancelVoice(); setShowLangPicker(false); }}>
                                <X size={16} /> Cancel
                            </button>
                            {!listening ? (
                                <button className="voice-modal-primary-btn" onClick={startVoiceWithLangs}>
                                    <Mic size={18} /> Start Listening
                                </button>
                            ) : (
                                <button className="voice-modal-primary-btn" onClick={stopVoice}>
                                    <Check size={16} /> Done
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Combined Streak + Stats Card */}
            <div className="home-streak-card compact">
                <div className="home-streak-row">
                    <div className="home-streak-header">
                        <Flame size={16} color="#FF6B35" fill="#FF6B35" />
                        <span className="home-streak-count">{dailyStreak}</span>
                        <span className="home-streak-label">{t('daily_streak')}</span>
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
                        <span className="home-progress-label">{t('words')}</span>
                    </div>
                    <div className="home-progress-divider" />
                    <div className="home-progress-stat">
                        <GraduationCap size={16} color="#06D6A0" />
                        <span className="home-progress-number">{completedNodes.size}</span>
                        <span className="home-progress-label">{t('lessons')}</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="home-actions">
                <button className="home-action-card home-action-study" onClick={handleContinue}>
                    <BookOpen size={22} />
                    <span>{t('continue_lesson')}</span>
                    <ChevronRight size={18} />
                </button>
                {dueCount > 0 && (
                    <button className="home-action-card home-action-review" onClick={() => navigate('/practice/flashcards')}>
                        <Layers size={22} />
                        <span>{dueCount} {t('cards_to_review')}</span>
                        <ChevronRight size={18} />
                    </button>
                )}
            </div>

            {/* Words of the Day */}
            {wordsOfDay.length > 0 && (
                <>
                    <div className="home-section-header">{t('words_of_the_day')}</div>
                    <div className="home-tips-scroll">
                        {wordsOfDay.map((word, i) => (
                            <div key={i} className="home-wotd-card" onClick={() => onSearchWord(word.vi_text)} style={{ cursor: 'pointer' }}>
                                <div className="home-wotd-word">
                                    <span className="home-wotd-vi">{word.vi_text}</span>
                                    <button className="home-speak-btn" onClick={(e) => { e.stopPropagation(); speak(word.vi_text); }}>
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
                <span>{t('tips_tricks')}</span>
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
            {userProfile?.isDeveloperMode && (
                <>
                    <div className="home-section-header">
                        <span>{t('explore_vietnam')}</span>
                    </div>
                    <div className="home-tips-scroll" style={{ paddingBottom: 16 }}>
                        {partnerCtas.map((cta, i) => (
                            <div key={i} className="home-partner-cta">
                                <img
                                    src={cta.img}
                                    alt="Partner"
                                    className="home-partner-cta-img"
                                />
                                <div className="home-partner-cta-content">
                                    <h3 className="home-partner-cta-title">
                                        {cta.title_en}
                                    </h3>
                                    <p className="home-partner-cta-desc">
                                        {cta.desc_en}
                                    </p>

                                    <div className="home-partner-cta-actions">
                                        <div className="home-partner-cta-code-box">
                                            <span className="home-partner-cta-code-label">CODE:</span>
                                            <span className="home-partner-cta-code-val">{cta.code}</span>
                                            <button
                                                className={`home-partner-cta-copy-btn ${copiedCode === cta.code ? 'copied' : ''}`}
                                                onClick={() => handleCopyCode(cta.code)}
                                            >
                                                {copiedCode === cta.code ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>

                                        <a
                                            href={cta.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="home-partner-cta-link-btn"
                                            style={{
                                                backgroundColor: cta.theme || 'var(--primary-color)',
                                                boxShadow: `0 4px 0 ${cta.themeDark || '#E5A503'}`,
                                                color: '#fff'
                                            }}
                                        >
                                            Get {cta.discount_en}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default HomeTab;
