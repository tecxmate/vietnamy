import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ChevronRight } from 'lucide-react';
import { getDB } from '../../lib/db';
import { useT } from '../../lib/i18n';
import './SpeakTab.css';

// "Speak" tab — scene-based speaking practice. Lists the immersive scenes seeded
// in the mock DB (db.scenes), grouped by location, and routes into the existing
// Scene engine via /scene/:sceneId. (Phase B will add LLM-driven roleplay.)
const SpeakTab = () => {
  const t = useT();
  const navigate = useNavigate();

  const { locations, scenesByLocation } = useMemo(() => {
    const db = getDB();
    const scenes = db.scenes || [];
    const allLocations = db.scene_locations || [];

    const byLocation = {};
    for (const scene of scenes) {
      (byLocation[scene.location_id] = byLocation[scene.location_id] || []).push(scene);
    }

    // Only show locations that actually have scenes, preserving seed order.
    const locsWithScenes = allLocations.filter(loc => byLocation[loc.id]?.length);
    return { locations: locsWithScenes, scenesByLocation: byLocation };
  }, []);

  if (!locations.length) {
    return (
      <div className="speak-tab speak-tab--empty">
        <Mic size={48} color="var(--accent, #1CB0F6)" />
        <p>{t('tab_coming_soon')}</p>
      </div>
    );
  }

  return (
    <div className="speak-tab">
      <header className="speak-tab__header">
        <h1 className="speak-tab__title">{t('speak_tab_title')}</h1>
        <p className="speak-tab__subtitle">{t('speak_tab_subtitle')}</p>
      </header>

      {locations.map(loc => (
        <section key={loc.id} className="speak-location">
          <div className="speak-location__head">
            <span className="speak-location__emoji" aria-hidden>{loc.emoji}</span>
            <span className="speak-location__name">{loc.name}</span>
          </div>

          <div className="speak-scene-list">
            {(scenesByLocation[loc.id] || []).map(scene => (
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
                  <span className="speak-scene-card__title">{scene.title}</span>
                  <span className="speak-scene-card__meta">
                    <span className="speak-scene-card__vi">{scene.title_vi}</span>
                    {scene.difficulty && (
                      <span className="speak-scene-card__difficulty">{scene.difficulty}</span>
                    )}
                  </span>
                </span>
                <ChevronRight size={20} className="speak-scene-card__chevron" aria-hidden />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default SpeakTab;
