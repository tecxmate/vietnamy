import { loadOverride } from '../lib/contentOverrides';

// The 29 letters of the Vietnamese alphabet: display form, Vietnamese letter
// name (how you say it), and a rough English sound hint. Shared by the Sounds
// tab reference and the Foundations Alphabet lesson.
export const ALPHABET = [
    { letter: 'A a', name: 'a', sound: 'ah' , soundZhS: '像 a（啊）', soundZhT: '像 ㄚ（啊）' },
    { letter: 'Ă ă', name: 'á', sound: 'a (short)' , soundZhS: '像 a 但短促', soundZhT: '像 ㄚ 但短促' },
    { letter: 'Â â', name: 'ớ', sound: 'uh' , soundZhS: '像轻短含糊的 e（呃）', soundZhT: '輕短含糊的 ㄜ（呃）' },
    { letter: 'B b', name: 'bê', sound: 'beh' , soundZhS: '像 b（玻、爸）', soundZhT: '像 ㄅ（玻）' },
    { letter: 'C c', name: 'xê', sound: 'seh' , soundZhS: '像 g（哥），不送气的 k', soundZhT: '像 ㄍ（哥），不送氣' },
    { letter: 'D d', name: 'dê', sound: 'zeh/yeh' , soundZhS: '北部像英文 z（zoo）；国语没有', soundZhT: '北部像英文 z（zoo）；國語沒有' },
    { letter: 'Đ đ', name: 'đê', sound: 'deh' , soundZhS: '像 d（大）', soundZhT: '像 ㄉ（大）' },
    { letter: 'E e', name: 'e', sound: 'eh' , soundZhS: '像 ê（耶里的 e）', soundZhT: '像 ㄝ（欸）' },
    { letter: 'Ê ê', name: 'ê', sound: 'ay' , soundZhS: '介于 ê 和 ei 之间', soundZhT: '像 ㄝ 偏緊（接近 ㄟ）' },
    { letter: 'G g', name: 'giê', sound: 'zheh' , soundZhS: '国语没有；像浊的 g，喉咙振动', soundZhT: '國語沒有；像濁的 ㄍ，喉嚨振動' },
    { letter: 'H h', name: 'hát', sound: 'haht' , soundZhS: '像 h（哈）', soundZhT: '像 ㄏ（哈）' },
    { letter: 'I i', name: 'i', sound: 'ee' , soundZhS: '像 yi（衣）', soundZhT: '像 ㄧ（衣）' },
    { letter: 'K k', name: 'ca', sound: 'kah' , soundZhS: '像 g（哥），不送气', soundZhT: '像 ㄍ（哥），不送氣' },
    { letter: 'L l', name: 'e-lờ', sound: 'el-uh' , soundZhS: '像 l（拉）', soundZhT: '像 ㄌ（拉）' },
    { letter: 'M m', name: 'em-mờ', sound: 'em-uh' , soundZhS: '像 m（妈）', soundZhT: '像 ㄇ（媽）' },
    { letter: 'N n', name: 'en-nờ', sound: 'en-uh' , soundZhS: '像 n（拿）', soundZhT: '像 ㄋ（拿）' },
    { letter: 'O o', name: 'o', sound: 'aw' , soundZhS: '像 o（哦）', soundZhT: '像 ㄛ（哦）' },
    { letter: 'Ô ô', name: 'ô', sound: 'oh' , soundZhS: '像 o 收圆', soundZhT: '像 ㄛ 收圓' },
    { letter: 'Ơ ơ', name: 'ơ', sound: 'uh (long)' , soundZhS: '拉长含糊的 e', soundZhT: '拉長含糊的 ㄜ' },
    { letter: 'P p', name: 'pê', sound: 'peh' , soundZhS: '像 b（玻），不送气；多在词尾', soundZhT: '像 ㄅ（玻），不送氣' },
    { letter: 'Q q', name: 'quy', sound: 'kwee' , soundZhS: '像 gu（搭配 u）', soundZhT: '像 ㄍㄨ' },
    { letter: 'R r', name: 'e-rờ', sound: 'er-uh' , soundZhS: '北部像 r（日）或英文 z', soundZhT: '北部像 ㄖ（日）或英文 z' },
    { letter: 'S s', name: 'ét-sì', sound: 'et-see' , soundZhS: '北部像 s（撒）；南部像 sh', soundZhT: '北部像 ㄙ（撒）；南部像 ㄕ' },
    { letter: 'T t', name: 'tê', sound: 'teh' , soundZhS: '像 d（大），不送气', soundZhT: '像 ㄉ（大），不送氣' },
    { letter: 'U u', name: 'u', sound: 'oo' , soundZhS: '像 wu（乌）', soundZhT: '像 ㄨ（烏）' },
    { letter: 'Ư ư', name: 'ư', sound: 'uh (unrounded)' , soundZhS: '像 si/zi 里的嗡嗡母音，嘴唇放平', soundZhT: 'ㄙ/ㄗ 後的母音，嘴唇放平' },
    { letter: 'V v', name: 'vê', sound: 'veh' , soundZhS: '国语没有；像英文 v（van）', soundZhT: '國語沒有；像英文 v（van）' },
    { letter: 'X x', name: 'ích-xì', sound: 'eek-see' , soundZhS: '像 s（撒）', soundZhT: '像 ㄙ（撒）' },
    { letter: 'Y y', name: 'y dài', sound: 'ee' , soundZhS: '像 yi（衣）', soundZhT: '像 ㄧ（衣）' },
];

export const ALPHABET_CMS_KEY = 'vnme_cms_alphabet';

// The alphabet to use — admin override (if edited) else the bundled default.
export const getAlphabet = () => loadOverride(ALPHABET_CMS_KEY, ALPHABET);
