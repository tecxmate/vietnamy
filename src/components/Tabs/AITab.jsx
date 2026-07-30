import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Sparkles, Volume2, AlertCircle, ArrowLeft, MessageCircle, Target } from 'lucide-react';
import speak from '../../utils/speak';
import { useT } from '../../lib/i18n';
import { useUser } from '../../context/UserContext';
import TappableVietnamese from '../TappableVietnamese';
import WordPopup from '../WordPopup';
import { toggleDictSavedWord } from '../../lib/dictSavedWords';
import { AI_DAILY_LIMIT, hasReachedLimit, recordUsage, getRemaining } from '../../lib/aiQuota';
import { AI_SCENARIOS, scenarioPayload } from '../../lib/aiScenarios';

const FREE_TALK = { id: '__free__' };

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

function ScenarioCard({ scenario, onOpen }) {
    return (
        <button
            onClick={() => onOpen(scenario)}
            style={{
                textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                background: 'var(--surface-color)', border: '1px solid var(--border-color)',
                borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 6,
                boxShadow: '0 2px 0 rgba(27,26,58,0.06)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 30, lineHeight: 1 }}>{scenario.emoji}</span>
                {scenario.level && (
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: 999, padding: '2px 7px' }}>
                        {scenario.level}
                    </span>
                )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>{scenario.titleVi}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{scenario.title}</div>
            {scenario.npc && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {scenario.npc.emoji} {scenario.npc.role}
                </div>
            )}
        </button>
    );
}

function ScenarioPicker({ t, onOpen }) {
    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <button
                onClick={() => onOpen(FREE_TALK)}
                style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                    background: 'var(--primary-color)', border: 'none', borderRadius: 16, padding: 16,
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
                    boxShadow: '0 3px 0 var(--cta-edge, rgba(27,26,58,0.14))', color: '#1A1A1A',
                }}
            >
                <MessageCircle size={22} />
                <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{t('ai_free_talk')}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{t('ai_free_talk_sub')}</div>
                </div>
            </button>

            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                {t('ai_pick_situation')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
                {AI_SCENARIOS.map(s => <ScenarioCard key={s.id} scenario={s} onOpen={onOpen} />)}
            </div>
        </div>
    );
}

export default function AITab() {
    const t = useT();
    const { userProfile } = useUser();
    const [scenario, setScenario] = useState(null); // null = picker; FREE_TALK or a scenario object = chat
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

    const devMode = userProfile?.isDeveloperMode === true;
    const [remaining, setRemaining] = useState(() => getRemaining());

    const isScenario = scenario && scenario.id !== FREE_TALK.id;

    const openConversation = (scn) => {
        setScenario(scn);
        setNotice('');
        setDraft('');
        if (scn.id === FREE_TALK.id) {
            setTurns(SEED_TURNS);
        } else {
            setTurns([{ from: 'ai', vi: scn.opening?.vi || 'Xin chào!', en: scn.opening?.en || '' }]);
        }
    };

    const sendTurn = async (vi, en) => {
        const text = (vi || '').trim();
        if (!text || loading) return;
        // Daily free-message limit — Developer Preview bypasses it.
        if (!devMode && hasReachedLimit()) {
            setNotice(t('ai_limit_reached').replace('{n}', AI_DAILY_LIMIT));
            return;
        }
        setNotice('');
        const next = [...turns, { from: 'me', vi: text, en: en || '' }];
        setTurns(next);
        setDraft('');
        setLoading(true);
        try {
            const r = await fetch('/api/tutor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: next,
                    level: userProfile?.level || 'new',
                    scenario: isScenario ? scenarioPayload(scenario) : undefined,
                }),
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) {
                setNotice(data.message || t('ai_error'));
                return;
            }
            setTurns(prev => [...prev, { from: 'ai', vi: data.vi, en: data.en, correction: data.correction }]);
            if (!devMode) setRemaining(recordUsage());
        } catch {
            setNotice(t('ai_error'));
        } finally {
            setLoading(false);
        }
    };

    if (scenario === null) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--surface-color-light)', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                    <Sparkles size={16} color="var(--primary-color)" />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('ai_live_note')}</span>
                </div>
                <ScenarioPicker t={t} onOpen={openConversation} />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface-color-light)', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                <button onClick={() => setScenario(null)} aria-label={t('ai_back_to_situations')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', padding: 4 }}>
                    <ArrowLeft size={20} />
                </button>
                <span style={{ fontSize: 20 }}>{isScenario ? scenario.emoji : '💬'}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isScenario ? scenario.titleVi : t('ai_free_talk')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {isScenario ? `${scenario.npc?.emoji || ''} ${scenario.npc?.name || ''} · ${scenario.title}` : t('ai_free_talk_sub')}
                    </div>
                </div>
            </div>

            {isScenario && scenario.goal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                    <Target size={14} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        <b style={{ color: 'var(--text-main)' }}>{t('ai_goal')}:</b> {scenario.goal.en}
                        {scenario.goal.vi ? ` — “${scenario.goal.vi}”` : ''}
                    </span>
                </div>
            )}

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

            {!isScenario && (
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
            )}

            {!devMode && (
                <div style={{ padding: '0 16px 6px', fontSize: 11, color: remaining <= 5 ? 'var(--primary-color)' : 'var(--text-muted)', textAlign: 'center', flexShrink: 0 }}>
                    {remaining > 0
                        ? t('ai_messages_left').replace('{n}', remaining).replace('{total}', AI_DAILY_LIMIT)
                        : t('ai_limit_reached').replace('{n}', AI_DAILY_LIMIT)}
                </div>
            )}

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
