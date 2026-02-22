import defaultData from '../data/vn_grammar_bank_v2.json';

const STORAGE_KEY = 'vnme_grammar_bank';

export const getGrammarItems = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed.items && Array.isArray(parsed.items)) {
                return parsed.items;
            }
        } catch { /* fall through to default */ }
    }
    return defaultData.items;
};

export const saveGrammarItems = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
};

export const resetGrammarItems = () => {
    localStorage.removeItem(STORAGE_KEY);
};
