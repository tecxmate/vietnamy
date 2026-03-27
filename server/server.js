import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { Converter } from 'opencc-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Simplified ↔ Traditional Chinese converters
const s2t = Converter({ from: 'cn', to: 'tw' });

// ---------------------------------------------------------------------------
// Language DB map — add new languages here
// ---------------------------------------------------------------------------
const ALL_LANGS = {
    en: { label: 'English', flag: '🇬🇧', file: 'vn_en_dictionary.db' },
    zh: { label: 'Chinese', flag: '🇨🇳', file: 'vn_zh_dictionary.db' },
    ja: { label: 'Japanese', flag: '🇯🇵', file: 'vn_ja_dictionary.db' },
    fr: { label: 'French', flag: '🇫🇷', file: 'vn_fr_dictionary.db' },
    de: { label: 'German', flag: '🇩🇪', file: 'vn_de_dictionary.db' },
    ru: { label: 'Russian', flag: '🇷🇺', file: 'vn_ru_dictionary.db' },
    no: { label: 'Norwegian', flag: '🇳🇴', file: 'vn_no_dictionary.db' },
    es: { label: 'Spanish', flag: '🇪🇸', file: 'vn_es_dictionary.db' },
    it: { label: 'Italian', flag: '🇮🇹', file: 'vn_it_dictionary.db' },
};

// In production only load EN + ZH; locally load all available dicts
const PROD_LANGS = ['en', 'zh'];
const LANG_META = process.env.NODE_ENV === 'production'
    ? Object.fromEntries(Object.entries(ALL_LANGS).filter(([k]) => PROD_LANGS.includes(k)))
    : ALL_LANGS;

// Open DBs that exist on disk
const dbs = {};
const DB_PATH_EN = join(__dirname, 'databases', 'vn_en_dictionary.db');
const DB_PATH_ZH = join(__dirname, 'databases', 'vn_zh_dictionary.db');

// Split EN dictionaries: high-priority (top 40K words) + low-priority (rest)
const DB_PATH_EN_HIGH = join(__dirname, 'databases', 'vn_en_dictionary_high.db');
const DB_PATH_EN_LOW = join(__dirname, 'databases', 'vn_en_dictionary_low.db');
const hasSplitDbs = existsSync(DB_PATH_EN_HIGH) && existsSync(DB_PATH_EN_LOW);

// Helper: open a SQLite DB with reduced memory footprint
function openDB(path) {
    const db = new Database(path, { fileMustExist: true, readonly: true });
    db.pragma('cache_size = -2000');   // 2MB page cache (default ~2MB per table, can grow)
    db.pragma('mmap_size = 0');        // disable memory-mapped I/O to reduce RSS
    return db;
}

for (const [lang, meta] of Object.entries(LANG_META)) {
    // For EN, prefer split DBs if available
    if (lang === 'en' && hasSplitDbs) {
        continue; // handled separately below
    }
    const p = join(__dirname, 'databases', meta.file);
    if (existsSync(p)) {
        dbs[lang] = openDB(p);
    } else {
        console.warn(`[WARN] DB not found for lang '${lang}': ${meta.file}`);
    }
}

// Set up EN databases (split or single)
let dbEnHigh, dbEnLow;
if (hasSplitDbs) {
    dbEnHigh = openDB(DB_PATH_EN_HIGH);
    dbEnLow = openDB(DB_PATH_EN_LOW);
    dbs['en'] = dbEnHigh; // primary EN DB for word index / suggest
    console.log('Using split EN dictionaries (high + low priority)');
} else if (existsSync(DB_PATH_EN)) {
    dbs['en'] = openDB(DB_PATH_EN);
    dbEnHigh = dbs['en'];
    dbEnLow = null;
    console.log('Using single EN dictionary');
}

// Convenience aliases used throughout the existing code
const dbEn = dbs['en'];
const dbZh = dbs['zh'];

// ---------------------------------------------------------------------------
// Normalize Vietnamese text to ASCII (strip diacritics)
// ---------------------------------------------------------------------------
function normalizeVi(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd');
}

// ---------------------------------------------------------------------------
// Build in-memory normalized→[actualWord] index at startup
// ---------------------------------------------------------------------------
function buildWordIndex(db, hasMetrics) {
    let rows;
    if (hasMetrics) {
        rows = db.prepare(`
            SELECT w.word, wm.subt_freq 
            FROM words w 
            LEFT JOIN word_metrics wm ON w.id = wm.word_id
            WHERE EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
        `).all();
    } else {
        rows = db.prepare(`
            SELECT word FROM words w
            WHERE EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
        `).all();
    }

    const index = new Map(); // normalizedForm → Set of actual words
    const freqMap = new Map(); // word -> subt_freq

    for (const row of rows) {
        const word = row.word;
        const freq = row.subt_freq || 0;
        const norm = normalizeVi(word);

        if (!index.has(norm)) index.set(norm, []);
        index.get(norm).push(word);

        if (freq > 0) {
            freqMap.set(word, Math.max(freq, freqMap.get(word) || 0));
        }
    }
    return { index, freqMap };
}

console.log('Building word indexes...');
const dataEnHigh = buildWordIndex(dbEnHigh, true);
const dataEnLow = dbEnLow ? buildWordIndex(dbEnLow, true) : { index: new Map(), freqMap: new Map() };
// Merge high + low EN indexes
const indexEn = new Map([...dataEnLow.index, ...dataEnHigh.index]); // high overrides low
const dataZh = buildWordIndex(dbZh, false);
const indexZh = dataZh.index;
const combinedFreqMap = new Map([...dataZh.freqMap, ...dataEnLow.freqMap, ...dataEnHigh.freqMap]);
console.log(`Indexes ready — EN: ${indexEn.size} (high: ${dataEnHigh.index.size}, low: ${dataEnLow.index.size}), ZH: ${indexZh.size} normalized keys`);

// Build indexes for all additional languages
const langIndexes = { en: indexEn, zh: indexZh };
const langSortedKeys = {};
for (const lang of Object.keys(dbs)) {
    if (lang === 'en' || lang === 'zh') continue;
    const data = buildWordIndex(dbs[lang], false);
    langIndexes[lang] = data.index;
    langSortedKeys[lang] = [...data.index.keys()].sort();
    console.log(`Index ready — ${lang.toUpperCase()}: ${data.index.size} normalized keys`);
}

// ---------------------------------------------------------------------------
// Build frequency rank index: word_id → rank (1 = most frequent)
// ---------------------------------------------------------------------------
const freqRankMap = new Map(); // word_id → rank
const MAX_DISP = 13287; // max subt_disp value in corpus

(() => {
    // Collect freq data from both high and low DBs
    const allRows = [];
    for (const db of [dbEnHigh, dbEnLow].filter(Boolean)) {
        const rows = db.prepare(`
            SELECT word_id, subt_freq FROM word_metrics
            WHERE subt_freq IS NOT NULL
        `).all();
        allRows.push(...rows);
    }
    // Sort combined by frequency descending and assign ranks
    allRows.sort((a, b) => b.subt_freq - a.subt_freq);
    allRows.forEach((row, i) => {
        if (!freqRankMap.has(row.word_id)) {
            freqRankMap.set(row.word_id, i + 1);
        }
    });
    console.log(`Frequency rank index built — ${freqRankMap.size} entries`);
})();

function getFreqTier(rank) {
    if (!rank) return null;
    if (rank <= 500) return 'Top 500';
    if (rank <= 1000) return 'Top 1K';
    if (rank <= 3000) return 'Top 3K';
    if (rank <= 10000) return 'Top 10K';
    return 'Rare';
}

// ---------------------------------------------------------------------------
// Prepared statements for compound word decomposition
// ---------------------------------------------------------------------------
// Prepared statements for compound decomposition — check high DB first, then low
const syllableMetricsSql = `
    SELECT w.id as word_id, wm.subt_freq
    FROM words w
    LEFT JOIN word_metrics wm ON w.id = wm.word_id
    WHERE w.word = ? COLLATE NOCASE
    LIMIT 1
`;
const syllableMeaningSql = `
    SELECT m.meaning_text
    FROM words w
    JOIN meanings m ON w.id = m.word_id
    WHERE w.word = ? COLLATE NOCASE
    LIMIT 1
`;

const stmtSyllableMetricsHigh = dbEnHigh.prepare(syllableMetricsSql);
const stmtSyllableMetricsLow = dbEnLow ? dbEnLow.prepare(syllableMetricsSql) : null;
const stmtSyllableMeaningHigh = dbEnHigh.prepare(syllableMeaningSql);
const stmtSyllableMeaningLow = dbEnLow ? dbEnLow.prepare(syllableMeaningSql) : null;

function getSyllableMetrics(word) {
    return stmtSyllableMetricsHigh.get(word) || stmtSyllableMetricsLow?.get(word) || null;
}
function getSyllableMeaning(word) {
    return stmtSyllableMeaningHigh.get(word) || stmtSyllableMeaningLow?.get(word) || null;
}

// ---------------------------------------------------------------------------
// Prepared statement for HanViet syllable lookup (compound decomposition)
// ---------------------------------------------------------------------------
const stmtHanVietSyllable = dbZh.prepare(`
    SELECT m.meaning_text, m.part_of_speech
    FROM words w
    JOIN meanings m ON w.id = m.word_id
    JOIN sources s ON m.source_id = s.id
    WHERE s.name = 'HanViet' AND w.word = ? COLLATE NOCASE
`);

// ---------------------------------------------------------------------------
// Build sorted normalized keys for binary-search prefix matching
// ---------------------------------------------------------------------------
const sortedNormKeysEn = [...indexEn.keys()].sort();
const sortedNormKeysZh = [...indexZh.keys()].sort();

// Populate langSortedKeys for en/zh as well (used in unified suggest)
langSortedKeys['en'] = sortedNormKeysEn;
langSortedKeys['zh'] = sortedNormKeysZh;

function prefixSearch(sortedKeys, prefix, limit) {
    // Binary search for first key >= prefix
    let lo = 0, hi = sortedKeys.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (sortedKeys[mid] < prefix) lo = mid + 1;
        else hi = mid;
    }
    const results = [];
    for (let i = lo; i < sortedKeys.length && results.length < limit; i++) {
        if (sortedKeys[i].startsWith(prefix)) results.push(sortedKeys[i]);
        else break;
    }
    return results;
}

// ---------------------------------------------------------------------------
// Helper: find diacriticized variants for a single normalized syllable
// Returns the actual Vietnamese words sorted by frequency (highest first)
// ---------------------------------------------------------------------------
function findDiacriticVariants(normSyll, limit = 5, extraIndexes = []) {
    const variants = [];
    for (const index of [indexEn, indexZh, ...extraIndexes]) {
        const words = index.get(normSyll);
        if (words) {
            for (const w of words) {
                if (!w.includes(' ')) variants.push(w); // single-syllable only
            }
        }
    }
    variants.sort((a, b) => (combinedFreqMap.get(b) || 0) - (combinedFreqMap.get(a) || 0));
    return [...new Set(variants)].slice(0, limit);
}

// ---------------------------------------------------------------------------
// /api/suggest?q=khong   → returns up to 8 fuzzy-matched words
// ---------------------------------------------------------------------------
app.get('/api/suggest', (req, res) => {
    const query = (req.query.q || '').trim();
    if (query.length < 2) return res.json([]);

    const lang = req.query.lang || 'en';

    const normQuery = normalizeVi(query);
    const queryLower = query.toLowerCase();
    const querySylls = normQuery.split(/\s+/);
    const isMultiSyll = querySylls.length >= 2;

    // Determine which indexes to search — always include EN/ZH for VI headwords,
    // and add the requested lang index for foreign-headword dicts
    const indexPairs = [
        [indexEn, sortedNormKeysEn],
        [indexZh, sortedNormKeysZh],
    ];
    if (lang && langIndexes[lang] && lang !== 'en' && lang !== 'zh') {
        indexPairs.push([langIndexes[lang], langSortedKeys[lang]]);
    }

    // Tier 1: Exact normalized matches (e.g. "khong" → "không", "khống")
    const exactMatches = [];
    // Tier 2: Compound recombinations (e.g. "xin chao" → "xin chào", "xín chào")
    const compoundMatches = [];
    // Tier 3: Prefix matches (e.g. "xin" → "xin lỗi", "xin phép")
    const prefixMatches = [];
    // Tier 4: Per-syllable matches for multi-word queries (e.g. "xin chao" → "xin", "chào")
    const syllableMatches = [];
    // Tier 5: Contains matches
    const containsMatches = [];

    for (const [index, sortedKeys] of indexPairs) {
        // Fast prefix search via binary search on sorted keys
        const prefixKeys = prefixSearch(sortedKeys, normQuery, 80);

        for (const norm of prefixKeys) {
            const words = index.get(norm);
            if (!words) continue;
            for (const w of words) {
                if (w.toLowerCase() === queryLower) continue;
                if (norm === normQuery) {
                    exactMatches.push(w);
                } else {
                    prefixMatches.push(w);
                }
            }
        }

        // Contains matching for short queries when we don't have enough results
        if (normQuery.length >= 3 && !isMultiSyll && exactMatches.length + prefixMatches.length < 8) {
            for (const norm of sortedKeys) {
                if (norm.includes(normQuery) && !norm.startsWith(normQuery)) {
                    const words = index.get(norm);
                    if (!words) continue;
                    for (const w of words) {
                        if (w.toLowerCase() === queryLower) continue;
                        containsMatches.push(w);
                    }
                    if (containsMatches.length >= 30) break;
                }
            }
        }
    }

    // Multi-syllable compound recombination:
    // e.g. "xin chao" → find diacriticized variants for each syllable,
    // then generate compound combinations and check if they exist in the index
    if (isMultiSyll && exactMatches.length === 0) {
        const syllVariants = querySylls.map(s => findDiacriticVariants(s, 4));

        // Generate all combinations (capped to avoid explosion)
        const combos = [];
        const generate = (idx, current) => {
            if (combos.length >= 20) return;
            if (idx === syllVariants.length) {
                combos.push(current.join(' '));
                return;
            }
            // Also try the original syllable as-is
            const candidates = syllVariants[idx].length > 0 ? syllVariants[idx] : [querySylls[idx]];
            for (const variant of candidates) {
                generate(idx + 1, [...current, variant]);
            }
        };
        generate(0, []);

        // Check which combos exist as dictionary words (have meanings)
        for (const combo of combos) {
            if (combo.toLowerCase() === queryLower) continue;
            const normCombo = normalizeVi(combo);
            for (const index of [indexEn, indexZh]) {
                const words = index.get(normCombo);
                if (words) {
                    for (const w of words) compoundMatches.push(w);
                }
            }
        }

        // Add individual syllable matches so user can explore each part
        for (let i = 0; i < querySylls.length; i++) {
            const variants = findDiacriticVariants(querySylls[i], 3);
            for (const v of variants) {
                syllableMatches.push(v);
            }
        }
    }

    // Sort each tier by: single-word first → frequency desc → shorter first
    const sortFn = (a, b) => {
        const aMulti = a.includes(' ') ? 1 : 0;
        const bMulti = b.includes(' ') ? 1 : 0;
        if (aMulti !== bMulti) return aMulti - bMulti;

        const freqA = combinedFreqMap.get(a) || 0;
        const freqB = combinedFreqMap.get(b) || 0;
        if (freqA !== freqB) return freqB - freqA;

        return a.length - b.length;
    };

    exactMatches.sort(sortFn);
    compoundMatches.sort(sortFn);
    prefixMatches.sort(sortFn);
    syllableMatches.sort(sortFn);
    containsMatches.sort(sortFn);

    // Merge tiers preserving priority
    const merged = [...exactMatches, ...compoundMatches, ...prefixMatches, ...syllableMatches, ...containsMatches];

    // Deduplicate and take top 8
    const seen = new Set();
    const result = [];
    for (const w of merged) {
        if (!seen.has(w)) {
            seen.add(w);
            result.push(w);
            if (result.length >= 8) break;
        }
    }

    res.json(result);
});

// ---------------------------------------------------------------------------
// /api/languages  → list of available language pairs
// ---------------------------------------------------------------------------
app.get('/api/languages', (req, res) => {
    const result = [];
    for (const [lang, meta] of Object.entries(LANG_META)) {
        if (!dbs[lang]) continue;
        const wc = dbs[lang].prepare('SELECT COUNT(*) as c FROM words').get().c;
        result.push({ lang, label: meta.label, flag: meta.flag, wordCount: wc, available: true });
    }
    res.json(result);
});

// ---------------------------------------------------------------------------
// /api/search?q=word&lang=en|zh|ja|fr|de|ru|no
// ---------------------------------------------------------------------------
app.get('/api/search', (req, res) => {
    const rawQuery = req.query.q;
    const lang = req.query.lang || 'en';
    if (!rawQuery) return res.json([]);
    const query = rawQuery.toLowerCase();

    const db = dbs[lang] || dbEn;
    const syllables = query.trim().split(/\s+/);

    const isCJK = ch => {
        const cp = ch.codePointAt(0);
        return (cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3400 && cp <= 0x4DBF) ||
            (cp >= 0x20000 && cp <= 0x2A6DF) || (cp >= 0xF900 && cp <= 0xFAFF);
    };
    const queryIsCJK = query.trim().length > 0 && [...query.replace(/\s+/g, '')].every(isCJK);

    try {
        const enSql = `
            SELECT
                w.word, w.id as word_id, s.name as source_name, m.id as meaning_id, m.part_of_speech, m.meaning_text,
                wm.subt_freq, wm.mi, wm.subt_disp, p.ipa
            FROM words w
            LEFT JOIN word_metrics wm ON w.id = wm.word_id
            LEFT JOIN pronunciations p ON w.id = p.word_id
            JOIN meanings m ON w.id = m.word_id
            JOIN sources s ON m.source_id = s.id
            WHERE w.word = ? COLLATE NOCASE
        `;
        const otherSql = `
            SELECT w.word, s.name as source_name, m.id as meaning_id, m.part_of_speech, m.meaning_text
            FROM words w
            JOIN meanings m ON w.id = m.word_id
            JOIN sources s ON m.source_id = s.id
            WHERE w.word = ? COLLATE NOCASE
        `;

        let results;
        let searchDb = db; // the DB that produced the results (for example lookups)
        if (lang === 'en') {
            // Check high-priority DB first, fall back to low
            results = dbEnHigh.prepare(enSql).all(query);
            searchDb = dbEnHigh;
            if (results.length === 0 && dbEnLow) {
                results = dbEnLow.prepare(enSql).all(query);
                searchDb = dbEnLow;
            }
        } else {
            results = db.prepare(otherSql).all(query);
        }

        if (results.length === 0 && !queryIsCJK) {
            return res.json({ word: query, results: [] });
        }

        const grouped = {};
        let wordId = null;
        for (const r of results) {
            if (!wordId && r.word_id) wordId = r.word_id;
            if (!grouped[r.source_name]) {
                const rank = r.word_id ? freqRankMap.get(r.word_id) : null;
                grouped[r.source_name] = {
                    source_name: r.source_name,
                    meanings: [],
                    metrics: {
                        subt_freq: r.subt_freq,
                        mi: r.mi,
                        ipa: r.ipa,
                        subt_disp: r.subt_disp,
                        freq_rank: rank || null,
                        freq_tier: getFreqTier(rank),
                        disp_pct: r.subt_disp != null ? Math.round((r.subt_disp / MAX_DISP) * 100) : null,
                    }
                };
            }

            // Only fetch examples for DBs that have the examples table (EN, ZH)
            let examples = [];
            if (lang === 'en' || lang === 'zh') {
                try {
                    const exDb = lang === 'en' ? searchDb : db;
                    const exStmt = exDb.prepare(
                        'SELECT vietnamese_text, english_text FROM examples WHERE meaning_id = ?'
                    );
                    examples = exStmt.all(r.meaning_id);
                } catch (_) { /* examples table missing */ }
            }

            grouped[r.source_name].meanings.push({
                part_of_speech: r.part_of_speech,
                meaning_text: r.meaning_text,
                examples,
            });
        }

        // Compound word decomposition: break multi-syllable words into components
        let components = null;
        if (syllables.length >= 2 && lang === 'en') {
            components = syllables.map(syll => {
                const metricsRow = getSyllableMetrics(syll);
                const meaningRow = getSyllableMeaning(syll);
                const syllRank = metricsRow?.word_id ? freqRankMap.get(metricsRow.word_id) : null;
                return {
                    syllable: syll,
                    freq: metricsRow?.subt_freq || null,
                    freq_tier: getFreqTier(syllRank),
                    meaning: meaningRow?.meaning_text || null,
                };
            });
        }

        // HanViet compound decomposition: for ZH searches with multi-syllable words,
        // look up each syllable's HanViet entries (Chinese character + pinyin)
        let hanvietComponents = null;

        if (lang === 'zh' || queryIsCJK) {
            const activeDbZh = dbs['zh'] || dbEn;
            if (queryIsCJK) {
                // If the user's query is purely Chinese characters, break it down character by character
                const cjkChars = [...query.replace(/\s+/g, '')];
                hanvietComponents = cjkChars.map(ch => {
                    const tradCh = s2t(ch); // try both simplified and traditional
                    // Query for this specific character in the definition text
                    const fetchHv = (c) => activeDbZh.prepare(`
                        SELECT w.word as hanviet, m.meaning_text, m.part_of_speech
                        FROM meanings m
                        JOIN words w ON m.word_id = w.id
                        JOIN sources s ON m.source_id = s.id
                        WHERE s.name = 'HanViet' 
                        AND (m.meaning_text LIKE ? OR m.meaning_text = ?)
                    `).all(`${c} — %`, c);

                    let hvRows = fetchHv(ch);
                    if (ch !== tradCh) {
                        hvRows = hvRows.concat(fetchHv(tradCh));
                    }

                    // Deduplicate by Vietnamese reading + Chinese character
                    const seenEntries = new Set();
                    const entries = [];
                    for (const r of hvRows) {
                        const parts = r.meaning_text.split(' — ', 2);
                        const chinese = parts[0].trim();
                        const key = `${r.hanviet}|${chinese}`;
                        if (!seenEntries.has(key)) {
                            seenEntries.add(key);
                            entries.push({
                                chinese,
                                pinyin: r.part_of_speech || null,
                                gloss: (parts[1] || '').trim(),
                            });
                        }
                    }

                    return {
                        syllable: hvRows.length > 0 ? hvRows[0].hanviet : '❓', // Use the first returned Han Viet reading as primary
                        entries
                    };
                }).filter(comp => comp.entries.length > 0); // Exclude characters that yielded no results
            } else if (syllables.length >= 2) {
                // For Vietnamese queries (multi-syllable), keep the existing logic:
                // Extract the Chinese compound from AI_Generated_ZH to disambiguate
                // e.g. "không gian" → AI_Generated_ZH has "空間" → chars ['空','間']
                let compoundChars = null;

                const aiZhSource = grouped['AI_Generated_ZH'];
                let aiFullText = '';
                if (aiZhSource && aiZhSource.meanings.length > 0) {
                    const zhWord = aiZhSource.meanings[0].meaning_text;
                    aiFullText = zhWord;
                    // Extract CJK characters from the full meaning text
                    const cjkChars = [...zhWord].filter(isCJK);
                    if (cjkChars.length === syllables.length) {
                        compoundChars = cjkChars;
                    } else {
                        // Try extracting just the first term before Chinese punctuation
                        const firstTerm = zhWord.split(/[，,；;、：:（(]/)[0].trim();
                        const firstCjk = [...firstTerm].filter(isCJK);
                        if (firstCjk.length === syllables.length) {
                            compoundChars = firstCjk;
                        }
                    }
                }

                // Convert compound chars to traditional for matching against HanViet
                const compoundTradChars = compoundChars
                    ? compoundChars.map(ch => s2t(ch))
                    : null;
                // Combine both simplified and traditional sets for matching
                const compoundCharSet = compoundChars
                    ? new Set([...compoundChars, ...compoundTradChars])
                    : null;
                // Always build a set from the full AI text (simplified + traditional) for fallback
                const aiCjkChars = aiFullText ? [...aiFullText].filter(isCJK) : [];
                const aiCharSet = aiCjkChars.length > 0
                    ? new Set([...aiCjkChars, ...aiCjkChars.map(ch => s2t(ch))])
                    : null;

                hanvietComponents = syllables.map((syll) => {
                    const hvRows = stmtHanVietSyllable.all(syll);
                    const entries = hvRows.map(r => {
                        const parts = r.meaning_text.split(' — ', 2);
                        const chinese = parts[0].trim();
                        const gloss = parts[1] || '';
                        return {
                            chinese,
                            pinyin: r.part_of_speech || null,
                            gloss: gloss.trim(),
                        };
                    });

                    // Try compound chars first, then fall back to full AI text
                    let matched = false;
                    if (compoundCharSet) {
                        const matchIdx = entries.findIndex(e => {
                            return [...e.chinese].some(ch => compoundCharSet.has(ch));
                        });
                        if (matchIdx >= 0) {
                            if (matchIdx > 0) {
                                const [m] = entries.splice(matchIdx, 1);
                                entries.unshift(m);
                            }
                            matched = true;
                        }
                    }
                    // Fallback: use full AI text characters if compound didn't match
                    if (!matched && aiCharSet) {
                        const matchIdx = entries.findIndex(e => {
                            return [...e.chinese].some(ch => aiCharSet.has(ch));
                        });
                        if (matchIdx > 0) {
                            const [m] = entries.splice(matchIdx, 1);
                            entries.unshift(m);
                        }
                    }

                    return { syllable: syll, entries };
                });
            } else if (syllables.length === 1) {
                // Single syllable Vietnamese lookup
                const hvRows = stmtHanVietSyllable.all(syllables[0]);
                if (hvRows.length > 0) {
                    hanvietComponents = [{
                        syllable: syllables[0],
                        entries: hvRows.map(r => {
                            const parts = r.meaning_text.split(' — ', 2);
                            return {
                                chinese: parts[0].trim(),
                                pinyin: r.part_of_speech || null,
                                gloss: (parts[1] || '').trim(),
                            };
                        }),
                    }];
                }
            }
        }

        res.json({ word: query, structured: true, data: Object.values(grouped), components, hanvietComponents });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---------------------------------------------------------------------------
// /api/segment?text=Tôi+đi+học   → split Vietnamese sentence into dictionary segments
// ---------------------------------------------------------------------------
app.get('/api/segment', (req, res) => {
    const text = (req.query.text || '').trim();
    if (!text) return res.json({ segments: [] });

    // Split into syllables, preserving punctuation attached to each
    const tokens = text.split(/\s+/);
    const segments = [];
    let i = 0;

    while (i < tokens.length) {
        let matched = false;

        // Try 3-gram, 2-gram — only group if compound freq > individual syllable freqs
        // This prevents "cho ngựa" from grouping when "cho" and "ngựa" are both common
        for (let len = Math.min(3, tokens.length - i); len >= 2; len--) {
            const phrase = tokens.slice(i, i + len).join(' ');
            const norm = normalizeVi(phrase);
            if (indexEn.has(norm) || indexZh.has(norm)) {
                // Check if compound is a "true" compound vs coincidental match
                const compoundFreq = combinedFreqMap.get(phrase.toLowerCase()) || combinedFreqMap.get(norm) || 0;
                const syllableFreqs = tokens.slice(i, i + len).map(t => {
                    const n = normalizeVi(t);
                    // Find the best freq among diacriticized variants
                    let best = 0;
                    for (const idx of [indexEn, indexZh]) {
                        const words = idx.get(n);
                        if (words) for (const w of words) best = Math.max(best, combinedFreqMap.get(w) || 0);
                    }
                    return best;
                });
                const minSyllableFreq = Math.min(...syllableFreqs);

                // Group as compound if: compound has own frequency, OR any syllable is rare
                // (rare = freq < 50, meaning it's likely not a standalone word)
                if (compoundFreq > 0 || minSyllableFreq < 50) {
                    segments.push({ text: phrase });
                    i += len;
                    matched = true;
                    break;
                }
            }
        }

        if (!matched) {
            // Single token — strip punctuation for dictionary check
            const token = tokens[i];
            const stripped = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
            const leading = token.slice(0, token.indexOf(stripped) >= 0 ? token.indexOf(stripped) : 0);
            const trailing = stripped.length > 0 ? token.slice(token.indexOf(stripped) + stripped.length) : '';

            if (stripped.length > 0) {
                segments.push({ text: stripped, leading, trailing });
            } else {
                // Pure punctuation
                segments.push({ text: token, punct: true });
            }
            i++;
        }
    }

    res.json({ segments });
});

// ---------------------------------------------------------------------------
// /api/word-popup?q=không+khí&lang=en  → lightweight word definition for popup
// ---------------------------------------------------------------------------
app.get('/api/word-popup', (req, res) => {
    const rawQuery = (req.query.q || '').trim();
    const lang = req.query.lang || 'en';
    if (!rawQuery) return res.json({ found: false });

    const query = rawQuery.toLowerCase();
    const db = dbs[lang] || dbEn;

    try {
        // Get first meaning + IPA
        const sql = lang === 'en'
            ? `SELECT m.meaning_text, m.part_of_speech, p.ipa
               FROM words w
               JOIN meanings m ON w.id = m.word_id
               LEFT JOIN pronunciations p ON w.id = p.word_id
               WHERE w.word = ? COLLATE NOCASE
               LIMIT 1`
            : `SELECT m.meaning_text, m.part_of_speech
               FROM words w
               JOIN meanings m ON w.id = m.word_id
               WHERE w.word = ? COLLATE NOCASE
               LIMIT 1`;

        let row;
        if (lang === 'en') {
            row = dbEnHigh.prepare(sql).get(query);
            if (!row && dbEnLow) row = dbEnLow.prepare(sql).get(query);
        } else {
            row = db.prepare(sql).get(query);
        }

        if (row) {
            return res.json({
                word: rawQuery,
                found: true,
                definition: row.meaning_text,
                pos: row.part_of_speech || null,
                ipa: row.ipa || null,
            });
        }

        // For compound words not found as a whole, combine individual syllable meanings
        const syllables = query.split(/\s+/);
        if (syllables.length >= 2) {
            const parts = syllables.map(syll => {
                const m = getSyllableMeaning(syll);
                return m ? m.meaning_text.split(/[;,]/)[0].trim() : syll;
            });
            return res.json({
                word: rawQuery,
                found: true,
                compound: true,
                definition: parts.join(' + '),
                pos: null,
                ipa: null,
            });
        }

        return res.json({ word: rawQuery, found: false });
    } catch (err) {
        console.error('word-popup error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ---------------------------------------------------------------------------
// /api/tts?text=xin+chào&lang=vi  → Google Translate TTS proxy
// ---------------------------------------------------------------------------
app.get('/api/tts', async (req, res) => {
    const text = (req.query.text || '').trim();
    const lang = req.query.lang || 'vi';
    if (!text || text.length > 200) {
        return res.status(400).json({ error: 'text required (max 200 chars)' });
    }

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://translate.google.com/',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });

        if (!response.ok) {
            return res.status(502).json({ error: 'TTS upstream error' });
        }

        res.set({
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=86400',
        });
        const buffer = Buffer.from(await response.arrayBuffer());
        res.send(buffer);
    } catch (err) {
        console.error('TTS error:', err.message);
        res.status(502).json({ error: 'TTS fetch failed' });
    }
});

// ---------------------------------------------------------------------------
// /api/translate?text=xin+chào&sl=vi&tl=en  → Google Translate proxy
// ---------------------------------------------------------------------------
app.get('/api/translate', async (req, res) => {
    const text = (req.query.text || '').trim();
    const sl = req.query.sl || 'vi';
    const tl = req.query.tl || 'en';
    if (!text || text.length > 500) {
        return res.status(400).json({ error: 'text required (max 500 chars)' });
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            return res.status(502).json({ error: 'Translation upstream error' });
        }

        const data = await response.json();
        // Response format: [[["translated text","source text",null,null,10]],null,"vi",...]
        const translated = (data[0] || []).map(seg => seg[0]).join('');
        const detectedLang = data[2] || sl;

        res.json({
            translated,
            source: text,
            sl: detectedLang,
            tl,
        });
    } catch (err) {
        console.error('Translate error:', err.message);
        res.status(502).json({ error: 'Translation failed' });
    }
});

// Serve Vite build output in production (skip if dist doesn't exist, e.g. dev mode)
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(join(distPath, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Dictionary API running on http://localhost:${PORT}`);
});
