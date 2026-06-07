// Exercise Profiles — named recipes that control which question types the
// generator produces for a lesson. A lesson points at a profile by id; if it
// doesn't, we fall back to one derived from its CEFR level.
//
// This is the customization surface for "what kind of questions does this
// lesson show": edit a profile once and every lesson using it updates, or set
// a lesson's profile id to override. `options` is passed straight into
// generateExercises(). New knobs (speaking, type weights) slot into `options`
// without touching call sites.
//
// For now profiles live here in code; they are designed to move into the
// canonical content bundle (content/exercise-profiles.json) so the mobile team
// inherits the same recipes.

export const EXERCISE_PROFILES = {
    beginner: {
        id: 'beginner',
        label: 'Beginner (no typing)',
        // New learners can't type Vietnamese diacritics yet — swap "type what
        // you hear" for the gentler "listen & choose" twin.
        options: { disableTyping: true },
    },
    standard: {
        id: 'standard',
        label: 'Standard',
        options: {},
    },
};

export const DEFAULT_PROFILE_ID = 'standard';

/**
 * Resolve the exercise profile for a lesson.
 * Priority: explicit profileId on the lesson  →  level-derived (A1 = beginner)
 *           →  standard.
 *
 * @param {{ profileId?: string, cefrLevel?: string }} ctx
 * @returns {{ id, label, options }}
 */
export function resolveExerciseProfile({ profileId, cefrLevel } = {}) {
    if (profileId && EXERCISE_PROFILES[profileId]) {
        return EXERCISE_PROFILES[profileId];
    }
    if ((cefrLevel || '').startsWith('A1')) {
        return EXERCISE_PROFILES.beginner;
    }
    return EXERCISE_PROFILES[DEFAULT_PROFILE_ID];
}
