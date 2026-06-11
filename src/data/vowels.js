import { loadOverride } from '../lib/contentOverrides';

// Single source of truth for the vowel-practice content (was inline in
// VowelsPractice + the wrapper files). The admin Pronunciation editor can
// override the four lists; the practice wrappers derive their subsets from
// here, so editing once updates every lesson that uses them.
export const VOWELS_CMS_KEY = 'vnme_cms_vowels';

const DEFAULT_SINGLE = [
    { letter: 'a', name: 'Plain a', sound: '"ah" as in <b>father</b>', soundZhS: '像 <b>a</b>（啊），拉长', soundZhT: '像 <b>ㄚ</b>（啊），拉長', example: 'ba', exMeaning: 'father' },
    { letter: 'ă', name: 'Smile a', sound: 'Shorter "ah" as in <b>cut</b> or <b>shut</b>', soundZhS: '像 a，但更短促', soundZhT: '像 ㄚ，但更短促', example: 'ăn', exMeaning: 'eat' },
    { letter: 'â', name: 'Hat a', sound: '"u" as in <b>but</b> (very short)', soundZhS: '国语没有；像轻短含糊的 e（呃）', soundZhT: '國語沒有；輕短含糊的 <b>ㄜ</b>（呃）', example: 'cần', exMeaning: 'need' },
    { letter: 'e', name: 'Plain e', sound: '"e" as in <b>get</b> or <b>set</b>', soundZhS: '像 <b>ê</b>（耶 ye 里的 e）', soundZhT: '像 <b>ㄝ</b>（欸）', example: 'xe', exMeaning: 'vehicle' },
    { letter: 'ê', name: 'Hat e', sound: '"ay" as in <b>say</b> or <b>day</b>', soundZhS: '介于 ê 和 ei 之间，嘴角往两侧、不滑动', soundZhT: '像 ㄝ 但更緊更高（接近 ㄟ 去掉尾音）', example: 'bê', exMeaning: 'calf' },
    { letter: 'i / y', name: 'i / y', sound: '"ee" as in <b>see</b>', soundZhS: '像 <b>yi</b>（衣、一）', soundZhT: '像 <b>ㄧ</b>（衣）', example: 'bi', exMeaning: 'marble' },
    { letter: 'o', name: 'Plain o', sound: '"o" as in <b>hot</b>', soundZhS: '像 <b>o</b>（哦），嘴张大', soundZhT: '像 <b>ㄛ</b>（哦），嘴張大', example: 'bò', exMeaning: 'cow' },
    { letter: 'ô', name: 'Hat o', sound: '"o" as in <b>go</b>', soundZhS: '像 o 收圆（播 bo 的 o），别滑成 ou', soundZhT: '像 ㄛ 收圓（接近 ㄡ 去掉尾音）', example: 'cô', exMeaning: 'miss' },
    { letter: 'ơ', name: 'Hook o', sound: '"u" as in <b>huh</b> or <b>fur</b> (but longer)', soundZhS: '国语没有；â 的长音，拉长又含糊的 e', soundZhT: '國語沒有；拉長的 <b>ㄜ</b>', example: 'thơ', exMeaning: 'poem' },
    { letter: 'u', name: 'Plain u', sound: '"oo" as in <b>boot</b> or <b>true</b>', soundZhS: '像 <b>wu</b>（乌、五）', soundZhT: '像 <b>ㄨ</b>（烏）', example: 'thu', exMeaning: 'autumn' },
    { letter: 'ư', name: 'Hook u', sound: 'Like "ee" but with flat, unrounded lips', soundZhS: '国语没有；像 si/zi/ri（思、资、日）里那个嗡嗡母音，嘴唇放平不噘', soundZhT: '國語沒有；<b>ㄙ/ㄗ/ㄖ</b> 後面那個母音，嘴唇放平不噘', example: 'thư', exMeaning: 'letter' },
];

const DEFAULT_CENTERING = [
    { group: 'i-ê', open: 'ia', closed: 'iê / yê', approx: 'Like <b>ee-uh</b> (e.g., beer)', approxZhS: 'i 滑向含糊的 ə（ee-uh）', approxZhT: 'ㄧ 滑向含糊的 ㄜ', examples: [{ word: 'mía', meaning: 'cane', type: 'open' }, { word: 'tiền', meaning: 'money', type: 'closed' }, { word: 'yêu', meaning: 'love', type: 'closed' }] },
    { group: 'u-ô', open: 'ua', closed: 'uô', approx: 'Like <b>oo-uh</b> (e.g., tour)', approxZhS: 'u 滑向含糊的 ə（oo-uh）', approxZhT: 'ㄨ 滑向含糊的 ㄜ', examples: [{ word: 'mua', meaning: 'buy', type: 'open' }, { word: 'muộn', meaning: 'late', type: 'closed' }] },
    { group: 'ư-ơ', open: 'ưa', closed: 'ươ', approx: 'Like <b>ư</b> (unrounded "ee") gliding into a neutral <b>uh</b>', approxZhS: '思的母音滑向含糊的 ə（国语没有）', approxZhT: 'ㄙ後母音滑向含糊的 ㄜ（國語沒有）', examples: [{ word: 'mưa', meaning: 'rain', type: 'open' }, { word: 'mượn', meaning: 'borrow', type: 'closed' }] },
];

const DEFAULT_GLIDING = [
    { diph: 'ai', approx: 'Like "I" or "eye" (long a)', approxZhS: '像 ài（爱、唉）', approxZhT: '像 ㄞ（愛）', example: 'tai', meaning: 'ear' },
    { diph: 'ay', approx: 'Like "I" but shorter (short ă)', approxZhS: '像 ai 但更短', approxZhT: '像 ㄞ 但更短', example: 'tay', meaning: 'hand' },
    { diph: 'ao', approx: 'Like "now" or "how"', approxZhS: '像 ào（奥）', approxZhT: '像 ㄠ（奧）', example: 'chào', meaning: 'hello' },
    { diph: 'au', approx: 'Like "owl" but much shorter', approxZhS: '像 ao 但更短促', approxZhT: '像 ㄠ 但更短促', example: 'sau', meaning: 'after' },
    { diph: 'âu', approx: 'Like "oh" (as in "go")', approxZhS: '像 ōu（欧）', approxZhT: '像 ㄡ（歐）', example: 'câu', meaning: 'sentence' },
    { diph: 'ây', approx: 'Like "ay" (as in "day")', approxZhS: '像 ei（欸）', approxZhT: '像 ㄟ（欸）', example: 'mấy', meaning: 'how many' },
    { diph: 'eo', approx: 'Like "eh-ao" (meow)', approxZhS: 'ê 滑向 ao（ㄝ→ㄠ）', approxZhT: 'ㄝ 滑向 ㄠ', example: 'mèo', meaning: 'cat' },
    { diph: 'êu', approx: 'Like "ay-oo"', approxZhS: 'ê 滑向 u（ㄝ→ㄨ）', approxZhT: 'ㄝ 滑向 ㄨ', example: 'kêu', meaning: 'call' },
    { diph: 'oi', approx: 'Like "oy" (as in "boy")', approxZhS: 'o 滑向 i（ㄛ→ㄧ）', approxZhT: 'ㄛ 滑向 ㄧ', example: 'hỏi', meaning: 'ask' },
    { diph: 'ôi', approx: 'Like "oh-ee"', approxZhS: 'ô 收圆滑向 i', approxZhT: 'ㄛ 收圓滑向 ㄧ', example: 'tôi', meaning: 'I / me' },
    { diph: 'ơi', approx: 'Like "uh-ee"', approxZhS: '含糊的 ơ 滑向 i（国语没有）', approxZhT: '含糊的 ㄜ 滑向 ㄧ（國語沒有）', example: 'mới', meaning: 'new' },
    { diph: 'ui', approx: 'Like "oo-ee" (long u)', approxZhS: 'u 滑向 i，像 wéi 的尾', approxZhT: '像 ㄨㄟ（威）', example: 'tui', meaning: 'me (slang)' },
    { diph: 'uy', approx: 'Like "we" in English', approxZhS: '像 wei（威）', approxZhT: '像 ㄨㄟ（威）', example: 'tuy', meaning: 'although' },
    { diph: 'iu', approx: 'Like "ew" (as in "few")', approxZhS: 'i 滑向 u（ㄧ→ㄨ）', approxZhT: 'ㄧ 滑向 ㄨ', example: 'chịu', meaning: 'tolerate' },
    { diph: 'ưu', approx: 'Like ư gliding into u', approxZhS: '思的母音滑向 u（国语没有）', approxZhT: 'ㄙ/ㄗ 後母音滑向 ㄨ（國語沒有）', example: 'hưu', meaning: 'retired' },
];

const DEFAULT_TRIPHTHONGS = [
    { triph: 'iêu', components: 'iê + u', approx: '"ee-ay-oo" (like a fast "miao")', approxZhS: 'i-ê-u 连读（ㄧㄝㄨ）', approxZhT: 'ㄧㄝㄨ 連讀', example: 'tiêu', meaning: 'pepper / spend' },
    { triph: 'yêu', components: 'yê + u', approx: '"ee-ay-oo" (same as iêu, but stands alone)', approxZhS: '同 iêu（ㄧㄝㄨ）', approxZhT: '同 iêu（ㄧㄝㄨ）', example: 'yêu', meaning: 'love' },
    { triph: 'oai', components: 'o + ai', approx: '"o-eye" (like "why" with a rounded start)', approxZhS: 'o-a-i（ㄛㄚㄧ），像歪加圆唇', approxZhT: 'ㄛㄚㄧ（像歪加圓唇）', example: 'khoai', meaning: 'potato' },
    { triph: 'oay', components: 'o + ay', approx: '"o-eye" (shorter and sharper than oai)', approxZhS: '像 oai 但更短', approxZhT: '像 oai 但更短', example: 'xoay', meaning: 'rotate' },
    { triph: 'uôi', components: 'uô + i', approx: '"oo-oh-ee" (like "buoy")', approxZhS: 'u-ô-i（ㄨㄛㄧ），像 buoy', approxZhT: 'ㄨㄛㄧ（像 buoy）', example: 'chuối', meaning: 'banana' },
    { triph: 'ươi', components: 'ươ + i', approx: '"ư-uh-ee" (no English equivalent)', approxZhS: 'ư-ơ-i 连读（国语没有）', approxZhT: 'ㄙ後母音-ㄜ-ㄧ（國語沒有）', example: 'tươi', meaning: 'fresh' },
    { triph: 'ươu', components: 'ươ + u', approx: '"ư-uh-oo" (vaguely like "sewer")', approxZhS: 'ư-ơ-u 连读（国语没有）', approxZhT: 'ㄙ後母音-ㄜ-ㄨ（國語沒有）', example: 'rượu', meaning: 'wine / alcohol' },
    { triph: 'uây', components: 'u + ây', approx: '"w-ay" (like "sway")', approxZhS: 'u-â-y（ㄨㄟ），像 sway', approxZhT: 'ㄨㄟ（像 sway）', example: 'khuấy', meaning: 'to stir' },
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
