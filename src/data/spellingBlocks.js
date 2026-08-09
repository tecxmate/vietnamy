// The block inventory for the Spelling Playground.
//
// A Vietnamese syllable is a 5-slot machine:
//   ÂM ĐẦU (initial) · ÂM ĐỆM (glide) · ÂM CHÍNH (nucleus) · ÂM CUỐI (final) · THANH (tone)
//
// Each block is one draggable/tappable piece. `id` is the orthographic form and
// the composition unit; `name` is how you SAY the piece when spelling it out
// loud (đánh vần); `hint` is a one-line sound cue for foreign learners.
//
// Roles map to colors in Spell.css (--sp-<role>): initial=navy, glide=violet,
// nucleus=pink, final=teal, tone=gold. The rules live in ../lib/spellingRules.js.

export const SLOTS = [
    { role: 'initial', label_vi: 'Âm đầu', label_en: 'Initial', optional: true },
    { role: 'glide', label_vi: 'Âm đệm', label_en: 'Glide', optional: true },
    { role: 'nucleus', label_vi: 'Âm chính', label_en: 'Vowel', optional: false },
    { role: 'final', label_vi: 'Âm cuối', label_en: 'Final', optional: true },
    { role: 'tone', label_vi: 'Thanh', label_en: 'Tone', optional: false },
];

// ── Âm đầu · initial consonants (orthographic forms) ────────────────────────
// `name` = the Vietnamese "âm" used when spelling out loud.
export const INITIALS = [
    { id: 'b', name: 'bờ', hint: 'b — like "b" in bee' },
    { id: 'c', name: 'cờ', hint: 'hard "k" (before a, o, u…)' },
    { id: 'k', name: 'ca', hint: 'hard "k" (before e, ê, i)' },
    { id: 'q', name: 'quờ', hint: 'always q + u → "kw"' },
    { id: 'ch', name: 'chờ', hint: 'like "ch" in church' },
    { id: 'd', name: 'dờ', hint: 'north "z", south "y"' },
    { id: 'đ', name: 'đờ', hint: 'hard "d" in do' },
    { id: 'g', name: 'gờ', hint: 'voiced "g" (before a, o, u…)' },
    { id: 'gh', name: 'gờ', hint: 'voiced "g" (before e, ê, i)' },
    { id: 'gi', name: 'giờ', hint: 'like "z" / "y"' },
    { id: 'h', name: 'hờ', hint: 'like "h" in hat' },
    { id: 'kh', name: 'khờ', hint: 'raspy "kh" (loch)' },
    { id: 'l', name: 'lờ', hint: 'like "l" in let' },
    { id: 'm', name: 'mờ', hint: 'like "m" in me' },
    { id: 'n', name: 'nờ', hint: 'like "n" in no' },
    { id: 'ng', name: 'ngờ', hint: '"ng" in singer (before a, o, u…)' },
    { id: 'ngh', name: 'ngờ', hint: '"ng" (before e, ê, i)' },
    { id: 'nh', name: 'nhờ', hint: 'like "ñ" / "ny" in canyon' },
    { id: 'p', name: 'pờ', hint: 'like "p" in spin' },
    { id: 'ph', name: 'phờ', hint: 'like "f" in fun' },
    { id: 'r', name: 'rờ', hint: 'north "z", south rolled "r"' },
    { id: 's', name: 'sờ', hint: 'north "s", south "sh"' },
    { id: 't', name: 'tờ', hint: 'unaspirated "t"' },
    { id: 'th', name: 'thờ', hint: 'aspirated "t" in top' },
    { id: 'tr', name: 'trờ', hint: 'like "tr" in tree' },
    { id: 'v', name: 'vờ', hint: 'like "v" in van' },
    { id: 'x', name: 'xờ', hint: 'like "s" in see' },
];

// ── Âm đệm · the medial glide /w/ ───────────────────────────────────────────
export const GLIDES = [
    { id: 'o', name: 'o', hint: 'glide "w" before a, ă, e (hoa)' },
    { id: 'u', name: 'u', hint: 'glide "w" before ê, y, â… (huê, quy)' },
];

// ── Âm chính · nucleus ──────────────────────────────────────────────────────
// `front: true` drives the k/c · gh/g · ngh/ng spelling rule (keyed off the
// first vowel). `tone_at` is the index in the id string that carries the tone
// mark — 0 for single vowels, and the "quality" vowel for centering diphthongs
// (tiền → mark on ê; muốn → mark on ô; người → mark on ơ).
export const NUCLEI = [
    { id: 'a', name: 'a', hint: '"a" in father', front: false, tone_at: 0 },
    { id: 'ă', name: 'á', hint: 'short "a" in cut', front: false, tone_at: 0 },
    { id: 'â', name: 'ớ', hint: 'short "uh" in but', front: false, tone_at: 0 },
    { id: 'e', name: 'e', hint: '"e" in get', front: true, tone_at: 0 },
    { id: 'ê', name: 'ê', hint: '"ay" in say', front: true, tone_at: 0 },
    { id: 'i', name: 'i', hint: '"ee" in see', front: true, tone_at: 0 },
    { id: 'o', name: 'o', hint: '"o" in hot', front: false, tone_at: 0 },
    { id: 'ô', name: 'ô', hint: '"o" in go', front: false, tone_at: 0 },
    { id: 'ơ', name: 'ơ', hint: 'long "uh" in fur', front: false, tone_at: 0 },
    { id: 'u', name: 'u', hint: '"oo" in boot', front: false, tone_at: 0 },
    { id: 'ư', name: 'ư', hint: '"ee" with flat lips', front: false, tone_at: 0 },
    { id: 'y', name: 'y dài', hint: '"ee" in see (long i)', front: true, tone_at: 0 },
    // centering diphthongs — the "open" form (no final) + the "closed" form (takes a final)
    { id: 'ia', name: 'i-a', hint: 'ee-uh (mía) · open', front: true, tone_at: 0, diph: true },
    { id: 'iê', name: 'i-ê', hint: 'ee-ay (tiền) · takes a final', front: true, tone_at: 1, diph: true },
    { id: 'ua', name: 'u-a', hint: 'oo-uh (mua) · open', front: false, tone_at: 0, diph: true },
    { id: 'uô', name: 'u-ô', hint: 'oo-oh (muốn) · takes a final', front: false, tone_at: 1, diph: true },
    { id: 'ưa', name: 'ư-a', hint: 'ưh-uh (mưa) · open', front: false, tone_at: 0, diph: true },
    { id: 'ươ', name: 'ư-ơ', hint: 'ưh-uh (người) · takes a final', front: false, tone_at: 1, diph: true },
];

// ── Âm cuối · final consonants + semivowel off-glides ───────────────────────
// `stops: true` closes the syllable → only sắc / nặng tones are legal.
// The semivowel finals (i, y, o, u) are how gliding diphthongs are built:
//   a + i → ai (tài) · a + o → ao (chào) · ô + i → ôi (tôi).
export const FINALS = [
    { id: 'c', name: 'cờ', hint: 'stops the syllable', stops: true },
    { id: 'ch', name: 'chờ', hint: 'stops · only after front vowels', stops: true },
    { id: 'm', name: 'mờ', hint: 'humming "m"' },
    { id: 'n', name: 'nờ', hint: 'like "n"' },
    { id: 'ng', name: 'ngờ', hint: '"ng" in sing' },
    { id: 'nh', name: 'nhờ', hint: 'like "ñ" · only after front vowels' },
    { id: 'p', name: 'pờ', hint: 'stops the syllable', stops: true },
    { id: 't', name: 'tờ', hint: 'stops the syllable', stops: true },
    { id: 'i', name: 'i', hint: 'off-glide → ai, ôi, ơi', glide: true },
    { id: 'y', name: 'i', hint: 'off-glide → ay, ây', glide: true },
    { id: 'o', name: 'o', hint: 'off-glide → ao, eo', glide: true },
    { id: 'u', name: 'u', hint: 'off-glide → au, êu, iu', glide: true },
];

// ── Thanh · the six tones ───────────────────────────────────────────────────
// `sample` shows the mark on a placeholder vowel for the chip; `stopOk` marks
// the two tones legal on a stopped syllable.
export const TONES = [
    { id: 'ngang', name: 'ngang', sample: 'a', hint: 'level — no mark', stopOk: false },
    { id: 'huyen', name: 'huyền', sample: 'à', hint: 'low falling', stopOk: false },
    { id: 'sac', name: 'sắc', sample: 'á', hint: 'high rising', stopOk: true },
    { id: 'hoi', name: 'hỏi', sample: 'ả', hint: 'dipping', stopOk: false },
    { id: 'nga', name: 'ngã', sample: 'ã', hint: 'creaky rising', stopOk: false },
    { id: 'nang', name: 'nặng', sample: 'ạ', hint: 'heavy, glottal', stopOk: true },
];

// Convenience lookups by id.
export const BY_ROLE = { initial: INITIALS, glide: GLIDES, nucleus: NUCLEI, final: FINALS, tone: TONES };

export const findBlock = (role, id) => (BY_ROLE[role] || []).find((b) => b.id === id) || null;
