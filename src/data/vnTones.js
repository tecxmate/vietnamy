// Vietnamese tone data — shared by the spelling rules (runtime) and the
// attested-syllable generator (build script). No imports, so Node can load it
// directly with an explicit .js path.

export const TONE_IDS = ['ngang', 'huyen', 'sac', 'hoi', 'nga', 'nang'];

// base vowel → [ngang, huyền, sắc, hỏi, ngã, nặng]
export const TONED = {
    a: ['a', 'à', 'á', 'ả', 'ã', 'ạ'],
    ă: ['ă', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ'],
    â: ['â', 'ầ', 'ấ', 'ẩ', 'ẫ', 'ậ'],
    e: ['e', 'è', 'é', 'ẻ', 'ẽ', 'ẹ'],
    ê: ['ê', 'ề', 'ế', 'ể', 'ễ', 'ệ'],
    i: ['i', 'ì', 'í', 'ỉ', 'ĩ', 'ị'],
    o: ['o', 'ò', 'ó', 'ỏ', 'õ', 'ọ'],
    ô: ['ô', 'ồ', 'ố', 'ổ', 'ỗ', 'ộ'],
    ơ: ['ơ', 'ờ', 'ớ', 'ở', 'ỡ', 'ợ'],
    u: ['u', 'ù', 'ú', 'ủ', 'ũ', 'ụ'],
    ư: ['ư', 'ừ', 'ứ', 'ử', 'ữ', 'ự'],
    y: ['y', 'ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ'],
};

// toned char → { base, toneId } for every non-level mark.
const REVERSE = (() => {
    const m = {};
    for (const [base, row] of Object.entries(TONED)) {
        row.forEach((ch, idx) => {
            if (idx > 0) m[ch] = { base, toneId: TONE_IDS[idx] };
        });
    }
    return m;
})();

/** Apply a tone mark to a single base vowel. Falls back to the base if unknown. */
export function applyTone(baseVowel, toneId) {
    const row = TONED[baseVowel];
    const idx = TONE_IDS.indexOf(toneId);
    if (!row || idx < 0) return baseVowel;
    return row[idx];
}

/**
 * Split a written syllable into its tone-less spelling and its tone.
 * "muốn" → { base: "muôn", toneId: "sac" }. Level tone → { base, toneId: "ngang" }.
 */
export function splitTone(syllable) {
    let toneId = 'ngang';
    const base = [...syllable].map((ch) => {
        const r = REVERSE[ch];
        if (r) { toneId = r.toneId; return r.base; }
        return ch;
    }).join('');
    return { base, toneId };
}
