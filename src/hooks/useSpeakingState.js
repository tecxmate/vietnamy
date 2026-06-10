import { useSyncExternalStore } from 'react';
import { subscribeSpeakingState, getSpeakingState } from '../utils/speak';

/**
 * Returns the playback state for a given text: 'loading' | 'playing' | 'idle'.
 * 'loading' is the cold-synthesis gap (server fetching brand-new audio from
 * Azure) — drive a spinner off it. Warm/preloaded clips skip straight to
 * 'playing', so the spinner never flashes for cached audio.
 */
export function useSpeakingState(text) {
    return useSyncExternalStore(
        subscribeSpeakingState,
        () => getSpeakingState(text),
    );
}
