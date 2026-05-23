import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { Converter } from 'opencc-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

function loadEnvFile(path) {
    if (!existsSync(path)) return;
    const lines = readFileSync(path, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, rawValue] = match;
        if (process.env[key] !== undefined) continue;
        process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
    }
}

loadEnvFile(join(ROOT_DIR, '.env.local'));
loadEnvFile(join(ROOT_DIR, '.env'));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Simplified ↔ Traditional Chinese converters
const s2t = Converter({ from: 'cn', to: 'tw' });

// ---------------------------------------------------------------------------
// Push notification MVP
// ---------------------------------------------------------------------------
const PUSH_STORE_PATH = join(__dirname, 'databases', 'push_notifications.json');
const PUSH_VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const PUSH_VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const PUSH_VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@vietnamy.app';
const PUSH_ENABLED = Boolean(PUSH_VAPID_PUBLIC_KEY && PUSH_VAPID_PRIVATE_KEY);

const PUSH_TEMPLATES = {
    daily_review: {
        title: 'Vietnamy review is ready',
        body: 'Review a few Vietnamese words before they fade.',
        url: '/practice/flashcards',
    },
    streak_save: {
        title: 'Keep today alive',
        body: 'Two minutes of Vietnamese keeps your learning rhythm going.',
        url: '/',
    },
    unfinished_lesson: {
        title: 'Your lesson is waiting',
        body: 'Finish the next small step in Vietnamese today.',
        url: '/study',
    },
};

function readPushStore() {
    try {
        if (!existsSync(PUSH_STORE_PATH)) {
            return { subscriptions: [], events: [] };
        }
        const parsed = JSON.parse(readFileSync(PUSH_STORE_PATH, 'utf8'));
        return {
            subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
            events: Array.isArray(parsed.events) ? parsed.events : [],
        };
    } catch (err) {
        console.warn('Push store read failed:', err.message);
        return { subscriptions: [], events: [] };
    }
}

function writePushStore(store) {
    mkdirSync(dirname(PUSH_STORE_PATH), { recursive: true });
    writeFileSync(PUSH_STORE_PATH, JSON.stringify(store, null, 2));
}

function pushSubscriptionKey(subscription) {
    return crypto.createHash('sha1').update(subscription?.endpoint || '').digest('hex');
}

async function loadWebPush() {
    const webPush = await import('web-push');
    const mod = webPush.default || webPush;
    mod.setVapidDetails(PUSH_VAPID_SUBJECT, PUSH_VAPID_PUBLIC_KEY, PUSH_VAPID_PRIVATE_KEY);
    return mod;
}

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
// Frequency tier helper (query on-demand instead of pre-loading)
// ---------------------------------------------------------------------------
const MAX_DISP = 13287; // max subt_disp value in corpus

// Prepared statement for frequency rank lookup
const stmtFreqRank = dbEnHigh.prepare(`
    SELECT COUNT(*) + 1 as rank FROM word_metrics
    WHERE subt_freq > (SELECT subt_freq FROM word_metrics WHERE word_id = ?)
`);
const stmtFreqRankLow = dbEnLow ? dbEnLow.prepare(`
    SELECT COUNT(*) + 1 as rank FROM word_metrics
    WHERE subt_freq > (SELECT subt_freq FROM word_metrics WHERE word_id = ?)
`) : null;

function getFreqRank(wordId) {
    let row = stmtFreqRank.get(wordId);
    if (!row && stmtFreqRankLow) row = stmtFreqRankLow.get(wordId);
    return row?.rank || null;
}

console.log('Server initialized (on-demand SQLite queries, no in-memory indexes)');

function getFreqTier(rank) {
    if (!rank) return null;
    if (rank <= 500) return 'Top 500';
    if (rank <= 1000) return 'Top 1K';
    if (rank <= 3000) return 'Top 3K';
    if (rank <= 10000) return 'Top 10K';
    return 'Rare';
}

// ---------------------------------------------------------------------------
// Prepared statements for suggest (prefix search via word_normalized column)
// ---------------------------------------------------------------------------
const stmtSuggestEn = dbEnHigh.prepare(`
    SELECT DISTINCT w.word, wm.subt_freq
    FROM words w
    LEFT JOIN word_metrics wm ON w.id = wm.word_id
    WHERE w.word_normalized LIKE ? || '%'
      AND EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
    ORDER BY wm.subt_freq DESC NULLS LAST, length(w.word)
    LIMIT 30
`);
const stmtSuggestEnLow = dbEnLow ? dbEnLow.prepare(`
    SELECT DISTINCT w.word, wm.subt_freq
    FROM words w
    LEFT JOIN word_metrics wm ON w.id = wm.word_id
    WHERE w.word_normalized LIKE ? || '%'
      AND EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
    ORDER BY wm.subt_freq DESC NULLS LAST, length(w.word)
    LIMIT 30
`) : null;
const stmtSuggestZh = dbZh.prepare(`
    SELECT DISTINCT w.word
    FROM words w
    WHERE w.word_normalized LIKE ? || '%'
      AND EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
    ORDER BY length(w.word)
    LIMIT 30
`);

// Contains search for fallback
const stmtContainsEn = dbEnHigh.prepare(`
    SELECT DISTINCT w.word, wm.subt_freq
    FROM words w
    LEFT JOIN word_metrics wm ON w.id = wm.word_id
    WHERE w.word_normalized LIKE '%' || ? || '%'
      AND w.word_normalized NOT LIKE ? || '%'
      AND EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
    ORDER BY wm.subt_freq DESC NULLS LAST
    LIMIT 20
`);

// Exact normalized match
const stmtExactEn = dbEnHigh.prepare(`
    SELECT DISTINCT w.word, wm.subt_freq
    FROM words w
    LEFT JOIN word_metrics wm ON w.id = wm.word_id
    WHERE w.word_normalized = ?
      AND EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
    ORDER BY wm.subt_freq DESC NULLS LAST
    LIMIT 10
`);
const stmtExactEnLow = dbEnLow ? dbEnLow.prepare(`
    SELECT DISTINCT w.word, wm.subt_freq
    FROM words w
    LEFT JOIN word_metrics wm ON w.id = wm.word_id
    WHERE w.word_normalized = ?
      AND EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
    ORDER BY wm.subt_freq DESC NULLS LAST
    LIMIT 10
`) : null;
const stmtExactZh = dbZh.prepare(`
    SELECT DISTINCT w.word
    FROM words w
    WHERE w.word_normalized = ?
      AND EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
    LIMIT 10
`);

// ---------------------------------------------------------------------------
// Prepared statements for compound word decomposition
// ---------------------------------------------------------------------------
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
// Helper: find diacriticized variants for a single normalized syllable
// Uses direct SQLite query instead of in-memory index
// ---------------------------------------------------------------------------
function findDiacriticVariants(normSyll, limit = 5) {
    const variants = [];
    // Query EN (high priority first)
    const enRows = stmtExactEn.all(normSyll);
    for (const r of enRows) {
        if (!r.word.includes(' ')) variants.push({ word: r.word, freq: r.subt_freq || 0 });
    }
    if (stmtExactEnLow) {
        const enLowRows = stmtExactEnLow.all(normSyll);
        for (const r of enLowRows) {
            if (!r.word.includes(' ')) variants.push({ word: r.word, freq: r.subt_freq || 0 });
        }
    }
    // Query ZH
    const zhRows = stmtExactZh.all(normSyll);
    for (const r of zhRows) {
        if (!r.word.includes(' ')) variants.push({ word: r.word, freq: 0 });
    }
    // Sort by freq and dedupe
    variants.sort((a, b) => b.freq - a.freq);
    const seen = new Set();
    return variants.filter(v => {
        if (seen.has(v.word)) return false;
        seen.add(v.word);
        return true;
    }).slice(0, limit).map(v => v.word);
}

// ---------------------------------------------------------------------------
// /api/suggest?q=khong   → returns up to 8 fuzzy-matched words
// ---------------------------------------------------------------------------
app.get('/api/suggest', (req, res) => {
    const query = (req.query.q || '').trim();
    if (query.length < 2) return res.json([]);

    const normQuery = normalizeVi(query);
    const queryLower = query.toLowerCase();
    const querySylls = normQuery.split(/\s+/);
    const isMultiSyll = querySylls.length >= 2;

    // Tier 1: Exact normalized matches (e.g. "khong" → "không", "khống")
    const exactMatches = [];
    // Tier 2: Compound recombinations
    const compoundMatches = [];
    // Tier 3: Prefix matches (e.g. "xin" → "xin lỗi", "xin phép")
    const prefixMatches = [];
    // Tier 4: Per-syllable matches for multi-word queries
    const syllableMatches = [];
    // Tier 5: Contains matches
    const containsMatches = [];

    // Query EN database (high + low)
    for (const r of stmtExactEn.all(normQuery)) {
        if (r.word.toLowerCase() !== queryLower) exactMatches.push({ word: r.word, freq: r.subt_freq || 0 });
    }
    if (stmtExactEnLow) {
        for (const r of stmtExactEnLow.all(normQuery)) {
            if (r.word.toLowerCase() !== queryLower) exactMatches.push({ word: r.word, freq: r.subt_freq || 0 });
        }
    }
    // Query ZH database
    for (const r of stmtExactZh.all(normQuery)) {
        if (r.word.toLowerCase() !== queryLower) exactMatches.push({ word: r.word, freq: 0 });
    }

    // Prefix matches from EN
    for (const r of stmtSuggestEn.all(normQuery)) {
        if (r.word.toLowerCase() !== queryLower && normalizeVi(r.word) !== normQuery) {
            prefixMatches.push({ word: r.word, freq: r.subt_freq || 0 });
        }
    }
    if (stmtSuggestEnLow) {
        for (const r of stmtSuggestEnLow.all(normQuery)) {
            if (r.word.toLowerCase() !== queryLower && normalizeVi(r.word) !== normQuery) {
                prefixMatches.push({ word: r.word, freq: r.subt_freq || 0 });
            }
        }
    }
    // Prefix matches from ZH
    for (const r of stmtSuggestZh.all(normQuery)) {
        if (r.word.toLowerCase() !== queryLower && normalizeVi(r.word) !== normQuery) {
            prefixMatches.push({ word: r.word, freq: 0 });
        }
    }

    // Contains matching for short queries when we don't have enough results
    if (normQuery.length >= 3 && !isMultiSyll && exactMatches.length + prefixMatches.length < 8) {
        for (const r of stmtContainsEn.all(normQuery, normQuery)) {
            if (r.word.toLowerCase() !== queryLower) {
                containsMatches.push({ word: r.word, freq: r.subt_freq || 0 });
            }
        }
    }

    // Multi-syllable compound recombination
    if (isMultiSyll && exactMatches.length === 0) {
        const syllVariants = querySylls.map(s => findDiacriticVariants(s, 4));

        // Generate combinations (capped)
        const combos = [];
        const generate = (idx, current) => {
            if (combos.length >= 20) return;
            if (idx === syllVariants.length) {
                combos.push(current.join(' '));
                return;
            }
            const candidates = syllVariants[idx].length > 0 ? syllVariants[idx] : [querySylls[idx]];
            for (const variant of candidates) {
                generate(idx + 1, [...current, variant]);
            }
        };
        generate(0, []);

        // Check which combos exist as dictionary words
        for (const combo of combos) {
            if (combo.toLowerCase() === queryLower) continue;
            const normCombo = normalizeVi(combo);
            for (const r of stmtExactEn.all(normCombo)) compoundMatches.push({ word: r.word, freq: r.subt_freq || 0 });
            for (const r of stmtExactZh.all(normCombo)) compoundMatches.push({ word: r.word, freq: 0 });
        }

        // Add individual syllable matches
        for (const syll of querySylls) {
            for (const v of findDiacriticVariants(syll, 3)) {
                syllableMatches.push({ word: v, freq: 0 });
            }
        }
    }

    // Sort each tier by: single-word first → frequency desc → shorter first
    const sortFn = (a, b) => {
        const aMulti = a.word.includes(' ') ? 1 : 0;
        const bMulti = b.word.includes(' ') ? 1 : 0;
        if (aMulti !== bMulti) return aMulti - bMulti;
        if (a.freq !== b.freq) return b.freq - a.freq;
        return a.word.length - b.word.length;
    };

    exactMatches.sort(sortFn);
    compoundMatches.sort(sortFn);
    prefixMatches.sort(sortFn);
    syllableMatches.sort(sortFn);
    containsMatches.sort(sortFn);

    // Merge tiers preserving priority, dedupe, take top 8
    const merged = [...exactMatches, ...compoundMatches, ...prefixMatches, ...syllableMatches, ...containsMatches];
    const seen = new Set();
    const result = [];
    for (const item of merged) {
        if (!seen.has(item.word)) {
            seen.add(item.word);
            result.push(item.word);
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
                const rank = r.word_id ? getFreqRank(r.word_id) : null;
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
                const syllRank = metricsRow?.word_id ? getFreqRank(metricsRow.word_id) : null;
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
// Prepared statements for segment endpoint
// ---------------------------------------------------------------------------
const stmtWordExistsEn = dbEnHigh.prepare(`
    SELECT w.word, wm.subt_freq FROM words w
    LEFT JOIN word_metrics wm ON w.id = wm.word_id
    WHERE w.word_normalized = ?
      AND EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
    LIMIT 1
`);
const stmtWordExistsEnLow = dbEnLow ? dbEnLow.prepare(`
    SELECT w.word, wm.subt_freq FROM words w
    LEFT JOIN word_metrics wm ON w.id = wm.word_id
    WHERE w.word_normalized = ?
      AND EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
    LIMIT 1
`) : null;
const stmtWordExistsZh = dbZh.prepare(`
    SELECT word FROM words w
    WHERE w.word_normalized = ?
      AND EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
    LIMIT 1
`);

function wordExistsWithFreq(norm) {
    let row = stmtWordExistsEn.get(norm);
    if (!row && stmtWordExistsEnLow) row = stmtWordExistsEnLow.get(norm);
    if (row) return { exists: true, freq: row.subt_freq || 0 };
    const zhRow = stmtWordExistsZh.get(norm);
    if (zhRow) return { exists: true, freq: 0 };
    return { exists: false, freq: 0 };
}

// ---------------------------------------------------------------------------
// /api/segment?text=Tôi+đi+học   → split Vietnamese sentence into dictionary segments
// ---------------------------------------------------------------------------
app.get('/api/segment', (req, res) => {
    const text = (req.query.text || '').trim();
    if (!text) return res.json({ segments: [] });

    const tokens = text.split(/\s+/);
    const segments = [];
    let i = 0;

    while (i < tokens.length) {
        let matched = false;

        // Try 3-gram, 2-gram — only group if compound freq > individual syllable freqs
        for (let len = Math.min(3, tokens.length - i); len >= 2; len--) {
            const phrase = tokens.slice(i, i + len).join(' ');
            const norm = normalizeVi(phrase);
            const compound = wordExistsWithFreq(norm);

            if (compound.exists) {
                // Check if compound is a "true" compound vs coincidental match
                const syllableFreqs = tokens.slice(i, i + len).map(t => {
                    const n = normalizeVi(t);
                    return wordExistsWithFreq(n).freq;
                });
                const minSyllableFreq = Math.min(...syllableFreqs);

                // Group as compound if: compound has own frequency, OR any syllable is rare
                if (compound.freq > 0 || minSyllableFreq < 50) {
                    segments.push({ text: phrase });
                    i += len;
                    matched = true;
                    break;
                }
            }
        }

        if (!matched) {
            const token = tokens[i];
            const stripped = token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
            const leading = token.slice(0, token.indexOf(stripped) >= 0 ? token.indexOf(stripped) : 0);
            const trailing = stripped.length > 0 ? token.slice(token.indexOf(stripped) + stripped.length) : '';

            if (stripped.length > 0) {
                segments.push({ text: stripped, leading, trailing });
            } else {
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
// Text-to-speech
// ---------------------------------------------------------------------------
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || '';
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || '';
const AZURE_TTS_ENABLED = Boolean(AZURE_SPEECH_KEY && AZURE_SPEECH_REGION);
const AZURE_VI_VOICES = {
    'azure-north': process.env.AZURE_TTS_VOICE_NORTH || 'vi-VN-NamMinhNeural',
    'azure-south': process.env.AZURE_TTS_VOICE_SOUTH || 'vi-VN-HoaiMyNeural',
};
const TTS_VOICES = new Set(['google', 'azure-north', 'azure-south']);
const DEFAULT_TTS_VOICE = process.env.DEFAULT_TTS_VOICE || 'azure-north';
const TTS_CACHE_VERSION = process.env.TTS_CACHE_VERSION || 'v9-nam-minh-lower';

// --- TTS bucket cache (Supabase Storage) -----------------------------------
// Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env to enable. Bucket name
// defaults to "tts-cache" and must be created as PUBLIC in the Supabase UI.
const TTS_BUCKET = process.env.TTS_BUCKET || 'tts-cache';
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TTS_CACHE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

function normalizeTtsCacheVersion(value) {
    const raw = typeof value === 'string' && value.trim() ? value.trim() : TTS_CACHE_VERSION;
    return raw.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 80) || TTS_CACHE_VERSION;
}

function ttsCacheKey(voice, lang, text, cacheVersion = TTS_CACHE_VERSION) {
    const hash = crypto.createHash('sha1').update(`${voice}|${lang}|${text}`).digest('hex');
    const ext = voice === 'google' ? 'mp3' : 'wav';
    return `${normalizeTtsCacheVersion(cacheVersion)}/${voice}/${hash}.${ext}`;
}

function ttsPublicUrl(key) {
    return `${SUPABASE_URL}/storage/v1/object/public/${TTS_BUCKET}/${key}`;
}

async function ttsCacheHas(key) {
    if (!TTS_CACHE_ENABLED) return false;
    try {
        const r = await fetch(ttsPublicUrl(key), { method: 'HEAD' });
        return r.ok;
    } catch {
        return false;
    }
}

async function ttsCachePut(key, buffer, contentType) {
    if (!TTS_CACHE_ENABLED) return false;
    try {
        const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${TTS_BUCKET}/${key}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': contentType,
                'x-upsert': 'true',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
            body: buffer,
        });
        if (!r.ok) {
            const detail = await r.text().catch(() => '');
            console.warn(`TTS cache upload failed (${r.status}): ${detail.slice(0, 200)}`);
            return false;
        }
        return true;
    } catch (err) {
        console.warn('TTS cache upload error:', err.message);
        return false;
    }
}
const AZURE_PCM_SAMPLE_RATE = 24000;
const AZURE_PCM_CHANNELS = 1;
const AZURE_PCM_BYTES_PER_SAMPLE = 2;
const TTS_SILENCE_THRESHOLD = 120;
const TTS_SILENCE_WINDOW_MS = 10;
const TTS_TRIM_START_PADDING_MS = 8;
const TTS_TRIM_END_PADDING_MS = 50;

function escapeSsml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function trimPcm16MonoSilence(buffer, {
    sampleRate = AZURE_PCM_SAMPLE_RATE,
    threshold = TTS_SILENCE_THRESHOLD,
    windowMs = TTS_SILENCE_WINDOW_MS,
    startPaddingMs = TTS_TRIM_START_PADDING_MS,
    endPaddingMs = TTS_TRIM_END_PADDING_MS,
} = {}) {
    if (!Buffer.isBuffer(buffer) || buffer.length < AZURE_PCM_BYTES_PER_SAMPLE) return buffer;

    const sampleCount = Math.floor(buffer.length / AZURE_PCM_BYTES_PER_SAMPLE);
    const windowSamples = Math.max(1, Math.floor((sampleRate * windowMs) / 1000));
    const startPaddingSamples = Math.max(0, Math.floor((sampleRate * startPaddingMs) / 1000));
    const endPaddingSamples = Math.max(0, Math.floor((sampleRate * endPaddingMs) / 1000));

    const windowIsVoiced = (startSample) => {
        const endSample = Math.min(sampleCount, startSample + windowSamples);
        let sumSquares = 0;
        for (let sample = startSample; sample < endSample; sample++) {
            const value = buffer.readInt16LE(sample * AZURE_PCM_BYTES_PER_SAMPLE);
            sumSquares += value * value;
        }
        const rms = Math.sqrt(sumSquares / Math.max(1, endSample - startSample));
        return rms > threshold;
    };

    let firstVoiced = 0;
    while (firstVoiced < sampleCount && !windowIsVoiced(firstVoiced)) {
        firstVoiced += windowSamples;
    }

    if (firstVoiced >= sampleCount) return buffer;

    let lastVoiced = sampleCount;
    for (let start = Math.max(0, sampleCount - windowSamples); start >= 0; start -= windowSamples) {
        if (windowIsVoiced(start)) {
            lastVoiced = Math.min(sampleCount, start + windowSamples);
            break;
        }
    }

    const trimStart = Math.max(0, firstVoiced - startPaddingSamples);
    const trimEnd = Math.min(sampleCount, lastVoiced + endPaddingSamples);
    if (trimEnd <= trimStart) return buffer;

    const startByte = trimStart * AZURE_PCM_BYTES_PER_SAMPLE;
    const endByte = trimEnd * AZURE_PCM_BYTES_PER_SAMPLE;
    return buffer.subarray(startByte, endByte);
}

function normalizePcm16MonoLoudness(buffer, targetRms = 0.16, maxGain = 3) {
    if (!Buffer.isBuffer(buffer) || buffer.length < AZURE_PCM_BYTES_PER_SAMPLE) return buffer;

    const sampleCount = Math.floor(buffer.length / AZURE_PCM_BYTES_PER_SAMPLE);
    let sumSquares = 0;
    let peak = 0;

    for (let sample = 0; sample < sampleCount; sample++) {
        const value = buffer.readInt16LE(sample * AZURE_PCM_BYTES_PER_SAMPLE);
        const abs = Math.abs(value);
        peak = Math.max(peak, abs);
        const normalized = value / 32768;
        sumSquares += normalized * normalized;
    }

    if (!sampleCount || !peak || !sumSquares) return buffer;

    const rms = Math.sqrt(sumSquares / sampleCount);
    const peakLimitedGain = (0.95 * 32767) / peak;
    const gain = Math.max(1, Math.min(targetRms / rms, peakLimitedGain, maxGain));
    if (gain <= 1.01) return buffer;

    const amplifiedBuffer = Buffer.allocUnsafe(buffer.length);
    for (let sample = 0; sample < sampleCount; sample++) {
        const offset = sample * AZURE_PCM_BYTES_PER_SAMPLE;
        const amplified = Math.round(buffer.readInt16LE(offset) * gain);
        amplifiedBuffer.writeInt16LE(Math.max(-32768, Math.min(32767, amplified)), offset);
    }

    return amplifiedBuffer;
}

function addPcm16MonoClarity(buffer, amount = 0.18) {
    if (!Buffer.isBuffer(buffer) || buffer.length < AZURE_PCM_BYTES_PER_SAMPLE * 2) return buffer;

    const sampleCount = Math.floor(buffer.length / AZURE_PCM_BYTES_PER_SAMPLE);
    const clarifiedBuffer = Buffer.allocUnsafe(buffer.length);
    let previous = 0;

    for (let sample = 0; sample < sampleCount; sample++) {
        const offset = sample * AZURE_PCM_BYTES_PER_SAMPLE;
        const value = buffer.readInt16LE(offset);
        const clarified = Math.round(value + amount * (value - previous));
        clarifiedBuffer.writeInt16LE(Math.max(-32768, Math.min(32767, clarified)), offset);
        previous = value;
    }

    return clarifiedBuffer;
}

function pcm16MonoToWav(buffer, sampleRate = AZURE_PCM_SAMPLE_RATE) {
    const header = Buffer.alloc(44);
    const byteRate = sampleRate * AZURE_PCM_CHANNELS * AZURE_PCM_BYTES_PER_SAMPLE;
    const blockAlign = AZURE_PCM_CHANNELS * AZURE_PCM_BYTES_PER_SAMPLE;

    header.write('RIFF', 0);
    header.writeUInt32LE(36 + buffer.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(AZURE_PCM_CHANNELS, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(16, 34);
    header.write('data', 36);
    header.writeUInt32LE(buffer.length, 40);

    return Buffer.concat([header, buffer]);
}

async function synthesizeWithAzure(text, lang, voice = 'azure-north') {
    if (!AZURE_TTS_ENABLED || lang !== 'vi') return null;

    const voiceName = AZURE_VI_VOICES[voice] || AZURE_VI_VOICES['azure-north'];
    const prosodyAttrs = voice === 'azure-south'
        ? 'volume="x-loud" pitch="+5%" rate="+4%"'
        : 'volume="default"';
    const endpoint = `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const ssml = `
<speak version="1.0" xml:lang="vi-VN">
  <voice xml:lang="vi-VN" name="${voiceName}">
    <prosody ${prosodyAttrs}>${escapeSsml(text)}</prosody>
  </voice>
</speak>`.trim();

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'raw-24khz-16bit-mono-pcm',
            'User-Agent': 'vietnamy-tts',
        },
        body: ssml,
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Azure TTS ${response.status}: ${detail || response.statusText}`);
    }

    const rawPcm = Buffer.from(await response.arrayBuffer());
    const trimmedPcm = trimPcm16MonoSilence(rawPcm);
    const enhancedPcm = voice === 'azure-south'
        ? addPcm16MonoClarity(trimmedPcm, 0.32)
        : trimmedPcm;
    const targetRms = voice === 'azure-south' ? 0.2 : 0.13;
    const normalizedPcm = normalizePcm16MonoLoudness(enhancedPcm, targetRms);
    return {
        buffer: pcm16MonoToWav(normalizedPcm),
        contentType: 'audio/wav',
    };
}

async function synthesizeWithGoogleTranslate(text, lang) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://translate.google.com/',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    });

    if (!response.ok) {
        throw new Error(`Google Translate TTS ${response.status}: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
}

// /api/tts?text=xin+chào&lang=vi&voice=google|azure-north
app.get('/api/tts', async (req, res) => {
    const text = (req.query.text || '').trim();
    const lang = req.query.lang || 'vi';
    const legacyAccent = 'azure-north';
    const hasVoice = TTS_VOICES.has(req.query.voice);
    const voice = hasVoice
        ? req.query.voice
        : (req.query.accent ? legacyAccent : DEFAULT_TTS_VOICE);
    if (!text || text.length > 200) {
        return res.status(400).json({ error: 'text required (max 200 chars)' });
    }

    // 1) Bucket hit — redirect the client straight to the CDN URL.
    const cacheKey = ttsCacheKey(voice, lang, text, req.query.ck);
    if (await ttsCacheHas(cacheKey)) {
        res.set('X-TTS-Cache', 'hit');
        return res.redirect(302, ttsPublicUrl(cacheKey));
    }

    try {
        let audioResult = null;
        let provider = 'google-translate';
        const attempts = [];

        const addAttempt = (label, engine, voiceName, action) => {
            attempts.push({ label, engine, voiceName, action });
        };

        if (voice === 'google') {
            addAttempt('google-translate', 'google', 'google', async () => {
                return {
                    buffer: await synthesizeWithGoogleTranslate(text, lang),
                    contentType: 'audio/mpeg',
                };
            });
            if (lang === 'vi') {
                addAttempt('azure-google-fallback', 'azure', 'azure-north', () => synthesizeWithAzure(text, lang, 'azure-north'));
            }
        } else {
            addAttempt('azure', 'azure', voice, () => synthesizeWithAzure(text, lang, voice));
            if (lang === 'vi' && voice === 'azure-south') {
                addAttempt('azure-south-fallback', 'azure', 'azure-north', () => synthesizeWithAzure(text, lang, 'azure-north'));
            }
            if (lang === 'vi' && voice === 'azure-north') {
                addAttempt('azure-north-fallback', 'azure', 'azure-south', () => synthesizeWithAzure(text, lang, 'azure-south'));
            }
            addAttempt('google-translate', 'google', 'google', async () => {
                return {
                    buffer: await synthesizeWithGoogleTranslate(text, lang),
                    contentType: 'audio/mpeg',
                };
            });
        }

        for (const attempt of attempts) {
            try {
                audioResult = await attempt.action();
                if (audioResult) {
                    provider = attempt.label;
                    break;
                }
            } catch (err) {
                if (attempt.engine === 'azure' && attempt.voiceName === 'google') {
                    console.warn('Azure TTS fallback:', err.message);
                } else if (attempt.label === 'azure-google-fallback') {
                    console.warn('Azure TTS fallback after Google failure:', err.message);
                } else if (attempt.label.includes('fallback')) {
                    console.warn(`Fallback TTS attempt (${attempt.label}) failed:`, err.message);
                } else {
                    console.warn(`TTS attempt (${attempt.label}) failed:`, err.message);
                }
            }
        }

        if (!audioResult) {
            throw new Error('TTS providers unavailable');
        }

        // 2) Bucket miss — upload to cache for next time (fire-and-forget so
        // the user doesn't wait for the round-trip).
        const canCacheAudio =
            (voice === 'google' && provider === 'google-translate') ||
            (voice !== 'google' && provider === 'azure');
        if (canCacheAudio) ttsCachePut(cacheKey, audioResult.buffer, audioResult.contentType);

        res.set({
            'Content-Type': audioResult.contentType,
            'Cache-Control': TTS_CACHE_ENABLED ? 'public, max-age=86400' : 'no-store',
            'X-TTS-Provider': provider,
            'X-TTS-Voice': voice,
            'X-TTS-Cache': TTS_CACHE_ENABLED ? 'miss' : 'disabled',
        });
        res.send(audioResult.buffer);
    } catch (err) {
        console.error('TTS error:', err.message);
        res.status(502).json({ error: 'TTS fetch failed' });
    }
});

// ---------------------------------------------------------------------------
// POST /api/pronunciation?text=<reference>
// Body: raw WAV audio (16kHz mono PCM). Returns Azure Speech pronunciation
// assessment scores (accuracy, fluency, completeness + per-word breakdown).
// ---------------------------------------------------------------------------
app.post('/api/pronunciation', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
    if (!AZURE_TTS_ENABLED) {
        return res.status(503).json({ error: 'Azure Speech not configured' });
    }
    const referenceText = (req.query.text || '').trim();
    if (!referenceText || referenceText.length > 500) {
        return res.status(400).json({ error: 'text query param required (max 500 chars)' });
    }
    if (!req.body || req.body.length < 1024) {
        return res.status(400).json({ error: 'audio body required (raw WAV PCM 16kHz mono)' });
    }

    const paConfig = {
        ReferenceText: referenceText,
        GradingSystem: 'HundredMark',
        Granularity: 'Phoneme',
        Dimension: 'Comprehensive',
        EnableMiscue: 'True',
    };
    const paHeader = Buffer.from(JSON.stringify(paConfig)).toString('base64');

    const endpoint = `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=vi-VN&format=detailed`;

    try {
        const azureRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
                'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
                'Pronunciation-Assessment': paHeader,
                'Accept': 'application/json',
            },
            body: req.body,
        });
        const text = await azureRes.text();
        if (!azureRes.ok) {
            console.warn('Pronunciation Azure error:', azureRes.status, text.slice(0, 200));
            return res.status(502).json({ error: 'Azure pronunciation failed', detail: text.slice(0, 500) });
        }
        const payload = JSON.parse(text);
        const best = payload.NBest?.[0];
        if (!best || best.RecognitionStatus !== 'Success' && !best.PronunciationAssessment) {
            return res.json({
                recognized: payload.DisplayText || '',
                status: payload.RecognitionStatus || best?.RecognitionStatus || 'NoMatch',
                scores: null,
                words: [],
            });
        }
        const pa = best.PronunciationAssessment || {};
        res.json({
            recognized: best.Display || best.Lexical || payload.DisplayText || '',
            status: 'Success',
            scores: {
                accuracy: pa.AccuracyScore ?? null,
                fluency: pa.FluencyScore ?? null,
                completeness: pa.CompletenessScore ?? null,
                pronunciation: pa.PronScore ?? null,
            },
            words: (best.Words || []).map(w => ({
                word: w.Word,
                accuracy: w.PronunciationAssessment?.AccuracyScore ?? null,
                errorType: w.PronunciationAssessment?.ErrorType || 'None',
                phonemes: (w.Phonemes || []).map(p => ({
                    phoneme: p.Phoneme,
                    accuracy: p.PronunciationAssessment?.AccuracyScore ?? null,
                })),
            })),
        });
    } catch (err) {
        console.error('Pronunciation error:', err.message);
        res.status(502).json({ error: 'pronunciation request failed' });
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

app.get('/api/push/vapid-public-key', (_req, res) => {
    res.json({
        enabled: PUSH_ENABLED,
        publicKey: PUSH_VAPID_PUBLIC_KEY || null,
    });
});

app.post('/api/push/subscribe', (req, res) => {
    const { subscription, userId = 'anonymous', userName = '', platform = 'web' } = req.body || {};
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        return res.status(400).json({ error: 'valid push subscription required' });
    }

    const store = readPushStore();
    const id = pushSubscriptionKey(subscription);
    const now = new Date().toISOString();
    const existingIndex = store.subscriptions.findIndex(item => item.id === id);
    const record = {
        id,
        userId,
        userName,
        platform,
        subscription,
        active: true,
        createdAt: existingIndex >= 0 ? store.subscriptions[existingIndex].createdAt : now,
        updatedAt: now,
        sent: existingIndex >= 0 ? store.subscriptions[existingIndex].sent || 0 : 0,
        clicked: existingIndex >= 0 ? store.subscriptions[existingIndex].clicked || 0 : 0,
    };

    if (existingIndex >= 0) store.subscriptions[existingIndex] = record;
    else store.subscriptions.push(record);
    store.events.push({ type: 'subscribed', subscriptionId: id, userId, platform, at: now });
    writePushStore(store);

    res.json({ ok: true, subscriptionId: id, enabled: PUSH_ENABLED });
});

app.post('/api/push/events', (req, res) => {
    const { type, notificationId = '', templateId = '', subscriptionId = '', userId = 'anonymous', metadata = {} } = req.body || {};
    if (!type) return res.status(400).json({ error: 'event type required' });

    const store = readPushStore();
    const now = new Date().toISOString();
    store.events.push({ type, notificationId, templateId, subscriptionId, userId, metadata, at: now });

    if (type === 'clicked' && subscriptionId) {
        const sub = store.subscriptions.find(item => item.id === subscriptionId);
        if (sub) sub.clicked = (sub.clicked || 0) + 1;
    }

    writePushStore(store);
    res.json({ ok: true });
});

app.get('/api/push/stats', (_req, res) => {
    const store = readPushStore();
    const byTemplate = {};

    for (const event of store.events) {
        const templateId = event.templateId || 'unknown';
        byTemplate[templateId] ||= { sent: 0, clicked: 0, openedApp: 0 };
        if (event.type === 'sent') byTemplate[templateId].sent += 1;
        if (event.type === 'clicked') byTemplate[templateId].clicked += 1;
        if (event.type === 'opened_app') byTemplate[templateId].openedApp += 1;
    }

    const templates = Object.entries(byTemplate).map(([templateId, stats]) => ({
        templateId,
        ...stats,
        clickRate: stats.sent ? stats.clicked / stats.sent : 0,
        openRate: stats.sent ? stats.openedApp / stats.sent : 0,
    })).sort((a, b) => b.openRate - a.openRate || b.clickRate - a.clickRate);

    res.json({
        subscriptions: store.subscriptions.filter(item => item.active).length,
        templates,
    });
});

app.post('/api/push/send', async (req, res) => {
    if (!PUSH_ENABLED) {
        return res.status(503).json({ error: 'push is not configured; set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY' });
    }

    const { templateId = 'daily_review', userId = null } = req.body || {};
    const template = PUSH_TEMPLATES[templateId] || PUSH_TEMPLATES.daily_review;
    const store = readPushStore();
    const subscriptions = store.subscriptions.filter(item => item.active && (!userId || item.userId === userId));
    const webPush = await loadWebPush();
    const now = new Date().toISOString();
    const notificationId = crypto.randomUUID();
    const results = { sent: 0, failed: 0, disabled: 0 };

    for (const record of subscriptions) {
        const payload = JSON.stringify({
            notificationId,
            templateId,
            subscriptionId: record.id,
            title: template.title,
            body: template.body,
            url: template.url,
        });

        try {
            await webPush.sendNotification(record.subscription, payload);
            record.sent = (record.sent || 0) + 1;
            record.updatedAt = now;
            store.events.push({ type: 'sent', notificationId, templateId, subscriptionId: record.id, userId: record.userId, at: now });
            results.sent += 1;
        } catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
                record.active = false;
                record.updatedAt = now;
                results.disabled += 1;
            } else {
                results.failed += 1;
                console.warn('Push send failed:', err.message);
            }
            store.events.push({ type: 'send_failed', notificationId, templateId, subscriptionId: record.id, userId: record.userId, metadata: { statusCode: err.statusCode || null }, at: now });
        }
    }

    writePushStore(store);
    res.json({ ok: true, notificationId, ...results });
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
