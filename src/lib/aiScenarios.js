// AI-tutor roleplay scenarios, derived from the roadmap scene seed data
// (src/lib/content/sceneSeedData.js) so the Talk tab and the Study roadmap
// share one source of truth. Each scenario becomes an in-character chat where
// the AI plays the scene's NPC and the learner works toward the scene's goal.
import { SCENES } from './content/sceneSeedData';

// The NPC the learner talks to: the first character that isn't the player or
// the helper friend (e.g. the waiter, vendor, receptionist, driver).
function pickNpc(scene) {
    const chars = scene.characters || [];
    return chars.find(c => c.id !== 'player' && c.id !== 'friend') || chars[0] || null;
}

// First line the NPC speaks anywhere in the scene — used to open the roleplay.
function pickOpening(scene, npcId) {
    for (const phase of scene.phases || []) {
        for (const line of phase.config?.script || []) {
            if (line.speaker === npcId && line.text_vi) {
                return { vi: line.text_vi, en: line.text_en || '' };
            }
        }
        for (const ch of phase.config?.challenges || []) {
            const sp = ch.speaker_prompt;
            if (sp && sp.speaker === npcId && sp.text_vi) {
                return { vi: sp.text_vi, en: sp.text_en || '' };
            }
        }
    }
    return null;
}

const LEVEL_LABEL = { beginner: 'A1', elementary: 'A2', intermediate: 'B1', advanced: 'B2' };

function toScenario(scene) {
    const npc = pickNpc(scene);
    const gc = scene.grammar_card || null;
    return {
        id: scene.id,
        title: scene.title,
        titleVi: scene.title_vi,
        emoji: scene.setting?.background_emoji || '💬',
        gradient: scene.setting?.background_css || null,
        level: LEVEL_LABEL[scene.difficulty] || scene.difficulty || '',
        npc: npc ? { name: npc.name, role: npc.role, personality: npc.personality || '', emoji: npc.emoji || '🙂' } : null,
        goal: gc ? { label: gc.title, vi: gc.example, en: gc.translation, pattern: gc.structure } : null,
        opening: npc ? pickOpening(scene, npc.id) : null,
    };
}

export const AI_SCENARIOS = (SCENES || []).map(toScenario);

export const getScenario = (id) => AI_SCENARIOS.find(s => s.id === id) || null;

// The compact context sent to /api/tutor so the server can build an in-character
// roleplay system prompt (kept small — only what the prompt needs).
export function scenarioPayload(s) {
    if (!s) return null;
    return {
        setting: s.titleVi || s.title,
        npc: s.npc,
        goal: s.goal,
    };
}
