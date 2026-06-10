import { useUser } from '../context/UserContext';
import { normalizeLang } from './i18n';

// The app's current UI language (mirrors how useT resolves it: from the profile).
export function useLang() {
    const { userProfile } = useUser();
    return normalizeLang(userProfile?.nativeLang);
}

// Pick a per-language explanation for a sound. Sibling-field convention:
//   base (English, always present) + `${base}ZhS` (Pinyin) + `${base}ZhT` (Bopomofo).
// Falls back to English when a localized value is absent — so content can be
// migrated one entry at a time, and the admin editor just exposes the extra columns.
export function pickLocalized(obj, base, lang) {
    if (!obj) return '';
    if (lang === 'zh-t') return obj[`${base}ZhT`] || obj[base] || '';
    if (lang === 'zh-s') return obj[`${base}ZhS`] || obj[base] || '';
    return obj[base] || '';
}
