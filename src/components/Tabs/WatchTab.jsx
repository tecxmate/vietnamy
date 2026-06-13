import React from 'react';
import { Video } from 'lucide-react';
import { useT } from '../../lib/i18n';
import PlaceholderTab from './PlaceholderTab';

// "Watch" tab (formerly YouTube). Phase 5 builds the VoiceTube-style embedded
// player + bilingual, tappable subtitles.
const WatchTab = () => {
  const t = useT();
  return (
    <PlaceholderTab icon={<Video size={48} />} title={t('nav_watch')} blurb={t('tab_coming_soon')} />
  );
};

export default WatchTab;
