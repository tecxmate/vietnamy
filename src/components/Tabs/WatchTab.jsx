import React, { useState } from 'react';
import { Video, Play, Clock } from 'lucide-react';
import { useT } from '../../lib/i18n';
import TappableVietnamese from '../TappableVietnamese';
import WordPopup from '../WordPopup';
import './WatchTab.css';

// "Watch" tab (formerly YouTube) — a VoiceTube-style experience: an embedded
// video player with bilingual, tappable subtitles that open a dictionary entry
// on tap. This is a LIGHT SCAFFOLD for a likely LATER RELEASE: it establishes
// the structure and wires the real tap-to-dictionary flow, but ships no heavy
// media (no autoplay, no bundled video, no real iframe yet).
//
// NOTE: copyright sourcing for real video content is UNRESOLVED — it was
// flagged in a meeting. The sample subtitles below are original placeholder
// lines only; sourcing licensed clips + their subtitle tracks is a later task.
const SAMPLE_SUBTITLES = [
  { vi: 'Xin chào, hôm nay chúng ta học tiếng Việt.', en: 'Hello, today we learn Vietnamese.' },
  { vi: 'Bạn có thể chạm vào bất kỳ từ nào để xem nghĩa.', en: 'You can tap any word to see its meaning.' },
];

const WatchTab = () => {
  const t = useT();
  const [popupWord, setPopupWord] = useState(null);

  const handleWordTap = (word, rect, isPhrase = false) => {
    if (!word) { setPopupWord(null); return; }
    setPopupWord({ word, anchorRect: rect, isPhrase });
  };

  return (
    <div className="watch-tab">
      {/* Honest "later release" framing — this is a scaffold, not a live feature */}
      <div className="watch-header">
        <div className="watch-header-icon"><Video size={28} /></div>
        <div className="watch-header-text">
          <h2 className="watch-title">{t('nav_watch')}</h2>
          <p className="watch-subtitle">{t('watch_tab_subtitle')}</p>
        </div>
      </div>

      <div className="watch-badge">
        <Clock size={14} />
        <span>{t('watch_later_release')}</span>
      </div>

      {/* Responsive 16:9 video player slot — a YouTube iframe / <video> goes
          here later. For now it is a poster placeholder with no media. */}
      <div className="watch-player" role="img" aria-label={t('watch_sample_label')}>
        <div className="watch-player-overlay">
          <div className="watch-play-btn"><Play size={28} fill="currentColor" /></div>
          <span className="watch-sample-tag">{t('watch_sample_label')}</span>
        </div>
      </div>

      <p className="watch-preview-note">{t('watch_preview_note')}</p>

      {/* Bilingual subtitle panel — demonstrates the core tap-to-dictionary
          interaction with TappableVietnamese -> WordPopup. */}
      <div className="watch-subtitles">
        <h3 className="watch-subtitles-heading">{t('watch_subtitles_heading')}</h3>
        {SAMPLE_SUBTITLES.map((line, idx) => (
          <div key={idx} className="watch-sub-row">
            <p className="watch-sub-vi">
              <TappableVietnamese text={line.vi} onWordTap={handleWordTap} />
            </p>
            <p className="watch-sub-en">{line.en}</p>
          </div>
        ))}
      </div>

      {popupWord && (
        <WordPopup
          word={popupWord.word}
          anchorRect={popupWord.anchorRect}
          dictMode="en"
          isPhrase={popupWord.isPhrase}
          onClose={() => setPopupWord(null)}
          onNavigate={() => setPopupWord(null)}
        />
      )}
    </div>
  );
};

export default WatchTab;
