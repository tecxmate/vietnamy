# Narrated Reader — Prototype Plan

Turn the Reading page into a **narrated slide presentation**: a deck of explanatory (annotated-photo) slides up top that auto-advance in sync with an audio narration below, where the transcript highlights word-by-word and any word can be tapped for its meaning. Practical, informational content — "what to expect at the airport in Vietnam," how the đồng works, how to use Grab — that helps a learner *do real things* while learning to listen and read.

Companion: **`docs/prototypes/narrated-reader-prototype.html`** — open it in a browser, press ▶, tap words while it plays. It demonstrates every interaction described here.

**Decisions locked in (from review):**
- Word highlighting v1 = **approximate syllable-estimate sweep** (no backend change).
- Slide visuals = **annotated real photos**.
- Modes in scope = **Listen + Read** core, plus **Save phrase** and **Explain**. (Shadowing/Dictation deferred.)

---

## 1. How it maps onto what you already have

This is more reassembly than new building. The reusable pieces already exist:

| Need | Already in the app | Status |
|---|---|---|
| Tap a word → meaning | `TappableVietnamese` + `WordPopup` + `/api/segment` (compound-aware) + `/api/word-popup` | **Reuse as-is** |
| Vietnamese audio | `buildTtsUrl(text,'vi',voice)` → `/api/tts` (Azure, cached to CDN) | **Reuse as-is** |
| Preload for instant play | `preloadSpeak([...])` | **Reuse as-is** |
| Article content + reader | `ReadingLibraryTab.jsx` → `ArticleReaderView`, `articleData.js`, `ArticleEditor.jsx` | **Extend** |
| Save word/phrase to review | `srs.js` (`addItemsFromLesson`, `recordReview`) | **Reuse / wrap** |
| Word highlighting synced to audio | — | **New (v1 = client-only)** |
| Slide layer (per-topic photos) | articles have one hero image only | **New (schema + UI)** |
| Per-line "Explain" note | sentences already carry a `note` field in some data | **Extend schema + UI** |

The two genuinely new pieces are the **karaoke sweep** (a client-side timing loop) and the **slide layer** (schema + a top stage). Neither needs a backend change for v1.

---

## 2. The screen (anatomy)

```
┌─────────────────────────────┐
│  ‹   Ở sân bay   A1 · 5 slides  🔖 │  top bar
├─────────────────────────────┤
│   ┌───────────────────────┐  │
│ ‹ │   ANNOTATED PHOTO      │ ›│  SLIDE STAGE (~35% height)
│   │   • callout  • callout │  │  auto-advances with narration
│   │   caption …            │  │  · manual ‹ › + dots
│   └───────────────────────┘  │
├─────────────────────────────┤
│  Listen & Read   Shadowing*  │  mode strip (* deferred)
├─────────────────────────────┤
│  Xin chào! Hôm nay chúng ta │  TRANSCRIPT (scrolls)
│  tìm hiểu về sân bay…        │  · current sentence = cyan
│  Hello! Today we'll learn…   │  · words sweep teal→lime
│  📌 Save phrase   ✦ Explain  │  · tap word → popup
├─────────────────────────────┤
│ 0:23 ▓▓▓▓▒▒▒▒▒▒ 1:48   1.0x  │  PLAYER
│  ⏮  ✦Explain (▶) 📌Save 🔁  │  play/scrub/speed/jump/loop
└─────────────────────────────┘
```

The **slide stage and the transcript are driven by the same clock.** As narration reaches a sentence, (a) that sentence becomes active and its words sweep, and (b) if the sentence belongs to a different slide, the deck flips to it. One playhead, two synchronized views — that's the whole trick.

---

## 3. Content schema (new "explainer" content type)

Extend the article shape into an **explainer**: a topic = ordered slides + ordered sentences, where each sentence points at the slide it belongs to. Backward-compatible with today's `{vi,en,zh,sentences[]}`.

```jsonc
{
  "id": "exp_airport_arrival",
  "type": "explainer",                 // distinguishes from plain "article"
  "title": { "vi": "Ở sân bay", "en": "At the airport", "zh": "在机场" },
  "category": "travel",                // ties into curriculum purpose tags
  "cefr": "A1",
  "purposes": [{ "id": "travel", "weight": 1.0 }],   // see sequencer spec

  "slides": [
    {
      "id": "s1",
      "image": "https://cdn/.../airport_arrival.jpg",  // annotated real photo
      "caption": { "en": "Landing & finding Immigration", "vi": "..." },
      "callouts": [                    // OPTIONAL: rendered as pins over the photo
        { "x": 0.58, "y": 0.30, "label": "Nhập cảnh →" },
        { "x": 0.20, "y": 0.62, "label": "follow the signs" }
      ]
    }
  ],

  "sentences": [
    {
      "id": "exp_airport_arrival_001",
      "slide": "s1",                   // which slide is shown while this is narrated
      "vi": "Xin chào! Hôm nay chúng ta tìm hiểu về sân bay ở Việt Nam.",
      "en": "Hello! Today we'll learn about airports in Vietnam.",
      "zh": "...",
      "note": "“tìm hiểu về …” = “to learn about …”.",   // shown in Explain
      "save": ["tìm hiểu", "sân bay"]   // OPTIONAL: phrases pre-flagged as worth saving
    }
  ]
}
```

Notes:
- **Sentence → slide is many-to-one.** A slide can span several sentences; the deck only flips when the slide id changes. This is what makes ~10 slides cover a 2–4 minute narration naturally.
- **`callouts` are normalized coordinates (0–1)** so the same data works at any image size. The pins (dot + label) render over the photo — that's how a plain photo becomes an *annotated* photo without baking text into the image (and keeps labels translatable).
- **No word array is stored.** Tokenization happens at runtime via the existing `/api/segment` (compound-aware), exactly like the current reader. Timing is computed from the tokens (next section). This keeps authoring to plain sentences.
- `note` powers **Explain**; `save` (optional) pre-marks high-value phrases. Both are author-light.

---

## 4. The karaoke sweep (v1: syllable estimate)

No word timings come back from your TTS today, so v1 *estimates* them on the client — good enough to feel like karaoke, zero backend work.

**Per sentence:**
1. Get the audio clip duration (from the `<audio>` element's `loadedmetadata`, or the cached duration).
2. Tokenize via `/api/segment` → tokens (compounds intact), skip pure punctuation.
3. Give each token a **weight** ≈ its syllable count (Vietnamese ≈ 1 syllable per written syllable; compounds like "băng chuyền" = 2). Add a small base so short words aren't too fast:
   `weight(tok) = BASE + PER_SYLLABLE × syllables(tok)`
4. Distribute the **real clip duration** across tokens proportional to weight:
   `dur(tok) = clipDuration × weight(tok) / Σ weights`
5. On `timeupdate` (or a rAF loop), highlight the token whose cumulative window contains `audio.currentTime`. Past tokens = "spoken" (teal), current = "current" (lime), future = plain.

Because step 4 scales to the **actual** clip length, drift stays bounded to within a sentence and resets every sentence boundary — the error never accumulates across the whole narration. The prototype implements exactly this (with a synthetic clock standing in for the audio clip).

**Known v1 limitation to handle in the real build:** resume-after-pause should continue from the current `audio.currentTime`, not restart the sentence. (The HTML prototype restarts the sentence on resume for simplicity — the production version binds to the real audio element's clock, which makes resume free.)

**v2 (when you want pixel-perfect, reusable in lessons too):** switch the server's Azure path from the REST endpoint to the **Speech SDK**, capture `WordBoundary` events, and store `[{ token, offsetMs, durMs }]` alongside the cached clip; serve via a new `/api/tts-timed`. The client then highlights on exact offsets instead of estimates. Same UI, just swaps the timing source. Worth doing once, because lesson `speak`/`listen` features benefit too.

---

## 5. Slide ↔ audio sync

Trivial once sentences carry a `slide` id: a single function maps the playhead to a slide.

```
onSentenceActivate(sentence):
    highlightSentence(sentence)
    if sentence.slide !== currentSlide:
        crossfadeTo(sentence.slide)      // .45s opacity fade
        updateDots()
```

Manual control coexists: tapping ‹ › or a dot just calls `showSlide(i)`; if the user scrubs audio, the slide snaps to whatever the new sentence dictates. The deck never gets out of sync because it's always derived from the playhead, never independent state.

---

## 6. Annotated-photo pipeline

Since slides are real photos with overlaid callouts:

- **Storage:** `slide.image` is a URL (same as today's hero image — CDN/Unsplash/your bucket). No new infra; the existing image field pattern extends to N images.
- **Annotation lives in data, not pixels:** `callouts[]` (normalized x/y + label) render as pins on top. Benefits: labels stay translatable (en/vi/zh), editable without re-exporting an image, and crisp at any density.
- **Authoring/admin:** extend `ArticleEditor.jsx` into an explainer editor — add a slides list (image URL + caption + a click-to-place callout editor) and a `slide` dropdown on each sentence. This matches your existing CMS pattern (localStorage override → bundled default), so it's the same mechanics as the vocab/article editors.
- **Sourcing the ~10 photos per topic:** real shots of Tân Sơn Nhất / Nội Bài arrivals, money, ATM screens, the Grab app. Where you can't get a clean real photo, a labeled diagram slide is a fine substitute — the schema doesn't care.

---

## 7. Save phrase & Explain

- **Save phrase** → push the sentence (or a tapped phrase) into the existing **SRS** (`addItemsFromLesson`-style insert). This quietly connects the reader to the review system: useful airport phrases become spaced-repetition cards. A counter/toast confirms.
- **Explain** → a bottom sheet showing the line, its translation, and the `note` (a short usage/grammar point in plain language — the same voice as the in-lesson Tip Chip, not a lecture). Optional later: a "deeper explain" that calls your dictionary/grammar data for the specific grammar tag.

Both are per-line, lightweight, and reuse systems you already have.

---

## 8. Build phases

**Phase 1 — Core reader (ship the feel):**
Slide stage + transcript + the syllable-estimate sweep bound to the real cached TTS clips, driven by one playhead. Reuse `TappableVietnamese`/`WordPopup` for tap-to-mean. This is the whole experience on existing infrastructure.

**Phase 2 — Authoring + content:**
Extend `ArticleEditor` to an explainer editor (slides + callouts + sentence→slide). Author the first 3–4 practical topics (airport arrival, money/đồng, Grab/transport, SIM/data) with real annotated photos.

**Phase 3 — Save/Explain wiring:**
Hook Save → SRS, Explain → `note` sheet. Surface saved phrases in the existing review/library.

**Phase 4 (optional) — Exact timing:**
Azure Speech SDK word boundaries + `/api/tts-timed`; swap the estimate for exact offsets. Reusable across lessons.

**Phase 5 (optional) — More modes:**
Shadowing (reuse pronunciation scoring) and Dictation (reuse `listen_type`) as alternate tabs on the same content — the screenshot's three-tab idea, minus heavy video integration.

---

## 9. Open questions / things to decide

1. **Where does it live?** Stays in the `library` tab as a richer content type, or also surfaced inside the Learn path as "explainer" nodes (the content overlaps with travel-purpose lessons)? Recommendation: author once as an explainer, surface in both — library for browsing, and as optional path nodes tagged by purpose (ties into the sequencer spec).
2. **Continuous vs per-sentence audio.** v1 plays one cached clip per sentence (simplest, instant with preload). A single long narration clip would sound smoother but complicates the estimate and caching. Recommendation: per-sentence clips for v1; revisit with v2 timing.
3. **How many slides per topic.** ~10 is a good target but optional; the schema supports any N, and a slide can hold several sentences, so don't force exactly 10.
4. **Auto-advance vs manual.** Should the deck auto-flip during playback (recommended, it's the magic) with manual override always available — or stay manual and only highlight? The prototype auto-advances.
```
