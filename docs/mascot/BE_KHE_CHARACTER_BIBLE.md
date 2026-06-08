# Bé Khế — Character Bible & Script Bank

**Purpose:** Give the Learn app a storyteller-guide with a consistent voice and an emotional reaction at every stage — the way Duolingo's Duo makes the app *feel* like someone is rooting for you. This is a content + interaction spec. **No code changes here**; everything is written to drop into the existing `i18n.js` strings and the existing feedback / sound / haptic surfaces.

**Who this maps onto in the current build:** `FeedbackBanner.jsx` (answer reactions), `LessonGame.jsx` (lesson intro + complete + streak notifications), `OnboardingFlow.jsx` + `AppTutorial.jsx` (first-run voice), `src/lib/i18n.js` (string store), `src/utils/sound.js` + `src/utils/haptics.js` (the sensory layer that already exists).

---

## Part 1 — Who is Bé Khế?

### The character

**Bé Khế** ("Little Starfruit" — *bé* = little kid, *khế* = starfruit) is the small yellow star already in your logo: a starfruit cut crosswise is a five-point star, so the mascot is literally a star *and* a fruit *and* a kid. In the logo Bé Khế has big sparkly eyes, rosy cheeks, two leaf-sprouts on top, a school satchel on the back, and an open book in hand, floating among Vietnamese vowels (A, ă, â).

That image already tells the whole story, and the scripts must protect it: **Bé Khế is a fellow student, not a teacher.** They are a curious little kid who started learning Vietnamese a few weeks before you did — far enough ahead to guide, close enough to remember being lost. They explore the language *with* the learner, not above them.

### Story DNA (why a starfruit)

The starfruit is the heart of one of Vietnam's most famous folktales, **"Ăn khế trả vàng"** ("Eat my starfruit, repay with gold") — a magic starfruit tree and a giant bird that rewards a kind, humble person with gold. You don't need to retell the tale, but it gives Bé Khế a thematic backbone the storyteller voice can lean on:

- **Kindness and patience are rewarded.** Bé Khế is never harsh. Effort earns "gold" (XP/coins/stars).
- **Small things grow.** A tiny seed → a tree heavy with fruit. Mirrors a beginner → speaker. Great metaphor for streaks and milestones ("look how much you've grown 🌱").
- **The journey/adventure framing.** Like the folktale's voyage to the island of gold, the curriculum is a journey Bé Khế narrates.

### Personality (the chosen direction: playful & naive but smart and funny — a kid's best friend)

| Trait | What it sounds like |
|------|---------------------|
| **Curious & naive** | Asks "wait, why does Vietnamese do that??" — discovers rules *with* the learner, sometimes out loud. |
| **Secretly smart** | Drops a genuinely useful memory trick right after the naive joke. Naive in delivery, sharp in substance. |
| **Funny, kid-logic humor** | Silly comparisons, mild mock-drama, wordplay. Never sarcasm aimed at the learner. |
| **Warm & loyal** | Always on the learner's side. When you fail, Bé Khế fails *with* you ("ugh, that one got me too"). |
| **Easily delighted** | Genuinely thrilled when you get things right. The joy is sincere, not performative. |

**One-line voice test:** *If a bright, funny 8-year-old who happens to know Vietnamese were cheering you on, would they say this?* If it sounds like a textbook, a brand, or a sarcastic adult, rewrite it.

### Voice rules

**DO**
- Keep lines **short** — 1 sentence for reactions, 1–2 for intros. Kids don't monologue.
- Use **"we" and "us"** for the journey ("let's", "we got this"), **"you"** for praise ("YOU did that").
- Sprinkle **one tiny bit of real Vietnamese** in cheers and intros, always instantly clear from context or with a 1-word gloss — this teaches micro-vocab and keeps the world authentic (see the "Vietnamese sprinkle" device below).
- Let Bé Khế be **wrong/confused occasionally** ("I always mix these two up too") — it lowers the stakes for the beginner.
- Use **at most one emoji** per line, and only where it adds warmth.

**DON'T**
- No sarcasm or guilt aimed at the user ("you finally showed up" — never). Bé Khế can tease *itself*, not the learner.
- No long grammar lectures in the mascot voice — defer real grammar to the Tip Chip / Notebook (those can be neutral). Bé Khế *points* at the tip; it doesn't *become* the tip.
- No adult idioms, no slang that dates fast, no corporate cheer ("Way to crush those KPIs!").
- Don't overuse the learner's name — it gets creepy fast. Name appears at big moments only.
- Never punish failure emotionally. Wrong answers get curiosity and a hand up, not a frown.

### The "Vietnamese sprinkle" device

Because Bé Khế lives in Vietnamese, the cheers occasionally *are* Vietnamese — a deliberate, repeatable teaching trick. Keep the set tiny and consistent so learners actually absorb them:

| Vietnamese | Meaning | Used for |
|-----------|---------|----------|
| **Tuyệt!** | Awesome! | big correct |
| **Giỏi quá!** | So clever! / Well done! | streak / mastery |
| **Đúng rồi!** | That's right! | correct |
| **Cố lên!** | Keep going! / You can do it! | wrong answer, encouragement |
| **Không sao!** | It's okay! / No worries! | wrong answer |
| **Tới luôn!** | Let's go! | lesson start |

First time each appears, pair it with the English ("**Tuyệt!** That's 'awesome,' by the way 😎"). After that, Bé Khế can use it bare — the learner has learned a word from their cheerleader.

### Expression states (for art/animation later)

The logo is one pose (happy-idle). For microinteractions, define a small set of expressions so an illustrator/animator has a target. These are **states**, each reused across many moments:

1. **Idle / happy** — the logo pose. Default, breathing/bobbing loop.
2. **Cheer (small win)** — one arm up, quick sparkle. For each correct answer.
3. **Celebrate (big)** — both arms up, confetti, leaf-sprouts bounce. Lesson complete, level up.
4. **Oops / supportive** — head tilt, gentle worried-but-kind face, reaches a hand toward you. Wrong answer.
5. **Thinking** — finger to chin, book open, a "?" Hmm moments, tips, intros.
6. **Wow / starstruck** — eyes huge, sparkling. New milestone, mastery, perfect lesson.
7. **Sleepy / waiting** — droopy, leaning on the satchel. Return-after-absence, idle/empty states.
8. **Reading / storyteller** — holding the book open toward the learner. Unit intros, story moments, Notebook.

> Cheap path to start: even without full animation, swap a **static expression PNG** + a CSS pop/shake (the feedback banner already uses inline keyframes) and you get 80% of the feeling. Lottie can come later.

---

## Part 2 — The emotional arc (every stage → reaction)

This is the map of *where* Bé Khế shows up and *what emotion* they bring. Modeled on how Duolingo attaches an emotional beat to each moment instead of leaving the UI cold. Each row ties a stage to an expression, the existing sound/haptic, and which script-bank keys to pull.

| App stage | Learner feeling | Bé Khế brings | Expression | Sound (`sound.js`) | Haptic | Script keys |
|-----------|-----------------|---------------|-----------|--------------------|--------|-------------|
| First open / welcome | Curious, unsure | Friendly hello, low pressure | Idle→Cheer | `playSelect` | tap | `bekhe_welcome_*` |
| Tone teaser (the hook) | "Whoa, it's tonal?" | Shared discovery, intrigue | Wow | `playNotification` | notification | `bekhe_teaser_*` |
| Onboarding steps | Setting up | Light, quick, warm | Idle | `playTap` | tap | `bekhe_onb_*` |
| Tutorial / first node | "What do I do?" | Clear, excited pointing | Reading | `playSelect` | select | `bekhe_tutorial_*` |
| Lesson/module intro | Bracing for new stuff | Sets the scene, "here's the fun part" | Reading→Thinking | — | — | `bekhe_intro_*` |
| **Correct answer** | Small win | Genuine delight | Cheer | `playSuccess` | success | `bekhe_correct_*` |
| **3 / 5 / 10 streak** | On a roll | Rising hype | Celebrate | `playCelebration` | success | `bekhe_streak_*` |
| Halfway through lesson | Maybe flagging | Quick "we're halfway!" boost | Cheer | `playNotification` | notification | `bekhe_halfway_*` |
| **Wrong answer** | Disappointed | Curiosity + a hand up, never blame | Oops/supportive | `playError` | error | `bekhe_wrong_*` |
| Wrong again (same item) | Frustrated | "Let's slow down together" + the trick | Thinking | `playError` (softer) | error | `bekhe_retry_*` |
| Lesson complete | Proud | Big celebration + name | Celebrate | `playCelebration` | success | `bekhe_complete_*` |
| Checkpoint / unit test pass | Relief + pride | Triumph, "you earned this gold" | Wow | `playCelebration` | success | `bekhe_test_pass_*` |
| Checkpoint fail | Discouraged | Reframe as practice, zero shame | Oops/supportive | `playNotification` | notification | `bekhe_test_fail_*` |
| Unit unlock / level up | Achievement | Storyteller "new chapter opens" | Celebrate→Reading | `playCelebration` | success | `bekhe_unlock_*` |
| Daily streak milestone | Habit forming | Pride in consistency, growth metaphor | Wow | `playCelebration` | success | `bekhe_dstreak_*` |
| Return after absence | Sheepish | Warm welcome-back, never guilt | Sleepy→Cheer | `playNotification` | notification | `bekhe_return_*` |
| Streak about to break | Anxious | Gentle nudge | Thinking | `playNotification` | notification | `bekhe_streak_save_*` |
| Streak lost | Bummed | "Trees regrow. Let's plant again." | Oops→Idle | `playSelect` | tap | `bekhe_streak_lost_*` |
| Empty / idle state | Bored/lost | Inviting prompt | Sleepy | — | — | `bekhe_empty_*` |
| Tip Chip / Notebook open | Wants to understand | Points to the explanation | Reading | `playSelect` | select | `bekhe_tip_*` |

### Microinteraction recipe (how a single moment is built)

Every reaction = **line + expression + sound + haptic + motion**, fired together. Example, a correct answer:

```
TRIGGER: answer checked === correct
  • LINE:      random from bekhe_correct_pool   →  "Đúng rồi! Nailed it."
  • EXPRESSION: Cheer (swap sprite / show cheer PNG)
  • MOTION:    pop scale 1→1.15→1 over 220ms (reuse FeedbackBanner spring easing)
  • SOUND:     playSuccess()        (already TOGGLE_ON + success haptic)
  • HAPTIC:    success  [12,35,18]  (already bundled in playSuccess)
  • BANNER:    existing green FeedbackBanner, now with Bé Khế avatar on the left
```

And a wrong answer — the emotionally important one:

```
TRIGGER: answer checked === incorrect
  • LINE:      random from bekhe_wrong_pool  →  "Không sao! That tone is sneaky. Here's the real one:"
  • EXPRESSION: Oops/supportive (NOT sad-at-you — concerned-FOR-you, hand reaching)
  • MOTION:    gentle head-tilt wobble ±4°, NO harsh shake on the mascot itself
               (keep the existing input-shake on the answer row if wanted, but Bé Khế stays kind)
  • SOUND:     playError()  — consider a SOFTER variant; the current TOGGLE_OFF can feel buzzy
  • HAPTIC:    error [25,40,25]  (already bundled)
  • BANNER:    existing red banner shows the correct answer; Bé Khế adds the one-line trick
```

**Design rule for failure:** the *interface* can register "incorrect" crisply (red, the answer reveal), but **Bé Khế's body language must read as on-your-side**. Duolingo's wrong-answer Duo looks concerned, not angry. Same here.

**Anti-annoyance rules** (so the charm doesn't curdle):
- Reaction lines are **pools, picked at random, no immediate repeats** — never the same cheer twice in a row.
- Bé Khế speaks on **meaningful beats**, not literally every tap. Correct/wrong yes; scrolling a list, no.
- Respect the existing **sound/haptic toggles** (`vnme_sound_enabled`, `vnme_haptics_enabled`). If sound's off, the line + motion still carry the emotion.
- On **tone-listening** exercises specifically, a wrong answer should **replay the audio**, not just buzz — failing to hear a tone is a cue to listen again, not a penalty.

---

## Part 3 — The Script Bank (i18n-ready)

Drop these into `src/lib/i18n.js` under the `en` object (then mirror into `zh-s` / `zh-t`). Arrays are **random pools**; the app already does this for `feedback_praise`. Keys use the `bekhe_` prefix. `{name}`, `{unit}`, `{tone}`, `{n}`, `{days}` are interpolation slots.

> **Localization note for translators:** keep the *personality* (playful kid-friend), not the literal words. The "Vietnamese sprinkle" words (Tuyệt!, Cố lên!…) **stay Vietnamese in every language** — they're content, not UI. Jokes should be re-invented per language, not translated literally.

### 3.1 Welcome & onboarding

```js
bekhe_welcome_1: "Hi! I'm Bé Khế — a little starfruit who's learning Vietnamese, same as you. Want to learn it together?",
bekhe_welcome_2: "Oh, a new friend! I'm Bé Khế. I'm a star, technically. Cut a starfruit and — ta-da — star. Anyway, let's learn Vietnamese!",
bekhe_onb_name: "What should I call you? (I'll try really hard to remember.)",
bekhe_onb_name_done: "{name}! Got it. We're officially a team now.",
bekhe_onb_goal: "Why Vietnamese? No wrong answer — I just like knowing things about my friends.",
bekhe_onb_voice: "Pick a voice you like listening to. Your ears are about to do a LOT of work.",
bekhe_onb_goal_done: "Ooh, good reason. Okay, I have a plan for us.",
bekhe_onb_dailygoal: "How much do you want to learn each day? Even a tiny bit grows into something big — trust me, I'm a fruit.",
```

### 3.2 The tone teaser (the hook)

```js
bekhe_teaser_intro: "Before anything — listen to these two. Tell me: same word, or different?",
bekhe_teaser_reveal_diff: "DIFFERENT! Same letters, but the TONE changed the whole meaning. Vietnamese has six of these. Wild, right?",
bekhe_teaser_hook: "Here's the secret: once your ears can hear the six tones, the rest gets WAY easier. So that's where we start. Tới luôn — let's go!",
```

### 3.3 App tutorial (rewrite the existing `app_tutorial_*` in voice)

```js
bekhe_tutorial_roadmap: "This is our map! We start at the very bottom and climb. Tap the glowing one — that's our first stop.",
bekhe_tutorial_foundations: "First up: Foundations. We learn to HEAR Vietnamese before we speak it. It's the most important part, so we do it first.",
bekhe_tutorial_hearts: "See these? They're your tries. Run out and we take a little break — no big deal, they come back.",
bekhe_tutorial_done: "That's everything! Okay okay okay — I'm excited. Let's actually start.",
```

### 3.4 Foundations module intros (Unit 0 — match the 16 current nodes)

```js
bekhe_intro_alphabet: "The Vietnamese alphabet looks almost like English... and then it has extra letters wearing little hats. Let's meet them.",
bekhe_intro_vowels_basic: "Vowels first. These are the sounds everything else sits on top of. Open your ears!",
bekhe_intro_vowels_special: "Now the special vowels — ơ, ư, ê, ô. English doesn't have these, so they feel weird at first. That's normal!",
bekhe_intro_consonants: "Consonants time. Most are easy. A couple are sneaky. I'll warn you about the sneaky ones.",
bekhe_intro_consonants_final: "Ending sounds matter a LOT in Vietnamese. A different ending = a different word. Let's get them crisp.",
bekhe_intro_vowels_diph: "Two vowels holding hands! When they team up, they make a brand new sound. Cute, honestly.",
bekhe_intro_tones_1: "THE BIG ONE. Tones. Today just two: a flat one and a falling one. Hear the difference and you're already winning.",
bekhe_intro_tones_2: "Adding the rising tone — it goes UP, like a question your voice asks. Listen for the lift.",
bekhe_intro_tones_3: "Now the dipping tone — it dives down then climbs back. It's the dramatic one. I love it.",
bekhe_intro_tones_4: "Hỏi vs ngã — okay these two are TWINS and even I mix them up. We'll figure them out together.",
bekhe_intro_tones_5: "All six tones at once. This felt impossible to me a week ago and now look at me. You're gonna get it.",
bekhe_intro_tones_speak: "Your turn to SAY them. Be brave, be loud, be a little silly. Nobody's judging — I'm a fruit.",
bekhe_intro_tonemarks: "Let's match each little mark to its sound. Once you can read the marks, you can read the tones. Superpower unlocked.",
bekhe_intro_checkpoint: "Checkpoint! Show me your ears are ready. Get through this and Unit 1 opens up. I believe in you.",
```

### 3.5 Per-unit intro & outro (Units 1–9; storyteller "new chapter" framing)

```js
// intros
bekhe_unit1_intro: "Our first real words! Greetings and names — exactly what you'd say walking into a room in Vietnam. Let's make a first impression.",
bekhe_unit2_intro: "Time to be polite. Vietnamese has special words just for being nice, and people NOTICE when you use them. Free charm points.",
bekhe_unit3_intro: "Café time! ☕ My favorite. We're going to order drinks like we belong here.",
bekhe_unit4_intro: "Food and prices — the two things you'll use most, honestly. Let's not overpay, okay?",
bekhe_unit5_intro: "The market! It's loud, it's fun, and we're going to bargain a little. Confidence is the trick.",
bekhe_unit6_intro: "Numbers, leveled up. Big ones now. Don't panic — there's a pattern, and patterns are my thing.",
bekhe_unit7_intro: "Getting around! Grab, taxis, motorbikes, directions. Let's make sure we never get lost.",
bekhe_unit8_intro: "Everyday life stuff — the words you'd actually use every single day. The quiet useful ones.",
bekhe_unit9_intro: "Talking with people! Making friends, small talk. This is where Vietnamese starts to feel real.",
// outros
bekhe_unit_outro_1: "Chapter done! 🌟 Feel that? You can do something now you couldn't an hour ago. Onward.",
bekhe_unit_outro_2: "Look how far we climbed. The tree's getting taller. Ready for the next branch?",
bekhe_unit_outro_3: "That's a wrap on this one. I'm genuinely impressed — and I have very high standards for a starfruit.",
```

> For Units 10–39, reuse `bekhe_unit_outro_*` as a rotating pool and write one intro line each following the same template: *one concrete scene + one reason it matters + a tiny dare/invite.*

### 3.6 Correct-answer pool (mix English + the Vietnamese sprinkle)

```js
bekhe_correct_pool: [
  "Đúng rồi! That means 'correct' — and you are!",
  "Tuyệt! (That's 'awesome,' by the way.) 😎",
  "YES. You heard it. I saw your ears work.",
  "Giỏi quá! So clever.",
  "Nailed it. Don't even act surprised.",
  "Ooh, smooth. Do it again, I liked that.",
  "Correct! Okay you're kind of good at this.",
  "That's the one! *leaf-sprouts wiggle*",
  "Perfect. We make a great team, huh?",
  "Yep yep yep! Keep that energy.",
  "Chuẩn! ('Spot on.') Look at you go.",
  "Easy for you now, apparently. Proud!"
],
bekhe_correct_typo: "Right idea! Tiny spelling wobble — here's the clean version:",
bekhe_correct_first_try: "First try?! Showing off. I love it.",
```

### 3.7 Streak (in-lesson combo)

```js
bekhe_streak_3: "Three in a row! We're cooking. 🔥",
bekhe_streak_5: "FIVE straight! Giỏi quá! Okay now I'm hyped.",
bekhe_streak_10: "TEN. In. A. ROW. Who ARE you?? Incredible.",
bekhe_halfway_pool: [
  "Halfway! The hard part's behind us.",
  "We're at the top of the hill — easy from here.",
  "Look, halfway already. Time flies when you're brilliant."
],
```

### 3.8 Wrong-answer pool (curiosity + a hand up, never blame)

```js
bekhe_wrong_pool: [
  "Không sao! ('No worries.') Here's the one we wanted:",
  "Ooh, so close. That tone is genuinely sneaky. Look:",
  "Honestly? That one got me too. The answer's:",
  "Cố lên! ('Keep going!') Not quite — it's actually:",
  "Almost! Tiny miss. The word we needed:",
  "Nope — but a GOOD nope, you were close. It's:",
  "Hmm, not this time. Let's see the right one together:",
  "That meant something else (sneaky language). Here you go:",
  "No biggie — even my leaves get confused. Correct one:",
  "Eh, language is tricky. Here's the fix:"
],
bekhe_retry_pool: [
  "Okay let's slow WAY down and do it together. Listen again:",
  "Same one again — no rush. Here's a trick to remember it:",
  "Take a breath. We'll get this one. Tiny hint:"
],
bekhe_tone_replay: "Let your ears try once more — here it is again. 👂",
```

### 3.9 Lesson complete

```js
bekhe_complete_pool: [
  "Lesson DONE! 🌟 {name}, you earned every bit of that gold.",
  "And... finished! Feel how that got easier near the end? That's you learning in real time.",
  "We did it! High-five. (I have little starfruit hands but I mean it.)",
  "Complete! The tree grew a little taller today. 🌱",
  "That's a wrap! You knew zero of those words this morning. Wild."
],
bekhe_complete_perfect: "PERFECT lesson — no misses! Tuyệt vời! I'm framing this moment.",
bekhe_complete_recap: "Today you learned to say: {recap}. Carry it out into the world!",
```

### 3.10 Checkpoint / unit test

```js
bekhe_test_pass_pool: [
  "You PASSED! 🏆 Ears officially tuned. The next chapter is yours.",
  "Checkpoint cleared! I never doubted us. (Okay, maybe a little. Not anymore.)",
  "Giỏi quá! That's a real milestone. Gold well earned."
],
bekhe_test_fail_pool: [
  "Not through yet — and that's totally fine. Tests are just practice with a fancy hat. Let's run it back.",
  "Almost there! A couple slipped. We'll warm those up and try again — no shame, only reps.",
  "Trees don't grow in one day. Quick review, then we go again. Cố lên!"
],
```

### 3.11 Unlock / level up

```js
bekhe_unlock_pool: [
  "A new chapter just opened! *flips the book dramatically* Come see.",
  "Level up! 🌟 New words, new places, same great team.",
  "Ding! You unlocked the next part of the map. The adventure continues."
],
```

### 3.12 Daily streak milestones

```js
bekhe_dstreak_1: "Day one! Every tree starts with one seed. See you tomorrow? 🌱",
bekhe_dstreak_3: "Three days straight! A habit is sprouting. I can feel it.",
bekhe_dstreak_7: "A WHOLE WEEK! 🔥 Seven days. You're not messing around.",
bekhe_dstreak_30: "Thirty days! 🌳 Look at this tree we grew. I'm a little emotional.",
bekhe_dstreak_100: "ONE HUNDRED DAYS. {name}. You're basically my hero now. Giỏi quá nhất! (The MOST clever.)",
```

### 3.13 Return after absence / streak save / streak lost

```js
bekhe_return_pool: [
  "You're back! 🌟 I kept your spot warm. Ready when you are.",
  "There you are! No 'where were you' from me — just happy you're here. Let's go.",
  "Welcome back, friend! The tree missed you. Let's water it."
],
bekhe_streak_save: "Psst — your streak's about to wilt! One quick lesson keeps it alive. I'll wait right here.",
bekhe_streak_lost_pool: [
  "Streak reset — but hey, trees regrow. We plant a new one today. Không sao!",
  "Lost the streak, kept the words. That part's still yours. Let's start a fresh one."
],
```

### 3.14 Empty / idle states & Tip/Notebook voice

```js
bekhe_empty_roadmap: "Nothing here yet — but down there? That glowing lesson has your name on it.",
bekhe_empty_notebook: "Your notebook's empty for now. Finish a lesson and I'll jot down everything we learn. ✏️",
bekhe_tip_peek: "Psst — there's a why behind this one. Tap the 💡 if you're curious.",
bekhe_tip_intro: "Here's the trick I used to remember this:",
bekhe_notebook_intro: "Everything we've learned so far, all in one place. I take good notes for a fruit.",
```

---

## Part 4 — Implementation notes (for whoever builds it; still no edits made here)

1. **Strings only, to start.** Every line above is an `i18n.js` key. Wiring them needs no new systems — `FeedbackBanner` already picks a random praise string; point it at `bekhe_correct_pool` / `bekhe_wrong_pool` instead.
2. **Add an avatar slot.** The single highest-impact visual change: render a small Bé Khế avatar (even one static PNG per expression state) beside the feedback banner and on the lesson-complete screen. Expression swaps + the existing CSS spring/shake = the whole feeling, cheaply.
3. **Reuse the sensory layer.** `playSuccess` / `playError` / `playCelebration` and the haptic patterns already exist and already respect user toggles. Map them per the Part 2 table; the only suggested *new* asset is a softer error sound for the wrong-answer moment.
4. **Random-pool helper.** Add a tiny "pick random, avoid last shown" util (the praise array proves the pattern) so reaction lines never repeat back-to-back.
5. **Respect the beginner zone.** Through Foundations + Unit 1, keep failure 100% pressure-free and let Bé Khế carry the encouragement. Stakes (hearts/streaks) ramp in later, exactly as the flow doc proposes.
6. **One persona, many surfaces.** The same voice rules apply whether Bé Khế is in onboarding, a lesson, a push notification, or an empty state. Consistency is what makes a mascot feel *alive* instead of like scattered UI copy.

### Quick wins, in order
1. Swap feedback praise/again strings → `bekhe_correct_pool` / `bekhe_wrong_pool` (pure string change).
2. Add Bé Khế avatar + expression states to the feedback banner and lesson-complete screen.
3. Add module/unit intro lines (`bekhe_intro_*`, `bekhe_unitN_intro`) to the lesson-start screen.
4. Add the tone teaser to onboarding with `bekhe_teaser_*`.
5. Add return / streak / daily-streak lines to the relevant notifications.
```
