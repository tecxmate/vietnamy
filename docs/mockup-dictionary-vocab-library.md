# Dictionary Tab (Vocab Library) - Feature Mockup

**Status:** Mockup / Proposal
**Date:** February 2026

---

## Overview

Redesign the Dictionary tab from a pure search tool into a combined **Dictionary + Vocab Library**. The tab gets two sub-views via a top toggle: **Search** (existing dictionary) and **My Decks** (new vocab library with flashcard testing).

The Vocabulary module currently lives in Practice tab — this moves and integrates it into Dictionary, making Dictionary the single hub for all word-related activity.

---

## Navigation Structure

```
Dictionary Tab (bottom nav)
  |
  |-- [Search]  [My Decks]    <-- sub-tab toggle at top
  |
  |-- Search view (existing dictionary, + bookmark button)
  |
  |-- My Decks view
  |     |-- Saved Words deck (bookmarked from Search)
  |     |-- Pre-saved Decks (Food, Animals, Objects, Nature, People)
  |     |-- Custom Decks (user-created)
  |     |-- [+ New Deck] button
  |     |
  |     |-- Deck Detail (tap any deck)
  |     |     |-- Word list with images
  |     |     |-- Add/Remove words (custom & saved only)
  |     |     |-- [Study] button -> Flashcard Test
  |     |
  |     |-- Flashcard Test (full-screen)
  |           |-- Tap center: reveal
  |           |-- Tap/swipe right: Know
  |           |-- Tap/swipe left: Don't know
  |           |-- Score: /100
  |           |-- Retry: "Don't know" words
```

---

## Screen Mockups

### 1. Sub-Tab Toggle (top of Dictionary tab)

```
+------------------------------------------+
|  [ Search ]         [ My Decks  3 ]      |
+------------------------------------------+
|                                           |
|  (content switches based on active tab)   |
|                                           |
+------------------------------------------+
```

- Pill-style toggle, same aesthetic as language mode toggle
- Badge on "My Decks" shows saved word count

---

### 2. Search View (enhanced existing)

Same as current dictionary, but with a **bookmark button** next to the speaker icon on results:

```
+------------------------------------------+
|                                           |
|  +------------------------------------+  |
|  |  pho              [speaker] [save] |  |
|  |  /fəː/                            |  |
|  +------------------------------------+  |
|                                           |
|  +------------------------------------+  |
|  |  ENGLISH                           |  |
|  |  noun  pho (noodle soup)           |  |
|  |                                    |  |
|  |  > "Cho toi mot bat pho." [speaker]|  |
|  |    Give me a bowl of pho.          |  |
|  +------------------------------------+  |
|                                           |
+------------------------------------------+
|  [suggestion chips...]                    |
|  [ EN ] [ VI ] [ jian ] [ fan ] [ All ]  |
|  [  Type a Vietnamese word...   ] [go]   |
+------------------------------------------+
```

- [save] = Bookmark icon -> toggles saved/unsaved
- Saved words appear in "Saved Words" deck in My Decks view

---

### 3. My Decks View

```
+------------------------------------------+
|  My Decks                    [+ New Deck] |
+------------------------------------------+
|                                           |
|  +------------------------------------+  |
|  | [bookmark]  Saved Words        >   |  |
|  |             3 words       [Study]  |  |
|  +------------------------------------+  |
|                                           |
|  +------------------------------------+  |
|  | [book]  Food & Drink           >   |  |
|  |         8 words           [Study]  |  |
|  +------------------------------------+  |
|                                           |
|  +------------------------------------+  |
|  | [book]  Animals                >   |  |
|  |         5 words           [Study]  |  |
|  +------------------------------------+  |
|                                           |
|  +------------------------------------+  |
|  | [book]  Objects                >   |  |
|  |         6 words           [Study]  |  |
|  +------------------------------------+  |
|                                           |
|  +------------------------------------+  |
|  | [book]  Nature                 >   |  |
|  |         6 words           [Study]  |  |
|  +------------------------------------+  |
|                                           |
|  +------------------------------------+  |
|  | [book]  People                 >   |  |
|  |         5 words           [Study]  |  |
|  +------------------------------------+  |
|                                           |
|  +------------------------------------+  |
|  | [layers] My Custom Deck     >  [x] |  |
|  |          2 words          [Study]  |  |
|  +------------------------------------+  |
|                                           |
+------------------------------------------+
```

**Deck types:**
- **Saved Words** — auto-populated from dictionary bookmarks
- **Pre-saved** — built from existing `vocabWords.js` categories (Food, Animals, Objects, Nature, People). Read-only, always available.
- **Custom** — user-created, can add/remove words, deletable

---

### 4. Deck Detail View

```
+------------------------------------------+
|  [< Back]   Food & Drink      [Study >]  |
+------------------------------------------+
|                                           |
|  +------------------------------------+  |
|  | [img]  pho                         |  |
|  |        pho (noodle soup)  [speaker]|  |
|  +------------------------------------+  |
|  | [img]  banh mi                     |  |
|  |        bread / sandwich   [speaker]|  |
|  +------------------------------------+  |
|  | [img]  ca phe                      |  |
|  |        coffee             [speaker]|  |
|  +------------------------------------+  |
|  | [img]  com                         |  |
|  |        rice / meal        [speaker]|  |
|  +------------------------------------+  |
|  | [img]  nuoc                        |  |
|  |        water              [speaker]|  |
|  +------------------------------------+  |
|  ...                                     |
+------------------------------------------+
```

For custom/saved decks, each row also has an [x] remove button, plus an [+ Add Word] button at top.

---

### 5. Flashcard Test - Card (unrevealed)

```
+------------------------------------------+
|  [<]    Food & Drink       3 / 8         |
+------------------------------------------+
|  [=======>-----------]  progress bar      |
|                                           |
|          +------------------+             |
|   Don't  |                  |  Know       |
|   know   |   [food image]   |             |
|    X     |                  |   check     |
|          |  "coffee"        |             |
|          |                  |             |
|          |  ~ tap to reveal ~|             |
|          +------------------+             |
|                                           |
+------------------------------------------+
```

### 6. Flashcard Test - Card (revealed)

```
+------------------------------------------+
|  [<]    Food & Drink       3 / 8         |
+------------------------------------------+
|  [=======>-----------]  progress bar      |
|                                           |
|          +------------------+             |
|   Don't  |  [small image]   |  Know       |
|   know   |                  |             |
|    X     |    ca phe        |   check     |
|          |    coffee        |             |
|          |                  |             |
|          | "Toi uong ca phe |             |
|          |  moi sang."      |             |
|          +------------------+             |
|                                           |
|  [ X Don't know ]    [ check Know ]       |
+------------------------------------------+
```

**Interactions:**
- **Tap center** = reveal the Vietnamese word + pronunciation
- **Tap right / swipe right** = "Know" (green)
- **Tap left / swipe left** = "Don't know" (red)
- Card animates out in swipe direction

---

### 7. Score Screen

```
+------------------------------------------+
|  [<  Done]                                |
+------------------------------------------+
|                                           |
|              +--------+                   |
|              |   75   |                   |
|              |  /100  |                   |
|              +--------+                   |
|                                           |
|            Great job!                     |
|                                           |
|    [check] 6 Known    [X] 2 Don't know   |
|                                           |
|    +----------------------------------+   |
|    |  Retry: Practice (2) again       |   |
|    +----------------------------------+   |
|                                           |
|    +----------------------------------+   |
|    |  Back to Decks                   |   |
|    +----------------------------------+   |
|                                           |
+------------------------------------------+
```

- Score is out of 100 (percentage)
- "Retry" button only shows if there are "Don't know" words
- Retry runs a mini flashcard session with only the missed words

---

## Data Flow

### Storage (localStorage)

| Key | Data |
|-----|------|
| `vnme_saved_words` | `[{ id, vietnamese, english, ipa }]` — bookmarked from dictionary |
| `vnme_vocab_decks` | `[{ id, name, words: [{id, vietnamese, english, image, emoji, example}] }]` — custom decks |

### Pre-saved Decks

Generated at runtime from existing `vocabWords.js` data, grouped by `CATEGORIES`. These are read-only — users cannot add/remove words from pre-saved decks.

### Word Saving Flow

```
Dictionary Search -> find "pho" -> tap [bookmark]
    -> word saved to `vnme_saved_words`
    -> appears in "Saved Words" deck under My Decks
    -> can be studied with flashcards
```

---

## Component Structure

```
DictionaryTab (main)
  |-- Sub-tab toggle: [Search] [My Decks]
  |
  |-- DictionarySearch (existing search + bookmark button)
  |
  |-- MyDecks
  |     |-- Deck cards (saved, pre-saved, custom)
  |     |-- Create deck modal
  |
  |-- DeckDetail (word list, add/remove)
  |
  |-- FlashcardTest (full-screen study mode)
        |-- Card with tap-to-reveal
        |-- Swipe left/right or button tap
        |-- Score screen with /100
        |-- Retry missed words
```

---

## Design Notes

- Follows existing dark theme with `--primary-color: #FFD166`, `--surface-color: #1E1E1E`
- 3D button press effects on Study/Know/Don't Know buttons
- Cards use same border-radius and shadow as existing source-section cards
- Flashcard has subtle swipe animation (translateX + opacity fade)
- Score circle uses primary color gradient
- Pre-saved deck icons use `BookOpen`, custom use `Layers`, saved use `BookmarkCheck`
- Images from Unsplash (already in vocabWords.js), fallback to emoji

---

## Migration from Practice Tab

The Vocabulary module (`/practice/vocab`) currently has:
- Browse tab (word list by category)
- Flashcard tab (flip cards with arrow nav)
- Quiz tab (multiple choice)
- Review tab (SRS-based review)

**Plan:** Keep the Practice route working for now (no breaking change), but the Dictionary tab becomes the primary home for vocab. The Practice tab's Vocab card can link to Dictionary > My Decks instead.

---

## Open Questions

1. Should flashcard test award Dong currency like the quiz does?
2. Should we fetch online images for custom words (e.g. Unsplash API)?
3. Should saved words sync across devices (requires backend) or stay localStorage only for now?
