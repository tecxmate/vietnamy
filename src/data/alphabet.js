import { loadOverride } from '../lib/contentOverrides';

// The 29 letters of the Vietnamese alphabet: display form, Vietnamese letter
// name (how you say it), and a rough English sound hint. Shared by the Sounds
// tab reference and the Foundations Alphabet lesson.
export const ALPHABET = [
    { letter: 'A a', name: 'a', sound: 'ah' , soundZhS: '像 a（啊）', soundZhT: '像 ㄚ（啊）' },
    { letter: 'Ă ă', name: 'á', sound: 'a (short)' , soundZhS: '像 a 但短促', soundZhT: '像 ㄚ 但短促' },
    { letter: 'Â â', name: 'ớ', sound: 'uh' , soundZhS: '像轻短含糊的 e（呃）', soundZhT: '輕短含糊的 ㄜ（呃）' },
    { letter: 'B b', name: 'bê', sound: 'beh' },
    { letter: 'C c', name: 'xê', sound: 'seh' },
    { letter: 'D d', name: 'dê', sound: 'zeh/yeh' },
    { letter: 'Đ đ', name: 'đê', sound: 'deh' },
    { letter: 'E e', name: 'e', sound: 'eh' , soundZhS: '像 ê（耶里的 e）', soundZhT: '像 ㄝ（欸）' },
    { letter: 'Ê ê', name: 'ê', sound: 'ay' , soundZhS: '介于 ê 和 ei 之间', soundZhT: '像 ㄝ 偏緊（接近 ㄟ）' },
    { letter: 'G g', name: 'giê', sound: 'zheh' },
    { letter: 'H h', name: 'hát', sound: 'haht' },
    { letter: 'I i', name: 'i', sound: 'ee' , soundZhS: '像 yi（衣）', soundZhT: '像 ㄧ（衣）' },
    { letter: 'K k', name: 'ca', sound: 'kah' },
    { letter: 'L l', name: 'e-lờ', sound: 'el-uh' },
    { letter: 'M m', name: 'em-mờ', sound: 'em-uh' },
    { letter: 'N n', name: 'en-nờ', sound: 'en-uh' },
    { letter: 'O o', name: 'o', sound: 'aw' , soundZhS: '像 o（哦）', soundZhT: '像 ㄛ（哦）' },
    { letter: 'Ô ô', name: 'ô', sound: 'oh' , soundZhS: '像 o 收圆', soundZhT: '像 ㄛ 收圓' },
    { letter: 'Ơ ơ', name: 'ơ', sound: 'uh (long)' , soundZhS: '拉长含糊的 e', soundZhT: '拉長含糊的 ㄜ' },
    { letter: 'P p', name: 'pê', sound: 'peh' },
    { letter: 'Q q', name: 'quy', sound: 'kwee' },
    { letter: 'R r', name: 'e-rờ', sound: 'er-uh' },
    { letter: 'S s', name: 'ét-sì', sound: 'et-see' },
    { letter: 'T t', name: 'tê', sound: 'teh' },
    { letter: 'U u', name: 'u', sound: 'oo' , soundZhS: '像 wu（乌）', soundZhT: '像 ㄨ（烏）' },
    { letter: 'Ư ư', name: 'ư', sound: 'uh (unrounded)' , soundZhS: '像 si/zi 里的嗡嗡母音，嘴唇放平', soundZhT: 'ㄙ/ㄗ 後的母音，嘴唇放平' },
    { letter: 'V v', name: 'vê', sound: 'veh' },
    { letter: 'X x', name: 'ích-xì', sound: 'eek-see' },
    { letter: 'Y y', name: 'y dài', sound: 'ee' , soundZhS: '像 yi（衣）', soundZhT: '像 ㄧ（衣）' },
];

export const ALPHABET_CMS_KEY = 'vnme_cms_alphabet';

// The alphabet to use — admin override (if edited) else the bundled default.
export const getAlphabet = () => loadOverride(ALPHABET_CMS_KEY, ALPHABET);
