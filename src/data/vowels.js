import { loadOverride } from '../lib/contentOverrides';

// Single source of truth for the vowel-practice content (was inline in
// VowelsPractice + the wrapper files). The admin Pronunciation editor can
// override the four lists; the practice wrappers derive their subsets from
// here, so editing once updates every lesson that uses them.
export const VOWELS_CMS_KEY = 'vnme_cms_vowels';

const DEFAULT_SINGLE = [
    { letter: 'a', name: 'Plain a', sound: '"ah" as in <b>father</b>', example: 'ba', exMeaning: 'father' },
    { letter: 'ă', name: 'Smile a', sound: 'Shorter "ah" as in <b>cut</b> or <b>shut</b>', example: 'ăn', exMeaning: 'eat' },
    { letter: 'â', name: 'Hat a', sound: '"u" as in <b>but</b> (very short)', example: 'cần', exMeaning: 'need' },
    { letter: 'e', name: 'Plain e', sound: '"e" as in <b>get</b> or <b>set</b>', example: 'xe', exMeaning: 'vehicle' },
    { letter: 'ê', name: 'Hat e', sound: '"ay" as in <b>say</b> or <b>day</b>', example: 'bê', exMeaning: 'calf' },
    { letter: 'i / y', name: 'i / y', sound: '"ee" as in <b>see</b>', example: 'bi', exMeaning: 'marble' },
    { letter: 'o', name: 'Plain o', sound: '"o" as in <b>hot</b>', example: 'bò', exMeaning: 'cow' },
    { letter: 'ô', name: 'Hat o', sound: '"o" as in <b>go</b>', example: 'cô', exMeaning: 'miss' },
    { letter: 'ơ', name: 'Hook o', sound: '"u" as in <b>huh</b> or <b>fur</b> (but longer)', example: 'thơ', exMeaning: 'poem' },
    { letter: 'u', name: 'Plain u', sound: '"oo" as in <b>boot</b> or <b>true</b>', example: 'thu', exMeaning: 'autumn' },
    { letter: 'ư', name: 'Hook u', sound: 'Like "ee" but with flat, unrounded lips', example: 'thư', exMeaning: 'letter' },
];

const DEFAULT_CENTERING = [
    { group: 'i-ê', open: 'ia', closed: 'iê / yê', approx: 'Like <b>ee-uh</b> (e.g., beer)', examples: [{ word: 'mía', meaning: 'cane', type: 'open' }, { word: 'tiền', meaning: 'money', type: 'closed' }, { word: 'yêu', meaning: 'love', type: 'closed' }] },
    { group: 'u-ô', open: 'ua', closed: 'uô', approx: 'Like <b>oo-uh</b> (e.g., tour)', examples: [{ word: 'mua', meaning: 'buy', type: 'open' }, { word: 'muộn', meaning: 'late', type: 'closed' }] },
    { group: 'ư-ơ', open: 'ưa', closed: 'ươ', approx: 'Like <b>ư</b> (unrounded "ee") gliding into a neutral <b>uh</b>', examples: [{ word: 'mưa', meaning: 'rain', type: 'open' }, { word: 'mượn', meaning: 'borrow', type: 'closed' }] },
];

const DEFAULT_GLIDING = [
    { diph: 'ai', approx: 'Like "I" or "eye" (long a)', example: 'tai', meaning: 'ear' },
    { diph: 'ay', approx: 'Like "I" but shorter (short ă)', example: 'tay', meaning: 'hand' },
    { diph: 'ao', approx: 'Like "now" or "how"', example: 'chào', meaning: 'hello' },
    { diph: 'au', approx: 'Like "owl" but much shorter', example: 'sau', meaning: 'after' },
    { diph: 'âu', approx: 'Like "oh" (as in "go")', example: 'câu', meaning: 'sentence' },
    { diph: 'ây', approx: 'Like "ay" (as in "day")', example: 'mấy', meaning: 'how many' },
    { diph: 'eo', approx: 'Like "eh-ao" (meow)', example: 'mèo', meaning: 'cat' },
    { diph: 'êu', approx: 'Like "ay-oo"', example: 'kêu', meaning: 'call' },
    { diph: 'oi', approx: 'Like "oy" (as in "boy")', example: 'hỏi', meaning: 'ask' },
    { diph: 'ôi', approx: 'Like "oh-ee"', example: 'tôi', meaning: 'I / me' },
    { diph: 'ơi', approx: 'Like "uh-ee"', example: 'mới', meaning: 'new' },
    { diph: 'ui', approx: 'Like "oo-ee" (long u)', example: 'tui', meaning: 'me (slang)' },
    { diph: 'uy', approx: 'Like "we" in English', example: 'tuy', meaning: 'although' },
    { diph: 'iu', approx: 'Like "ew" (as in "few")', example: 'chịu', meaning: 'tolerate' },
    { diph: 'ưu', approx: 'Like ư gliding into u', example: 'hưu', meaning: 'retired' },
];

const DEFAULT_TRIPHTHONGS = [
    { triph: 'iêu', components: 'iê + u', approx: '"ee-ay-oo" (like a fast "miao")', example: 'tiêu', meaning: 'pepper / spend' },
    { triph: 'yêu', components: 'yê + u', approx: '"ee-ay-oo" (same as iêu, but stands alone)', example: 'yêu', meaning: 'love' },
    { triph: 'oai', components: 'o + ai', approx: '"o-eye" (like "why" with a rounded start)', example: 'khoai', meaning: 'potato' },
    { triph: 'oay', components: 'o + ay', approx: '"o-eye" (shorter and sharper than oai)', example: 'xoay', meaning: 'rotate' },
    { triph: 'uôi', components: 'uô + i', approx: '"oo-oh-ee" (like "buoy")', example: 'chuối', meaning: 'banana' },
    { triph: 'ươi', components: 'ươ + i', approx: '"ư-uh-ee" (no English equivalent)', example: 'tươi', meaning: 'fresh' },
    { triph: 'ươu', components: 'ươ + u', approx: '"ư-uh-oo" (vaguely like "sewer")', example: 'rượu', meaning: 'wine / alcohol' },
    { triph: 'uây', components: 'u + ây', approx: '"w-ay" (like "sway")', example: 'khuấy', meaning: 'to stir' },
];

export const DEFAULT_VOWELS = { single: DEFAULT_SINGLE, centering: DEFAULT_CENTERING, gliding: DEFAULT_GLIDING, triphthongs: DEFAULT_TRIPHTHONGS };

// The vowel content to use — admin override (if edited) else the bundled default.
export const getVowels = () => {
    const ov = loadOverride(VOWELS_CMS_KEY, null);
    return ov ? { ...DEFAULT_VOWELS, ...ov } : DEFAULT_VOWELS;
};

// Which symbols each practice wrapper teaches — its subset is derived from the
// (possibly edited) full lists by this membership.
const BASIC_LETTERS = ['a', 'e', 'i / y', 'o', 'u'];
const SPECIAL_LETTERS = ['ă', 'â', 'ê', 'ô', 'ơ', 'ư'];
const GLIDING_1 = ['ai', 'ay', 'ao', 'au', 'oi', 'ôi', 'ơi', 'ui'];
const GLIDING_2 = ['âu', 'ây', 'eo', 'êu', 'uy', 'iu', 'ưu'];

export const getBasicVowels = () => getVowels().single.filter(v => BASIC_LETTERS.includes(v.letter));
export const getSpecialVowels = () => getVowels().single.filter(v => SPECIAL_LETTERS.includes(v.letter));
export const getCenteringDiphthongs = () => getVowels().centering;
export const getGlidingGroup1 = () => getVowels().gliding.filter(g => GLIDING_1.includes(g.diph));
export const getGlidingGroup2 = () => getVowels().gliding.filter(g => GLIDING_2.includes(g.diph));
