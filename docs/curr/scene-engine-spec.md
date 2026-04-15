# Scene Engine — Immersive Scenario Lessons

## Vision

Replace the standard exercise-list flow with **playable scenes** where the learner explores a Vietnamese environment (restaurant, market, taxi, etc.), taps objects to learn vocabulary in context, then performs in a scripted dramatic interaction that tests what they absorbed.

Each scene has three phases:

1. **Explore** — An illustrated environment with tappable hotspots (menu items, signs, objects). Tap to see word, translation, pronunciation. No pressure.
2. **Observe** — A short scripted dialogue plays out between NPCs. Learner reads along, taps unfamiliar words for hints. Grammar callouts appear contextually.
3. **Perform** — The learner is pulled into the conversation. They must respond using what they learned: choosing lines, ordering from the menu, asking for directions, etc. Wrong answers get dramatic NPC reactions.

---

## Data Schema

### Scene Definition

```javascript
{
  id: "scene_cafe_001",
  lesson_id: "lesson_006",            // links to existing lesson system
  title: "At the Café",
  title_vi: "Ở quán cà phê",
  scene_type: "narrative",             // narrative | exploration | dialogue
  setting: {
    background_emoji: "☕",            // fallback
    background_css: "linear-gradient(135deg, #1a1208 0%, #2d1f0e 100%)",
    ambient_description: "A small sidewalk café in Saigon, plastic chairs, iced coffee dripping through a phin filter."
  },

  // Characters in this scene
  characters: [
    { id: "waiter", name: "Anh Minh", role: "Waiter", emoji: "👨‍🍳", personality: "friendly but busy" },
    { id: "friend", name: "Chị Lan", role: "Your friend", emoji: "👩", personality: "helpful, encouraging" },
    { id: "player", name: null, role: "You", emoji: "🧑‍🎓" }
  ],

  // Vocabulary items (references to existing items in db.js)
  vocab_items: [
    "it_w_0040", "it_w_0041", "it_w_0042", "it_w_0043",
    "it_w_0044", "it_w_0045"
  ],

  // Grammar point shown as a floating card during Explore phase
  grammar_card: {
    title: "Ordering Pattern",
    structure: "Cho tôi + [quantity] + [item] + (không đá / ít đường)",
    example: "Cho tôi một cà phê sữa không đá.",
    translation: "Give me one iced milk coffee, no ice."
  },

  // Three phases
  phases: [
    { type: "explore", config: { /* ... */ } },
    { type: "observe", config: { /* ... */ } },
    { type: "perform", config: { /* ... */ } }
  ]
}
```

### Phase 1: Explore (Interactive Environment)

```javascript
{
  type: "explore",
  instruction: "You just sat down at a café. Tap items on the menu to learn the words.",
  duration_hint: "Take your time",

  // Interactive hotspots the learner can tap
  hotspots: [
    {
      id: "hs_caphe",
      label: "Cà phê đen",               // what shows on the "menu"
      translation: "Black coffee",
      pronunciation_note: "kah-feh den",
      audio_key: "a_caphe_den",
      item_id: "it_w_0040",               // links to SRS item
      emoji: "☕",
      price: "25.000₫",                   // scene flavor
      position: { row: 1, col: 1 }        // grid position on menu
    },
    {
      id: "hs_caphesuada",
      label: "Cà phê sữa đá",
      translation: "Iced milk coffee",
      pronunciation_note: "kah-feh suh-ah dah",
      audio_key: "a_caphe_sua_da",
      item_id: "it_w_0041",
      emoji: "🥛",
      price: "30.000₫",
      position: { row: 1, col: 2 }
    },
    {
      id: "hs_tra",
      label: "Trà đá",
      translation: "Iced tea",
      audio_key: "a_tra_da",
      item_id: "it_w_0042",
      emoji: "🍵",
      price: "10.000₫",
      position: { row: 2, col: 1 }
    },
    {
      id: "hs_banhmi",
      label: "Bánh mì",
      translation: "Bread / Sandwich",
      audio_key: "a_banh_mi",
      item_id: "it_w_0043",
      emoji: "🥖",
      price: "20.000₫",
      position: { row: 2, col: 2 }
    }
  ],

  // Minimum hotspots to tap before "Continue" unlocks
  min_taps: 3,

  // Grammar card floats at top
  show_grammar_card: true
}
```

### Phase 2: Observe (Scripted Dialogue)

```javascript
{
  type: "observe",
  instruction: "Watch how your friend orders. Tap any word you don't know.",

  script: [
    {
      speaker: "waiter",
      text_vi: "Chào chị! Chị dùng gì ạ?",
      text_en: "Hello miss! What would you like?",
      hints: { "dùng": "to use/have", "gì": "what", "ạ": "(polite particle)" },
      audio_key: "a_scene_cafe_001_line_01",
      emotion: "friendly"
    },
    {
      speaker: "friend",
      text_vi: "Cho tôi một cà phê sữa đá.",
      text_en: "Give me one iced milk coffee.",
      hints: { "cho": "give", "một": "one" },
      audio_key: "a_scene_cafe_001_line_02",
      emotion: "confident",
      grammar_highlight: "Cho tôi + [item]"    // highlights the pattern
    },
    {
      speaker: "waiter",
      text_vi: "Dạ, còn gì nữa không ạ?",
      text_en: "Yes, anything else?",
      hints: { "còn": "still/more", "nữa": "more", "không": "no/not" },
      audio_key: "a_scene_cafe_001_line_03",
      emotion: "attentive"
    },
    {
      speaker: "friend",
      text_vi: "Dạ, hết rồi. Cảm ơn anh.",
      text_en: "That's all. Thank you.",
      hints: { "hết": "finished", "rồi": "already" },
      audio_key: "a_scene_cafe_001_line_04",
      emotion: "satisfied"
    }
  ],

  // Auto-advance or tap to continue
  auto_play: false,
  replay_enabled: true
}
```

### Phase 3: Perform (Interactive Challenge)

```javascript
{
  type: "perform",
  instruction: "Now it's your turn! The waiter is looking at you.",

  // Dramatic flavor text
  scene_beat: "The waiter turns to you expectantly. Your friend nudges you under the table.",

  challenges: [
    {
      id: "ch_01",
      type: "dialogue_choice",            // pick the right response
      speaker_prompt: {
        speaker: "waiter",
        text_vi: "Còn anh/chị? Dùng gì ạ?",
        text_en: "And you? What would you like?",
        emotion: "waiting"
      },
      choices: [
        { text_vi: "Cho tôi một cà phê đen.", correct: true, response_emotion: "pleased" },
        { text_vi: "Tôi là cà phê.", correct: false, response_vi: "Anh/chị... là cà phê? 😅", response_en: "You... are coffee?", response_emotion: "confused" },
        { text_vi: "Cà phê, cảm ơn.", correct: true, response_emotion: "friendly", partial: true, tip: "Correct! But 'Cho tôi...' is more natural." }
      ]
    },
    {
      id: "ch_02",
      type: "build_sentence",             // word bank to construct
      context_vi: "The waiter asks if you want ice.",
      speaker_prompt: {
        speaker: "waiter",
        text_vi: "Có đá không ạ?",
        text_en: "With ice?",
        emotion: "helpful"
      },
      answer_tokens: ["Không", "đá", ",", "cảm", "ơn"],
      distractor_tokens: ["sữa", "một", "gì"],
      answer_en: "No ice, thank you."
    },
    {
      id: "ch_03",
      type: "fill_response",              // fill blank in your line
      context_vi: "Your friend asks what you ordered.",
      speaker_prompt: {
        speaker: "friend",
        text_vi: "Bạn gọi gì?",
        text_en: "What did you order?",
        emotion: "curious"
      },
      template_vi: "Tôi gọi một ____ đen.",
      answer: "cà phê",
      choices: ["cà phê", "trà", "bánh mì", "nước"]
    },
    {
      id: "ch_04",
      type: "free_speak",                 // speech recognition
      context_vi: "Say thank you when the waiter brings your drink.",
      scene_beat: "The waiter places a perfect Vietnamese iced coffee in front of you. The ice clinks.",
      target_vi: "Cảm ơn anh!",
      accept_variations: ["cảm ơn", "cảm ơn anh", "cảm ơn ạ"]
    }
  ],

  // NPC reactions to wrong answers (dramatic flair)
  wrong_answer_reactions: [
    { speaker: "friend", text_vi: "(thì thầm) Không phải vậy...", text_en: "(whispers) Not like that...", emotion: "nervous" },
    { speaker: "waiter", text_vi: "Dạ... xin lỗi?", text_en: "Um... sorry?", emotion: "confused" }
  ],

  // Ending based on performance
  endings: {
    perfect: {
      scene_beat: "The waiter smiles. Your friend looks impressed. You sip your cà phê đen like a pro.",
      bonus_dong: 5
    },
    good: {
      scene_beat: "A few stumbles, but you got your coffee! Your friend gives you a thumbs up.",
      bonus_dong: 2
    },
    retry: {
      scene_beat: "The waiter is patient. Your friend helps you out. You'll nail it next time!",
      bonus_dong: 0
    }
  }
}
```

---

## Component Architecture

```
SceneEngine (main orchestrator)
├── SceneExplore          — Interactive environment with hotspots
│   ├── HotspotGrid       — Tappable menu/map/scene items
│   ├── HotspotPopup      — Word card on tap (translation, audio, SRS link)
│   └── GrammarCard       — Floating grammar pattern reference
├── SceneObserve          — Scripted dialogue viewer
│   ├── DialogueBubble     — Character speech with TappableText
│   ├── CharacterPortrait  — Emoji/avatar + name + emotion state
│   └── GrammarHighlight   — Inline pattern annotation
├── ScenePerform          — Interactive challenge phase
│   ├── DialogueChoice     — Pick-the-right-line exercise
│   ├── BuildSentence      — Word bank (reuses existing token components)
│   ├── FillResponse       — Fill-in-blank in dialogue context
│   ├── FreeSpeak          — Speech recognition (reuses existing mic component)
│   └── NPCReaction        — Dramatic response to right/wrong answers
├── SceneProgress          — Phase indicator (Explore → Observe → Perform)
└── SceneEnding            — Performance-based conclusion + rewards
```

### Integration with Existing Systems

| Existing System | How Scene Engine Hooks In |
|---|---|
| **SRS** (`srs.js`) | `addItemsFromLesson()` called with scene's `vocab_items` after completion |
| **Word Grades** (`wordGrades.js`) | `recordExerciseResult()` for each Perform challenge |
| **Dong/Gamification** (`DongContext`) | `completeNode()` + bonus đồng from endings |
| **TTS** (`speak.js`) | All `audio_key` fields use existing `speak()` function |
| **TappableText** (`LessonGame`) | Reused directly in Observe phase dialogue bubbles |
| **Exercise types** | BuildSentence = `reorder_words`, FillResponse = `fill_blank` — same grading logic |
| **Path nodes** (`db.js`) | New node_type: `"scene"` with `scene_id` reference |

### New path_node type

```javascript
{
  id: "p2_SC001",
  course_id: "course_vi_en_v1",
  unit_id: "phase_2_daily_life",
  node_index: 4,
  node_type: "scene",                    // NEW type
  module_type: "gold",                   // distinctive color on roadmap
  label: "☕ At the Café",
  scene_id: "scene_cafe_001",
  unlock_rule: {
    requires: [{ type: "node_completed", node_id: "p2_L006" }]
  }
}
```

### New route

```javascript
// App.jsx
<Route path="/scene/:sceneId" element={
  <div className="mobile-app-wrapper"><SceneEngine /></div>
} />
```

### `getNodeRoute()` addition

```javascript
if (type === 'scene') return `/scene/${node.scene_id}`;
```

---

## Implementation Plan

### Phase 1: Core Engine (MVP)
1. Create `SceneEngine.jsx` — orchestrator with phase state machine
2. Create `SceneExplore.jsx` — hotspot grid + popup + grammar card
3. Create `SceneObserve.jsx` — dialogue viewer with TappableText
4. Create `ScenePerform.jsx` — challenge runner (dialogue_choice + build_sentence)
5. Add scene data to `db.js` (one café scenario)
6. Add route + path_node type
7. Hook into SRS + DongContext for completion

### Phase 2: Polish
8. Add character emotion states (emoji variations or CSS expressions)
9. Add scene_beat dramatic text with typewriter animation
10. Add NPCReaction component with shake/flash animations
11. Add performance-based endings with reward screen
12. Add `free_speak` challenge type (reuse speech recognition)

### Phase 3: Scale
13. Create scene editor in `/admin` CMS
14. Build 5+ scenarios: market, taxi, directions, phone call, doctor visit
15. Add illustration system (SVG scene backgrounds or AI-generated)
16. Add branching dialogue (responses change the conversation path)

---

## Example Scenarios to Build

| Scene | Unit | Key Vocab | Grammar Pattern |
|---|---|---|---|
| ☕ Café ordering | Daily Life | cà phê, trà, bánh mì, nước | Cho tôi + [item] |
| 🏪 Market haggling | Shopping | bao nhiêu, đắt, rẻ, giảm giá | [item] + bao nhiêu tiền? |
| 🚕 Taxi directions | Transport | đi, rẽ, thẳng, dừng | Cho tôi đi + [place] |
| 📱 Phone greeting | Communication | alô, ai, gọi, nhắn | Alô, [name] đây |
| 🏥 Doctor visit | Health | đau, bệnh, thuốc, khám | Tôi bị + [symptom] |
| 🍜 Phở restaurant | Food | phở, bún, gỏi, chay | Cho tôi + [dish] + [modifier] |
| 🏨 Hotel check-in | Travel | phòng, đêm, giá, wifi | Tôi đặt phòng + [duration] |
| 🎉 Birthday party | Social | sinh nhật, quà, chúc mừng | Chúc mừng + [occasion] |

---

## File Structure

```
src/
├── components/
│   └── Scene/
│       ├── SceneEngine.jsx          — Main orchestrator
│       ├── SceneExplore.jsx         — Explore phase
│       ├── SceneObserve.jsx         — Observe phase
│       ├── ScenePerform.jsx         — Perform phase
│       ├── SceneEnding.jsx          — Results/reward screen
│       ├── HotspotGrid.jsx          — Tappable environment
│       ├── HotspotPopup.jsx         — Word detail popup
│       ├── DialogueBubble.jsx       — Character speech bubble
│       ├── CharacterPortrait.jsx    — Avatar + emotion
│       ├── GrammarCard.jsx          — Floating grammar reference
│       └── NPCReaction.jsx          — Dramatic response animations
├── data/
│   └── scenes/
│       ├── scene_cafe_001.js        — Café scenario data
│       ├── scene_market_001.js      — Market scenario data
│       └── ...
```
