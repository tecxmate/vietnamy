# Bé Khế — Veo 2 Animation Prompt Pack

A set of prompts for generating short, loop-friendly Bé Khế clips you can frame-extract and background-remove for in-app animation. Each scenario maps to a Bé Khế **expression state** from the character bible, so the animations match the moments they'll be used in.

---

## 0. Read this first — pipeline notes (learned from your example clip)

Your sample (`1v.mp4`) looked great character-wise but had three things that hurt frame-extraction. These prompts fix all three:

1. **Flat chroma, edge to edge.** Your sample had a dusty-rose *panel* with a darker border, a drop-shadow under the feet, and a corner sparkle. For clean cutouts you want **one uniform color filling the entire frame** — no panel, no border/vignette, no ground shadow, no particles. The prompts below demand this explicitly.
2. **Veo 2 outputs 16:9 or 9:16, not 1:1.** Don't fight it. Generate **16:9 with the character centered and generous empty margins**, then crop to square (or whatever your sprite needs) in post. Prompts ask for centered framing + breathing room so the crop is easy.
3. **Matte by subject, not by color.** Bé Khế has both green leaves and pink cheeks, so *no* single chroma color is conflict-free for a hard key (magenta keys the cheeks; green keys the leaves). Use **AI subject matting** — `rembg`, Photoshop "Remove Background", Runway, Kapwing, etc. — which segments the character regardless of background. With subject matting, the flat background just needs to be high-contrast; **magenta `#FF00FF` against this yellow character is ideal** and stays consistent with your test.

**Reference image:** feed a **clean, background-removed PNG of Bé Khế** as the character reference, not a frame from the sample (which carries the border/shadow). If you only have the red-background logo, cut the red out first — a cleaner reference dramatically improves identity stability. (I can generate a transparent-PNG reference for you if useful — just ask.)

**Loop reality:** video models rarely produce a *perfect* seamless loop or a perfectly static background — expect slight lighting drift. Mitigations baked into the prompts: minimal/slow motion, locked camera, "completely static flat background," and "first and last pose identical." In post, you can still tidy a loop by trimming to the cleanest sub-range or adding a 2–3 frame crossfade.

**Generation settings:** keep clips **~3–4s**, no audio needed, highest resolution available (more pixels = cleaner mattes). Extract frames at native fps, then thin to ~12–15 fps for sprite sheets if you want smaller assets. Run the **same `[CHARACTER LOCK]` paragraph in every clip** so Bé Khế stays identical across the whole set.

> If a clip drifts off-model, regenerate with the reference image weight higher and the motion described as "small and slow." Identity holds best when motion is gentle.

---

## 1. Reusable blocks (paste these around each scenario)

Every prompt = **`[CHARACTER LOCK]` + `[ANIMATION]` (per scenario) + `[SHOT/TECH]` + `[NEGATIVE]`**. The per-scenario prompts below are already fully assembled and ready to paste, but here are the shared blocks if you want to remix.

### `[CHARACTER LOCK]`
> Use the uploaded image as the strict character reference. The character is **Bé Khế**, a cute chibi mascot shaped like a cross-cut **starfruit — a plump rounded five-point yellow star** with a thick dark-brown outline and soft glossy cel-shading. Identity, exact and unchanging: warm golden-yellow body with subtle ridge lines, big sparkling dark-brown eyes with bright catchlights, soft rosy cheeks, a small happy open mouth, **two little green leaf-sprouts at the top-right of the head**, short rounded yellow arms and two little yellow feet (the lower star points), a small **brown school satchel**, and a **turquoise open book**. The two leaf-sprouts act like expressive antennae and the side star-points act like little gesturing hands. Children's-book vector sticker style: clean rounded shapes, warm highlights, friendly and wholesome. Keep proportions, colors, outline thickness, leaf placement, satchel, and book identical to the reference.

### `[SHOT/TECH]`
> 16:9 composition, locked static camera — no zoom, no pan, no rotation. Character fully visible and centered with generous empty margin on all sides for easy cropping. Background is a **completely flat, uniform, pure magenta `#FF00FF` filling the entire frame edge to edge** — no panel, no border, no vignette, no gradient, no texture, no floor, no contact shadow, no environment. Crisp clean vector edges, no motion blur, no depth of field. Smooth gentle motion suitable for extracting individual frames. The first and last frames should match as closely as possible for a seamless loop.

### `[NEGATIVE]`
> Do not redesign the character. Do not turn the starfruit into a plain star. Do not remove or duplicate the leaves, satchel, book, rosy cheeks, or brown outline. No extra arms, legs, eyes, leaves, or fingers. No text, letters, words, logos, subtitles, UI, or watermark. No confetti or particles covering the character, no sparkles in the corners, no background objects, no second character. No camera movement, no background motion, no lighting changes, no flicker. No realistic, 3D, claymation, plastic-toy, or anime-human rendering. No motion blur, no drop shadow on the ground, no colored rim spill.

---

## 2. The scenario prompts

Each is a complete, copy-paste prompt. The **app moment** tells you where the resulting animation gets used (see the character bible's emotional-arc table).

---

### 2.1 — Idle / Reading (default loop)
**App moment:** home screen, roadmap idle, between actions — Bé Khế's resting state.

> Use the uploaded image as the strict character reference. The character is **Bé Khế**, a cute chibi mascot shaped like a cross-cut **starfruit — a plump rounded five-point yellow star** with a thick dark-brown outline and soft glossy cel-shading. Identity, exact and unchanging: warm golden-yellow body with subtle ridge lines, big sparkling dark-brown eyes with bright catchlights, soft rosy cheeks, a small happy open mouth, two little green leaf-sprouts at the top-right of the head, short rounded yellow arms and two little yellow feet, a small brown school satchel, and a turquoise open book. The leaf-sprouts act like expressive antennae and the side star-points act like little gesturing hands.
>
> **Animation:** a calm, content 3-second loop. Bé Khế holds the open turquoise book at chest height and reads happily, gently bobbing up and down as if breathing. The leaf-sprouts sway softly with the bob. It blinks once, slowly, then its eyes settle back into a warm half-moon smile. Tiny, peaceful, endlessly loopable. Return exactly to the starting pose.
>
> 16:9 composition, locked static camera — no zoom, pan, or rotation. Character fully visible and centered with generous empty margin for cropping. Background a completely flat, uniform, pure magenta #FF00FF filling the entire frame edge to edge — no panel, border, vignette, gradient, texture, floor, contact shadow, or environment. Crisp clean vector edges, no motion blur. First and last frames match for a seamless loop.
>
> Do not redesign the character or turn the starfruit into a plain star. Keep the leaves, satchel, book, cheeks, and brown outline. No text, particles, sparkles, background objects, second character, camera movement, background motion, lighting changes, 3D/realistic/plastic look, motion blur, or ground shadow.

---

### 2.2 — Wave Hello (greeting)
**App moment:** onboarding welcome, first launch, "Hi! I'm Bé Khế."

> [CHARACTER LOCK — paste the full block from §1]
>
> **Animation:** a friendly 3-second greeting loop. Bé Khế looks straight at the viewer with bright, welcoming eyes, lifts one little yellow arm and **waves hello twice** with an eager, happy bounce. The leaf-sprouts perk up and wiggle with the wave, cheeks lifting into a big open smile. It keeps the turquoise book tucked against its body in the other arm. Small joyful bob throughout. Return to a warm idle so it loops cleanly.
>
> [SHOT/TECH — paste from §1]
>
> [NEGATIVE — paste from §1]

---

### 2.3 — Cheer (correct answer / small win)
**App moment:** every correct answer in a lesson. The most-used clip — keep it short and snappy.

> [CHARACTER LOCK]
>
> **Animation:** a quick, delighted 2.5-second celebration. Bé Khế's eyes light up with sparkle, it throws **one arm up in a happy little fist-pump** and does a tiny excited hop, cheeks glowing rosy with pride. The leaf-sprouts spring upward on the hop and settle. A genuine "yes, you did it!" burst of joy — bright but brief. It still holds the turquoise book in the other arm. Snap back to the idle reading pose at the end so it can loop or cut cleanly.
>
> [SHOT/TECH]
>
> [NEGATIVE]

---

### 2.4 — Big Celebrate + Jump (lesson complete / level up)
**App moment:** lesson-complete screen, unit unlock, level up — the big reward beat.

> [CHARACTER LOCK]
>
> **Animation:** an exuberant 4-second celebration. Bé Khế raises **both arms high with pure joy**, does a happy jump with a clear squash-and-stretch — squashing slightly as it crouches, stretching as it leaps, landing soft and bouncy. Eyes turn big and sparkly, mouth wide in an excited open smile, cheeks glowing. The leaf-sprouts bounce energetically on the jump. It hugs the turquoise book to its chest as it lands, then gives one happy little spin-wiggle of delight. End back near the starting pose. Keep all motion inside the frame with margin around it.
>
> [SHOT/TECH]
>
> [NEGATIVE — and additionally: no confetti, no stars, no particles, no glowing effects around the character; the celebration is all in the body and face.]

---

### 2.5 — Oops / Supportive (wrong answer)
**App moment:** wrong answer. **Critical:** concerned *for* you, never sad *at* you. This is the emotional-design hinge.

> [CHARACTER LOCK]
>
> **Animation:** a gentle, caring 3-second reaction. Bé Khế tilts its head with a soft, sympathetic expression — eyebrows raised in kindness, a small encouraging closed-mouth smile, NOT a frown or tears. It gives a tiny reassuring shrug and **reaches one little arm out toward the viewer**, palm open, as if to say "it's okay, try again." The leaf-sprouts droop a touch then perk back up hopefully. Warm and supportive, never disappointed. Return to a gentle, patient idle.
>
> [SHOT/TECH]
>
> [NEGATIVE — and additionally: no tears, no sad crying face, no angry expression, no sweat-drop, no shaking head scolding; the mood is kind and encouraging.]

---

### 2.6 — Thinking / Curious (tips & intros)
**App moment:** tip chip, lesson intro, "hmm, why does Vietnamese do that?" moments.

> [CHARACTER LOCK]
>
> **Animation:** a curious, thoughtful 3-second loop. Bé Khế looks slightly up and to the side, **raises one little arm with a finger-point to its chin** in a classic "hmm, thinking" pose, eyes blinking thoughtfully and brows lifting with curiosity. A small "aha" perk at the end — eyes brighten, leaf-sprouts spring up — as if it just understood something, then settle back. It keeps the turquoise book held in the other arm, slightly open. Gentle bob throughout. Loop back to the thinking pose.
>
> [SHOT/TECH]
>
> [NEGATIVE — and additionally: no thought-bubble, no lightbulb icon, no question-mark symbol; the thinking is conveyed only through pose and expression.]

---

### 2.7 — Wow / Starstruck (milestone / mastery)
**App moment:** big milestones, perfect lesson, daily-streak milestones, mastery.

> [CHARACTER LOCK]
>
> **Animation:** an awed, starry-eyed 3-second reaction. Bé Khế's **eyes go huge and sparkling like little stars**, mouth opening in a delighted gasp, both little hands rising to its cheeks in amazement. Cheeks glow bright rosy. It does a slow, wonder-filled wobble, leaf-sprouts standing tall and quivering with excitement. Pure "wow, look at you!" wonder. Ease back down to a proud, happy idle so it loops.
>
> [SHOT/TECH]
>
> [NEGATIVE — and additionally: no sparkle particles or star shapes floating around the character; the "starstruck" look lives in the eyes and pose only.]

---

### 2.8 — Sleepy / Waiting (return after absence, idle empty)
**App moment:** return-after-absence welcome, empty states, "I kept your spot warm."

> [CHARACTER LOCK]
>
> **Animation:** a sweet, sleepy 3.5-second loop. Bé Khế **leans gently on its little brown satchel**, eyes droopy and half-closed, doing a slow contented sway. It gives one slow blink and a tiny cozy yawn, leaf-sprouts drooping softly like it's resting. The turquoise book rests closed against its side. Calm, patient, waiting-for-you energy — drowsy but happy. Loop the slow sway seamlessly.
>
> [SHOT/TECH]
>
> [NEGATIVE — and additionally: no "Zzz" letters or sleep symbols, no pillow or bed; sleepiness shown only through droopy eyes, yawn, and lean.]

---

### 2.9 — Storyteller Reading Aloud (unit intro)
**App moment:** unit/chapter intros where Bé Khế narrates "here's what we'll learn."

> [CHARACTER LOCK]
>
> **Animation:** a warm 4-second storyteller loop. Bé Khế **holds the open turquoise book up and gestures with one free arm** as if narrating an exciting story to the viewer — pointing outward, then a small inviting "come along" wave, looking up from the book to make eye contact with a bright, engaging smile. The leaf-sprouts bob expressively with the gestures, like it's animatedly telling a tale. Lively but not frantic. Return to holding the book ready to begin again.
>
> [SHOT/TECH]
>
> [NEGATIVE]

---

### 2.10 — Encouraging "Cố lên!" (retry / keep going)
**App moment:** second-try prompts, "let's slow down together," gentle push to continue.

> [CHARACTER LOCK]
>
> **Animation:** a warm, motivating 3-second loop. Bé Khế makes **two small determined fist-pumps** with a kind, encouraging smile — a "you've got this, let's go!" gesture — giving a confident little nod. Eyes warm and steady (not over-excited), cheeks softly rosy, leaf-sprouts giving a supportive bounce with each pump. It keeps the turquoise book against its body. Steady, believing-in-you energy. Loop the encouraging pumps smoothly.
>
> [SHOT/TECH]
>
> [NEGATIVE]

---

### 2.11 — Streak Hype (streak combo)
**App moment:** 3 / 5 / 10 in-a-row streak moments — rising excitement.

> [CHARACTER LOCK]
>
> **Animation:** an energetic, hyped 3-second loop. Bé Khế **shakes with excitement and pumps both fists rapidly**, doing a fast happy bounce in place, eyes bright and sparkling, big open grin, cheeks glowing. The leaf-sprouts vibrate with the energy. A "we're on FIRE!" thrill conveyed entirely through fast, bouncy body language. Keep it contained and centered. Settle to a happy idle to close the loop.
>
> [SHOT/TECH]
>
> [NEGATIVE — and additionally: no flames, fire, or "combo" effects around the character; the hype is all body and face energy.]

---

### 2.12 — Gentle Reset (streak lost / soft reassurance)
**App moment:** streak lost — "trees regrow, let's plant a new one." Kind, never guilt.

> [CHARACTER LOCK]
>
> **Animation:** a soft, reassuring 3-second loop. Bé Khế gives a gentle understanding shrug and a small warm smile, tilts its head kindly, then a slow encouraging nod as if to say "it's okay, we start again." A quiet, comforting bob — calm and caring, not sad. The leaf-sprouts give one soft dip and lift, like a little reset. Book held softly against its side. Loop the gentle reassurance.
>
> [SHOT/TECH]
>
> [NEGATIVE — and additionally: no tears, no broken-heart or wilting symbols, no sad sulking; the tone is gently hopeful.]

---

## 3. Quick mapping table (clip → app surface → bible state)

| Clip | App moment | Bible expression state |
|------|-----------|------------------------|
| 2.1 Idle / Reading | home, roadmap, resting | Idle / happy |
| 2.2 Wave Hello | onboarding welcome, greeting | (Idle→Cheer) |
| 2.3 Cheer | correct answer | Cheer |
| 2.4 Big Celebrate + Jump | lesson complete, level up | Celebrate |
| 2.5 Oops / Supportive | wrong answer | Oops / supportive |
| 2.6 Thinking / Curious | tip chip, lesson intro | Thinking |
| 2.7 Wow / Starstruck | milestone, mastery, daily streak | Wow / starstruck |
| 2.8 Sleepy / Waiting | return after absence, empty states | Sleepy / waiting |
| 2.9 Storyteller Reading | unit / chapter intro | Reading / storyteller |
| 2.10 Encouraging Cố lên | retry, keep-going | (Thinking→Cheer) |
| 2.11 Streak Hype | streak combo 3/5/10 | Celebrate (high energy) |
| 2.12 Gentle Reset | streak lost | Oops→Idle |

---

## 4. After generation — extraction checklist

1. **Matte the character** with AI subject removal (`rembg i input.png output.png`, or Photoshop/Runway). The flat magenta makes edges clean; subject matting avoids the green-leaf / pink-cheek key conflict.
2. **Trim to the cleanest loop range** if the model added drift; a 2–3 frame crossfade hides a seam.
3. **Crop to your target ratio** (square or the sprite frame) now that margins are generous.
4. **Export** as a transparent PNG sequence, an APNG/WebP loop, a Lottie-style sprite sheet, or an MP4 with alpha — whatever your in-app animation layer consumes. (The bible's microinteraction spec lists where each state fires.)
5. **Keep one master reference frame** per state so future regenerations stay on-model.
