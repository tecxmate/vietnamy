/**
 * senseRank.js — order and annotate dictionary senses for learners.
 *
 * The dictionary DBs merge five sources with different conventions, and the
 * senses come back in insertion order. A beginner looking up "đi" gets 25
 * entries, most of them Vietnamese-monolingual definitions they can't read,
 * with the plain English gloss buried somewhere in the middle.
 *
 * This module doesn't drop anything — it annotates each sense with a canonical
 * part of speech, the language its gloss is written in, and a score, then sorts
 * so the senses a learner can actually use come first. The UI can collapse
 * anything tagged `tier: 'secondary'`.
 *
 * Ranking lives here rather than in the DB because the dictionary files aren't
 * in the repo (they're 100MB+ and built out-of-band), so a schema migration
 * couldn't ship through a normal PR. This is pure and testable — see
 * scripts/validate-sense-rank.mjs.
 */

// ─── Part of speech ────────────────────────────────────────────────
// Five sources, five conventions: VE uses English and Vietnamese names
// interchangeably, 3-dict-combination uses a Vietnamese treebank tagset
// (Nt/Na/Vt/Vu…), AI_Generated_EN uses abbreviations. Typos in the source data
// ("tính tứ", "danh tù", "thành ngử") are mapped rather than dropped.
const POS_CANON = {
    // English, long and abbreviated
    noun: 'noun', n: 'noun', 'n.': 'noun',
    verb: 'verb', v: 'verb', 'v.': 'verb',
    adj: 'adjective', 'adj.': 'adjective', adjective: 'adjective',
    adv: 'adverb', 'adv.': 'adverb', adverb: 'adverb',
    pron: 'pronoun', 'pron.': 'pronoun', pronoun: 'pronoun',
    prep: 'preposition', 'prep.': 'preposition', preposition: 'preposition',
    conj: 'conjunction', 'conj.': 'conjunction', conjunction: 'conjunction',
    interj: 'interjection', 'interj.': 'interjection', excl: 'interjection',
    number: 'numeral', num: 'numeral',
    phrase: 'phrase', expr: 'phrase', 'expr.': 'phrase', idiom: 'idiom',

    // Vietnamese names (including the misspellings present in VE)
    'danh từ': 'noun', 'danh từ.': 'noun', 'danh tù': 'noun',
    'động từ': 'verb', 'động từ.': 'verb',
    'tính từ': 'adjective', 'tính từ.': 'adjective', 'tính tứ': 'adjective',
    'trạng từ': 'adverb', 'trang từ': 'adverb', 'phó từ': 'adverb', 'trạng ngữ': 'adverb',
    'đại từ': 'pronoun', 'giới từ': 'preposition', 'liên từ': 'conjunction',
    'từ nối': 'conjunction', 'tán thán từ': 'interjection', 'từ đệm': 'particle',
    'số từ': 'numeral', 'thành ngữ': 'idiom', 'thành ngử': 'idiom',
    'tục ngữ': 'proverb', 'khẩu ngữ': 'colloquial',

    // 3-dict-combination's treebank tagset. First letter is the class:
    // N=noun, V=verb, A=adjective, P=pronoun, M=numeral, R=adverb…
    nt: 'noun', na: 'noun', nc: 'noun', nu: 'noun', np: 'noun', nl: 'noun', nx: 'noun', ng: 'noun', n_: 'noun',
    vt: 'verb', vi: 'verb', vu: 'verb', vs: 'verb', vm: 'verb',
    ap: 'adjective', ao: 'adjective', ai: 'adjective', ar: 'adjective', ax: 'adjective', a: 'adjective', a0: 'adjective',
    pd: 'pronoun', pp: 'pronoun', pi: 'pronoun', pq: 'pronoun',
    mc: 'numeral', mo: 'numeral',
    r: 'adverb', c: 'conjunction', e: 'preposition', i: 'interjection',
};

// A POS field longer than this isn't a tag — it's a definition that landed in
// the wrong column. VE has rows where an entire sentence sits in part_of_speech.
const MAX_POS_LEN = 24;

/**
 * Map a raw part_of_speech value onto one canonical label.
 * Returns null for empty, unrecognised, or obviously-malformed values.
 */
export function normalizePos(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const s = raw.trim().toLowerCase();
    if (!s || s.length > MAX_POS_LEN) return null;

    if (POS_CANON[s]) return POS_CANON[s];

    // Compound tags: "noun & verb", "adj, adv", "động từ /danh từ" — take the
    // first component, which is the primary reading in every source we merge.
    const first = s.split(/\s*[&,/]\s*/)[0].trim();
    if (first !== s && POS_CANON[first]) return POS_CANON[first];

    return null;
}

// ─── Gloss language ────────────────────────────────────────────────
// Which language is this sense written in? Vietnamese-monolingual definitions
// are useless to a learner who doesn't read Vietnamese yet — that's exactly who
// is looking the word up.

const VI_DIACRITICS = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;

// Vietnamese function words — the giveaway when a definition happens to carry
// few diacritics. Deliberately excludes words that are also English ("can",
// "co", "la", "ta", "me") to avoid false positives on English glosses.
const VI_FUNCTION_WORDS = new Set([
    'của', 'và', 'là', 'người', 'cho', 'được', 'những', 'một', 'có', 'không',
    'này', 'đó', 'các', 'với', 'trong', 'khi', 'như', 'để', 'đến', 'từ',
    'vào', 'làm', 'thì', 'mà', 'hoặc', 'hay', 'bị', 'sự', 'việc', 'cách',
    'nơi', 'chỉ', 'nhất', 'rất', 'cũng', 'đã', 'sẽ', 'bằng', 'theo', 'trên',
    'dưới', 'vì', 'nên', 'nếu', 'thường', 'gì', 'nào', 'nhiều', 'thể', 'ở',
]);

// English function words that rarely open a Vietnamese gloss.
const EN_MARKERS = /\b(to|the|a|an|of|or|and|that|which|something|someone|be|is|are|in|on|for)\b/gi;

// The Chinese dictionaries gloss in Han characters; detecting them keeps a
// zh reader's own glosses from being mislabelled as English.
const CJK = /[一-鿿㐀-䶿豈-﫿]/;

/**
 * Classify a gloss as 'en', 'vi', 'zh', or 'mixed'.
 *
 * "mixed" is real and common: VE entries like "to eat, to feed" are English,
 * but plenty read "chim sẻ; sparrow" — both languages in one sense. Those rank
 * between pure-English and pure-Vietnamese rather than being forced either way.
 */
export function classifyGloss(text) {
    if (!text || typeof text !== 'string') return 'en';
    const s = text.trim();
    if (!s) return 'en';

    if (CJK.test(s)) return 'zh';

    const tokens = s.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
    if (tokens.length === 0) return 'en';

    const viFunc = tokens.filter(t => VI_FUNCTION_WORDS.has(t)).length;
    const hasViChars = VI_DIACRITICS.test(s);
    const enHits = (s.match(EN_MARKERS) || []).length;

    // Vietnamese diacritics are decisive when there's no competing English.
    const viScore = (hasViChars ? 2 : 0) + viFunc * 2;
    const enScore = enHits;

    if (viScore === 0) return 'en';
    if (enScore === 0) return 'vi';
    // Both present. Whichever dominates by a clear margin wins; otherwise mixed.
    if (viScore > enScore * 2) return 'vi';
    if (enScore > viScore * 2) return 'en';
    return 'mixed';
}

// ─── Metadata rows ─────────────────────────────────────────────────
// Every StarDict-derived source ships its own license header and index URLs as
// ordinary rows in `meanings`, attached to pseudo-headwords like
// "00-database-info". They are not definitions and must never rank.
const METADATA_WORD = /^0\d-database-/i;
const METADATA_TEXT = /(GNU General Public License|Free Vietnamese Dictionary Project|@0\d-database-|This is the .{0,40}dictionary database)/i;

/** Is this row dictionary bookkeeping rather than a definition? */
export function isMetadataSense(word, meaningText) {
    if (word && METADATA_WORD.test(String(word).trim())) return true;
    if (!meaningText) return false;
    // Only treat as metadata when it appears at the head of the text, so a
    // definition that merely mentions a license isn't discarded.
    return METADATA_TEXT.test(String(meaningText).slice(0, 200));
}

// ─── Scoring ───────────────────────────────────────────────────────

// Source trust for a learner-facing gloss. VE and AI_Generated_EN are written
// as bilingual glosses; 3-dict-combination is a Vietnamese monolingual
// dictionary; the StarDict/FVDP blobs are dense and parsed client-side.
const SOURCE_WEIGHT = {
    VE: 6,
    AI_Generated_EN: 5,
    Wiktionary: 5,
    VietAnh_Stardict: 3,
    'FVDP (GPL)': 3,
    '3-dict-combination': 2,
    AI_Generated_ZH: 5,
    AI_Generated_ZH_T: 5,
    TrungViet: 3,
};

// A gloss in this range reads as a definition. Much shorter is usually a
// fragment; much longer is an essay a learner won't read at a glance.
const IDEAL_MIN = 8;
const IDEAL_MAX = 120;

const PRIMARY_COUNT = 3;

/**
 * Can a reader of `lang` read a gloss written in `glossLang`?
 * A zh reader reads Han glosses; everyone else here reads English. Vietnamese
 * monolingual definitions are what the learner is trying to work up to.
 */
function isReadable(glossLang, lang) {
    if (lang === 'zh-s' || lang === 'zh-t') return glossLang === 'zh' || glossLang === 'en';
    return glossLang === 'en';
}

/**
 * Score one annotated sense. Higher ranks earlier.
 *
 * `lang` is the dictionary being read (the learner's language), so a Vietnamese
 * gloss is penalised for an 'en' reader but is the whole point for someone
 * reading the Vietnamese monolingual entries deliberately.
 */
function scoreSense(sense, lang) {
    if (sense.is_metadata) return -1000;

    let score = 0;
    score += SOURCE_WEIGHT[sense.source_name] ?? 3;

    // Gloss language vs. what the reader can read.
    if (isReadable(sense.gloss_lang, lang)) score += 8;
    else if (sense.gloss_lang === 'mixed') score += 4;
    // A Vietnamese-only gloss gets nothing — kept, but ranked below anything
    // the reader can actually use.

    if (sense.part_of_speech_canonical) score += 3;
    if (sense.examples && sense.examples.length > 0) score += 4;

    const len = (sense.meaning_text || '').trim().length;
    if (len >= IDEAL_MIN && len <= IDEAL_MAX) score += 3;
    else if (len > IDEAL_MAX * 4) score -= 3; // a wall of text
    else if (len < IDEAL_MIN) score -= 2;     // a fragment

    return score;
}

/**
 * Annotate and sort a word's senses.
 *
 * Nothing is removed — metadata rows sort to the bottom and are flagged so a
 * caller can filter them, and every original sense object is preserved with its
 * fields intact. Returns a new array; the input is not mutated.
 *
 * Each returned sense gains:
 *   part_of_speech_canonical — one label across all five source conventions
 *   gloss_lang               — 'en' | 'vi' | 'mixed'
 *   is_metadata              — license/index row, not a definition
 *   rank_score               — the computed score (useful for debugging)
 *   tier                     — 'primary' for the top few, else 'secondary'
 */
export function rankSenses(meanings, { lang = 'en', word = null, sourceName = null } = {}) {
    if (!Array.isArray(meanings) || meanings.length === 0) return [];

    const annotated = meanings.map((m, index) => {
        const source_name = m.source_name ?? sourceName ?? null;
        const sense = {
            ...m,
            source_name,
            part_of_speech_canonical: normalizePos(m.part_of_speech),
            gloss_lang: classifyGloss(m.meaning_text),
            is_metadata: isMetadataSense(word, m.meaning_text),
            _index: index, // stable-sort tiebreak: preserve source order
        };
        sense.rank_score = scoreSense(sense, lang);
        // Readability is the outer sort key, not just a score bonus, so that
        // display order and `tier` can never disagree: everything the reader can
        // use comes first, best-first, then the rest, best-first. Without this a
        // low-scoring readable gloss would be tagged primary while sitting
        // below higher-scoring Vietnamese ones in the array.
        sense._readable = sense.is_metadata ? 0
            : isReadable(sense.gloss_lang, lang) ? 2
                : sense.gloss_lang === 'mixed' ? 1
                    : 0;
        return sense;
    });

    annotated.sort((a, b) =>
        b._readable - a._readable ||
        b.rank_score - a.rank_score ||
        a._index - b._index);

    // 'primary' means "senses this reader can use", so a Vietnamese-only gloss
    // is not promoted just because it placed in the top three. When a word has
    // no readable gloss at all, fall back to promoting the best of what exists
    // — showing nothing as primary would be worse than showing something.
    const anyReadable = annotated.some(s => s._readable > 0);
    let promoted = 0;
    return annotated.map((s) => {
        const eligible = !s.is_metadata
            && promoted < PRIMARY_COUNT
            && (!anyReadable || s._readable > 0);
        if (eligible) promoted++;
        const { _index, _readable, ...rest } = s;
        return { ...rest, tier: eligible ? 'primary' : 'secondary' };
    });
}
