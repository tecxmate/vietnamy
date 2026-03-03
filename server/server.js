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
const LANG_META = {
    en: { label: 'English', flag: '🇬🇧', file: 'vn_en_dictionary.db' },
    zh: { label: 'Chinese', flag: '🇨🇳', file: 'vn_zh_dictionary.db' },
    ja: { label: 'Japanese', flag: '🇯🇵', file: 'vn_ja_dictionary.db' },
    fr: { label: 'French', flag: '🇫🇷', file: 'vn_fr_dictionary.db' },
    de: { label: 'German', flag: '🇩🇪', file: 'vn_de_dictionary.db' },
    ru: { label: 'Russian', flag: '🇷🇺', file: 'vn_ru_dictionary.db' },
    no: { label: 'Norwegian', flag: '🇳🇴', file: 'vn_no_dictionary.db' },
    es: { label: 'Spanish', flag: '🇪🇸', file: 'vn_es_dictionary.db' },
};

// Open DBs that exist on disk
const dbs = {};
const DB_PATH_EN = join(__dirname, 'databases', 'vn_en_dictionary.db');
const DB_PATH_ZH = join(__dirname, 'databases', 'vn_zh_dictionary.db');

for (const [lang, meta] of Object.entries(LANG_META)) {
    const p = join(__dirname, 'databases', meta.file);
    if (existsSync(p)) {
        dbs[lang] = new Database(p, { fileMustExist: true });
    } else {
        console.warn(`[WARN] DB not found for lang '${lang}': ${meta.file}`);
    }
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
const dataEn = buildWordIndex(dbEn, true);
const dataZh = buildWordIndex(dbZh, false);
const indexEn = dataEn.index;
const indexZh = dataZh.index;
const combinedFreqMap = new Map([...dataZh.freqMap, ...dataEn.freqMap]); // EN overrides ZH if both exist
console.log(`Indexes ready — EN: ${indexEn.size}, ZH: ${indexZh.size} normalized keys`);

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
    const rows = dbEn.prepare(`
        SELECT word_id, subt_freq FROM word_metrics
        WHERE subt_freq IS NOT NULL
        ORDER BY subt_freq DESC
    `).all();
    rows.forEach((row, i) => {
        freqRankMap.set(row.word_id, i + 1);
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
const stmtSyllableMetrics = dbEn.prepare(`
    SELECT w.id as word_id, wm.subt_freq
    FROM words w
    LEFT JOIN word_metrics wm ON w.id = wm.word_id
    WHERE w.word = ? COLLATE NOCASE
    LIMIT 1
`);

const stmtSyllableMeaning = dbEn.prepare(`
    SELECT m.meaning_text
    FROM words w
    JOIN meanings m ON w.id = m.word_id
    WHERE w.word = ? COLLATE NOCASE
    LIMIT 1
`);

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

    try {
        let sql = `
            SELECT w.word, s.name as source_name, m.id as meaning_id, m.part_of_speech, m.meaning_text
            FROM words w
            JOIN meanings m ON w.id = m.word_id
            JOIN sources s ON m.source_id = s.id
            WHERE w.word = ? COLLATE NOCASE
        `;

        if (lang === 'en') {
            sql = `
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
        }

        const stmt = db.prepare(sql);

        const results = stmt.all(query);

        if (results.length === 0) {
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
                    const exStmt = db.prepare(
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
        const syllables = query.trim().split(/\s+/);
        if (syllables.length >= 2 && lang === 'en') {
            components = syllables.map(syll => {
                const metricsRow = stmtSyllableMetrics.get(syll);
                const meaningRow = stmtSyllableMeaning.get(syll);
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
        if (syllables.length >= 2 && lang === 'zh') {
            // Extract the Chinese compound from AI_Generated_ZH to disambiguate
            // e.g. "không gian" → AI_Generated_ZH has "空間" → chars ['空','間']
            let compoundChars = null;
            const isCJK = ch => {
                const cp = ch.codePointAt(0);
                return (cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3400 && cp <= 0x4DBF) ||
                    (cp >= 0x20000 && cp <= 0x2A6DF) || (cp >= 0xF900 && cp <= 0xFAFF);
            };

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
                    if (matchIdx > 0) {
                        const [m] = entries.splice(matchIdx, 1);
                        entries.unshift(m);
                        matched = true;
                    } else if (matchIdx === 0) {
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
        }
        // Also provide hanvietComponents for single-syllable ZH lookups
        if (syllables.length === 1 && lang === 'zh') {
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

        res.json({ word: query, structured: true, data: Object.values(grouped), components, hanvietComponents });

    } catch (error) {
        console.error(error);
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://translate.google.com/',
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

// Serve Vite build output in production
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Dictionary API running on http://localhost:${PORT}`);
});
