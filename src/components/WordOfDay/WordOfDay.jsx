import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import speak from '../../utils/speak';
import { splitTones, getEdition, fetchLiveWord, WORDS } from '../../lib/wordOfDay';
import { isMagazineTheme } from '../../lib/theme';
import './WordOfDay.css';

function TonedWord({ word }) {
  return splitTones(word).map((seg, i) =>
    seg.tone ? <span key={i} className="tone">{seg.text}</span> : <React.Fragment key={i}>{seg.text}</React.Fragment>,
  );
}

function CoverCard({ entry, onOpen }) {
  return (
    <article className="wod" role="button" tabIndex={0}
      onClick={() => onOpen(entry.word)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(entry.word); } }}
    >
      <span className="halftone" /><span className="burst" />
      {entry.glossEm && (
        <div style={{ position: 'relative', zIndex: 1, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--tc-yellow, #FCBD1B)', marginBottom: 6 }}>
          {entry.glossEm}
        </div>
      )}
      <div className="word"><TonedWord word={entry.word} /></div>
      {entry.gloss && <div className="gloss">{entry.gloss}</div>}
      <button type="button" className="listen" aria-label="Nghe phát âm"
        onClick={(e) => { e.stopPropagation(); speak(entry.word); }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M16 9a3 3 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
      </button>
    </article>
  );
}

/* Word-of-the-day magazine deck for the top of the Study tab — a swipeable
   row of cover cards (today's pick first, then the rest of the pool). Renders
   only under the Tạp Chí theme; each word is pulled live from /api/search. */
export default function WordOfDay({ onOpenWord }) {
  const navigate = useNavigate();
  const openWord = (word) => {
    if (onOpenWord) return onOpenWord(word);
    navigate('/', { state: { tab: 'dictionary', dictInput: word } });
  };
  const [active, setActive] = useState(isMagazineTheme);
  const ordered = useMemo(() => {
    const { pick } = getEdition();
    const rest = WORDS.filter((w) => w.word !== pick.word);
    return [pick, ...rest];
  }, []);
  const [entries, setEntries] = useState(ordered);
  const [idx, setIdx] = useState(0);
  const deckRef = useRef(null);

  // Show/hide live when the theme toggles (no remount needed).
  useEffect(() => {
    const onTheme = () => setActive(isMagazineTheme());
    window.addEventListener('vnme-theme-changed', onTheme);
    return () => window.removeEventListener('vnme-theme-changed', onTheme);
  }, []);

  // Pull live dictionary data for the whole pool over the curated framing.
  useEffect(() => {
    if (!active) return undefined;
    const ctrl = new AbortController();
    Promise.all(ordered.map((w) => fetchLiveWord(w, ctrl.signal))).then(setEntries);
    return () => ctrl.abort();
  }, [active, ordered]);

  // Track the centered card so the pagination dots stay in sync.
  const onScroll = () => {
    const el = deckRef.current;
    if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    [...el.children].forEach((card, i) => {
      const cardMid = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardMid - mid);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setIdx(best);
  };

  const goTo = (i) => {
    deckRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  if (!active) return null;

  return (
    <div className="wod-wrap">
      <div className="wod-head">
        <Newspaper size={16} color="var(--tc-pink)" />
        <span>Word of the day</span>
      </div>
      <div className="wod-deck" ref={deckRef} onScroll={onScroll}>
        {entries.map((entry) => (
          <CoverCard key={entry.word} entry={entry} onOpen={openWord} />
        ))}
      </div>
      <div className="wod-dots" role="tablist" aria-label="Từ trong ngày">
        {entries.map((entry, i) => (
          <button
            key={entry.word}
            type="button"
            className={i === idx ? 'on' : ''}
            aria-label={entry.word}
            aria-selected={i === idx}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
