# App User Flow & Features Map

This document serves as the holistic bridge for the design team, mapping the `vnme-app` logic, feature capabilities, and how different state models interact with the user journey.

---

## 1. Onboarding Flow (`/`)

When a user launches the app for the very first time, they go through an onboarding sequence to personalize their experience and create their profile.

- **Welcome Screen**: Initial landing to trigger "Get Started" or "Login".
- **Goal & Motivation**: "Why are you learning Vietnamese?" (Options: Travel basics, Talk with family, Work, Just for fun).
- **Dialect Focus**: Options to target North (Hanoi), South (Saigon), or Both.
- **Level Assessment**: New to Vietnamese, Basics, or Intermediate.
- **Goal Setup**: Establish a daily goal (5, 10, 15, or 20 mins/day).
- **Permissions Validation**: Notifies user about Push Notifications and Microphone access.
- **First Win Mini-Lesson**: A mock lesson completion screen displaying a star animation to boost dopamine, awarding users their first 10 XP and day 1 streak before jumping into the main app.

---

## 2. Main Application Navigation Context

Once inside, a persistent bottom navigation bar guides the user across the five core tabs:

### Roadmap Tab (`/`)

The primary destination holding the user's continuous learning path.

- **Unit Layout**: Divided systematically into units, displaying the user's progress linearly.
- **Lesson Nodes**: Nodes have visually distinct states: locked, active, or completed. The active node bounces with a prominent "START" prompt.
- **SRS Due Reviews Prompt**: A Top Banner alerts users if they have pending vocabulary due for spaced-repetition testing, navigating them instantly to practice.

### Practice Tab (`/practice`)

A library of specific, repeatable practice modules not strictly bound by the main roadmap progression.
Currently implemented modules:

- Tone Practice
- Tone Marks Practice
- Pronouns Practice (Family tree simulation and kinship definitions)
- Numbers Practice
- Vowels Practice (Interactive single, centering, and gliding definitions)
- Vocab Practice (Spaced Repetition System / Flashcards)
- Tone Pitch Training (Native pronunciation AI feedback module with DTW scoring)
- TELEX Typing (Keyboard practice for mastering the Vietnamese layout)

### Dictionary Tab (`/dictionary`)

- An embedded dictionary offering bidirectional searches between Vietnamese and English.
- Results dynamically display: meaning, grammatical explanation, example sentences, translations, and "Han Viet" Chinese roots.
- Audio play buttons mapped to words.

### Grammar Tab (`/grammar`)

- Grammar point repositories indexed by CEFR levels.
- Direct navigation into `GrammarDetail` pages which breakdown rules, usage patterns, and structurally rendered tabular examples.

### Leaderboard / Me Tab (`/leaderboard`)

- Tracks user statistics: Stroke count, Streaks, XP points.
- Foundation for future expansions: Badges, Achievements, Friends Ranking.

---

## 3. Lesson Game Loop (`/lesson/:lessonId`)

The interactive core mechanic invoked when clicking an active lesson node on the Roadmap Tab.

- **Micro-lessons Types**: Cycles through vocabulary introduction, multiple choice, matching exercises, sentence building, and audio comprehension to maximize retention.
- **Content Paths**:
  - Foundational & Survival Lessons (Pronunciations, Tones, Basic routines).
  - Goal-Based Path content (e.g. Business terminology, Explore culture).
- **Reward Economics**: The completion unlocks distinct mockups like "Energy Refill", "Quest Reward", and "XP Boost". Successful completion formally triggers `DongContext` to award Vietnam Dong (in-app currency) and XP.

---

## 4. Admin CMS (`/admin`)

Hidden functionality accessible only to users sporting the Admin role.

- **Roadmap Mapper (`/admin/mapper`)**: Visual tool for managing units and individual lesson nodes on the persistent Roadmap.
- **Lesson Builder (`/admin/lesson`)**: Content Management interface scaling the micro-lessons inside the interactive loops.
- **Grammar Editor (`/admin/grammar`)**: Safely structures the CEFR-indexed grammar points, updating JSON payloads with rules and rendering formats.

---

## 5. Global State Management Logic

Underlying mechanics governing cross-screen persistence.

- **`UserContext`**: Saves onboarding choices (goals, dialects), XP, continuous Streaks, and general user profile constraints.
- **`DongContext`**: Tracks economy and roadmap progress by saving array markers of `completedNodes`, while actively granting currency across completed practice modules.
- **`LanguageContext`**: Global toggle ensuring the UI translates context seamlessly without manual component prop drilling.
