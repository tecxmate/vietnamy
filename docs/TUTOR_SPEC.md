# AI Tutor (`/api/tutor`) — end-to-end spec

The chat-style teacher ("Bé Khế", the starfruit mascot). This layer adds **free-text conversation** on
top of the deterministic beat lessons. The golden rule, unchanged: **the LLM is
the voice and the interpreter — never the curriculum or the grader.**

---

## 1. Scripted vs LLM — who does what

| Concern | Owner | Why |
|---|---|---|
| What is taught, in what order | **Authored beats** | Strict, reviewable, stable |
| Grading taps (chips/MCQ/listen) | **Deterministic** | Can't be wrong, zero cost |
| Mastery score & pass/fail | **Deterministic** | Auditable, reproducible |
| Vietnamese facts (tones, words, IPA) | **Content bundle (injected)** | No hallucination |
| Warm replies to free text | **LLM** | Natural, handles ambiguity |
| Interpreting a fuzzy/confused reply | **LLM** | "uhh the falling one?" → intent |
| Answering side questions | **LLM (grounded)** | "dạ vs vâng?" |
| Grading a free-text "explain it back" | **LLM (rubric, structured verdict)** | Returns evidence, not a grade |

**The LLM is only called when the student *types*.** Tapping through a lesson =
**$0** (pure deterministic path). A chatty student pays per typed turn.

---

## 2. Conversation flow

```
beat plays (typing → message → optional widget)
   │
   ├─ student TAPS a widget  → deterministic grade → scripted feedback → advance   [no LLM]
   │
   └─ student TYPES free text → POST /api/tutor → {say, intent, action} → render + apply   [LLM]
                                   action ∈ stay | advance | reexplain | hint
```

A free-text input box sits under every beat. `checkpoint` beats *require* a typed
answer and are LLM-graded for mastery. Everything else is optional conversation.

---

## 3. Lesson format (v2)

```jsonc
Lesson {
  id, title,
  teacher: { name, emoji },
  objectives: [                       // what "getting it" means — drives the score
    { id, text, threshold }           // threshold 0..1 mastery to count as "got it"
  ],
  beats: [ Beat, … ]
}

Beat =
  | { type:'say',         text }
  | { type:'cards',       text, items:[{vi,en,emoji}] }
  | { type:'tone_explore',text, tones:[…] }
  | { type:'mcq',         text, options:[{label,correct}], correctNote, wrongNote, objective }
  | { type:'listen_pick', text, items, targetIndex, objective }
  | { type:'tone_listen', text, tones, targetToneId, objective }
  | { type:'checkpoint',  text, objective, rubric }   // free-text, LLM-graded
  | { type:'done',        text }
```

Interactive beats carry an `objective` id. Each contributes **evidence**
(`strong` first-try correct, `partial` correct-after-hint, `none` wrong) to that
objective's running mastery. Authoring a new lesson = a script file + a
`LESSONS` entry + (optional) a `teach_route` to surface it in Study.

---

## 4. `/api/tutor` contract

### Request (client → server)
```jsonc
POST /api/tutor
{
  "lessonId": "tones",
  "message": "wait is the falling one à or ã?",   // student free text
  "context": {
    "currentBeat": { "type":"mcq", "text":"which mark is falling?", "summary":"…" },
    "objectives": [ { "id":"recognize", "text":"recognize the 6 tone marks" }, … ],
    "objectiveStates": { "recognize": 0.5, "identify": 0.0 },   // durable "what they know"
    "recentTurns": [ { "role":"teacher", "text":"…" }, { "role":"student", "text":"…" } ]  // temp memory, last ~6
  }
}
```

### Response (server → client) — schema-validated
```jsonc
{
  "say": "Good question! The falling tone (huyền) is the grave mark “à”. “ã” is ngã, which dips and breaks. 😊",
  "intent": "question",            // answer | question | confused | offtopic | ready
  "action": "stay",                // stay | advance | reexplain | hint
  "masteryEvidence": "na"          // strong | partial | none | na  (for checkpoints)
}
```

The server forces this shape via Anthropic **tool use** (`tool_choice:
tutor_reply`), so malformed output self-retries. The client applies `action`:
`advance` moves to the next beat, `reexplain`/`hint` re-present the current beat,
`stay` just shows `say`.

---

## 5. System prompt & memory

**System prompt** (built server-side per request, cacheable):
- **Persona**: Bé Khế (the starfruit mascot) — warm, playful Vietnamese guide; replies are short, like texting.
- **Strict rules**: teach *only* this lesson's content; use only the Vietnamese facts in the injected context; if asked off-topic, redirect warmly in one line; never reveal you're an AI model; always return the structured reply.
- **Injected grounding** (the anti-hallucination layer): lesson title, objectives, the current beat's authored content, and the allowed `action`s.

**Memory, two tiers:**
- **Temp (conversational)** — a rolling window of the last ~6 turns, passed in the
  request, lives only for the lesson. Cheap, ephemeral.
- **Durable (what they know)** — the deterministic `objectiveStates` mastery
  vector. This is the real "memory" of progress; it persists with the learner
  and is injected so the teacher can adapt ("you've nailed recognition, let's
  train your ear").

**Prompt caching**: the system block + lesson grounding are static per lesson →
cached (5-min TTL) so repeat turns in a session are cheap.

---

## 6. Knowing when they "get it" + graceful end + score

100% deterministic (the LLM only *feeds* evidence at checkpoints):

1. Every interactive beat emits evidence to its `objective`.
2. `mastery[obj] = weighted(correct, attempts, first-try)` → 0..1.
3. An objective is **mastered** when `mastery[obj] ≥ objective.threshold`.
4. The lesson **ends** when beats reach `done` (or all objectives mastered early).
5. **Score** = `round(100 × mean(mastery across objectives))`; pass = all required
   objectives mastered.
6. **Closing screen**: score ring + per-objective ✓/⟳ ("Mastered: recognize
   tones · Review: ngã vs hỏi") + a Finish button. The numbers are deterministic;
   an optional LLM one-liner adds warmth, but never changes the score.

This is how we avoid the classic failure of "the model decides if you passed."

---

## 7. Inference cost

Per **typed** turn (Haiku-class model, the recommended default):

| Component | Tokens | Note |
|---|---|---|
| System + lesson grounding | ~900 in | **cached** after first turn |
| Recent turns + message | ~350 in | |
| Reply (structured) | ~120 out | short by design |

Rough per-turn cost ≈ **$0.0006–0.0015** (lower once the system block is cached).
A *chatty* lesson (~8 typed turns) ≈ **$0.005–0.012**. A tap-through lesson ≈ **$0**.

At 10k daily learners each doing one chatty lesson/day ≈ **~$50–120/day**.
Cost levers, in order: (1) only call on free text, (2) prompt-cache the system
block, (3) Haiku by default / escalate to Sonnet only for hard turns, (4) cap
`max_tokens` (~160) and the temp-memory window (~6 turns).
*(Prices are approximate — verify current Anthropic pricing.)*

---

## 8. Required input data & output, recap

- **Input data the feature needs**: the authored lesson (beats + objectives),
  the current beat, the rolling turn window, and the mastery vector. All already
  produced by the client director — no new content authoring for the LLM layer.
- **Output**: a validated `{ say, intent, action, masteryEvidence }` directive,
  plus (deterministically) an updated mastery vector and, at the end, a score.

---

## 9. Stability / failure modes

- **No API key** → server returns a deterministic, grounded fallback reply (the
  lesson still works end-to-end; this is the prototype's default).
- **Malformed model output** → tool-use schema forces retry; on hard failure the
  server falls back to `{action:'stay'}` + a safe message.
- **Latency** → stream `say`; show the typing indicator (already built).
- **Abuse / off-topic / cost** → per-user rate limit + max tokens + the scope
  guard in the system prompt; the model can't touch grading or the score.

---

## 10. Pronunciation scoring by language (IMPORTANT FINDING)

The `pronounce` beat records audio (`recordPCM`) and posts it to Azure Speech
via `/api/pronunciation`. How a take is scored depends on the language, because
**Azure Pronunciation Assessment supports only a limited set of locales — and
Vietnamese (`vi-VN`) is NOT one of them** (verified June 2026 against
[Azure language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support)).

What we observed for `vi-VN`: Azure does plain speech recognition (and its ASR
**is tone-aware** — it transcribes `má` with the sắc mark), returns
`status: Success`, but **omits the `PronunciationAssessment` object**, so every
score field is `null`. The symptom was the teacher repeating "I couldn't quite
hear that" even on perfect speech.

Two scoring paths, chosen automatically by what Azure returns:

| Path | When | How |
|---|---|---|
| **Phoneme assessment** | Azure returns `scores` (en-US, zh-CN, … — supported locales) | use `pronunciation`/`accuracy` %; ≥80 strong, ≥60 partial, else none |
| **Recognition match** (Vietnamese) | `scores` null but `status: Success` + `recognized` | compare the transcript to the target: exact (right tone) → **strong/90%**, right syllable but wrong tone → **partial/55%** + a "watch the tone" hint, different word → none |

For the wrong-tone check we strip the five Vietnamese tone marks
(huyền/sắc/ngã/hỏi/nặng = combining U+0300/0301/0303/0309/0323) while keeping
vowel-quality marks (circumflex/breve/horn). Recognition match is implemented
client-side in `TeacherChat.PronounceCard` (`normVi` / `stripViTone`).

**Why this is fine — even good:** for a tonal language the most important
pronunciation signal is *did you produce the right tone*, and tone-aware ASR
match captures exactly that. Phoneme-level detail (which Azure can't give for
Vietnamese anyway) is a refinement, not the core.

**Cross-language implication:** pronunciation-feature richness varies by
language. Supported locales get full phoneme assessment for free; unsupported
ones fall back to ASR recognition match (works wherever Azure has tone/word-
accurate ASR). Worth confirming Azure's assessment + ASR support per target
language before promising phoneme-level scoring in that language's course.

Also fixed alongside this: `recordPCM` resumes a possibly-`suspended`
AudioContext (Safari/Chrome) — without it the capture was silent — and added
voice-activity **auto-stop** (~2s of silence, 8s cap) so the learner doesn't
have to stop manually.

---

## 11. Model A/B — Vietnamese tone accuracy (June 2026)

Question: is OpenAI worse than Gemini at Vietnamese (more hallucination)? We
ran 6 Vietnamese tone questions × 3 models × grounded/ungrounded, judged each
answer against `content/tones.json` (CORRECT=1, PARTIAL=0.5, WRONG=0).

| Model | **Grounded** (what we ship) | Ungrounded |
|---|---|---|
| `gpt-4o-mini` | 92% | 83% |
| **`gpt-4.1-mini`** (chosen default) | **100%** | 83% |
| `gemini-2.5-flash` | 100% | 88% * |

\* Gemini's free tier **429'd mid-run** — even with pacing + retries, only 4 of
6 ungrounded calls completed. That operational unreliability (not accuracy) is
the real reason we moved off Gemini.

**Findings**
1. **Grounded, vendor barely matters** — all three land 92–100%. The injected
   `facts` ("use ONLY these") carry the accuracy; the model is the voice, the
   content is the truth.
2. **"OpenAI worse on Vietnamese" doesn't hold.** `gpt-4.1-mini` ties
   `gemini-2.5-flash` at 100% grounded. The earlier misses were the *cheap*
   `gpt-4o-mini` (a model-tier gap, not a vendor gap). Ungrounded, Gemini was
   marginally ahead (88% vs 83%) — consistent with Google's broader multilingual
   training — but only on the calls it managed to complete.
3. **Reliability decided it.** OpenAI ran every call clean; Gemini rate-limited
   itself out of the test.

**Decision:** default `TUTOR_MODEL = gpt-4.1-mini` (OpenAI). Matches Gemini's
grounded accuracy, fixes the `gpt-4o-mini` miss, and doesn't rate-limit. Keep
the grounding as the real safety net regardless of model. (Method:
`/tmp/ab.mjs` — re-runnable; swap the model list to re-test.)
