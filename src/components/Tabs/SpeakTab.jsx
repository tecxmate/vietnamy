import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ChevronRight, MessageCircle } from 'lucide-react';
import { getDB } from '../../lib/db';
import { useT } from '../../lib/i18n';
import './SpeakTab.css';

// Difficulty pill colors, matched to the app's level palette (index.css accents).
const DIFFICULTY_META = {
  beginner: { key: 'speak_difficulty_beginner', color: '#06D6A0' },
  intermediate: { key: 'speak_difficulty_intermediate', color: '#FFD166' },
  advanced: { key: 'speak_difficulty_advanced', color: '#EF476F' },
};

// "Speak" tab — scene-based speaking practice. Lists the immersive scenes seeded
// in the mock DB (db.scenes), grouped by location, and routes into the existing
// Scene engine via /scene/:sceneId.
const SpeakTab = () => {
  const t = useT();
  const navigate = useNavigate();

  const sections = useMemo(() => {
    const db = getDB();
    const scenes = Array.isArray(db?.scenes) ? db.scenes : [];
    const allLocations = Array.isArray(db?.scene_locations) ? db.scene_locations : [];

    const byLocation = {};
    for (const scene of scenes) {
      if (!scene?.id) continue;
      const key = scene.location_id || '__ungrouped__';
      (byLocation[key] = byLocation[key] || []).push(scene);
    }

    // Build ordered sections from seeded locations that actually have scenes,
    // then append any scenes whose location wasn't found (defensive).
    const result = [];
    for (const loc of allLocations) {
      const items = byLocation[loc?.id];
      if (items?.length) result.push({ loc, scenes: items });
    }
    if (byLocation.__ungrouped__?.length) {
      result.push({ loc: null, scenes: byLocation.__ungrouped__ });
    }
    return result;
  }, []);

  if (!sections.length) {
    return (
      <div className="speak-tab">
        <header className="speak-tab__header">
          <div className="speak-tab__badge" aria-hidden>
            <Mic size={22} />
          </div>
          <div className="speak-tab__heading">
            <h1 className="speak-tab__title">{t('speak_tab_title')}</h1>
            <p className="speak-tab__subtitle">{t('speak_tab_subtitle')}</p>
          </div>
        </header>
        <div className="speak-tab__empty">
          <MessageCircle size={40} aria-hidden />
          <p>{t('speak_empty_title')}</p>
          <span>{t('speak_empty_hint')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="speak-tab">
      <header className="speak-tab__header">
        <div className="speak-tab__badge" aria-hidden>
          <Mic size={22} />
        </div>
        <div className="speak-tab__heading">
          <h1 className="speak-tab__title">{t('speak_tab_title')}</h1>
          <p className="speak-tab__subtitle">{t('speak_tab_subtitle')}</p>
        </div>
      </header>

      {sections.map(({ loc, scenes }, sectionIdx) => (
        <section key={loc?.id || `section-${sectionIdx}`} className="speak-location">
          {loc && (
            <div className="speak-location__head">
              <span className="speak-location__emoji" aria-hidden>{loc.emoji || '📍'}</span>
              <span className="speak-location__name">{loc.name || t('speak_section_scenes')}</span>
              <span className="speak-location__count">{scenes.length}</span>
            </div>
          )}

          <div className="speak-scene-list">
            {scenes.map(scene => {
              const diff = DIFFICULTY_META[scene.difficulty];
              return (
                <button
                  key={scene.id}
                  type="button"
                  className="speak-scene-card"
                  onClick={() => navigate(`/scene/${scene.id}`)}
                >
                  <span className="speak-scene-card__emoji" aria-hidden>
                    {scene.setting?.background_emoji || '🎬'}
                  </span>
                  <span className="speak-scene-card__body">
                    <span className="speak-scene-card__title">
                      {scene.title || scene.title_vi || t('speak_section_scenes')}
                    </span>
                    {scene.title_vi && scene.title && (
                      <span className="speak-scene-card__vi">{scene.title_vi}</span>
                    )}
                    {diff && (
                      <span
                        className="speak-scene-card__difficulty"
                        style={{ color: diff.color, backgroundColor: `${diff.color}22` }}
                      >
                        {t(diff.key)}
                      </span>
                    )}
                  </span>
                  <ChevronRight size={20} className="speak-scene-card__chevron" aria-hidden />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default SpeakTab;
