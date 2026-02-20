-- USERS
CREATE TABLE app_user (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_profile (
  user_id UUID PRIMARY KEY REFERENCES app_user(id),
  ui_language TEXT NOT NULL,             -- "en", "zh-Hant", ...
  dialect TEXT NOT NULL,                 -- "north", "south", "both"
  daily_goal_minutes INT NOT NULL,
  reminder_time_local TIME,
  timezone TEXT,
  level_estimate TEXT,                   -- "new", "basic", "intermediate"
  onboarding_completed BOOLEAN NOT NULL DEFAULT false
);

-- COURSE CONTENT
CREATE TABLE course (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,             -- "vi_en", "vi_zh"
  version INT NOT NULL,
  title TEXT NOT NULL
);

CREATE TABLE unit (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES course(id),
  unit_index INT NOT NULL,
  title TEXT NOT NULL
);

CREATE TABLE skill (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES course(id),
  key TEXT NOT NULL,                     -- "tones_basic", "food_ordering_1"
  title TEXT NOT NULL,
  skill_type TEXT NOT NULL               -- "vocab", "grammar", "tones", "pronunciation"
);

CREATE TABLE lesson (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES course(id),
  skill_id UUID REFERENCES skill(id),
  lesson_index INT NOT NULL,
  title TEXT
);

-- PATH NODES (Duolingo-like)
CREATE TABLE path_node (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES course(id),
  unit_id UUID REFERENCES unit(id),
  node_index INT NOT NULL,               -- order along the path
  node_type TEXT NOT NULL,               -- "lesson" | "review" | "checkpoint" | "story"
  lesson_id UUID NULL REFERENCES lesson(id),
  skill_id UUID NULL REFERENCES skill(id),
  unlock_rule JSONB                      -- flexible gating rules
);

-- LINGUISTIC ITEMS (reused across features)
CREATE TABLE exercise_item (
  id UUID PRIMARY KEY,
  item_type TEXT NOT NULL,               -- "word" | "phrase" | "sentence"
  vi_text TEXT NOT NULL,
  vi_text_no_diacritics TEXT,            -- for tone/diacritic drills
  ipa TEXT,                              -- optional
  phonemes JSONB,                        -- optional array
  audio_url TEXT,
  dialect TEXT                           -- "north" | "south" | "both"
);

CREATE TABLE item_translation (
  item_id UUID REFERENCES exercise_item(id),
  lang TEXT NOT NULL,                    -- "en", "zh-Hant", ...
  text TEXT NOT NULL,
  PRIMARY KEY (item_id, lang)
);

-- EXERCISES
CREATE TABLE exercise (
  id UUID PRIMARY KEY,
  lesson_id UUID REFERENCES lesson(id),
  exercise_type TEXT NOT NULL,           -- "mcq", "listen_tap", "dictation", "speaking_repeat", ...
  prompt JSONB NOT NULL                  -- holds choices, correct answers, refs to items
);

CREATE TABLE exercise_item_link (
  exercise_id UUID REFERENCES exercise(id),
  item_id UUID REFERENCES exercise_item(id),
  role TEXT NOT NULL,                    -- "prompt" | "choice" | "answer" | "distractor"
  PRIMARY KEY (exercise_id, item_id, role)
);

-- USER PROGRESS
CREATE TABLE user_node_state (
  user_id UUID REFERENCES app_user(id),
  node_id UUID REFERENCES path_node(id),
  status TEXT NOT NULL,                  -- "locked" | "unlocked" | "completed"
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, node_id)
);

CREATE TABLE user_skill_mastery (
  user_id UUID REFERENCES app_user(id),
  skill_id UUID REFERENCES skill(id),
  mastery_score INT NOT NULL DEFAULT 0,  -- 0..100
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE user_exercise_attempt (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES app_user(id),
  exercise_id UUID REFERENCES exercise(id),
  correct BOOLEAN,
  response_time_ms INT,
  speaking_score REAL,                   -- 0..1 if speaking
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB                          -- per-token errors, chosen answers, ASR transcript, etc.
);

-- SRS (for Practice)
CREATE TABLE srs_card (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES app_user(id),
  item_id UUID REFERENCES exercise_item(id),
  state TEXT NOT NULL,                   -- "learning" | "review"
  ease REAL NOT NULL DEFAULT 2.5,
  interval_days REAL NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ NOT NULL,
  last_result JSONB
);

-- WATCH CONTENT
CREATE TABLE media_content (
  id UUID PRIMARY KEY,
  content_type TEXT NOT NULL,            -- "video" | "news"
  title TEXT NOT NULL,
  level TEXT,                            -- "A1"..."B2" (your own scale)
  source TEXT,
  thumb_url TEXT,
  media_url TEXT,                        -- video url if video
  published_at TIMESTAMPTZ
);

CREATE TABLE media_segment (
  id UUID PRIMARY KEY,
  content_id UUID REFERENCES media_content(id),
  segment_index INT NOT NULL,
  start_ms INT,                          -- for video
  end_ms INT,
  vi_text TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE media_segment_translation (
  segment_id UUID REFERENCES media_segment(id),
  lang TEXT NOT NULL,
  text TEXT NOT NULL,
  PRIMARY KEY (segment_id, lang)
);

CREATE TABLE user_saved_item (
  user_id UUID REFERENCES app_user(id),
  item_id UUID REFERENCES exercise_item(id),
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

-- GAMIFICATION
CREATE TABLE user_xp (
  user_id UUID PRIMARY KEY REFERENCES app_user(id),
  total_xp INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  last_active_date DATE
);

CREATE TABLE achievement (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  rule JSONB NOT NULL                    -- e.g. {"type":"streak","days":7}
);

CREATE TABLE user_achievement (
  user_id UUID REFERENCES app_user(id),
  achievement_id UUID REFERENCES achievement(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);
