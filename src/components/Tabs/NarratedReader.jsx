import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import {
    ChevronLeft, ChevronRight, Play, Pause, RotateCcw, SkipBack,
    Repeat, Bookmark, Sparkles, X, Zap,
} from 'lucide-react';
import { Converter } from 'opencc-js';
import { buildTtsUrl, preloadSpeak } from '../../utils/speak';
import TappableVietnamese from '../TappableVietnamese';
import WordPopup from '../WordPopup';
import { toggleDictSavedWord } from '../../lib/dictSavedWords';
import { lookupWords } from '../../lib/dictionaryLookup';
import { useT } from '../../lib/i18n';
import { syllables, estSentSec, buildEstimateWindows, buildExactWindows } from '../../lib/karaokeTiming';
import './NarratedReader.css';

const s2t = Converter({ from: 'cn', to: 'tw' });
const toTraditionalIfNeeded = (text, lang) => (lang === 'zh-t' ? s2t(text || '') : (text || ''));

const fmt = (sec) => {
    const s = Math.max(0, Math.round(sec || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const SPEEDS = [1, 1.25, 1.5, 0.75];

// ── A single transcript line (memoized so the per-word karaoke repaint only
// re-renders the active sentence, not the whole list) ───────────────────────
const SentenceRow = memo(function SentenceRow({
    sentence, index, active, karaokeCur, translationLang, saved,
    onWordTap, onSegments, onSave, onExplain, onActivate, t,
}) {
    return (
        <div
            className={`nr-sent${active ? ' active' : ''}`}
            data-i={index}
            onClick={() => !active && onActivate(index)}
        >
            <div className="nr-sent-vi">
                <TappableVietnamese
                    text={sentence.vi}
                    onWordTap={onWordTap}
                    karaokeCur={active ? karaokeCur : -1}
                    onSegments={(segs) => onSegments(index, segs)}
                />
            </div>
            <div className="nr-sent-tr">
                {translationLang === 'en' ? sentence.en : toTraditionalIfNeeded(sentence.zh, translationLang)}
            </div>
            <div className="nr-lineacts">
                <button className={`nr-la${saved ? ' on' : ''}`} onClick={(e) => { e.stopPropagation(); onSave(index); }}>
                    <Bookmark size={13} /> {saved ? t('narrated_saved') : t('narrated_save_phrase')}
                </button>
                <button className="nr-la" onClick={(e) => { e.stopPropagation(); onExplain(index); }}>
                    <Sparkles size={13} /> {t('narrated_explain')}
                </button>
            </div>
        </div>
    );
});

export default function NarratedReader({ explainer, onBack }) {
    const t = useT();
    const sentences = useMemo(() => explainer.sentences || [], [explainer]);
    const slides = useMemo(() => explainer.slides || [], [explainer]);
    const slideIndexOf = useCallback(
        (id) => Math.max(0, slides.findIndex((s) => s.id === id)),
        [slides]
    );

    // ── Render state ──
    const [translationLang, setTranslationLang] = useState(() => {
        try {
            const v = localStorage.getItem('vnme_reading_translation_lang');
            if (v === 'en' || v === 'zh-s' || v === 'zh-t') return v;
            if (v === 'zh') return 'zh-s';
        } catch { /* */ }
        return 'en';
    });
    const [curSent, setCurSent] = useState(0);
    const [curSlide, setCurSlide] = useState(() => slideIndexOf(sentences[0]?.slide));
    const [curWord, setCurWord] = useState(-1);
    const [playing, setPlaying] = useState(false);
    const [ended, setEnded] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [looping, setLooping] = useState(false);
    const [popupWord, setPopupWord] = useState(null);
    const [sheetSent, setSheetSent] = useState(null);
    const [savedSet, setSavedSet] = useState(() => new Set());
    const [toastMsg, setToastMsg] = useState(null);
    const [dictInfo, setDictInfo] = useState(new Map());
    const [exactTiming, setExactTiming] = useState(false);   // Phase 4: word-timed vs estimate

    // ── Mutable refs (read from the rAF loop / audio events without stale state) ──
    const audioRef = useRef(null);
    const rafRef = useRef(0);
    const playingRef = useRef(false);
    const loopingRef = useRef(false);
    const speedRef = useRef(1);
    const curSentRef = useRef(0);
    const curWordRef = useRef(-1);
    const windowsRef = useRef(null);          // cumulative seconds, aligned to seg indices
    const segMapRef = useRef({});             // sentenceIndex -> segments[]
    const marksRef = useRef({});              // sentenceIndex -> Azure marks[] | null
    const timedRef = useRef({});              // sentenceIndex -> { src, marks } | in-flight Promise
    const dursRef = useRef(sentences.map((s) => estSentSec(s.vi)));
    const fillRef = useRef(null);
    const knobRef = useRef(null);
    const curTimeRef = useRef(null);
    const durTimeRef = useRef(null);
    const toastTimer = useRef(null);

    useEffect(() => { loopingRef.current = looping; }, [looping]);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    const urlFor = useCallback((i) => buildTtsUrl(sentences[i].vi), [sentences]);

    // Resolve the user's configured voice from the existing TTS URL builder, so
    // /api/tts-timed synthesizes with the same voice the rest of the app uses.
    const ttsVoice = useMemo(() => {
        try { return new URL(buildTtsUrl('x'), window.location.origin).searchParams.get('voice') || 'azure-north'; }
        catch { return 'azure-north'; }
    }, []);

    // Fetch exact word timings (Phase 4). On success → { src: dataURI, marks }.
    // On any failure (no Azure key, google voice, network) → fall back to the
    // REST clip + null marks, which triggers the client-side syllable estimate.
    const fetchTimed = useCallback((i) => {
        const cached = timedRef.current[i];
        if (cached) return cached.then ? cached : Promise.resolve(cached);
        const fallback = () => ({ src: urlFor(i), marks: null });
        const p = fetch(`/api/tts-timed?text=${encodeURIComponent(sentences[i].vi)}&lang=vi&voice=${encodeURIComponent(ttsVoice)}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                const result = (data && data.marks && data.audioBase64)
                    ? { src: `data:${data.contentType || 'audio/wav'};base64,${data.audioBase64}`, marks: data.marks }
                    : fallback();
                timedRef.current[i] = result;
                return result;
            })
            .catch(() => { const r = fallback(); timedRef.current[i] = r; return r; });
        timedRef.current[i] = p;
        return p;
    }, [sentences, urlFor, ttsVoice]);

    // ── Warm TTS clips + preload local word definitions for instant popups ──
    useEffect(() => {
        preloadSpeak(sentences.map((s) => s.vi).filter(Boolean));
        const words = new Set();
        for (const s of sentences) {
            const toks = (s.vi || '')
                .split(/\s+/)
                .map((w) => w.replace(/[.,!?;:"“”'’()…«»]/g, '').trim())
                .filter(Boolean);
            for (let i = 0; i < toks.length; i++) {
                for (let len = 1; len <= 3 && i + len <= toks.length; len++) {
                    words.add(toks.slice(i, i + len).join(' '));
                }
            }
        }
        lookupWords([...words]).then(setDictInfo);
    }, [sentences]);

    // ── Timing windows: distribute the real clip duration across the tokens ──
    const computeWindows = useCallback(() => {
        const i = curSentRef.current;
        const segs = segMapRef.current[i];
        const dur = audioRef.current?.duration;
        if (!segs || !segs.length || !Number.isFinite(dur) || dur <= 0) {
            windowsRef.current = null;
            return;
        }
        const marks = marksRef.current[i];
        if (marks && marks.length) {
            // Phase 4: exact offsets from Azure WordBoundary.
            windowsRef.current = buildExactWindows(segs, marks, dur);
            setExactTiming(true);
            return;
        }
        // Fallback: distribute the real clip duration by syllable estimate.
        windowsRef.current = buildEstimateWindows(segs, dur);
        setExactTiming(false);
    }, []);

    const handleSegments = useCallback((index, segs) => {
        segMapRef.current[index] = segs;
        if (index === curSentRef.current) computeWindows();
    }, [computeWindows]);

    // ── Progress bar / time labels (DOM-direct to avoid per-frame React work) ──
    const sumBefore = (i) => dursRef.current.slice(0, i).reduce((a, b) => a + b, 0);
    const sumAll = () => dursRef.current.reduce((a, b) => a + b, 0);
    const paintProgress = useCallback((t0) => {
        const total = sumAll();
        const g = sumBefore(curSentRef.current) + (t0 || 0);
        const pct = total ? Math.min(100, (g / total) * 100) : 0;
        if (fillRef.current) fillRef.current.style.width = `${pct}%`;
        if (knobRef.current) knobRef.current.style.left = `${pct}%`;
        if (curTimeRef.current) curTimeRef.current.textContent = fmt(g);
        if (durTimeRef.current) durTimeRef.current.textContent = fmt(total);
    }, []);

    // ── The rAF loop: one playhead drives word sweep + slide + progress ──
    const loop = useCallback(() => {
        const audio = audioRef.current;
        if (!playingRef.current || !audio) return;
        const tNow = audio.currentTime;
        const w = windowsRef.current;
        if (w && w.length) {
            let idx = w.findIndex((end) => tNow < end);
            if (idx === -1) idx = w.length - 1;
            if (idx !== curWordRef.current) { curWordRef.current = idx; setCurWord(idx); }
        }
        paintProgress(tNow);
        rafRef.current = requestAnimationFrame(loop);
    }, [paintProgress]);

    const startLoop = useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(loop);
    }, [loop]);

    // ── Load (and optionally play) a sentence ──
    const loadSentence = useCallback((i, autoplay) => {
        const audio = audioRef.current;
        if (!audio || i < 0 || i >= sentences.length) return;
        curSentRef.current = i;
        curWordRef.current = -1;
        windowsRef.current = null;
        setCurSent(i);
        setCurWord(-1);
        setEnded(false);
        setCurSlide(slideIndexOf(sentences[i].slide));
        audio.playbackRate = speedRef.current;
        paintProgress(0);
        // Resolve the audio source (exact-timed clip if available, else REST clip),
        // then wire it up. Guard against the user moving on while the fetch was in flight.
        fetchTimed(i).then(({ src, marks }) => {
            if (curSentRef.current !== i || !audioRef.current) return;
            marksRef.current[i] = marks;
            audio.src = src;
            audio.load();
            computeWindows();
            if (autoplay) {
                playingRef.current = true;
                setPlaying(true);
                audio.play().catch(() => { playingRef.current = false; setPlaying(false); });
                startLoop();
            }
            if (i + 1 < sentences.length) fetchTimed(i + 1);   // warm the next clip
        });
    }, [sentences, fetchTimed, slideIndexOf, paintProgress, startLoop, computeWindows]);

    const pause = useCallback(() => {
        playingRef.current = false;
        setPlaying(false);
        cancelAnimationFrame(rafRef.current);
        audioRef.current?.pause();
    }, []);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (ended) { loadSentence(0, true); return; }
        if (playingRef.current) { pause(); return; }
        playingRef.current = true;
        setPlaying(true);
        audio.play().catch(() => { playingRef.current = false; setPlaying(false); });
        startLoop();
    }, [ended, loadSentence, pause, startLoop]);

    // ── Audio element lifecycle (created once) ──
    useEffect(() => {
        const audio = new Audio();
        audio.preload = 'auto';
        audioRef.current = audio;

        const onMeta = () => {
            dursRef.current[curSentRef.current] = audio.duration;
            computeWindows();
            paintProgress(audio.currentTime);
        };
        const onEnded = () => {
            const i = curSentRef.current;
            if (loopingRef.current) {
                audio.currentTime = 0;
                curWordRef.current = -1;
                setCurWord(-1);
                audio.play().catch(() => {});
                return;
            }
            if (i < sentences.length - 1) {
                loadSentence(i + 1, true);
            } else {
                // mark the final sentence fully spoken, stop
                playingRef.current = false;
                setPlaying(false);
                setEnded(true);
                cancelAnimationFrame(rafRef.current);
                const segs = segMapRef.current[i];
                if (segs) { curWordRef.current = segs.length; setCurWord(segs.length); }
            }
        };
        audio.addEventListener('loadedmetadata', onMeta);
        audio.addEventListener('ended', onEnded);

        // prime the first clip (no autoplay)
        loadSentence(0, false);

        return () => {
            cancelAnimationFrame(rafRef.current);
            audio.pause();
            audio.removeEventListener('loadedmetadata', onMeta);
            audio.removeEventListener('ended', onEnded);
            audioRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Keep the active sentence scrolled into view ──
    const scrollRef = useRef(null);
    useEffect(() => {
        const row = scrollRef.current?.querySelector(`.nr-sent[data-i="${curSent}"]`);
        row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [curSent]);

    // ── Controls ──
    const cycleSpeed = () => {
        const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
        setSpeed(next);
        if (audioRef.current) audioRef.current.playbackRate = next;
    };
    const toggleLoop = () => {
        setLooping((v) => { const nv = !v; toast(nv ? t('narrated_looping_line') : t('narrated_loop_off')); return nv; });
    };
    const prevLine = () => loadSentence(Math.max(0, curSentRef.current - 1), playingRef.current);
    const seekToFraction = (frac) => {
        const total = sumAll();
        const target = frac * total;
        let acc = 0, i = 0;
        for (let k = 0; k < dursRef.current.length; k++) {
            if (target < acc + dursRef.current[k]) { i = k; break; }
            acc += dursRef.current[k]; i = k;
        }
        loadSentence(i, playingRef.current);
    };
    const onSeekClick = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        seekToFraction(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    };

    const setAndPersistLang = (lang) => {
        setTranslationLang(lang);
        try { localStorage.setItem('vnme_reading_translation_lang', lang); } catch { /* */ }
    };

    // ── Save phrase / Explain ──
    const toast = useCallback((m) => {
        setToastMsg(m);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastMsg(null), 1700);
    }, []);
    const handleSave = useCallback((i) => {
        const phrases = sentences[i].save?.length ? sentences[i].save : [sentences[i].vi];
        setSavedSet((prev) => {
            const next = new Set(prev);
            if (next.has(i)) {
                next.delete(i);
                phrases.forEach((p) => toggleDictSavedWord(p));
                toast(t('narrated_removed_review'));
            } else {
                next.add(i);
                phrases.forEach((p) => toggleDictSavedWord(p));
                toast(t('narrated_saved_review'));
            }
            return next;
        });
    }, [sentences, toast, t]);
    const handleExplain = useCallback((i) => setSheetSent(i), []);
    const handleActivate = useCallback((i) => loadSentence(i, playingRef.current), [loadSentence]);

    const handleWordTap = useCallback((word, rect, isPhrase = false) => {
        if (!word) { setPopupWord(null); return; }
        setPopupWord({ word, anchorRect: rect, isPhrase });
    }, []);

    const meta = useMemo(() => {
        const lvl = explainer.level ? explainer.level[0].toUpperCase() + explainer.level.slice(1) : '';
        return [explainer.title_en, lvl, t('narrated_slide_count').replace('{count}', slides.length)]
            .filter(Boolean).join(' · ');
    }, [explainer, slides.length, t]);

    const sheet = sheetSent != null ? sentences[sheetSent] : null;

    return (
        <div className="nr-reader">
            {/* ── Top bar ── */}
            <div className="nr-topbar">
                <button className="nr-iconbtn" onClick={onBack} aria-label={t('dict_back')}>
                    <ChevronLeft size={20} />
                </button>
                <div className="nr-title">
                    {explainer.title_vi}
                    <small>{meta}</small>
                </div>
                <div className="rlib-lang-toggle nr-lang-toggle">
                    <button className={`rlib-lang-btn ${translationLang === 'en' ? 'active' : ''}`} onClick={() => setAndPersistLang('en')}>EN</button>
                    <button className={`rlib-lang-btn ${translationLang === 'zh-s' ? 'active' : ''}`} onClick={() => setAndPersistLang('zh-s')}>
                        <span className="rlib-lang-full">简体</span><span className="rlib-lang-short">简</span>
                    </button>
                    <button className={`rlib-lang-btn ${translationLang === 'zh-t' ? 'active' : ''}`} onClick={() => setAndPersistLang('zh-t')}>
                        <span className="rlib-lang-full">繁體</span><span className="rlib-lang-short">繁</span>
                    </button>
                </div>
            </div>

            {/* ── Slide stage ── */}
            <div className="nr-stage">
                {slides.map((sl, i) => (
                    <div key={sl.id} className={`nr-slide${i === curSlide ? ' on' : ''}`}>
                        <img className="nr-slide-img" src={sl.image} alt={sl.tag || ''} loading="lazy" />
                        <div className="nr-slide-shade" />
                        {sl.tag && <div className="nr-slide-tag">{sl.tag}</div>}
                        {(sl.callouts || []).map((c, ci) => (
                            <div key={ci} className="nr-callout" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}>
                                <span className="nr-callout-dot" />
                                <span className="nr-callout-lab">{c.label}</span>
                            </div>
                        ))}
                        <div className="nr-slide-cap">
                            {i + 1}. {translationLang === 'en' ? sl.caption_en : toTraditionalIfNeeded(sl.caption_zh, translationLang)}
                        </div>
                    </div>
                ))}
                {curSlide > 0 && (
                    <button className="nr-slide-nav prev" onClick={() => setCurSlide((s) => Math.max(0, s - 1))}>
                        <ChevronLeft size={18} />
                    </button>
                )}
                {curSlide < slides.length - 1 && (
                    <button className="nr-slide-nav next" onClick={() => setCurSlide((s) => Math.min(slides.length - 1, s + 1))}>
                        <ChevronRight size={18} />
                    </button>
                )}
                <div className="nr-dots">
                    {slides.map((sl, i) => <i key={sl.id} className={i === curSlide ? 'on' : ''} />)}
                </div>
            </div>

            {/* ── Mode strip ── */}
            <div className="nr-modes">
                <b>{t('narrated_listen_read')}</b>
                <span className="nr-modes-sp" />
                {exactTiming && (
                    <span className="nr-timing-badge" title={t('narrated_timing_exact_hint')}>
                        <Zap size={11} /> {t('narrated_timing_exact')}
                    </span>
                )}
            </div>

            {/* ── Transcript ── */}
            <div className="nr-scroll" ref={scrollRef}>
                {sentences.map((s, i) => (
                    <SentenceRow
                        key={i}
                        sentence={s}
                        index={i}
                        active={i === curSent}
                        karaokeCur={i === curSent ? curWord : -1}
                        translationLang={translationLang}
                        saved={savedSet.has(i)}
                        onWordTap={handleWordTap}
                        onSegments={handleSegments}
                        onSave={handleSave}
                        onExplain={handleExplain}
                        onActivate={handleActivate}
                        t={t}
                    />
                ))}
            </div>

            {/* ── Player ── */}
            <div className="nr-player">
                <div className="nr-seekrow">
                    <span ref={curTimeRef} className="nr-time">0:00</span>
                    <div className="nr-seek" onClick={onSeekClick}>
                        <div ref={fillRef} className="nr-seek-fill" />
                        <div ref={knobRef} className="nr-seek-knob" />
                    </div>
                    <span ref={durTimeRef} className="nr-time">0:00</span>
                    <button className="nr-speed" onClick={cycleSpeed}>{speed.toFixed(2).replace(/0$/, '')}x</button>
                </div>
                <div className="nr-controls">
                    <button className="nr-pbtn" onClick={prevLine}>
                        <SkipBack size={20} /><span>{t('narrated_prev_line')}</span>
                    </button>
                    <button className="nr-pbtn" onClick={() => handleExplain(curSent)}>
                        <Sparkles size={20} /><span>{t('narrated_explain')}</span>
                    </button>
                    <button className="nr-play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
                        {ended ? <RotateCcw size={22} /> : playing ? <Pause size={22} /> : <Play size={22} />}
                    </button>
                    <button className={`nr-pbtn${savedSet.has(curSent) ? ' on' : ''}`} onClick={() => handleSave(curSent)}>
                        <Bookmark size={20} /><span>{t('narrated_save')}</span>
                    </button>
                    <button className={`nr-pbtn${looping ? ' on' : ''}`} onClick={toggleLoop}>
                        <Repeat size={20} /><span>{t('narrated_loop')}</span>
                    </button>
                </div>
            </div>

            {/* ── Word popup ── */}
            {popupWord && (
                <WordPopup
                    word={popupWord.word}
                    anchorRect={popupWord.anchorRect}
                    dictMode={translationLang === 'en' ? 'en' : translationLang}
                    isPhrase={popupWord.isPhrase}
                    preDefinition={!popupWord.isPhrase && translationLang === 'en'
                        ? (dictInfo.get(popupWord.word) || dictInfo.get(popupWord.word.toLowerCase()))
                        : null}
                    onClose={() => setPopupWord(null)}
                    onNavigate={() => setPopupWord(null)}
                    onSave={(word) => { toggleDictSavedWord(word); setPopupWord(null); }}
                />
            )}

            {/* ── Explain sheet ── */}
            <div className={`nr-sheet${sheet ? ' up' : ''}`}>
                {sheet && (
                    <>
                        <div className="nr-sheet-grab" />
                        <button className="nr-sheet-close" onClick={() => setSheetSent(null)}><X size={16} /></button>
                        <h4>{t('narrated_explain_title')}</h4>
                        <div className="nr-sheet-vi">{sheet.vi}</div>
                        <div className="nr-sheet-tr">
                            {translationLang === 'en' ? sheet.en : toTraditionalIfNeeded(sheet.zh, translationLang)}
                        </div>
                        {sheet.note && <p className="nr-sheet-note">{sheet.note}</p>}
                    </>
                )}
            </div>

            {/* ── Toast ── */}
            <div className={`nr-toast${toastMsg ? ' show' : ''}`}>{toastMsg}</div>
        </div>
    );
}
