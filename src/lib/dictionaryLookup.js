// Lightweight dictionary lookup from the canonical content bundle.
// Used to enrich lesson word introductions with definitions.
// Contract: content/dictionary.json (see docs/CONTENT_SCHEMA.md).

let dictCache = null;

async function loadDict() {
    if (dictCache) return dictCache;
    try {
        const data = await import('../../content/dictionary.json');
        // Build a Map keyed by the Vietnamese headword for fast lookup
        const map = new Map();
        (data.default || data).forEach(entry => {
            map.set(entry.vi, entry);
        });
        dictCache = map;
        return map;
    } catch {
        dictCache = new Map();
        return dictCache;
    }
}

/**
 * Look up a Vietnamese word in the dictionary.
 * Returns { definition, tags } or null.
 */
export async function lookupWord(viText) {
    const dict = await loadDict();
    // Try exact match first
    let entry = dict.get(viText);
    // Try lowercase
    if (!entry) entry = dict.get(viText.toLowerCase());
    if (!entry) return null;

    // Extract a short English definition (first 80 chars)
    const enDef = entry.definitions?.en || '';
    const shortDef = enDef.length > 80 ? enDef.slice(0, 80).replace(/,\s*$/, '') + '...' : enDef;

    return {
        definition: shortDef,
        tags: entry.pos || [],
        examples: (entry.examples || []).slice(0, 2)
    };
}

/**
 * Look up multiple words at once. Returns a Map<viText, dictEntry>.
 */
export async function lookupWords(viTexts) {
    const dict = await loadDict();
    const results = new Map();
    for (const text of viTexts) {
        let entry = dict.get(text) || dict.get(text.toLowerCase());
        if (entry) {
            const enDef = entry.definitions?.en || '';
            const shortDef = enDef.length > 80 ? enDef.slice(0, 80).replace(/,\s*$/, '') + '...' : enDef;
            results.set(text, {
                definition: shortDef,
                tags: entry.pos || [],
            });
        }
    }
    return results;
}
