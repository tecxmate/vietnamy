# Commercial Product Requirements Document (PRD)

**Product:** VNME App (Vietnamese Language Learning Platform)
**Document Status:** Version 1.2
**Last Updated:** March 2026
**Target Platforms:** iOS (Primary Launch), Web, Android (Roadmap)
**Core Tech Stack:** React + Vite (Web/PWA, confirmed); Flutter (Native iOS/Android, roadmap)

---

## 1. Product Vision & Strategy

### 1.1 Vision

VNME is a cross-platform, gamified language learning application designed exclusively for the complexities of the Vietnamese language. The goal is to onboard as many users as possible with minimal friction, creating a thriving community of learners, heritage speakers, and professionals.

### 1.2 Core Business Objectives

- **Primary Goal:** Maximize User Acquisition over initial revenue. The initial focus is solely on grabbing market share and reducing the friction to start learning.
- **Retention Strategy:** Achieve an **80% Retention Rate** via gamified loops, daily streaks, community features, and habit-forming spaced repetition.
- **Ecosystem Growth:** Collaborate and create affiliate partnerships with offline Cram Schools and other educational entities to expand the market collaboratively. Pull existing learner traffic from YouTube, social media, and broader channels.

---

## 2. Target Audience, Customer Intelligence & Go-To-Market

### 2.1 Customer Segment Overview

VNME targets five distinct segments, each with different motivations, pain points, and acquisition channels. Early traction will focus on Segments 1 and 2 (highest-intent, lowest cost to reach), with Segment 5 as the enterprise revenue lever once the product has social proof.

**Multilingual dictionary expansion — addressable market note:** VNME's dictionary now covers 9 interface languages (English, Chinese, Japanese, French, Russian, German, Norwegian, Spanish, Italian), making it the only Vietnamese learning app serving non-English speakers natively. This significantly expands the reachable audience to include French-Vietnamese diaspora, Japanese corporate expats, German and Spanish-speaking travelers, and the Russian-speaking community in Southeast Asia — all segments with no current dedicated tool.

---

### Segment 1 — Expats & Digital Nomads Living in Vietnam

**Who they are:** Working professionals, digital nomads, and long-term residents in HCMC, Hanoi, and Da Nang. Mix of Western (US/UK/EU/AU) and Northeast Asian (Korean, Japanese, Taiwanese). Many have been in Vietnam 6 months to several years and still can’t hold a basic conversation.

**Where to find them:**
- Facebook Groups: "Expats in Saigon", "Hanoi Massive", "Ho Chi Minh City Expats", "Vietnam Expat Community"
- Meetup.com events (language exchange nights)
- Co-working spaces (Toong, Dreamplex, WeWork HCMC/Hanoi)
- Instagram and TikTok location tags: #expatsaigon #hanoilife #livinginvietnam

**What they want to learn:**
- Survival & daily life: food ordering, taxis, market bargaining, landlord conversations
- Making Vietnamese friends; understanding what colleagues/staff say
- Southern or Northern dialect depending on city of residence

**Pain points:**
- Generic apps (Duolingo, Babbel) feel too slow and Western-focused — take months to say anything useful on the street
- Examples are tourist-centric, not practical for long-term residents
- No dialect targeting — Southern Vietnamese sounds completely different from what apps teach
- Can’t learn the informal texting/slang locals actually use (zalo, messenger)

**VNME features that match:**
- Dialect selection (North/South) on onboarding
- Kinship terms module (essential for Vietnamese social dynamics)
- Teen Code module (WhatsApp/Zalo shorthand with local friends)
- Fast-track practical vocab path on Roadmap
- Dictionary with instant lookup and word saving

**Marketing strategy:**
- Organic: Post in Facebook groups with a genuine "I built this because I struggled too" angle — no hard selling. Share before/after stories of expats who used it.
- Influencer: Partner with 3-5 expat TikTok/Instagram creators in HCMC/Hanoi (lifestyle/food accounts, 20K–200K followers). Product seeding in exchange for honest reviews.
- Content hook: "5 Vietnamese phrases every expat in Saigon needs to know this week" → drives to waitlist/download.
- IRL: Sponsor or attend language exchange events; QR codes at co-working spaces.

**Early adopter / waitlist tactic:**
- Offer "Founding Member" badge + 3 months premium free for first 200 signups from expat communities.
- Ask early users to record a 15-second TikTok/Reel in Vietnamese — community UGC loop.

**Sales process:**
- Entirely self-serve. Freemium → in-app premium upsell after 7-day engagement. Referral bonus (give 1 month free, get 1 month free).

---

### Segment 2 — Vietnamese Language Learners on Reddit & Discord

**Who they are:** Heritage Vietnamese diaspora (Vietnamese-Americans, Australians, Europeans) reconnecting with their roots; people in relationships with Vietnamese partners; language hobbyists; people planning to move to Vietnam; academics studying Southeast Asian languages.

**Where to find them:**
- Reddit: r/learnvietnamese (78K+ members), r/vietnam, r/viet, r/languagelearning
- Discord: Vietnamese language learning servers, diaspora community servers
- YouTube comments on Vietnamese language learning channels
- Facebook groups: "Learn Vietnamese with Annie", "Vietnamese Language Learners"

**What they want to learn:**
- Accurate tones (the #1 complaint about Duolingo VN)
- Grammar depth and sentence structure
- Reading and writing (TELEX typing)
- Formal vs. informal registers; communicating with grandparents vs. peers
- Understanding the Han-Viet word roots (for heritage speakers with Chinese background)

**Pain points:**
- Duolingo’s Vietnamese course is widely criticized for poor quality, missing tones audio, and outdated content
- No app does tones justice — most learners stagnate at "tourist level" and never get conversational
- Lack of community accountability / social features for solo learners
- Heritage speakers feel "not Vietnamese enough" — apps don’t address their specific identity-driven motivation

**VNME features that match:**
- Dedicated Tones & Tone Marks module
- Han-Viet word roots in the dictionary
- TELEX Typing module
- SRS Flashcards with custom decks (for self-directed study)
- Grammar section with in-depth explanations
- Community tab and leaderboards for accountability

**Marketing strategy:**
- Organic Reddit: Engage authentically in r/learnvietnamese — answer questions, share resources, build credibility over 2–4 weeks before mentioning VNME. Post a "I built an app to fix what I hated about Duolingo Vietnamese" launch post.
- Beta tester recruitment: Offer power users (those who post frequently on Reddit) direct beta access and a "Founding Contributor" role in Discord.
- YouTube: Short-form content comparing VNME’s tone teaching vs. Duolingo — direct, honest comparison drives high-intent clicks.
- SEO content: Blog posts targeting "best app to learn Vietnamese", "how to learn Vietnamese tones", "Duolingo Vietnamese alternative".

**Early adopter / waitlist tactic:**
- Dedicated Reddit thread for early feedback. Offer testers a lifetime deal at $20 (limited to 50 seats) — creates urgency and genuine product advocates.
- Create a public changelog/roadmap so community feels invested in product direction.

**Sales process:**
- Self-serve. Strong free tier to overcome skepticism (Reddit users are sensitive to "pay to learn" apps). Upsell via SRS advanced features and community unlocks. Lifetime deal for early evangelists.

---

### Segment 3 — Social Media Audiences (TikTok / Instagram / Threads)

**Who they are:** Younger users (18–32) who consume Vietnamese food, travel, K-pop adjacent culture, or dating-related content on TikTok/Instagram. Many follow Vietnamese creators or have Vietnamese friends. Discovery is entirely algorithm-driven — they aren’t actively seeking a language app but are receptive to one if presented the right way.

**Where to find them:**
- TikTok: #learnvietnamese (300M+ views), #vietnamesefood, #expatsaigon, Vietnamese creator comment sections
- Instagram Reels: Travel/food/lifestyle accounts covering Vietnam
- Threads: Diaspora communities, language learning threads
- YouTube Shorts: "Learn Vietnamese in 60 seconds" style content

**What they want to learn:**
- Being able to comment/DM in Vietnamese to impress a Vietnamese person
- Casual slang and informal phrases (not textbook language)
- Quick wins — something they can use in 5 minutes
- Teen Code to understand what Vietnamese friends text them

**Pain points:**
- No language app matches short-form content consumption habits
- Traditional apps feel like homework — not fun, too slow for the "dopamine learner"
- Can’t relate to formal / textbook Vietnamese taught in most apps

**VNME features that match:**
- Teen Code module (perfect hook: "learn what Vietnamese people actually text")
- Short daily lesson format with gamification (streaks, coins, hearts)
- Dictionary + word saving (look up a word from a TikTok caption instantly)
- Community tab and leaderboards (social proof + accountability)

**Marketing strategy:**
- Hook-first TikTok content: "POV: you’re trying to text your Vietnamese crush" or "When your Vietnamese friends send you this 🫠 — here’s what it means [shows teen code]". Drives curiosity.
- Partner with Vietnamese food/travel TikTok creators for sponsored integrations (gifted trips, product seeding).
- Instagram: Carousel posts — "5 things Vietnamese people text that you didn’t know" (each slide teaches one teen code entry). Swipe hook → link in bio → waitlist.
- Threads: Conversational posts in diaspora/language threads.
- UGC strategy: Encourage users to post their "first Vietnamese sentence" videos with #VNME — community amplification.

**Early adopter / waitlist tactic:**
- TikTok lead gen ad with a "get early access" CTA — drives to Tally waitlist form.
- "Tag a Vietnamese friend who would roast your pronunciation" challenge — organic virality loop.

**Sales process:**
- Top-of-funnel is pure awareness. Conversion is app download → freemium → upsell via engagement. Retargeting ads for waitlist subscribers who haven’t downloaded.

---

### Segment 4 — Heritage Speakers (Vietnamese Diaspora)

**Who they are:** Second and third generation Vietnamese living in the US, Australia, Canada, France, and Germany. Grew up speaking some Vietnamese at home but lost fluency. Now motivated by family connection, identity, or wanting to speak to grandparents before it’s too late.

**Where to find them:**
- Instagram: Vietnamese-American/Australian creators (identity, culture, family content)
- TikTok: #vietamerican #vietnamese diaspora content
- Facebook: Vietnamese community associations, church groups, cultural organizations
- Reddit: r/viet, r/asianamerican

**What they want to learn:**
- Speaking correctly with grandparents and older relatives (formal registers, kinship terms)
- Reading and writing Vietnamese (many understand spoken but can’t read)
- Reclaiming identity — emotional motivation, not just functional

**Pain points:**
- Existing apps treat them as a "beginner" even though they have heritage listening comprehension — the learning curve mismatch is frustrating
- No app acknowledges the emotional / identity dimension of heritage language learning
- The kinship term system (ông, bà, chú, cô, anh, chị, etc.) is uniquely complex and no app covers it properly

**VNME features that match:**
- Kinship Terms module (unique competitive differentiator for this segment)
- Han-Viet dictionary roots (connects to family cultural knowledge)
- Dialect toggle (match to family’s home region — North/South)
- Custom reading material in the Library for intermediate-level heritage speakers

**Marketing strategy:**
- Emotional, identity-first content: "I forgot how to say ‘I love you’ to my grandma in Vietnamese" — drives very high engagement among diaspora.
- Partner with Vietnamese-American/Australian YouTubers and TikTokers who already discuss identity and culture.
- Facebook community group engagement (Vietnamese church groups, cultural associations).
- Mother’s Day / Tết campaign: "Call your grandma in Vietnamese this year" — strong seasonal hook.

**Sales process:**
- Self-serve premium upsell. Strong emotional brand affinity → higher willingness to pay for a "quality" Vietnamese learning product vs. generic apps. Lifetime deal resonates with this segment’s commitment mindset.

---

### Segment 5 — Managers & Executives at Foreign Companies in Vietnam

**Who they are:** Korean, Japanese, Taiwanese, American, French, German, and other European managers and C-suite at large multinationals operating in Vietnam — Samsung, LG, Canon, Bosch, Total Energies, Airbus, AEON, banking/finance sector. Often relocated for 2–3 year stints. Need Vietnamese for team management, business relationships, and daily workplace communication. VNME is uniquely positioned for Japanese, French, and German managers because the dictionary interface is available in their native language — no other tool offers this.

**Where to find them:**
- LinkedIn: "General Manager Vietnam", "Country Director Vietnam", "Plant Manager Vietnam"
- Professional networks: AmCham Vietnam, EuroCham, KorCham, JCCI (Japan Chamber of Commerce)
- Corporate HR/L&D departments at multinationals
- Expat professional events (business networking dinners, Chamber events)

**What they want to learn:**
- Enough Vietnamese to manage a team, run meetings, and build trust with local employees
- Business vocabulary and polite professional registers
- Understanding cultural nuance (hierarchy, formality, indirect communication)
- Measurable progress they can report to HR

**Pain points:**
- No Vietnamese learning tool is designed for the business context — all apps are tourist/travel level
- Busy schedule — needs to fit in 10-minute daily sessions, not hour-long classes
- ROI must be demonstrable for corporate expense approval
- Individual apps don’t scale to team learning programs

**VNME features that match:**
- Professional vocabulary track on the Roadmap
- Short daily session format (10–15 min, fits between meetings)
- Streak and progress tracking (shareable proof of consistent learning)
- Future: Corporate dashboard for HR to track team progress

**Marketing strategy:**
- LinkedIn content: "Why every foreign manager in Vietnam should speak basic Vietnamese" — thought leadership, not product push. Drives profile follows and newsletter signups.
- Chamber of Commerce partnerships: Sponsor or speak at AmCham/EuroCham events; offer corporate trial licenses.
- Direct outreach: LinkedIn Sales Navigator targeting "Country Manager Vietnam", "VP Operations Vietnam" — personalized note, offer a 30-day free corporate trial.
- Case study content: "How learning Vietnamese changed how I manage my team in Hanoi" — partner with 1–2 willing users to produce this.

**Early adopter / waitlist tactic:**
- "Corporate Beta" program: 5 free premium seats for the company in exchange for monthly feedback calls and a testimonial.

**Sales process:**
- Individual: Self-serve freemium → premium upsell.
- Corporate (B2B): LinkedIn DM or email → demo call → 30-day team trial → annual subscription quote (e.g., $200/year per seat, volume discounts for 10+ seats). Invoice/PO-based billing for enterprise expense compliance.

---

### 2.2 Early Tester & Early Adopter Program

**Goal:** Recruit 100–200 engaged beta users across Segments 1–3 before public launch. Quality over quantity — want users who will give structured feedback and become vocal advocates.

**Channels:**
- Reddit (r/learnvietnamese): Direct recruitment post with honest positioning and early access offer.
- Expat Facebook groups: Soft launch announcement with founding member offer.
- TikTok waitlist funnel: Lead gen ad driving to Tally.so waitlist form embedded on landing page.
- Direct network: Friends, colleagues, and Vietnamese community connections of the founding team.

**Offer:**
- Founding Member badge (permanent, in-app)
- Lifetime access at $20 (limited to 100 seats) — creates real skin in the game
- Monthly live feedback call with the product team
- Their name or handle in the app credits/acknowledgments

**Feedback structure:**
- Onboarding survey (motivation, background, which device)
- Weekly 3-question NPS pulse via email or in-app prompt
- Async feedback channel (Discord or WhatsApp group)
- 1:1 calls with 10–15 most engaged testers

**Success metrics for beta:**
- 40% Day 7 retention
- Average 3+ sessions per week
- At least 50% complete the onboarding flow to Lesson 1
- 20+ qualitative pieces of feedback per week

---

### 2.3 Competitive Defensibility

**Direct Competitors:** Duolingo, LingoDeer, Pimsleur (audio-only), HelloTalk (conversation exchange).

**Why VNME wins:**
- Duolingo Vietnamese is widely regarded as low quality — poor tone audio, outdated content, no dialect targeting. VNME’s entire product is built around Vietnamese specificity.
- No competitor has a Teen Code module, kinship system simulation, or Han-Viet root integration.
- **9-language dictionary** is a structural moat: every other Vietnamese learning app is English-first. VNME natively serves Japanese, French, German, Spanish, Russian, Norwegian, and Italian speakers — entirely untapped audiences with zero existing tools.
- Community + content ecosystem (affiliated schools, content creators, expat community channels) creates lock-in that app-only competitors cannot match.
- B2B corporate channel (Segment 5) is entirely unaddressed by consumer language apps — and the Japanese/Korean/French dictionary coverage directly serves the largest foreign investor communities in Vietnam.
- Vietnamese-specific SRS with a tailored content library vs. generic flashcard tools.

**The Moat:** Vietnamese is structurally different from any language existing learning apps were built around. VNME is the only product designed from the ground up for this language’s complexity, its learners’ real motivations, its community’s distribution channels, and crucially — for learners who don’t speak English.

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

- **Quick Setup:** Captures native language (from 9 supported options — sets dictionary interface language), motivation (Travel, Family, Work, Fun), Dialect (North/South/Both), and daily goals (5-20 mins).
- **First Win:** Immediate micro-lesson (Greetings & Tones) rewarding instant XP/Streak logic before the main dashboard.

### 5.2 The Main Learning Loop (Roadmap & Practice)

- **Roadmap:** Linear unit progression with 6 units (~60 path nodes), active nodes, locked nodes, and completed checks. Each lesson node requires completing 4 sessions to mark as complete. Hearts (5 max, regenerates 1 per 30 minutes) gate lesson access to encourage consistent daily practice.
- **Practice Modules & Mini-Games:**
  - Tones & Tone Marks
  - Numbers & Vowels
  - Pronouns (Family tree simulation)
  - TELEX Typing
  - **Teen Code** — Vietnamese texting abbreviations used in digital communication (e.g., k=không, dc=được, mk=mình). Covers 24+ rules across basics, pronouns, verbs, internet slang, and lifestyle vocabulary. Bridges learners from formal to informal digital Vietnamese.
- **Library Tab (Content Hub):**
  - Spotify-style nested filter system. Primary content types: **Grammar**, **Readings**, **Practice**, **Vocabulary**. Each type has contextual sub-tags for granular browsing.
  - Sort controls: Recent / Name / Level. View toggle: List / Grid.
  - **Flashcards (SRS)** live under the Vocabulary content type, enabling in-context review without leaving the Library.
  - Spaced Repetition System (SRS) schedules review intervals at 1→3→7→14→30 days, alerting users when cards are due.
- **Exercise Engine:** An automated exercise generator builds Duolingo-style exercises in a progressive pipeline: Match Pairs → Multiple Choice → Listen & Choose → Reorder → Dictation. Supports both vocabulary and grammar items, auto-selecting distractors from the shared item pool.

### 5.3 Advanced Tools & Utilities

- **Smart Dictionary — 9 Languages:** VNME's dictionary is the product's core infrastructure differentiator. It supports bidirectional lookup between Vietnamese and 9 interface languages, each backed by a dedicated SQLite database:

  | Language | Database | Flag |
  |---|---|---|
  | English | `vn_en_dictionary.db` | 🇬🇧 |
  | Chinese (Traditional) | `vn_zh_dictionary.db` | 🇨🇳 |
  | Japanese | `vn_ja_dictionary.db` | 🇯🇵 |
  | French | `vn_fr_dictionary.db` | 🇫🇷 |
  | Russian | `vn_ru_dictionary.db` | 🇷🇺 |
  | German | `vn_de_dictionary.db` | 🇩🇪 |
  | Norwegian | `vn_no_dictionary.db` | 🇳🇴 |
  | Spanish | `vn_es_dictionary.db` | 🇪🇸 |
  | Italian | `vn_it_dictionary.db` | 🇮🇹 |

  Features: Audio playback, Han Viet (Sino-Vietnamese) word roots for Chinese/Japanese users, auto-language detection, and instant lookup via long-press on the bottom navigation bar. The user's native language is captured at onboarding and determines the default dictionary interface. This multilingual foundation is unique among Vietnamese learning apps — no competitor offers native dictionary access for non-English speakers.
- **Word Saving & Custom Decks:** Users save words directly from the dictionary to a personal saved-words list. Saved words can be organized into named custom decks and reviewed as flashcards in the Library. Saved-word data persists locally and syncs to the SRS pipeline.
- **OCR Translation Feature:** "Chụp hình dịch đơn giản OCR". Users can take photos of text, process local on-device translation (Tesseract.js), and directly add new words to their word banks.
- **ASR Speech Feedback:**
  - *Initial Implementation:* Web Speech API for tone recognition in speaking exercises.
  - *Future Iteration (Phase 2):* Cloud-based comprehensive AI feedback (AWS/Azure).

### 5.4 Community & Social Mechanics

- **Leaderboards & Friends:** Tracking XP, streaks, and Word Library completion amongst peers.
- **Referrals Program:** Incentivizing the "Grab as many users as possible" objective.
- **Affiliated Business Pages:** Directory and integration with partner Cram Schools and educators.

### 5.5 Gamification & Progression

- **XP & Streaks:** XP is awarded on lesson and test completion. Daily streaks track consecutive active days and are a primary retention driver shown prominently on the home dashboard.
- **Coins:** A soft in-app currency awarded for completing lessons and tests (10 coins per lesson, 25 per test). Coins replace the earlier premium currency concept and are used for in-app rewards and progression incentives. No real-money purchase flow for coins.
- **Hearts:** A daily energy mechanic (max 5 hearts) that gates lesson attempts. Hearts regenerate automatically (1 heart per 30 minutes), encouraging healthy session spacing without hard paywalls. Hearts are lost on incorrect lesson attempts.
- **Achievements:** Rule-based achievement unlocks tied to streaks, total XP thresholds, and lesson completion milestones.

### 5.6 Admin Content Management System (CMS)

- **Visual Mapping:** Roadmap mapper, scalable lesson builders, and grammar editors.
- **Media Support:** The CMS natively supports embedding both photos and text for richer lesson design.
- **Editors:** Article Editor, Vocabulary Editor, Tone Word Editor, Kinship Term Editor — enabling non-technical content managers to maintain and expand the curriculum without developer involvement.

---

## 6. Technical Requirements

- **Frontend (Current — Web/PWA):** React 19 + Vite, React Router v6, Context API for global state. Mobile-optimized (480px viewport). Deployed as a Progressive Web App.
- **Frontend (Roadmap — Native):** Flutter for native iOS/Android packaging once the React PWA has validated product-market fit.
- **Backend Services:** Node.js/Express serving 9 language-specific SQLite dictionary databases (`vn_en`, `vn_zh`, `vn_ja`, `vn_fr`, `vn_ru`, `vn_de`, `vn_no`, `vn_es`, `vn_it`). Designed to scale to PostgreSQL for production user data, leaderboards, and community features.
- **Local Device Processing:** On-device OCR (Tesseract.js) and speech recognition (Web Speech API) to reduce server friction and latency for free users.
- **Data Persistence (Current):** localStorage for mock user data, SRS cards, saved words, and custom decks during development. PostgreSQL schema defined and ready for production migration (`schema.sql`).
