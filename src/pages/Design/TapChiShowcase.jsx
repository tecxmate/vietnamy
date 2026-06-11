import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import speak from '../../utils/speak';
import { detectToneName, splitTones, getEdition, fetchLiveWord } from '../../lib/wordOfDay';
import './TapChiShowcase.css';

/* =========================================================================
   Vietnamy — Tạp Chí (Thanh âm Hà Nội) design showcase.

   A faithful React port of the Claude Design handoff
   (vnmy/project/Vietnamy Tạp Chí.html): the "word-of-the-day as a Hà Nội
   magazine cover" home screen + the dictionary-entry spread, in the
   hot-pink / navy / teal / gold palette with Finesse-Roman display type.

   The word-of-the-day is wired to the live dictionary API (/api/search);
   curated editorial framing fills the gaps the database doesn't carry
   (gloss line, issue framing, Hán-Việt etymology), with curated fallbacks
   if the API is unavailable.
   ========================================================================= */

// Combining tone marks (NFD): grave, acute, hook-above, tilde, dot-below.
// Render a Vietnamese word, highlighting the tone-bearing vowel in gold —
// the same trick the mockup uses for "ph<span class=tone>ở</span>".
function renderTonedWord(word) {
  return splitTones(word).map((seg, i) =>
    seg.tone ? <span key={i} className="tone">{seg.text}</span> : <React.Fragment key={i}>{seg.text}</React.Fragment>,
  );
}

const Icon = {
  tone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14c2-6 5-9 8-9s4 3 4 7-2 7-5 7" /><path d="M4 14h10" /></svg>,
  vowel: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></svg>,
  greet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 9h10M7 13h6" /><path d="M5 5h14v11l-4 3v-3H5Z" /></svg>,
  family: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M3 19c0-3.3 2.7-5 6-5s6 1.7 6 5M15 19c0-2.4 1-3.6 3-3.8" /></svg>,
  food: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a3 3 0 0 0 6 0V3M9 3v18M18 3c-1.5 1-2 3-2 6s.5 4 2 5v7" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>,
  speaker: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M16 9a3 3 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="2" /></svg>,
  play: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7Z" /></svg>,
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>,
  bookmark: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h12a2 2 0 0 1 2 2v14l-8-3.5L5 20Z" /></svg>,
  navHoc: <svg className="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4Z" /><path d="M20 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7Z" /></svg>,
  navDict: <svg className="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h12a2 2 0 0 1 2 2v14l-8-3.5L5 20Z" /></svg>,
  navDrill: <svg className="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /></svg>,
  navMe: <svg className="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>,
};

const LESSONS = [
  { num: 1, vn: 'Thanh điệu', ds: 'The six tones · 12 từ', color: 'var(--pink)', icon: Icon.tone, state: 'done' },
  { num: 2, vn: 'Nguyên âm', ds: 'Vowels · 10 từ', color: 'var(--teal)', icon: Icon.vowel, state: 'done' },
  { num: 3, vn: 'Chào hỏi', ds: 'Greetings · 5/8', color: 'var(--yellow)', dark: true, icon: Icon.greet, state: 'active' },
  { num: 4, vn: 'Gia đình', ds: 'Family · 14 từ', color: 'var(--navy)', icon: Icon.family, state: 'locked' },
  { num: 5, vn: 'Ẩm thực', ds: 'Food · 16 từ', color: 'var(--pink)', icon: Icon.food, state: 'locked' },
];

// Be Vietnam Pro + Anton aren't used elsewhere in the app, so load them
// lazily (once) only when this showcase mounts.
const FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900&family=Anton&display=swap';
function useMagazineFonts() {
  useEffect(() => {
    if (document.getElementById('tapchi-fonts')) return;
    const link = document.createElement('link');
    link.id = 'tapchi-fonts';
    link.rel = 'stylesheet';
    link.href = FONTS_HREF;
    document.head.appendChild(link);
  }, []);
}

const StatusBar = () => (
  <div className="statusbar">
    <span>9:41</span>
    <span className="sb-right">
      <span className="sig"><i /><i /><i /><i /></span>
      <span className="batt" />
    </span>
  </div>
);

export default function TapChiShowcase() {
  const navigate = useNavigate();
  useMagazineFonts();
  const { pick, issueNum, date } = useMemo(() => getEdition(), []);
  const [entry, setEntry] = useState(pick);

  // Word-of-the-day wired to the live dictionary: overlay real ipa /
  // definition / example onto the curated editorial framing.
  useEffect(() => {
    const ctrl = new AbortController();
    fetchLiveWord(pick, ctrl.signal).then((merged) => setEntry(merged));
    return () => ctrl.abort();
  }, [pick]);

  const toneName = detectToneName(entry.word);
  const say = () => speak(entry.word);

  return (
    <div className="tapchi">
      <main className="page">
        <header>
          <div className="eyebrow">Vietnamy · Variation 1 — Tạp Chí</div>
          <h1 className="page-title">The word-of-the-day, as a <em>Hà Nội</em> magazine cover</h1>
          <p className="page-lede">
            Variation 1 in the <strong>Thanh âm Hà Nội</strong> palette — hot pink, navy, teal and gold,
            plus-mark motifs and halftone grain. Each day opens on a <strong>dictionary-masthead hero</strong>:
            one giant Finesse word with its phonetic breakdown, like a cover line. The full entry reads like a
            magazine spread, and the word-of-the-day is pulled live from the dictionary.
          </p>
        </header>

        <div className="rail">

          {/* ===== SCREEN 01 — HOME ===== */}
          <section>
            <div className="col-head">
              <div className="col-tag"><span className="dot" />Screen 01</div>
              <div className="col-name">Home · word of the day</div>
            </div>
            <div className="phone">
              <div className="screen home">
                <div className="notch" />
                <StatusBar />
                <div className="mast">
                  <div className="wm"><b>việt<span>namy</span></b><small>Tạp chí học tiếng Việt</small></div>
                  <div className="pls"><span className="plus" /><span className="plus" /></div>
                </div>

                <div className="cover">
                  <span className="halftone" /><span className="burst" />
                  <div className="crow">
                    <span className="kicker">Từ trong ngày</span>
                    <div className="issue">SỐ {issueNum}<small>{date}</small></div>
                  </div>
                  <div className="word">{renderTonedWord(entry.word)}</div>
                  <div className="brk">
                    <span className="seg">{entry.initial}</span>
                    <span className="seg">{entry.rhyme}</span>
                    <span className="seg">{toneName}</span>
                    <span className="ipa">{entry.ipa}</span>
                  </div>
                  <div className="gloss">{entry.gloss} — <em>{entry.glossEm}</em></div>
                  <button type="button" className="listen" onClick={say}>{Icon.speaker}Nghe phát âm</button>
                  <span className="tag2"><span className="plus sm" />Bản hoá ca</span>
                </div>

                <div className="index">
                  <div className="ihd"><b>Chặng 1 — Nền tảng</b><span className="ln" /></div>
                  {LESSONS.map((l) => (
                    <div key={l.num} className={`row${l.state === 'locked' ? ' lock' : ''}`}>
                      <span className="cat" style={{ background: l.color, ...(l.dark ? { color: 'var(--ink)' } : null) }}>{l.icon}</span>
                      <span className="num">{l.num}</span>
                      <div className="nm"><div className="vn">{l.vn}</div><div className="ds">{l.ds}</div></div>
                      {l.state === 'done' && <span className="ck">{Icon.check}</span>}
                      {l.state === 'active' && <button type="button" className="go">Tiếp</button>}
                      {l.state === 'locked' && <span className="rg" />}
                    </div>
                  ))}
                </div>

                <div className="tabbar">
                  <div className="it on">{Icon.navHoc}Học</div>
                  <div className="it">{Icon.navDict}Từ điển</div>
                  <div className="it">{Icon.navDrill}Luyện</div>
                  <div className="it">{Icon.navMe}Tôi</div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== SCREEN 02 — DICTIONARY ENTRY ===== */}
          <section>
            <div className="col-head">
              <div className="col-tag"><span className="dot" />Screen 02</div>
              <div className="col-name">Mục từ · dictionary entry</div>
            </div>
            <div className="phone">
              <div className="screen entry">
                <div className="notch" />
                <StatusBar />
                <div className="ebar">
                  <button type="button" className="bk" aria-label="Quay lại" onClick={() => navigate(-1)}>{Icon.back}</button>
                  <span className="mlabel">Mục từ · {String(issueNum % 100).padStart(2, '0')}</span>
                  <span className="pls"><span className="plus" /><span className="plus" /></span>
                </div>

                <div className="ehero">
                  <span className="halftone" />
                  <span className="toneflag">LEVEL · {entry.level}</span>
                  <div className="pos">{entry.pos}</div>
                  <div className="bigword">{renderTonedWord(entry.word)}</div>
                  <div className="phon">
                    <button type="button" className="play" aria-label="Nghe phát âm" onClick={say}>{Icon.play}</button>
                    <span className="ipa">{entry.ipa}</span>
                  </div>
                </div>

                <div className="ebody">
                  <div className="sec"><span className="plus sm" />Định nghĩa</div>
                  <p className="def">{entry.def}</p>
                  <div className="sec" style={{ marginTop: 22 }}><span className="plus sm" />Ví dụ</div>
                  <div className="ex">
                    <div className="vn">{entry.example.vi}</div>
                    {entry.example.en && <div className="en">{entry.example.en}</div>}
                  </div>
                  {entry.han && (
                    <>
                      <div className="sec" style={{ marginTop: 22 }}><span className="plus sm" />Gốc từ · etymology</div>
                      <div className="han">
                        <span className="gly">{entry.han.gly}</span>
                        <div className="x"><b>{entry.han.label}</b>{entry.han.note}</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="ecta">
                  <button type="button">{Icon.bookmark}Thêm vào sổ tay</button>
                </div>
              </div>
            </div>
          </section>

          {/* ===== PALETTE KEY ===== */}
          <section className="keycol">
            <div className="col-head">
              <div className="col-tag">DESIGN SYSTEM</div>
              <div className="col-name">Năng lượng mới</div>
            </div>
            <div className="kblk">
              <h4>Palette</h4>
              <div className="sw">
                <div style={{ background: 'var(--pink)' }}><span>Pink EE4A75</span></div>
                <div style={{ background: 'var(--navy)' }}><span>Navy 204081</span></div>
                <div style={{ background: 'var(--teal)' }}><span>Teal 38BA94</span></div>
                <div style={{ background: 'var(--yellow)' }}><span>Gold FCBD1B</span></div>
                <div style={{ background: 'var(--cream)' }}><span>Paper</span></div>
              </div>
            </div>
            <div className="kblk" style={{ marginTop: 46 }}>
              <h4>Display · Finesse-Roman</h4>
              <div className="typ">phở · Thanh điệu<small>Cover words &amp; every Vietnamese term</small></div>
            </div>
            <div className="kblk">
              <h4>Masthead · Be Vietnam Pro</h4>
              <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                TỪ TRONG NGÀY · SỐ {issueNum}
                <small style={{ display: 'block', fontWeight: 700, fontSize: 11, color: '#9a8f74', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 6 }}>Kickers, labels, buttons</small>
              </div>
            </div>
            <div className="kblk">
              <h4>Motif</h4>
              <div style={{ display: 'flex', gap: 10, color: 'var(--navy)' }}><span className="plus" /><span className="plus" /><span className="plus" /></div>
              <p>Plus-marks &amp; halftone dots carry the collage energy of the magazine into the UI chrome.</p>
            </div>
          </section>

        </div>

        <footer className="foot">
          Variation 1 · <b>Tạp Chí</b> in the Thanh âm Hà Nội palette · uses the <b>Finesse-Roman</b> display font.
          The word-of-the-day rotates daily and is pulled live from the dictionary.
        </footer>
      </main>
    </div>
  );
}
