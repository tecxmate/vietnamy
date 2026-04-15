import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, BookOpen, Layers, ChevronRight, GraduationCap, BookOpenText, Search, Mic, X, Check, Sparkles, Lightbulb } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { useT } from '../../lib/i18n';
import { getItems, getUnits, getNodesForUnitWithProgress } from '../../lib/db';
import { getDueItems, getTotalItems } from '../../lib/srs';
import ARTICLES from '../../data/articleData';
import speak from '../../utils/speak';
import SoundButton from '../SoundButton';
import { useUser } from '../../context/UserContext';
import { DEFAULT_LEARNER_MODE } from '../../data/learnerModes';
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

const GOOGLE_FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSfGs4jkrPQ3poxNlLkG85H5VyF4KgSdC_MMvrML1WOhhm4rnA/viewform?usp=sharing&ouid=106659001470051938885';
const FACEBOOK_GROUP = 'https://www.facebook.com/groups/2144254376389864/';
const INSTAGRAM = 'https://www.instagram.com/tecxmate';
const LINE_OPENCHAT = 'https://line.me/ti/g2/w5lDtqeWGdgyTyht80MaBp5-7b79mi3nlqAYPg';
const WHATSAPP_GROUP = 'https://chat.whatsapp.com/EKFn6q6gXeZIT2ZcNDYOV4';

const HomeTab = ({ onSearchWord }) => {
    const navigate = useNavigate();
    const { completedNodes } = useProgress();
    const { userProfile } = useUser();
    const currentMode = userProfile?.learnerMode || DEFAULT_LEARNER_MODE;
    const modeCompletedNodes = completedNodes[currentMode] || new Set();
    const t = useT();
    const [searchQuery, setSearchQuery] = useState('');
    const [listening, setListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [inputLang, setInputLang] = useState('vi');
    const [copiedCode, setCopiedCode] = useState(null);
    const [bannerDismissed, setBannerDismissed] = useState(() => !!localStorage.getItem('vnme_banner_dismissed'));
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
    const handleContinue = () => {
        const units = getUnits();
        for (const unit of units) {
            const nodes = getNodesForUnitWithProgress(unit.id, modeCompletedNodes);
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
            {/* Words to Review Banner */}
            {dueCount > 0 && (
                <button
                    onClick={() => navigate('/practice/flashcards')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        width: 'calc(100% - 32px)', margin: '16px auto 0',
                        padding: '12px 16px', borderRadius: 12,
                        backgroundColor: 'rgba(28, 176, 246, 0.1)',
                        border: '1px solid rgba(28, 176, 246, 0.3)',
                        color: '#1CB0F6', fontWeight: 700, fontSize: 14,
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    <BookOpen size={20} />
                    <span>{dueCount} word{dueCount > 1 ? 's' : ''} to review</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}>Tap to review</span>
                </button>
            )}

            {/* Demo Banner */}
            {!bannerDismissed && <div className="demo-banner" style={{ position: 'relative' }}>
                <button
                    className="ghost"
                    onClick={() => { setBannerDismissed(true); localStorage.setItem('vnme_banner_dismissed', '1'); }}
                    style={{ position: 'absolute', top: 12, right: 12, padding: 4, zIndex: 1 }}
                >
                    <X size={20} color="var(--text-muted)" />
                </button>
                <span className="demo-banner-tag"><Sparkles size={12} /> Vietnamy v0.3.15</span>
                <div className="demo-banner-header">
                    <h3 className="demo-banner-title">Welcome to Vietnamy!</h3>
                    <p className="demo-banner-subtitle">We are glad to have you here. This is a research prototype of the world's 1st Vietnamese Learning App. We aim to provide high-quality lessons and tools for anyone who love to learn and explore Vietnamese. Feel free to join the waitlist and let us know any features you want. Welcome to being a part of our community!</p>
                    <p className="demo-banner-founder"></p>
                </div>

                <div className="demo-actions-row">
                    <a
                        href={GOOGLE_FORM}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="demo-action-btn"
                    >
                        <Lightbulb size={16} />
                        <span>Join Waitlist & Share Ideas</span>
                    </a>
                </div>

                <div className="demo-community-row">
                    <span className="demo-community-label">Join Vietnamy Community</span>
                    <div className="demo-community-links">
                        <a href={FACEBOOK_GROUP} target="_blank" rel="noopener noreferrer" className="demo-community-chip" style={{ '--chip-color': '#1877F2' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            Facebook
                        </a>
                        <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="demo-community-chip" style={{ '--chip-color': '#E4405F' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                            Instagram
                        </a>
                        <a href={LINE_OPENCHAT} target="_blank" rel="noopener noreferrer" className="demo-community-chip" style={{ '--chip-color': '#06C755' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
                            LINE
                        </a>
                        <a href={WHATSAPP_GROUP} target="_blank" rel="noopener noreferrer" className="demo-community-chip" style={{ '--chip-color': '#25D366' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            WhatsApp
                        </a>
                    </div>
                </div>
            </div>}

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

            {/* Stats Card */}
            <div className="home-streak-card compact">
                <div className="home-streak-stats">
                    <div className="home-progress-stat">
                        <BookOpenText size={16} color="#FFB703" />
                        <span className="home-progress-number">{totalWords}</span>
                        <span className="home-progress-label">{t('words')}</span>
                    </div>
                    <div className="home-progress-divider" />
                    <div className="home-progress-stat">
                        <GraduationCap size={16} color="#06D6A0" />
                        <span className="home-progress-number">{modeCompletedNodes.size}</span>
                        <span className="home-progress-label">{t('lessons')}</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="home-actions">
                <SoundButton className="home-action-card home-action-study" sound="button" onClick={handleContinue}>
                    <BookOpen size={22} />
                    <span>{t('continue_lesson')}</span>
                    <ChevronRight size={18} />
                </SoundButton>
                {dueCount > 0 && (
                    <SoundButton className="home-action-card home-action-review" sound="button" onClick={() => navigate('/practice/flashcards')}>
                        <Layers size={22} />
                        <span>{dueCount} {t('cards_to_review')}</span>
                        <ChevronRight size={18} />
                    </SoundButton>
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
