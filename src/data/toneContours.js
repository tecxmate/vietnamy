/**
 * toneContours.js — Reference pitch contours for the 6 Vietnamese tones.
 *
 * Each contour is a normalized array of ~20 semitone values representing
 * the "ideal" pitch shape over the duration of a syllable. Values are
 * relative to the speaker's baseline (0 = baseline pitch).
 *
 * Based on published phonetic research on Hanoi Vietnamese tone contours
 * (Brunelle 2009, Michaud 2004, Pham 2003).
 */

// ─── Reference Contours ────────────────────────────────────────────
// Each array = 20 time-steps from syllable start to end.
// Values in semitones from the speaker's personal baseline.
//
// Calibrated from native Hanoi Vietnamese speaker recordings (2025).
// These represent natural speech contours — not idealized textbook shapes.

export const TONE_CONTOURS = {
    ngang: {
        id: 'ngang',
        name: 'Ngang',
        label: 'Level',
        mark: 'a',
        color: '#4CAF50',
        description: 'High and flat — no mark',
        // Mostly flat with slight natural drift downward at the end
        contour: [0.8, 0.9, 1.0, 1.0, 1.0, 1.0, 1.0, 0.9, 0.9, 0.8,
            0.8, 0.7, 0.7, 0.6, 0.6, 0.5, 0.5, 0.4, 0.4, 0.3],
    },

    sac: {
        id: 'sac',
        name: 'Sắc',
        label: 'Rising',
        mark: 'á',
        color: '#2196F3',
        description: 'Rises sharply from mid to high',
        // Starts low-mid, may dip slightly, then rises steeply
        contour: [-1.0, -0.8, -0.5, -0.3, 0.0, 0.3, 0.7, 1.0, 1.4, 1.7,
            2.0, 2.3, 2.5, 2.7, 2.9, 3.0, 3.1, 3.2, 3.2, 3.2],
    },

    huyen: {
        id: 'huyen',
        name: 'Huyền',
        label: 'Falling',
        mark: 'à',
        color: '#9C27B0',
        description: 'Falls gradually from mid to low, breathy/creaky end',
        // Starts near baseline, falls with slight acceleration, creaky finish
        contour: [0.3, 0.1, -0.1, -0.3, -0.5, -0.8, -1.0, -1.3, -1.5, -1.8,
            -2.0, -2.2, -2.4, -2.6, -2.8, -3.0, -3.1, -3.2, -3.3, -3.4],
    },

    hoi: {
        id: 'hoi',
        name: 'Hỏi',
        label: 'Dipping',
        mark: 'ả',
        color: '#FF9800',
        description: 'Dips low then rises back up',
        // Falls to a low point around 60% through, then rises
        contour: [0.0, -0.3, -0.7, -1.2, -1.7, -2.2, -2.6, -3.0, -3.3, -3.4,
            -3.4, -3.2, -2.9, -2.5, -2.0, -1.5, -1.0, -0.5, -0.1, 0.3],
    },

    nga: {
        id: 'nga',
        name: 'Ngã',
        label: 'Rising-Glottal',
        mark: 'ã',
        color: '#E91E63',
        description: 'Rises, glottal break drops sharply, then rises again',
        // Rise → sharp glottal drop (to -4) → sharp rise back up
        // Calibrated from native speaker: dramatic dip is the key feature
        contour: [0.5, 0.8, 1.1, 1.4, 1.6, 1.5, 0.5, -1.5, -3.5, -4.0,
            -3.0, -1.0, 0.5, 1.5, 2.2, 2.6, 2.8, 2.9, 3.0, 3.0],
    },

    nang: {
        id: 'nang',
        name: 'Nặng',
        label: 'Heavy',
        mark: 'ạ',
        color: '#795548',
        description: 'Low, short, drops with glottal constriction',
        // Starts low, drops sharply, ends abruptly (short effective duration)
        contour: [-0.5, -0.8, -1.2, -1.6, -2.0, -2.5, -3.0, -3.4, -3.8, -4.0,
        -4.2, -4.3, -4.4, -4.5, -4.5, -4.5, -4.5, -4.5, -4.5, -4.5],
    },
};

// Ordered array for iteration
export const TONE_LIST = [
    TONE_CONTOURS.ngang,
    TONE_CONTOURS.sac,
    TONE_CONTOURS.huyen,
    TONE_CONTOURS.hoi,
    TONE_CONTOURS.nga,
    TONE_CONTOURS.nang,
];


// ─── Practice Words ────────────────────────────────────────────────
// Words to practice, grouped by tone. Each includes the word, tone id, and meaning.

export const PRACTICE_WORDS = [
    // Ngang
    { word: 'ma', tone: 'ngang', meaning: 'ghost' },
    { word: 'ba', tone: 'ngang', meaning: 'three / father' },
    { word: 'ca', tone: 'ngang', meaning: 'to sing' },
    { word: 'ta', tone: 'ngang', meaning: 'we / us' },
    { word: 'la', tone: 'ngang', meaning: 'to shout' },
    { word: 'đi', tone: 'ngang', meaning: 'to go' },

    // Sắc
    { word: 'má', tone: 'sac', meaning: 'mother / cheek' },
    { word: 'bá', tone: 'sac', meaning: 'governor' },
    { word: 'cá', tone: 'sac', meaning: 'fish' },
    { word: 'lá', tone: 'sac', meaning: 'leaf' },
    { word: 'tá', tone: 'sac', meaning: 'dozen' },
    { word: 'bó', tone: 'sac', meaning: 'bundle' },

    // Huyền
    { word: 'mà', tone: 'huyen', meaning: 'but / which' },
    { word: 'bà', tone: 'huyen', meaning: 'grandmother' },
    { word: 'là', tone: 'huyen', meaning: 'to be' },
    { word: 'và', tone: 'huyen', meaning: 'and' },
    { word: 'dù', tone: 'huyen', meaning: 'although' },
    { word: 'rồi', tone: 'huyen', meaning: 'already' },

    // Hỏi
    { word: 'mả', tone: 'hoi', meaning: 'grave / tomb' },
    { word: 'bả', tone: 'hoi', meaning: 'poison bait' },
    { word: 'cả', tone: 'hoi', meaning: 'all / eldest' },
    { word: 'hỏi', tone: 'hoi', meaning: 'to ask' },
    { word: 'bảo', tone: 'hoi', meaning: 'to tell' },
    { word: 'chỉ', tone: 'hoi', meaning: 'only / to point' },

    // Ngã
    { word: 'mã', tone: 'nga', meaning: 'code / horse (Sino)' },
    { word: 'bã', tone: 'nga', meaning: 'residue / dregs' },
    { word: 'ngã', tone: 'nga', meaning: 'to fall / tumble' },
    { word: 'lũ', tone: 'nga', meaning: 'flood' },
    { word: 'cũ', tone: 'nga', meaning: 'old (thing)' },
    { word: 'đã', tone: 'nga', meaning: 'already (past)' },

    // Nặng
    { word: 'mạ', tone: 'nang', meaning: 'rice seedling' },
    { word: 'bạ', tone: 'nang', meaning: 'reckless / record' },
    { word: 'nạn', tone: 'nang', meaning: 'disaster' },
    { word: 'họp', tone: 'nang', meaning: 'to meet' },
    { word: 'học', tone: 'nang', meaning: 'to study' },
    { word: 'mặt', tone: 'nang', meaning: 'face' },
];
