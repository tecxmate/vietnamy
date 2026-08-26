# Handoff — serve the four dictionary endpoints from the mobile backend

**To:** whoever owns the mobile app's backend
**From:** the web repo (`tecxmate/vietnamy`)
**Status:** four endpoints the web client calls have no route in production. The mobile backend reportedly already has the full server, which would make this a routing/exposure job rather than a port.

---

## What's broken and why it matters

`vercel.json` sends every `/api/*` request to `api/[...path].js`. Four endpoints exist only in `server/server.js` (the Docker / `npm start` server), so they **404 on every Vercel deploy**:

| endpoint | what dies without it |
|---|---|
| `/api/search` | the entire Dictionary tab |
| `/api/suggest` | search autocomplete |
| `/api/word-popup` | tap-a-word popups in readings |
| `/api/segment` | Vietnamese word segmentation |

They're grouped because all four read the SQLite dictionaries in `server/databases/`, which can't ship inside a serverless function bundle. Tracked in issue #49.

**This gates real work.** PR #58 normalized part-of-speech tags across five merged sources, ranked senses by whether the reader can read them, and filtered license rows out of results. All of that runs inside `/api/search`. Until the route is reachable, none of it executes in production — and neither will any future dictionary enrichment.

### Read `ROLE-OF-THIS-REPO.md` and `Vietnamy_APP/docs/BACKENDS.md` before choosing an architecture

Those two describe the constraint this handoff sits inside, and it narrows the options below more than it first appears: **the Flutter app calls these same four routes**, on `vietnamy.tecxmate.com` — which is the Docker deploy, so mobile works today while Vercel 404s. Confirmed live: `GET /api/suggest?q=di` returns a populated array.

Two consequences for the fix:

- Of the two architectures under "What done looks like", **serving both halves from the same backend leaves mobile untouched.** Re-pointing only the web app at the mobile backend leaves the two clients reading from two different dictionary deployments — the symptom is web and app disagreeing on search results, which is tedious to diagnose from either side alone.
- Either way, `dictionaryBaseUrl` in the Flutter repo moves in the same change, or someone decides it doesn't and writes down why.

---

## What "done" looks like

The web client must reach these four paths over HTTPS with the response shapes below. Two ways to get there:

- **Point the web app at the mobile backend.** Either a Vercel rewrite from `/api/*` to its host, or set the client's API base URL. Needs CORS for the web origin.
- **Serve the web app from the same backend.** `server/server.js` already serves `/dist` in production, so the Docker path serves both halves.

Either way, delete the corresponding entries from `KNOWN_GAPS` in `scripts/validate-api-routes.mjs` when a route goes live — CI **fails** if a listed gap starts resolving, specifically so fixes get locked in rather than silently forgotten.

---

## The contract

Captured from the running server, not from reading code. All responses are JSON.

### `GET /api/suggest?q=<prefix>`

Prefix match on the diacritic-stripped form. Returns a bare string array, ordered by subtitle-corpus frequency then length.

```json
["đi","dĩ","dì","đĩ","dí","dị","đì","dỉ"]
```

### `GET /api/segment?text=<sentence>`

```json
{"segments":[{"text":"tôi","leading":"","trailing":""},
             {"text":"đi","leading":"","trailing":""},
             {"text":"học","leading":"","trailing":""}]}
```

`leading`/`trailing` carry punctuation so the caller can rebuild the original string exactly.

### `GET /api/word-popup?q=<word>&lang=<en|zh-s|zh-t>`

One-line lookup for tap-a-word. `found: false` when absent.

```json
{"word":"đi","found":true,"definition":"to go; to walk; to depart","pos":"verb","ipa":null}
```

`ipa` is almost always `null` — only 6,974 of 40,000 words have pronunciation data, and **none of the most common words do**. Don't treat null as an error.

### `GET /api/search?q=<word>&lang=<en|zh-s|zh-t>`

The big one. The client calls it **twice per lookup** — once with `lang=en`, once with `lang=zh-s` — and merges client-side.

```jsonc
{
  "word": "đi",
  "structured": true,          // client reads `data` when true, `results` when false
  "data": [
    {
      "source_name": "VE",     // VE | 3-dict-combination | AI_Generated_EN | FVDP (GPL) | VietAnh_Stardict
      "metrics": {
        "subt_freq": 854000, "mi": null, "ipa": null, "subt_disp": null,
        "freq_rank": 8, "freq_tier": "Top 500", "disp_pct": null
      },
      "meanings": [
        {
          "part_of_speech": "verb",              // raw, as the source wrote it
          "meaning_text": "to go; to walk; to depart",
          "examples": [{"vietnamese_text": "đi đến một nơi nào",
                        "english_text": "to go to a place"}],
          "source_name": "VE",
          "part_of_speech_canonical": "verb",    // ← from senseRank.js
          "gloss_lang": "en",                    // ← 'en' | 'vi' | 'zh' | 'mixed'
          "is_metadata": false,                  // ← license/index row, not a definition
          "rank_score": 24,
          "tier": "primary"                      // ← 'primary' | 'secondary'
        }
      ]
    }
  ],
  "components": [ /* only for multi-syllable words, lang=en */ ],
  "hanvietComponents": null
}
```

`freq_tier` is bucketed from `freq_rank`: `Top 500` / `Top 1K` / `Top 3K` / `Top 10K` / `Rare`, else `null`.

`components` decomposes a compound so a learner sees the parts:

```json
[{"syllable":"học","freq":30748,"freq_tier":"Top 500","meaning":"to study; to learn; to read"},
 {"syllable":"sinh","freq":6170,"freq_tier":"Top 3K","meaning":"to give birth to to produce, yield to turn"}]
```

---

## The one thing that must not be dropped

**`server/senseRank.js` must run on every `/api/search` response.** The five annotated fields above (`part_of_speech_canonical`, `gloss_lang`, `is_metadata`, `rank_score`, `tier`) come from it, and the web UI reads them directly:

- renders `part_of_speech_canonical` as the POS chip, falling back to the raw tag
- shows a **VI** badge when `gloss_lang === 'vi'`
- collapses `tier === 'secondary'` behind a "show more" toggle

Without it the UI degrades: **1,971 senses (13% of tagged ones) show a Vietnamese POS label to an English reader** — 977 entries render `danh từ` where the reader expects `noun`, 492 render `động từ` — and 4,457 Vietnamese-language glosses (10.7%) appear unmarked and unsorted among the English ones.

The module is pure, has no DB dependency, and is a single call in the response assembly:

```js
import { rankSenses } from './senseRank.js';

for (const group of Object.values(grouped)) {
    group.meanings = rankSenses(group.meanings, {
        lang,                        // the requested dictionary language
        word: query,
        sourceName: group.source_name,
    });
}
```

`scripts/validate-sense-rank.mjs` covers the contract with fixtures (CI-safe, no DB) and additionally ranks the 500 most frequent words when `server/databases/` is present.

---

## Traps

**1. Use the right database file.** `server/databases/` has three EN files and picking wrong is silent:

| file | size | verdict |
|---|---|---|
| `vn_en_dictionary_high.db` | 18 MB | **the real one.** 40,000 words. All 60 core beginner words present. |
| `vn_en_dictionary_low.db` | 100 MB | overflow tier, checked only when `_high` misses |
| `vn_en_dictionary.db` | 100 MB | **a collocation dump, not a learner dictionary.** 70% multi-word entries; only **2 of 60** core words present — `ăn`, `tôi`, `đi`, `nhà` are all missing. |

`server.js` prefers the `_high`/`_low` pair and falls back to `vn_en_dictionary.db` only when the split files are absent. That fallback is a silent cliff: lookups keep returning 200 while missing the most common words in the language. **Add a startup assertion** that a known core word (`ăn` will do) resolves, and refuse to boot otherwise.

For sizing: the useful EN dictionary is 18 MB, not 100 MB.

**The Flutter app bundles a file with that same poisoned name.** `Vietnamy_APP/assets/databases/vn_en_dictionary.db` is ~10 MB, 18,357 words, same six-table schema — and it is *not* the collocation dump despite the name. Spot-checked: `ăn tôi đi nhà học anh chị nước người làm` are all present, 10/10. It is 75% multi-word, close enough to the bad file's 70% to be mistaken for it at a glance.

The hazard is copying **by filename** between the repos. `vn_en_dictionary.db` means a working 18k-word offline dictionary in one repo and a core-word-free collocation dump in the other, and swapping them produces a dictionary that still answers 200 while missing the commonest words in the language. If these files are ever synced, match them on a core-word probe rather than a name.

**2. Two of these aren't as portable as issue #49 claims.**
- `/api/tone-samples` — writes to a local SQLite file. On serverless its disk is ephemeral, so a naive port accepts every upload and silently discards it. Needs a hosted store. Worse than the current 404.
- `/api/tutor` — genuinely portable, but its per-IP rate limit, global daily cost ceiling, and moderation pass all have to move with it. Losing the cap means unbounded OpenAI spend.

**3. `allData.vi` is dead code in the web client.** `DictionaryTab.jsx` fetches the Vietnamese monolingual source (`3-dict-combination`, ~22 senses on a common word), buckets it, and never renders it. Not your problem to fix, but don't optimize for a code path nobody displays.

---

## How to verify

Run these against the backend once routed. Expected values are from the live server, so they're exact:

```bash
BASE=https://your-backend

curl "$BASE/api/suggest?q=di"                  # ["đi","dĩ","dì",…]
curl "$BASE/api/word-popup?q=đi&lang=en"       # found:true, definition:"to go; to walk; to depart"
curl "$BASE/api/segment?text=tôi%20đi%20học"   # 3 segments
curl "$BASE/api/search?q=anh%20rể&lang=en"     # part_of_speech_canonical:"noun" (raw is "danh từ")
curl "$BASE/api/search?q=học%20sinh&lang=en"   # components: học + sinh
```

The `anh rể` case is the one worth checking by eye: the raw tag is `danh từ` and the canonical must be `noun`. If it comes back `danh từ`, `senseRank.js` isn't wired in.

Then in the web app: **Dictionary tab → search `đi`** should show two English senses with examples and a `verb` chip. No console errors.

Finally, from the web repo:

```bash
npm run validate:routes   # fails if a KNOWN_GAPS entry now resolves — delete it
npm run validate:senses
```

---

## Repo pointers

| what | where |
|---|---|
| the four handlers | `server/server.js` — suggest `:1028`, search `:1172`, segment `:1486`, word-popup `:1542` |
| sense ranking | `server/senseRank.js` |
| DB selection + fallback | `server/server.js` `:788–830` (`hasSplitDbs`) |
| frequency tiers | `server/server.js` `getFreqTier()` |
| serverless app (what Vercel runs) | `api/[...path].js` |
| route coverage ratchet | `scripts/validate-api-routes.mjs` |
| tracking issue | #49 |
