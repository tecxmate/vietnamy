# Commercial Product Requirements Document (PRD)

**Product:** VNME App (Vietnamese Language Learning Platform)
**Document Status:** Version 1.0
**Target Platforms:** iOS (Primary Launch), Web, Android (Roadmap)
**Core Tech Stack:** Flutter, React (Pending CTO finalization)

---

## 1. Product Vision & Strategy

### 1.1 Vision

VNME is a cross-platform, gamified language learning application designed exclusively for the complexities of the Vietnamese language. The goal is to onboard as many users as possible with minimal friction, creating a thriving community of learners, heritage speakers, and professionals.

### 1.2 Core Business Objectives

- **Primary Goal:** Maximize User Acquisition over initial revenue. The initial focus is solely on grabbing market share and reducing the friction to start learning.
- **Retention Strategy:** Achieve an **80% Retention Rate** via gamified loops, daily streaks, community features, and habit-forming spaced repetition.
- **Ecosystem Growth:** Collaborate and create affiliate partnerships with offline Cram Schools and other educational entities to expand the market collaboratively. Pull existing learner traffic from YouTube, social media, and broader channels.

---

## 2. Target Audience & Competitive Landscape

### 2.1 Target Audience

- **The Traveler:** Needs survival phrases and basic navigation.
- **The Heritage Speaker:** Focused on reconnecting with family, prioritizing accurate pronunciation and kinship terms.
- **The Professional / Expat:** Requires practical, business-oriented vocabulary.
- **The Language Enthusiast:** Wants deep comprehension, including reading/writing formats (e.g., TELEX typing).

### 2.2 Competitive Defensibility

- **Direct Competitors:** Duolingo, LingoDeer.
- **The Moat:** Existing platforms struggle with the structural complexities and tonal nuances of Vietnamese. VNME’s competitive advantage lies in specialized, high-quality content targeting specific dialects (North/South), practical user workflows (family vs. business), and direct community/school integrations that generic platforms cannot provide.

---

## 3. Product Timeline

- **MVP Launch:** 1 Month from kickoff. Focus on onboarding frictionless users onto iOS.
- **Beta Testing Phase:** 1 Month immediately following the MVP. Iterative feedback loops.
- **Phase 2 Expansion:** 3 Months post-Beta. Introduction of advanced tech (AI ASR Voice Feedback).

---

## 4. Monetization & Pricing Strategy

While initial revenue is not the core metric, VNME utilizes a freemium architecture to capture dedicated learners.

- **Guest / Free Tier:** Frictionless onboarding. Free dictionary access, basic roadmap traversal, and core module trials.
- **Scholar Subscription (Premium):**
  - **Monthly Plan:** $10 / month
  - **Lifetime Subscription:** $50 (One-time purchase to capture high-intent users immediately).
- **Affiliate & B2B Channels:** Revenue and traffic sharing with partner Cram Schools through dedicated community pages.

---

## 5. Core Features & User Flow

### 5.1 Frictionless Onboarding

- **Quick Setup:** Captures motivation (Travel, Family, Work, Fun), Dialect (North/South/Both), and daily goals (5-20 mins).
- **First Win:** Immediate micro-lesson (Greetings & Tones) rewarding instant XP/Streak logic before the main dashboard.

### 5.2 The Main Learning Loop (Roadmap & Practice)

- **Roadmap:** Linear unit progression with active nodes, locked nodes, and completed checks.
- **Practice Modules & Mini-Games:**
  - Tones & Tone Marks
  - Numbers & Vowels
  - Pronouns (Family tree simulation)
  - TELEX Typing
- **Vocab Library & Flashcards (SRS):**
  - Dedicated filtering of the top 5,000 most common Vietnamese words, enriched into the library.
  - Spaced Repetition System (SRS) alerting users when words are due for review.

### 5.3 Advanced Tools & Utilities

- **Smart Dictionary:** Bi-directional (Vietnamese/English), audio playback, and Han Viet (Sino-Vietnamese) word roots.
- **OCR Translation Feature:** "Chụp hình dịch đơn giản OCR". Users can take photos of text, process local on-device translation, and directly add new words to their Word Banks.
- **ASR Speech Feedback:**
  - *Initial Implementation:* Cost-effective tone recognition models.
  - *Future Iteration (Phase 2):* Cloud-based comprehensive AI feedback (AWS/Azure).

### 5.4 Community & Social Mechanics

- **Leaderboards & Friends:** Tracking XP, streaks, and Word Library completion amongst peers.
- **Referrals Program:** Incentivizing the "Grab as many users as possible" objective.
- **Affiliated Business Pages:** Directory and integration with partner Cram Schools and educators.

### 5.5 Admin Content Management System (CMS)

- **Visual Mapping:** Roadmap mapper, scalable lesson builders, and grammar editors.
- **Media Support:** The CMS natively supports embedding both photos and text for richer lesson design.

---

## 6. Technical Requirements

- **Frontend/Mobile:** Flutter (Primary for cross-platform efficiency starting with iOS) & React (Web).
- **Backend Services:** Node.js/Express, scaling to support heavy community databases and leaderboard analytics.
- **Local Device Processing:** On-device models for OCR translation to reduce server friction and latency for free users.
