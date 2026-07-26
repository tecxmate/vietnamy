import React, { useState, useRef, useEffect } from 'react';
import { Play, ChevronLeft, Volume2 } from 'lucide-react';
import speak from '../../utils/speak';
import { useT } from '../../lib/i18n';

// Video — real YouTube playback (IFrame API) with tap-to-seek bilingual transcript.
// Seed videos are verified-embeddable VN-learning clips. Transcripts here are
// short illustrative samples (approx. timing) — production should use each
// video's real captions. Add your own clips via the "Add a YouTube link" box.

const SEED = [
    { id: 'Jf6mvBy9VXk', title: 'The Vietnamese Alphabet', channel: 'Tiếng Việt Ơi', level: 'Beginner', transcript: [
        { s: 8, vi: 'Bảng chữ cái tiếng Việt.', en: 'The Vietnamese alphabet.' },
        { s: 24, vi: 'Có hai mươi chín chữ cái.', en: 'There are 29 letters.' },
        { s: 60, vi: 'a, ă, â, b, c...', en: 'a, ă, â, b, c...' },
    ] },
    { id: 'OP21UmdXDYs', title: 'Vietnamese numbers 0–10', channel: 'ToanTran', level: 'Beginner', transcript: [
        { s: 10, vi: 'không, một, hai, ba', en: 'zero, one, two, three' },
        { s: 30, vi: 'bốn, năm, sáu, bảy', en: 'four, five, six, seven' },
        { s: 50, vi: 'tám, chín, mười', en: 'eight, nine, ten' },
    ] },
    { id: '33p4CVF-vd0', title: '20 Essential Phrases for Travelers', channel: 'Levion', level: 'Beginner', transcript: [
        { s: 15, vi: 'Xin chào!', en: 'Hello!' },
        { s: 40, vi: 'Cảm ơn nhiều.', en: 'Thank you very much.' },
        { s: 70, vi: 'Cái này bao nhiêu tiền?', en: 'How much is this?' },
    ] },
    { id: 'QUotrw9CX5w', title: '20 Words for Everyday Life', channel: 'Learn Vietnamese', level: 'Beginner', transcript: [
        { s: 12, vi: 'nước — water', en: 'water' },
        { s: 33, vi: 'cơm — rice', en: 'rice' },
        { s: 55, vi: 'nhà — house', en: 'house' },
    ] },
];

// ── YouTube IFrame API loader (once) ─────────────────────────────
let ytReady;
function loadYT() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (!ytReady) {
        ytReady = new Promise(resolve => {
            const prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(window.YT); };
            const s = document.createElement('script');
            s.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(s);
        });
    }
    return ytReady;
}

function YouTubePlayer({ videoId, playerRef }) {
    const hostRef = useRef(null);
    useEffect(() => {
        let cancelled = false;
        loadYT().then(YT => {
            if (cancelled || !hostRef.current) return;
            const el = document.createElement('div');
            el.style.width = '100%';
            el.style.height = '100%';
            hostRef.current.innerHTML = '';
            hostRef.current.appendChild(el);
            playerRef.current = new YT.Player(el, {
                videoId,
                playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
            });
        });
        return () => { cancelled = true; try { playerRef.current?.destroy(); } catch { /* noop */ } playerRef.current = null; };
    }, [videoId, playerRef]);
    return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />;
}

function extractId(url) {
    const m = String(url).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : (String(url).trim().length === 11 ? String(url).trim() : null);
}

export default function VideoTab() {
    const t = useT();
    const [videos, setVideos] = useState(SEED);
    const [active, setActive] = useState(null);
    const [linkInput, setLinkInput] = useState('');
    const playerRef = useRef(null);

    const seek = (sec) => {
        const p = playerRef.current;
        if (p?.seekTo) { p.seekTo(sec, true); p.playVideo?.(); }
    };

    const addLink = () => {
        const id = extractId(linkInput);
        if (!id) { alert(t('video_bad_link')); return; }
        const v = { id, title: 'My video', channel: '', level: '', transcript: [] };
        setVideos(prev => [v, ...prev]);
        setLinkInput('');
        setActive(v);
    };

    if (active) {
        return (
            <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-color)' }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
                    <YouTubePlayer videoId={active.id} playerRef={playerRef} />
                </div>
                <div style={{ padding: 16 }}>
                    <button onClick={() => setActive(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 12, fontFamily: 'inherit' }}>
                        <ChevronLeft size={16} /> {t('video_back')}
                    </button>
                    <h2 style={{ margin: '0 0 4px', fontSize: 18, color: 'var(--text-main)' }}>{active.title}</h2>
                    <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-muted)' }}>{[active.channel, active.level].filter(Boolean).join(' · ')}</p>

                    {active.transcript.length > 0 ? (
                        <>
                            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 8 }}>{t('video_transcript')}</div>
                            {active.transcript.map((line, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                                    <button onClick={() => seek(line.s)} style={{ flex: 1, textAlign: 'left', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--surface-color)', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-color)', marginRight: 8 }}>{Math.floor(line.s / 60)}:{String(line.s % 60).padStart(2, '0')}</span>
                                        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)' }}>{line.vi}</span>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{line.en}</div>
                                    </button>
                                    <button onClick={() => speak(line.vi)} aria-label="hear" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Volume2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{t('video_transcript_sample')}</p>
                        </>
                    ) : (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('video_no_transcript')}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-color)', padding: 16 }}>
            {/* Add-your-own */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                    value={linkInput}
                    onChange={e => setLinkInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addLink(); }}
                    placeholder={t('video_add_placeholder')}
                    style={{ flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--surface-color-light)', color: 'var(--text-main)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                />
                <button onClick={addLink} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: 'var(--primary-color)', color: '#1A1A1A', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>{t('video_add_btn')}</button>
            </div>

            {videos.map(v => (
                <button key={v.id} onClick={() => setActive(v)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: 0, border: 'none', background: 'none', cursor: 'pointer', marginBottom: 16 }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 14, overflow: 'hidden', background: '#000' }}>
                        <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Play size={22} color="#fff" fill="#fff" />
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>{v.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{[v.channel, v.level].filter(Boolean).join(' · ')}</div>
                    </div>
                </button>
            ))}
        </div>
    );
}
