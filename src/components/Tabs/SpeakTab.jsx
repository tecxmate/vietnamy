import React from 'react';
import { Mic } from 'lucide-react';
import { useT } from '../../lib/i18n';
import PlaceholderTab from './PlaceholderTab';

// "Speak" tab (formerly Conversation). Phase 4 builds it on the existing Scene
// engine first, then adds LLM-driven AI roleplay + speaking practice.
const SpeakTab = () => {
  const t = useT();
  return (
    <PlaceholderTab icon={<Mic size={48} />} title={t('nav_speak')} blurb={t('tab_coming_soon')} />
  );
};

export default SpeakTab;
