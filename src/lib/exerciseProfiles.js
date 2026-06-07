// Exercise Profiles — named recipes that control which question types the
// generator produces for a lesson.
//
// The profiles themselves are canonical content, owned by content/exercise-
// profiles.json so the mobile team reads the exact same recipes. This module is
// a thin adapter over that bundle (same pattern as toneContours.js → tones.json):
// it exposes the profiles as a lookup and resolves a profile for a lesson.
//
// A lesson resolves its profile by:
//   explicit profileId (curriculum lesson.exerciseProfileId / admin override)
//   → levelDefaults[CEFR band]  (e.g. A1 → beginner)
//   → defaultProfileId.
//
// A profile's `options` object is passed straight into generateExercises().

import profilesData from '../../content/exercise-profiles.json';

export const EXERCISE_PROFILES = Object.fromEntries(
    (profilesData.profiles || []).map((p) => [p.id, p]),
);

export const DEFAULT_PROFILE_ID = profilesData.defaultProfileId;

const LEVEL_DEFAULTS = profilesData.levelDefaults || {};

/**
 * Resolve the exercise profile for a lesson.
 *
 * @param {{ profileId?: string, cefrLevel?: string }} ctx
 * @returns {{ id, label, options }}
 */
export function resolveExerciseProfile({ profileId, cefrLevel } = {}) {
    if (profileId && EXERCISE_PROFILES[profileId]) {
        return EXERCISE_PROFILES[profileId];
    }
    // CEFR band is the first two chars ("A1.1" → "A1", "A2" → "A2").
    const byLevel = LEVEL_DEFAULTS[(cefrLevel || '').slice(0, 2)];
    if (byLevel && EXERCISE_PROFILES[byLevel]) {
        return EXERCISE_PROFILES[byLevel];
    }
    return EXERCISE_PROFILES[DEFAULT_PROFILE_ID];
}
