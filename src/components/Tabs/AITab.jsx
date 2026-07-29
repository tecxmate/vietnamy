import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Sparkles, Volume2, AlertCircle } from 'lucide-react';
import speak from '../../utils/speak';
import { useT } from '../../lib/i18n';
import { useUser } from '../../context/UserContext';
import TappableVietnamese from '../TappableVietnamese';
import WordPopup from '../WordPopup';
import { toggleDictSavedWord } from '../../lib/dictSavedWords';

// Talk to AI — live Vietnamese tutor powered by Gemini (server /api/tutor).
// If GEMINI_API_KEY is not set in server/.env, the endpoint returns 503 and we
// show a friendly "add key" notice. Voice input (mic→STT) is a follow-up.

const SEED_TURNS = [
    { from: 'ai', vi: 'Chào bạn! Bạn tên là gì?', en: 'Hi! What is your name?' },
];

const SUGGESTIONS = [
    { vi: 'Tôi tên là...', en: 'My name is...' },
    { vi: 'Bạn nói chậm hơn được không?', en: 'Can you speak slower?' },
    { vi: 'Nghĩa là gì?', en: 'What does that mean?' },
];

function Bubble({ turn, onWordTap }) {
    const mine = turn.from === 'me';
    return (
        <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
            <div style={{ maxWidth: '80%' }}>
                <div style={{
                    background: mine ? 'var(--primary-color)' : 'var(--surface-color)',
                    color: mine ? '#1A1A1A' : 'var(--text-main)',
                    border: mine ? 'none' : '1px solid var(--border-color)',
                    borderRadius: 16,
                    borderBottomRightRadius: mine ? 4 : 16,
                    borderBottomLeftRadius: mine ? 16 : 4,
                    boxShadow: mine ? '0 3px 0 var(--cta-edge, rgba(27,26,58,0.14))' : '0 2px 0 rgba(27,26,58,0.07)',
                    padding: '10px 14px',
                }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>
                        {!mine && onWordTap ? <TappableVietnamese text={turn.vi} onWordTap={onWordTap} /> : turn.vi}
                    </div>
                    {turn.en && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{turn.en}</div>}
                </div>
                {!mine && (
                    <button
                        onClick={() => speak(turn.vi)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                        <Volume2 size={13} /> tap to hear
                    </button>
                )}
                {turn.correction && (
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-color-light)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '6px 10px' }}>
                        💡 {turn.correction}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AITab() {
    const t = useT();
    const { userProfile } = useUser();
    const [turns, setTurns] = useState(SEED_TURNS);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState('');
    const [popupWord, setPopupWord] = useState(null);
    const endRef = useRef(null);

    const dictMode = (userProfile?.nativeLang === 'zh-s' || userProfile?.nativeLang === 'zh-t') ? userProfile.nativeLang : 'en';
    const handleWordTap = (word, rect, isPhrase) => {
        if (!word) { setPopupWord(null); return; }
        setPopupWord({ word, anchorRect: rect, isPhrase });
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [turns, loading]);

    const sendTurn = async (vi, en) => {
        const text = (vi || '').trim();
        if (!text || loading) return;
        setNotice('');
        const next = [...turns, { from: 'me', vi: text, en: en || '' }];
        setTurns(next);
        setDraft('');
        setLoading(true);
        try {
            const r = await fetch('/api/tutor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: next, level: userProfile?.level || 'new' }),
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) {
                setNotice(data.message || t('ai_error'));
                return;
            }
            setTurns(prev => [...prev, { from: 'ai', vi: data.vi, en: data.en, correction: data.correction }]);
        } catch {
            setNotice(t('ai_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--surface-color-light)', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                <Sparkles size={16} color="var(--primary-color)" />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('ai_live_note')}</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {turns.map((turn, i) => <Bubble key={i} turn={turn} onWordTap={handleWordTap} />)}
                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 16, borderBottomLeftRadius: 4, padding: '12px 16px', color: 'var(--text-muted)', fontSize: 14 }}>
                            {t('ai_typing')}
                        </div>
                    </div>
                )}
                {notice && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'var(--surface-color-light)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-muted)', fontSize: 12 }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{notice}</span>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <div style={{ display: 'flex', gap: 8, padding: '8px 16px', overflowX: 'auto', flexShrink: 0 }}>
                {SUGGESTIONS.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => sendTurn(s.vi, s.en)}
                        disabled={loading}
                        style={{ whiteSpace: 'nowrap', padding: '8px 14px', borderRadius: 999, border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, opacity: loading ? 0.5 : 1 }}
                    >
                        {s.vi}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border-color)', background: 'var(--surface-color)', flexShrink: 0 }}>
                <input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendTurn(draft); }}
                    placeholder={t('ai_input_placeholder')}
                    style={{ flex: 1, minWidth: 0, padding: '12px 16px', borderRadius: 24, border: '1px solid var(--border-color)', background: 'var(--surface-color-light)', color: 'var(--text-main)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                />
                <button
                    onClick={() => alert(t('ai_mic_soon'))}
                    aria-label="Speak"
                    style={{ width: 44, height: 44, flexShrink: 0, borderRadius: '50%', border: '1.5px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <Mic size={20} />
                </button>
                <button
                    onClick={() => sendTurn(draft)}
                    disabled={loading}
                    aria-label="Send"
                    style={{ width: 44, height: 44, flexShrink: 0, borderRadius: '50%', border: 'none', background: 'var(--primary-color)', color: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
                >
                    <Send size={20} />
                </button>
            </div>

            {popupWord && (
                <WordPopup
                    word={popupWord.word}
                    anchorRect={popupWord.anchorRect}
                    dictMode={dictMode}
                    isPhrase={popupWord.isPhrase}
                    onClose={() => setPopupWord(null)}
                    onNavigate={() => setPopupWord(null)}
                    onSave={(w) => { toggleDictSavedWord(w); setPopupWord(null); }}
                />
            )}
        </div>
    );
}
