// A mock database using localStorage to simulate a backend for the 100-levels proposal.

const DB_KEY = 'vnme_mock_db_v5'; // Bumped to v5 for integrated roadmap with skill nodes + test gates

const INIT_DATA = {
    course: {
        id: "course_vi_en_v1",
        code: "vi_en",
        version: 1,
        title: "Vietnamese (English UI)",
        dialect_default: "both"
    },
    units: [
        { id: "unit_1_basics", course_id: "course_vi_en_v1", unit_index: 1, title: "Unit 1 — Basics" },
        { id: "unit_2_coffee", course_id: "course_vi_en_v1", unit_index: 2, title: "Unit 2 — Coffee Culture" },
        { id: "unit_3_market", course_id: "course_vi_en_v1", unit_index: 3, title: "Unit 3 — Market Life" },
        { id: "unit_4_transport", course_id: "course_vi_en_v1", unit_index: 4, title: "Unit 4 — Getting Around" },
        { id: "unit_5_daily", course_id: "course_vi_en_v1", unit_index: 5, title: "Unit 5 — Daily Life" },
        { id: "unit_6_friends", course_id: "course_vi_en_v1", unit_index: 6, title: "Unit 6 — Making Friends" }
    ],
    skills: [
        { id: "skill_greetings_1", course_id: "course_vi_en_v1", key: "greetings_1", title: "Greetings", skill_type: "vocab" },
        { id: "skill_introduce_1", course_id: "course_vi_en_v1", key: "introduce_1", title: "Introduce Yourself", skill_type: "grammar" },
        { id: "skill_polite_1", course_id: "course_vi_en_v1", key: "polite_1", title: "Polite Phrases", skill_type: "vocab" },
        { id: "skill_numbers_1", course_id: "course_vi_en_v1", key: "numbers_1", title: "Numbers 1–10", skill_type: "vocab" },
        { id: "skill_order_1", course_id: "course_vi_en_v1", key: "order_1", title: "Ordering Drinks", skill_type: "grammar" },
        { id: "skill_cafe_1", course_id: "course_vi_en_v1", key: "cafe_1", title: "At the Café", skill_type: "vocab" },
        { id: "skill_food_1", course_id: "course_vi_en_v1", key: "food_1", title: "Food Vocabulary", skill_type: "vocab" },
        { id: "skill_market_1", course_id: "course_vi_en_v1", key: "market_1", title: "At the Market", skill_type: "grammar" },
        // Unit 3 skills
        { id: "skill_colors_1", course_id: "course_vi_en_v1", key: "colors_1", title: "Colors & Descriptions", skill_type: "vocab" },
        { id: "skill_haggle_1", course_id: "course_vi_en_v1", key: "haggle_1", title: "Haggling", skill_type: "grammar" },
        { id: "skill_fruit_1", course_id: "course_vi_en_v1", key: "fruit_1", title: "Fruits & Vegetables", skill_type: "vocab" },
        { id: "skill_bignums_1", course_id: "course_vi_en_v1", key: "bignums_1", title: "Big Numbers", skill_type: "vocab" },
        // Unit 4 skills
        { id: "skill_directions_1", course_id: "course_vi_en_v1", key: "directions_1", title: "Directions", skill_type: "vocab" },
        { id: "skill_taxi_1", course_id: "course_vi_en_v1", key: "taxi_1", title: "Taxi & Grab", skill_type: "grammar" },
        { id: "skill_hotel_1", course_id: "course_vi_en_v1", key: "hotel_1", title: "At the Hotel", skill_type: "vocab" },
        { id: "skill_help_1", course_id: "course_vi_en_v1", key: "help_1", title: "Asking for Help", skill_type: "grammar" },
        // Unit 5 skills
        { id: "skill_time_1", course_id: "course_vi_en_v1", key: "time_1", title: "Time & Schedule", skill_type: "vocab" },
        { id: "skill_weather_1", course_id: "course_vi_en_v1", key: "weather_1", title: "Weather", skill_type: "vocab" },
        { id: "skill_family_1", course_id: "course_vi_en_v1", key: "family_1", title: "Family", skill_type: "vocab" },
        { id: "skill_house_1", course_id: "course_vi_en_v1", key: "house_1", title: "Around the House", skill_type: "vocab" },
        // Unit 6 skills
        { id: "skill_hobbies_1", course_id: "course_vi_en_v1", key: "hobbies_1", title: "Hobbies & Interests", skill_type: "vocab" },
        { id: "skill_feelings_1", course_id: "course_vi_en_v1", key: "feelings_1", title: "Feelings & Opinions", skill_type: "vocab" },
        { id: "skill_invite_1", course_id: "course_vi_en_v1", key: "invite_1", title: "Invitations", skill_type: "grammar" },
        { id: "skill_party_1", course_id: "course_vi_en_v1", key: "party_1", title: "At the Party", skill_type: "vocab" }
    ],
    lessons: [
        { id: "lesson_001", course_id: "course_vi_en_v1", skill_id: "skill_greetings_1", lesson_index: 1, title: "Hello & Goodbye", target_xp: 10 },
        { id: "lesson_002", course_id: "course_vi_en_v1", skill_id: "skill_introduce_1", lesson_index: 1, title: "My Name Is…", target_xp: 12 },
        { id: "lesson_003", course_id: "course_vi_en_v1", skill_id: "skill_polite_1", lesson_index: 1, title: "Please & Sorry", target_xp: 12 },
        { id: "lesson_004", course_id: "course_vi_en_v1", skill_id: "skill_numbers_1", lesson_index: 1, title: "1 to 10", target_xp: 12 },
        { id: "lesson_005", course_id: "course_vi_en_v1", skill_id: "skill_order_1", lesson_index: 1, title: "I Want…", target_xp: 14 },
        { id: "lesson_006", course_id: "course_vi_en_v1", skill_id: "skill_cafe_1", lesson_index: 1, title: "Café Ordering", target_xp: 14 },
        { id: "lesson_007", course_id: "course_vi_en_v1", skill_id: "skill_food_1", lesson_index: 1, title: "Vietnamese Food", target_xp: 14 },
        { id: "lesson_008", course_id: "course_vi_en_v1", skill_id: "skill_market_1", lesson_index: 1, title: "How Much?", target_xp: 16 },
        // Unit 3
        { id: "lesson_009", course_id: "course_vi_en_v1", skill_id: "skill_colors_1", lesson_index: 1, title: "Colors & Descriptions", target_xp: 16 },
        { id: "lesson_010", course_id: "course_vi_en_v1", skill_id: "skill_haggle_1", lesson_index: 1, title: "Haggling", target_xp: 16 },
        { id: "lesson_011", course_id: "course_vi_en_v1", skill_id: "skill_fruit_1", lesson_index: 1, title: "Fruits & Vegetables", target_xp: 16 },
        { id: "lesson_012", course_id: "course_vi_en_v1", skill_id: "skill_bignums_1", lesson_index: 1, title: "Big Numbers", target_xp: 18 },
        // Unit 4
        { id: "lesson_013", course_id: "course_vi_en_v1", skill_id: "skill_directions_1", lesson_index: 1, title: "Where To?", target_xp: 18 },
        { id: "lesson_014", course_id: "course_vi_en_v1", skill_id: "skill_taxi_1", lesson_index: 1, title: "Taxi & Grab", target_xp: 18 },
        { id: "lesson_015", course_id: "course_vi_en_v1", skill_id: "skill_hotel_1", lesson_index: 1, title: "At the Hotel", target_xp: 18 },
        { id: "lesson_016", course_id: "course_vi_en_v1", skill_id: "skill_help_1", lesson_index: 1, title: "Asking for Help", target_xp: 20 },
        // Unit 5
        { id: "lesson_017", course_id: "course_vi_en_v1", skill_id: "skill_time_1", lesson_index: 1, title: "Time & Schedule", target_xp: 20 },
        { id: "lesson_018", course_id: "course_vi_en_v1", skill_id: "skill_weather_1", lesson_index: 1, title: "Weather & Seasons", target_xp: 20 },
        { id: "lesson_019", course_id: "course_vi_en_v1", skill_id: "skill_family_1", lesson_index: 1, title: "Family", target_xp: 20 },
        { id: "lesson_020", course_id: "course_vi_en_v1", skill_id: "skill_house_1", lesson_index: 1, title: "Around the House", target_xp: 22 },
        // Unit 6
        { id: "lesson_021", course_id: "course_vi_en_v1", skill_id: "skill_hobbies_1", lesson_index: 1, title: "Hobbies & Interests", target_xp: 22 },
        { id: "lesson_022", course_id: "course_vi_en_v1", skill_id: "skill_feelings_1", lesson_index: 1, title: "Feelings & Opinions", target_xp: 22 },
        { id: "lesson_023", course_id: "course_vi_en_v1", skill_id: "skill_invite_1", lesson_index: 1, title: "Invitations", target_xp: 22 },
        { id: "lesson_024", course_id: "course_vi_en_v1", skill_id: "skill_party_1", lesson_index: 1, title: "At the Party", target_xp: 24 }
    ],
    path_nodes: [
        // Unit 1: Basics — lessons + skill nodes + test gate
        { id: "node_001", course_id: "course_vi_en_v1", unit_id: "unit_1_basics", node_index: 1, node_type: "lesson", lesson_id: "lesson_001", unlock_rule: { requires: [] } },
        { id: "node_002", course_id: "course_vi_en_v1", unit_id: "unit_1_basics", node_index: 2, node_type: "lesson", lesson_id: "lesson_002", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_001" }] } },
        { id: "node_s02", course_id: "course_vi_en_v1", unit_id: "unit_1_basics", node_index: 3, node_type: "skill", label: "Vowels Basics", skill_content: { type: "practice_module", route: "/practice/vowels" }, unlock_rule: { requires: [{ type: "node_completed", node_id: "node_002" }] } },
        { id: "node_003", course_id: "course_vi_en_v1", unit_id: "unit_1_basics", node_index: 4, node_type: "lesson", lesson_id: "lesson_003", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_s02" }] } },
        { id: "node_s01", course_id: "course_vi_en_v1", unit_id: "unit_1_basics", node_index: 5, node_type: "skill", label: "Tone Marks", skill_content: { type: "practice_module", route: "/practice/tonemarks" }, unlock_rule: { requires: [{ type: "node_completed", node_id: "node_003" }] } },
        { id: "node_004", course_id: "course_vi_en_v1", unit_id: "unit_1_basics", node_index: 6, node_type: "lesson", lesson_id: "lesson_004", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_s02" }] } },
        { id: "node_005", course_id: "course_vi_en_v1", unit_id: "unit_1_basics", node_index: 7, node_type: "lesson", lesson_id: "lesson_005", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_004" }] } },
        { id: "node_t01", course_id: "course_vi_en_v1", unit_id: "unit_1_basics", node_index: 8, node_type: "test", label: "Unit 1 Quiz", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_005" }] } },

        // Unit 2: Coffee Culture — lessons + grammar skill + test gate
        { id: "node_006", course_id: "course_vi_en_v1", unit_id: "unit_2_coffee", node_index: 1, node_type: "lesson", lesson_id: "lesson_006", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_t01" }] } },
        { id: "node_s03", course_id: "course_vi_en_v1", unit_id: "unit_2_coffee", node_index: 2, node_type: "skill", label: "Grammar: Subject + là", skill_content: { type: "grammar_lesson", grammar_level: "A1", grammar_index: 0 }, unlock_rule: { requires: [{ type: "node_completed", node_id: "node_006" }] } },
        { id: "node_007", course_id: "course_vi_en_v1", unit_id: "unit_2_coffee", node_index: 3, node_type: "lesson", lesson_id: "lesson_007", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_s03" }] } },
        { id: "node_s04", course_id: "course_vi_en_v1", unit_id: "unit_2_coffee", node_index: 4, node_type: "skill", label: "Tone Mastery", skill_content: { type: "practice_module", route: "/practice/tones" }, unlock_rule: { requires: [{ type: "node_completed", node_id: "node_007" }] } },
        { id: "node_008", course_id: "course_vi_en_v1", unit_id: "unit_2_coffee", node_index: 5, node_type: "lesson", lesson_id: "lesson_008", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_s04" }] } },
        { id: "node_t02", course_id: "course_vi_en_v1", unit_id: "unit_2_coffee", node_index: 6, node_type: "test", label: "Unit 2 Quiz", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_008" }] } },

        // Unit 3: Market Life
        { id: "node_009", course_id: "course_vi_en_v1", unit_id: "unit_3_market", node_index: 1, node_type: "lesson", lesson_id: "lesson_009", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_t02" }] } },
        { id: "node_010", course_id: "course_vi_en_v1", unit_id: "unit_3_market", node_index: 2, node_type: "lesson", lesson_id: "lesson_010", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_009" }] } },
        { id: "node_s05", course_id: "course_vi_en_v1", unit_id: "unit_3_market", node_index: 3, node_type: "skill", label: "Grammar: Asking Questions", skill_content: { type: "grammar_lesson", grammar_level: "A1", grammar_index: 4 }, unlock_rule: { requires: [{ type: "node_completed", node_id: "node_010" }] } },
        { id: "node_011", course_id: "course_vi_en_v1", unit_id: "unit_3_market", node_index: 4, node_type: "lesson", lesson_id: "lesson_011", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_s05" }] } },
        { id: "node_s06", course_id: "course_vi_en_v1", unit_id: "unit_3_market", node_index: 5, node_type: "skill", label: "Numbers Master", skill_content: { type: "practice_module", route: "/practice/numbers" }, unlock_rule: { requires: [{ type: "node_completed", node_id: "node_011" }] } },
        { id: "node_012", course_id: "course_vi_en_v1", unit_id: "unit_3_market", node_index: 6, node_type: "lesson", lesson_id: "lesson_012", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_s06" }] } },
        { id: "node_t03", course_id: "course_vi_en_v1", unit_id: "unit_3_market", node_index: 7, node_type: "test", label: "Unit 3 Quiz", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_012" }] } },

        // Unit 4: Getting Around
        { id: "node_013", course_id: "course_vi_en_v1", unit_id: "unit_4_transport", node_index: 1, node_type: "lesson", lesson_id: "lesson_013", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_t03" }] } },
        { id: "node_014", course_id: "course_vi_en_v1", unit_id: "unit_4_transport", node_index: 2, node_type: "lesson", lesson_id: "lesson_014", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_013" }] } },
        { id: "node_s07", course_id: "course_vi_en_v1", unit_id: "unit_4_transport", node_index: 3, node_type: "skill", label: "Grammar: Giving Directions", skill_content: { type: "grammar_lesson", grammar_level: "A1", grammar_index: 2 }, unlock_rule: { requires: [{ type: "node_completed", node_id: "node_014" }] } },
        { id: "node_015", course_id: "course_vi_en_v1", unit_id: "unit_4_transport", node_index: 4, node_type: "lesson", lesson_id: "lesson_015", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_s07" }] } },
        { id: "node_s08", course_id: "course_vi_en_v1", unit_id: "unit_4_transport", node_index: 5, node_type: "skill", label: "TELEX Typing", skill_content: { type: "practice_module", route: "/practice/telex" }, unlock_rule: { requires: [{ type: "node_completed", node_id: "node_015" }] } },
        { id: "node_016", course_id: "course_vi_en_v1", unit_id: "unit_4_transport", node_index: 6, node_type: "lesson", lesson_id: "lesson_016", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_s08" }] } },
        { id: "node_t04", course_id: "course_vi_en_v1", unit_id: "unit_4_transport", node_index: 7, node_type: "test", label: "Unit 4 Quiz", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_016" }] } },

        // Unit 5: Daily Life
        { id: "node_017", course_id: "course_vi_en_v1", unit_id: "unit_5_daily", node_index: 1, node_type: "lesson", lesson_id: "lesson_017", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_t04" }] } },
        { id: "node_s09", course_id: "course_vi_en_v1", unit_id: "unit_5_daily", node_index: 2, node_type: "skill", label: "Grammar: Time Expressions", skill_content: { type: "grammar_lesson", grammar_level: "A1", grammar_index: 6 }, unlock_rule: { requires: [{ type: "node_completed", node_id: "node_017" }] } },
        { id: "node_018", course_id: "course_vi_en_v1", unit_id: "unit_5_daily", node_index: 3, node_type: "lesson", lesson_id: "lesson_018", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_s09" }] } },
        { id: "node_019", course_id: "course_vi_en_v1", unit_id: "unit_5_daily", node_index: 4, node_type: "lesson", lesson_id: "lesson_019", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_018" }] } },
        { id: "node_s10", course_id: "course_vi_en_v1", unit_id: "unit_5_daily", node_index: 5, node_type: "skill", label: "Pronouns & Kinship", skill_content: { type: "practice_module", route: "/practice/pronouns" }, unlock_rule: { requires: [{ type: "node_completed", node_id: "node_019" }] } },
        { id: "node_020", course_id: "course_vi_en_v1", unit_id: "unit_5_daily", node_index: 6, node_type: "lesson", lesson_id: "lesson_020", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_s10" }] } },
        { id: "node_t05", course_id: "course_vi_en_v1", unit_id: "unit_5_daily", node_index: 7, node_type: "test", label: "Unit 5 Quiz", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_020" }] } },

        // Unit 6: Making Friends
        { id: "node_021", course_id: "course_vi_en_v1", unit_id: "unit_6_friends", node_index: 1, node_type: "lesson", lesson_id: "lesson_021", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_t05" }] } },
        { id: "node_022", course_id: "course_vi_en_v1", unit_id: "unit_6_friends", node_index: 2, node_type: "lesson", lesson_id: "lesson_022", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_021" }] } },
        { id: "node_s11", course_id: "course_vi_en_v1", unit_id: "unit_6_friends", node_index: 3, node_type: "skill", label: "Grammar: Invitations", skill_content: { type: "grammar_lesson", grammar_level: "A1", grammar_index: 8 }, unlock_rule: { requires: [{ type: "node_completed", node_id: "node_022" }] } },
        { id: "node_023", course_id: "course_vi_en_v1", unit_id: "unit_6_friends", node_index: 4, node_type: "lesson", lesson_id: "lesson_023", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_s11" }] } },
        { id: "node_s12", course_id: "course_vi_en_v1", unit_id: "unit_6_friends", node_index: 5, node_type: "skill", label: "Flashcard Review", skill_content: { type: "practice_module", route: "/practice/flashcards" }, unlock_rule: { requires: [{ type: "node_completed", node_id: "node_023" }] } },
        { id: "node_024", course_id: "course_vi_en_v1", unit_id: "unit_6_friends", node_index: 6, node_type: "lesson", lesson_id: "lesson_024", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_s12" }] } },
        { id: "node_t06", course_id: "course_vi_en_v1", unit_id: "unit_6_friends", node_index: 7, node_type: "test", label: "Final Quiz", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_024" }] } }
    ],
    items: [
        { id: "it_w_0001", item_type: "word", vi_text: "xin chào", vi_text_no_diacritics: "xin chao", audio_key: "a_xin_chao", dialect: "both" },
        { id: "it_w_0002", item_type: "word", vi_text: "chào", vi_text_no_diacritics: "chao", audio_key: "a_chao", dialect: "both" },
        { id: "it_w_0003", item_type: "word", vi_text: "tạm biệt", vi_text_no_diacritics: "tam biet", audio_key: "a_tam_biet", dialect: "both" },
        { id: "it_w_0004", item_type: "word", vi_text: "cảm ơn", vi_text_no_diacritics: "cam on", audio_key: "a_cam_on", dialect: "both" },
        { id: "it_w_0005", item_type: "word", vi_text: "vâng", vi_text_no_diacritics: "vang", audio_key: "a_vang", dialect: "north" },
        { id: "it_w_0006", item_type: "word", vi_text: "dạ", vi_text_no_diacritics: "da", audio_key: "a_da", dialect: "south" },
        { id: "it_w_0007", item_type: "word", vi_text: "không", vi_text_no_diacritics: "khong", audio_key: "a_khong", dialect: "both" },
        { id: "it_w_0008", item_type: "word", vi_text: "tôi", vi_text_no_diacritics: "toi", audio_key: "a_toi", dialect: "both" },
        { id: "it_w_0009", item_type: "word", vi_text: "bạn", vi_text_no_diacritics: "ban", audio_key: "a_ban", dialect: "both" },
        { id: "it_p_0010", item_type: "phrase", vi_text: "tôi tên là {NAME}", vi_text_no_diacritics: "toi ten la {NAME}", audio_key: "a_toi_ten_la_name", dialect: "both" },
        { id: "it_p_0011", item_type: "phrase", vi_text: "tôi là {ROLE}", vi_text_no_diacritics: "toi la {ROLE}", audio_key: "a_toi_la_role", dialect: "both" },
        { id: "it_s_0012", item_type: "sentence", vi_text: "Bạn tên là gì?", vi_text_no_diacritics: "Ban ten la gi?", audio_key: "a_ban_ten_la_gi", dialect: "both" },
        { id: "it_s_0013", item_type: "sentence", vi_text: "Rất vui được gặp bạn.", vi_text_no_diacritics: "Rat vui duoc gap ban.", audio_key: "a_rat_vui_duoc_gap_ban", dialect: "both" },
        { id: "it_w_0014", item_type: "word", vi_text: "xin lỗi", vi_text_no_diacritics: "xin loi", audio_key: "a_xin_loi", dialect: "both" },
        { id: "it_w_0015", item_type: "word", vi_text: "làm ơn", vi_text_no_diacritics: "lam on", audio_key: "a_lam_on", dialect: "both" },
        { id: "it_s_0016", item_type: "sentence", vi_text: "Tôi không hiểu.", vi_text_no_diacritics: "Toi khong hieu.", audio_key: "a_toi_khong_hieu", dialect: "both" },
        { id: "it_s_0017", item_type: "sentence", vi_text: "Bạn có thể nói chậm lại không?", vi_text_no_diacritics: "Ban co the noi cham lai khong?", audio_key: "a_noi_cham_lai", dialect: "both" },
        { id: "it_w_0020", item_type: "word", vi_text: "một", vi_text_no_diacritics: "mot", audio_key: "a_mot", dialect: "both" },
        { id: "it_w_0021", item_type: "word", vi_text: "hai", vi_text_no_diacritics: "hai", audio_key: "a_hai", dialect: "both" },
        { id: "it_w_0022", item_type: "word", vi_text: "ba", vi_text_no_diacritics: "ba", audio_key: "a_ba", dialect: "both" },
        { id: "it_w_0023", item_type: "word", vi_text: "bốn", vi_text_no_diacritics: "bon", audio_key: "a_bon", dialect: "both" },
        { id: "it_w_0024", item_type: "word", vi_text: "năm", vi_text_no_diacritics: "nam", audio_key: "a_nam", dialect: "both" },
        { id: "it_w_0025", item_type: "word", vi_text: "sáu", vi_text_no_diacritics: "sau", audio_key: "a_sau", dialect: "both" },
        { id: "it_w_0026", item_type: "word", vi_text: "bảy", vi_text_no_diacritics: "bay", audio_key: "a_bay", dialect: "both" },
        { id: "it_w_0027", item_type: "word", vi_text: "tám", vi_text_no_diacritics: "tam", audio_key: "a_tam", dialect: "both" },
        { id: "it_w_0028", item_type: "word", vi_text: "chín", vi_text_no_diacritics: "chin", audio_key: "a_chin", dialect: "both" },
        { id: "it_w_0029", item_type: "word", vi_text: "mười", vi_text_no_diacritics: "muoi", audio_key: "a_muoi", dialect: "both" },
        { id: "it_w_0030", item_type: "word", vi_text: "cà phê", vi_text_no_diacritics: "ca phe", audio_key: "a_ca_phe", dialect: "both" },
        { id: "it_w_0031", item_type: "word", vi_text: "trà", vi_text_no_diacritics: "tra", audio_key: "a_tra", dialect: "both" },
        { id: "it_w_0032", item_type: "word", vi_text: "nước", vi_text_no_diacritics: "nuoc", audio_key: "a_nuoc", dialect: "both" },
        { id: "it_s_0033", item_type: "sentence", vi_text: "Cho tôi một cà phê, làm ơn.", vi_text_no_diacritics: "Cho toi mot ca phe, lam on.", audio_key: "a_cho_toi_mot_ca_phe", dialect: "both" },
        { id: "it_s_0034", item_type: "sentence", vi_text: "Tôi muốn một trà.", vi_text_no_diacritics: "Toi muon mot tra.", audio_key: "a_toi_muon_mot_tra", dialect: "both" },
        { id: "it_w_0035", item_type: "word", vi_text: "muốn", vi_text_no_diacritics: "muon", audio_key: "a_muon", dialect: "both" },
        { id: "it_w_0036", item_type: "word", vi_text: "cho", vi_text_no_diacritics: "cho", audio_key: "a_cho", dialect: "both" },
        { id: "it_s_0037", item_type: "sentence", vi_text: "Cảm ơn!", vi_text_no_diacritics: "Cam on!", audio_key: "a_cam_on_2", dialect: "both" },
        // Unit 2 items
        { id: "it_w_0040", item_type: "word", vi_text: "cà phê sữa đá", vi_text_no_diacritics: "ca phe sua da", audio_key: "a_ca_phe_sua_da", dialect: "both" },
        { id: "it_w_0041", item_type: "word", vi_text: "sữa", vi_text_no_diacritics: "sua", audio_key: "a_sua", dialect: "both" },
        { id: "it_w_0042", item_type: "word", vi_text: "đá", vi_text_no_diacritics: "da_ice", audio_key: "a_da_ice", dialect: "both" },
        { id: "it_w_0043", item_type: "word", vi_text: "nóng", vi_text_no_diacritics: "nong", audio_key: "a_nong", dialect: "both" },
        { id: "it_s_0044", item_type: "sentence", vi_text: "Cho tôi một cà phê sữa đá.", vi_text_no_diacritics: "Cho toi mot ca phe sua da.", audio_key: "a_cho_toi_csda", dialect: "both" },
        { id: "it_w_0045", item_type: "word", vi_text: "phở", vi_text_no_diacritics: "pho", audio_key: "a_pho", dialect: "both" },
        { id: "it_w_0046", item_type: "word", vi_text: "bánh mì", vi_text_no_diacritics: "banh mi", audio_key: "a_banh_mi", dialect: "both" },
        { id: "it_w_0047", item_type: "word", vi_text: "bún", vi_text_no_diacritics: "bun", audio_key: "a_bun", dialect: "both" },
        { id: "it_w_0048", item_type: "word", vi_text: "cơm", vi_text_no_diacritics: "com", audio_key: "a_com", dialect: "both" },
        { id: "it_s_0049", item_type: "sentence", vi_text: "Tôi muốn một bát phở.", vi_text_no_diacritics: "Toi muon mot bat pho.", audio_key: "a_toi_muon_pho", dialect: "both" },
        { id: "it_w_0050", item_type: "word", vi_text: "bát", vi_text_no_diacritics: "bat", audio_key: "a_bat", dialect: "both" },
        { id: "it_w_0051", item_type: "word", vi_text: "ngon", vi_text_no_diacritics: "ngon", audio_key: "a_ngon", dialect: "both" },
        { id: "it_w_0052", item_type: "word", vi_text: "bao nhiêu", vi_text_no_diacritics: "bao nhieu", audio_key: "a_bao_nhieu", dialect: "both" },
        { id: "it_w_0053", item_type: "word", vi_text: "tiền", vi_text_no_diacritics: "tien", audio_key: "a_tien", dialect: "both" },
        { id: "it_s_0054", item_type: "sentence", vi_text: "Cái này bao nhiêu tiền?", vi_text_no_diacritics: "Cai nay bao nhieu tien?", audio_key: "a_bao_nhieu_tien", dialect: "both" },
        { id: "it_w_0055", item_type: "word", vi_text: "cái này", vi_text_no_diacritics: "cai nay", audio_key: "a_cai_nay", dialect: "both" },
        { id: "it_w_0056", item_type: "word", vi_text: "đắt", vi_text_no_diacritics: "dat", audio_key: "a_dat", dialect: "both" },
        { id: "it_w_0057", item_type: "word", vi_text: "rẻ", vi_text_no_diacritics: "re", audio_key: "a_re", dialect: "both" },
        // Unit 3: Market Life
        // Lesson 009: Colors & Descriptions
        { id: "it_w_0060", item_type: "word", vi_text: "màu", vi_text_no_diacritics: "mau", audio_key: "a_mau", dialect: "both" },
        { id: "it_w_0061", item_type: "word", vi_text: "đỏ", vi_text_no_diacritics: "do", audio_key: "a_do", dialect: "both" },
        { id: "it_w_0062", item_type: "word", vi_text: "xanh", vi_text_no_diacritics: "xanh", audio_key: "a_xanh", dialect: "both" },
        { id: "it_w_0063", item_type: "word", vi_text: "trắng", vi_text_no_diacritics: "trang", audio_key: "a_trang", dialect: "both" },
        { id: "it_w_0064", item_type: "word", vi_text: "đen", vi_text_no_diacritics: "den", audio_key: "a_den", dialect: "both" },
        { id: "it_w_0065", item_type: "word", vi_text: "vàng", vi_text_no_diacritics: "vang_color", audio_key: "a_vang_color", dialect: "both" },
        { id: "it_w_0066", item_type: "word", vi_text: "to", vi_text_no_diacritics: "to", audio_key: "a_to", dialect: "both" },
        { id: "it_w_0067", item_type: "word", vi_text: "nhỏ", vi_text_no_diacritics: "nho", audio_key: "a_nho", dialect: "both" },
        { id: "it_w_0068", item_type: "word", vi_text: "đẹp", vi_text_no_diacritics: "dep", audio_key: "a_dep", dialect: "both" },
        { id: "it_w_0069", item_type: "word", vi_text: "xấu", vi_text_no_diacritics: "xau", audio_key: "a_xau", dialect: "both" },
        // Lesson 010: Haggling
        { id: "it_w_0070", item_type: "word", vi_text: "mua", vi_text_no_diacritics: "mua", audio_key: "a_mua", dialect: "both" },
        { id: "it_w_0071", item_type: "word", vi_text: "bán", vi_text_no_diacritics: "ban_sell", audio_key: "a_ban_sell", dialect: "both" },
        { id: "it_w_0072", item_type: "word", vi_text: "mắc", vi_text_no_diacritics: "mac", audio_key: "a_mac", dialect: "south" },
        { id: "it_w_0073", item_type: "word", vi_text: "bớt", vi_text_no_diacritics: "bot", audio_key: "a_bot", dialect: "both" },
        { id: "it_w_0074", item_type: "word", vi_text: "giảm", vi_text_no_diacritics: "giam", audio_key: "a_giam", dialect: "both" },
        { id: "it_s_0075", item_type: "sentence", vi_text: "Mắc quá! Bớt đi.", vi_text_no_diacritics: "Mac qua! Bot di.", audio_key: "a_mac_qua_bot_di", dialect: "south" },
        { id: "it_s_0076", item_type: "sentence", vi_text: "Tôi muốn mua cái này.", vi_text_no_diacritics: "Toi muon mua cai nay.", audio_key: "a_toi_muon_mua", dialect: "both" },
        { id: "it_w_0077", item_type: "word", vi_text: "được không", vi_text_no_diacritics: "duoc khong", audio_key: "a_duoc_khong", dialect: "both" },
        // Lesson 011: Fruits & Vegetables
        { id: "it_w_0080", item_type: "word", vi_text: "trái cây", vi_text_no_diacritics: "trai cay", audio_key: "a_trai_cay", dialect: "both" },
        { id: "it_w_0081", item_type: "word", vi_text: "cam", vi_text_no_diacritics: "cam", audio_key: "a_cam_fruit", dialect: "both" },
        { id: "it_w_0082", item_type: "word", vi_text: "xoài", vi_text_no_diacritics: "xoai", audio_key: "a_xoai", dialect: "both" },
        { id: "it_w_0083", item_type: "word", vi_text: "dừa", vi_text_no_diacritics: "dua_coconut", audio_key: "a_dua_coconut", dialect: "both" },
        { id: "it_w_0084", item_type: "word", vi_text: "dưa hấu", vi_text_no_diacritics: "dua hau", audio_key: "a_dua_hau", dialect: "both" },
        { id: "it_w_0085", item_type: "word", vi_text: "rau", vi_text_no_diacritics: "rau", audio_key: "a_rau", dialect: "both" },
        { id: "it_w_0086", item_type: "word", vi_text: "cà chua", vi_text_no_diacritics: "ca chua", audio_key: "a_ca_chua", dialect: "both" },
        { id: "it_w_0087", item_type: "word", vi_text: "khoai", vi_text_no_diacritics: "khoai", audio_key: "a_khoai", dialect: "both" },
        // Lesson 012: Big Numbers
        { id: "it_w_0090", item_type: "word", vi_text: "trăm", vi_text_no_diacritics: "tram", audio_key: "a_tram", dialect: "both" },
        { id: "it_w_0091", item_type: "word", vi_text: "nghìn", vi_text_no_diacritics: "nghin", audio_key: "a_nghin", dialect: "north" },
        { id: "it_w_0092", item_type: "word", vi_text: "ngàn", vi_text_no_diacritics: "ngan", audio_key: "a_ngan", dialect: "south" },
        { id: "it_w_0093", item_type: "word", vi_text: "triệu", vi_text_no_diacritics: "trieu", audio_key: "a_trieu", dialect: "both" },
        { id: "it_w_0094", item_type: "word", vi_text: "hóa đơn", vi_text_no_diacritics: "hoa don", audio_key: "a_hoa_don", dialect: "both" },
        { id: "it_s_0095", item_type: "sentence", vi_text: "Tính tiền, làm ơn.", vi_text_no_diacritics: "Tinh tien, lam on.", audio_key: "a_tinh_tien", dialect: "both" },
        // Unit 4: Getting Around
        // Lesson 013: Where To?
        { id: "it_w_0100", item_type: "word", vi_text: "đi", vi_text_no_diacritics: "di", audio_key: "a_di", dialect: "both" },
        { id: "it_w_0101", item_type: "word", vi_text: "đường", vi_text_no_diacritics: "duong", audio_key: "a_duong", dialect: "both" },
        { id: "it_w_0102", item_type: "word", vi_text: "bên trái", vi_text_no_diacritics: "ben trai", audio_key: "a_ben_trai", dialect: "both" },
        { id: "it_w_0103", item_type: "word", vi_text: "bên phải", vi_text_no_diacritics: "ben phai", audio_key: "a_ben_phai", dialect: "both" },
        { id: "it_w_0104", item_type: "word", vi_text: "thẳng", vi_text_no_diacritics: "thang", audio_key: "a_thang", dialect: "both" },
        { id: "it_w_0105", item_type: "word", vi_text: "gần", vi_text_no_diacritics: "gan", audio_key: "a_gan", dialect: "both" },
        { id: "it_w_0106", item_type: "word", vi_text: "xa", vi_text_no_diacritics: "xa", audio_key: "a_xa", dialect: "both" },
        { id: "it_s_0107", item_type: "sentence", vi_text: "Đi thẳng rồi quẹo trái.", vi_text_no_diacritics: "Di thang roi queo trai.", audio_key: "a_di_thang_queo", dialect: "south" },
        // Lesson 014: Taxi & Grab
        { id: "it_w_0110", item_type: "word", vi_text: "xe", vi_text_no_diacritics: "xe", audio_key: "a_xe", dialect: "both" },
        { id: "it_w_0111", item_type: "word", vi_text: "xe ôm", vi_text_no_diacritics: "xe om", audio_key: "a_xe_om", dialect: "both" },
        { id: "it_w_0112", item_type: "word", vi_text: "dừng lại", vi_text_no_diacritics: "dung lai", audio_key: "a_dung_lai", dialect: "both" },
        { id: "it_w_0113", item_type: "word", vi_text: "ở đây", vi_text_no_diacritics: "o day", audio_key: "a_o_day", dialect: "both" },
        { id: "it_w_0114", item_type: "word", vi_text: "đến", vi_text_no_diacritics: "den_arrive", audio_key: "a_den_arrive", dialect: "both" },
        { id: "it_s_0115", item_type: "sentence", vi_text: "Cho tôi đến khách sạn.", vi_text_no_diacritics: "Cho toi den khach san.", audio_key: "a_cho_toi_den_ks", dialect: "both" },
        { id: "it_s_0116", item_type: "sentence", vi_text: "Dừng ở đây, làm ơn.", vi_text_no_diacritics: "Dung o day, lam on.", audio_key: "a_dung_o_day", dialect: "both" },
        // Lesson 015: At the Hotel
        { id: "it_w_0120", item_type: "word", vi_text: "khách sạn", vi_text_no_diacritics: "khach san", audio_key: "a_khach_san", dialect: "both" },
        { id: "it_w_0121", item_type: "word", vi_text: "phòng", vi_text_no_diacritics: "phong", audio_key: "a_phong", dialect: "both" },
        { id: "it_w_0122", item_type: "word", vi_text: "chìa khóa", vi_text_no_diacritics: "chia khoa", audio_key: "a_chia_khoa", dialect: "both" },
        { id: "it_w_0123", item_type: "word", vi_text: "giường", vi_text_no_diacritics: "giuong", audio_key: "a_giuong", dialect: "both" },
        { id: "it_w_0124", item_type: "word", vi_text: "nhà vệ sinh", vi_text_no_diacritics: "nha ve sinh", audio_key: "a_nha_ve_sinh", dialect: "both" },
        { id: "it_s_0125", item_type: "sentence", vi_text: "Phòng có wifi không?", vi_text_no_diacritics: "Phong co wifi khong?", audio_key: "a_phong_co_wifi", dialect: "both" },
        // Lesson 016: Asking for Help
        { id: "it_w_0130", item_type: "word", vi_text: "giúp", vi_text_no_diacritics: "giup", audio_key: "a_giup", dialect: "both" },
        { id: "it_w_0131", item_type: "word", vi_text: "tìm", vi_text_no_diacritics: "tim", audio_key: "a_tim", dialect: "both" },
        { id: "it_w_0132", item_type: "word", vi_text: "bị lạc", vi_text_no_diacritics: "bi lac", audio_key: "a_bi_lac", dialect: "both" },
        { id: "it_w_0133", item_type: "word", vi_text: "cần", vi_text_no_diacritics: "can", audio_key: "a_can", dialect: "both" },
        { id: "it_w_0134", item_type: "word", vi_text: "gọi", vi_text_no_diacritics: "goi", audio_key: "a_goi", dialect: "both" },
        { id: "it_s_0135", item_type: "sentence", vi_text: "Giúp tôi với!", vi_text_no_diacritics: "Giup toi voi!", audio_key: "a_giup_toi_voi", dialect: "both" },
        { id: "it_s_0136", item_type: "sentence", vi_text: "Tôi bị lạc.", vi_text_no_diacritics: "Toi bi lac.", audio_key: "a_toi_bi_lac", dialect: "both" },
        // Unit 5: Daily Life
        // Lesson 017: Time & Schedule
        { id: "it_w_0140", item_type: "word", vi_text: "giờ", vi_text_no_diacritics: "gio", audio_key: "a_gio", dialect: "both" },
        { id: "it_w_0141", item_type: "word", vi_text: "phút", vi_text_no_diacritics: "phut", audio_key: "a_phut", dialect: "both" },
        { id: "it_w_0142", item_type: "word", vi_text: "sáng", vi_text_no_diacritics: "sang", audio_key: "a_sang", dialect: "both" },
        { id: "it_w_0143", item_type: "word", vi_text: "chiều", vi_text_no_diacritics: "chieu", audio_key: "a_chieu", dialect: "both" },
        { id: "it_w_0144", item_type: "word", vi_text: "tối", vi_text_no_diacritics: "toi_evening", audio_key: "a_toi_evening", dialect: "both" },
        { id: "it_w_0145", item_type: "word", vi_text: "hôm nay", vi_text_no_diacritics: "hom nay", audio_key: "a_hom_nay", dialect: "both" },
        { id: "it_w_0146", item_type: "word", vi_text: "ngày mai", vi_text_no_diacritics: "ngay mai", audio_key: "a_ngay_mai", dialect: "both" },
        { id: "it_w_0147", item_type: "word", vi_text: "hôm qua", vi_text_no_diacritics: "hom qua", audio_key: "a_hom_qua", dialect: "both" },
        { id: "it_s_0148", item_type: "sentence", vi_text: "Bây giờ là mấy giờ?", vi_text_no_diacritics: "Bay gio la may gio?", audio_key: "a_may_gio", dialect: "both" },
        // Lesson 018: Weather & Seasons
        { id: "it_w_0150", item_type: "word", vi_text: "trời", vi_text_no_diacritics: "troi", audio_key: "a_troi", dialect: "both" },
        { id: "it_w_0151", item_type: "word", vi_text: "mưa", vi_text_no_diacritics: "mua_rain", audio_key: "a_mua_rain", dialect: "both" },
        { id: "it_w_0152", item_type: "word", vi_text: "nắng", vi_text_no_diacritics: "nang", audio_key: "a_nang", dialect: "both" },
        { id: "it_w_0153", item_type: "word", vi_text: "gió", vi_text_no_diacritics: "gio_wind", audio_key: "a_gio_wind", dialect: "both" },
        { id: "it_w_0154", item_type: "word", vi_text: "lạnh", vi_text_no_diacritics: "lanh", audio_key: "a_lanh", dialect: "both" },
        { id: "it_w_0155", item_type: "word", vi_text: "mát", vi_text_no_diacritics: "mat", audio_key: "a_mat", dialect: "both" },
        { id: "it_s_0156", item_type: "sentence", vi_text: "Hôm nay trời đẹp quá!", vi_text_no_diacritics: "Hom nay troi dep qua!", audio_key: "a_troi_dep_qua", dialect: "both" },
        // Lesson 019: Family
        { id: "it_w_0160", item_type: "word", vi_text: "bố", vi_text_no_diacritics: "bo", audio_key: "a_bo", dialect: "north" },
        { id: "it_w_0161", item_type: "word", vi_text: "ba", vi_text_no_diacritics: "ba_dad", audio_key: "a_ba_dad", dialect: "south" },
        { id: "it_w_0162", item_type: "word", vi_text: "mẹ", vi_text_no_diacritics: "me", audio_key: "a_me", dialect: "north" },
        { id: "it_w_0163", item_type: "word", vi_text: "má", vi_text_no_diacritics: "ma", audio_key: "a_ma", dialect: "south" },
        { id: "it_w_0164", item_type: "word", vi_text: "anh", vi_text_no_diacritics: "anh", audio_key: "a_anh", dialect: "both" },
        { id: "it_w_0165", item_type: "word", vi_text: "chị", vi_text_no_diacritics: "chi", audio_key: "a_chi", dialect: "both" },
        { id: "it_w_0166", item_type: "word", vi_text: "em", vi_text_no_diacritics: "em", audio_key: "a_em", dialect: "both" },
        { id: "it_w_0167", item_type: "word", vi_text: "con", vi_text_no_diacritics: "con", audio_key: "a_con", dialect: "both" },
        { id: "it_w_0168", item_type: "word", vi_text: "vợ", vi_text_no_diacritics: "vo", audio_key: "a_vo", dialect: "both" },
        { id: "it_w_0169", item_type: "word", vi_text: "chồng", vi_text_no_diacritics: "chong", audio_key: "a_chong", dialect: "both" },
        // Lesson 020: Around the House
        { id: "it_w_0170", item_type: "word", vi_text: "nhà", vi_text_no_diacritics: "nha", audio_key: "a_nha", dialect: "both" },
        { id: "it_w_0171", item_type: "word", vi_text: "nhà bếp", vi_text_no_diacritics: "nha bep", audio_key: "a_nha_bep", dialect: "both" },
        { id: "it_w_0172", item_type: "word", vi_text: "phòng ngủ", vi_text_no_diacritics: "phong ngu", audio_key: "a_phong_ngu", dialect: "both" },
        { id: "it_w_0173", item_type: "word", vi_text: "phòng khách", vi_text_no_diacritics: "phong khach", audio_key: "a_phong_khach", dialect: "both" },
        { id: "it_w_0174", item_type: "word", vi_text: "cửa", vi_text_no_diacritics: "cua", audio_key: "a_cua", dialect: "both" },
        { id: "it_w_0175", item_type: "word", vi_text: "ghế", vi_text_no_diacritics: "ghe", audio_key: "a_ghe", dialect: "both" },
        { id: "it_w_0176", item_type: "word", vi_text: "bàn", vi_text_no_diacritics: "ban_table", audio_key: "a_ban_table", dialect: "both" },
        // Unit 6: Making Friends
        // Lesson 021: Hobbies & Interests
        { id: "it_w_0180", item_type: "word", vi_text: "thích", vi_text_no_diacritics: "thich", audio_key: "a_thich", dialect: "both" },
        { id: "it_w_0181", item_type: "word", vi_text: "đi chơi", vi_text_no_diacritics: "di choi", audio_key: "a_di_choi", dialect: "both" },
        { id: "it_w_0182", item_type: "word", vi_text: "xem phim", vi_text_no_diacritics: "xem phim", audio_key: "a_xem_phim", dialect: "both" },
        { id: "it_w_0183", item_type: "word", vi_text: "nghe nhạc", vi_text_no_diacritics: "nghe nhac", audio_key: "a_nghe_nhac", dialect: "both" },
        { id: "it_w_0184", item_type: "word", vi_text: "nấu ăn", vi_text_no_diacritics: "nau an", audio_key: "a_nau_an", dialect: "both" },
        { id: "it_w_0185", item_type: "word", vi_text: "đọc sách", vi_text_no_diacritics: "doc sach", audio_key: "a_doc_sach", dialect: "both" },
        { id: "it_s_0186", item_type: "sentence", vi_text: "Bạn thích làm gì?", vi_text_no_diacritics: "Ban thich lam gi?", audio_key: "a_ban_thich_lam_gi", dialect: "both" },
        // Lesson 022: Feelings & Opinions
        { id: "it_w_0190", item_type: "word", vi_text: "vui", vi_text_no_diacritics: "vui", audio_key: "a_vui", dialect: "both" },
        { id: "it_w_0191", item_type: "word", vi_text: "buồn", vi_text_no_diacritics: "buon", audio_key: "a_buon", dialect: "both" },
        { id: "it_w_0192", item_type: "word", vi_text: "mệt", vi_text_no_diacritics: "met", audio_key: "a_met", dialect: "both" },
        { id: "it_w_0193", item_type: "word", vi_text: "đói", vi_text_no_diacritics: "doi", audio_key: "a_doi", dialect: "both" },
        { id: "it_w_0194", item_type: "word", vi_text: "khát", vi_text_no_diacritics: "khat", audio_key: "a_khat", dialect: "both" },
        { id: "it_w_0195", item_type: "word", vi_text: "sợ", vi_text_no_diacritics: "so", audio_key: "a_so", dialect: "both" },
        { id: "it_s_0196", item_type: "sentence", vi_text: "Tôi mệt quá.", vi_text_no_diacritics: "Toi met qua.", audio_key: "a_toi_met_qua", dialect: "both" },
        // Lesson 023: Invitations
        { id: "it_w_0200", item_type: "word", vi_text: "cuối tuần", vi_text_no_diacritics: "cuoi tuan", audio_key: "a_cuoi_tuan", dialect: "both" },
        { id: "it_w_0201", item_type: "word", vi_text: "rảnh", vi_text_no_diacritics: "ranh", audio_key: "a_ranh", dialect: "both" },
        { id: "it_w_0202", item_type: "word", vi_text: "bận", vi_text_no_diacritics: "ban_busy", audio_key: "a_ban_busy", dialect: "both" },
        { id: "it_w_0203", item_type: "word", vi_text: "cùng", vi_text_no_diacritics: "cung", audio_key: "a_cung", dialect: "both" },
        { id: "it_w_0204", item_type: "word", vi_text: "hẹn", vi_text_no_diacritics: "hen", audio_key: "a_hen", dialect: "both" },
        { id: "it_s_0205", item_type: "sentence", vi_text: "Cuối tuần bạn rảnh không?", vi_text_no_diacritics: "Cuoi tuan ban ranh khong?", audio_key: "a_cuoi_tuan_ranh", dialect: "both" },
        { id: "it_s_0206", item_type: "sentence", vi_text: "Đi chơi cùng tôi không?", vi_text_no_diacritics: "Di choi cung toi khong?", audio_key: "a_di_choi_cung_toi", dialect: "both" },
        // Lesson 024: At the Party
        { id: "it_w_0210", item_type: "word", vi_text: "chúc mừng", vi_text_no_diacritics: "chuc mung", audio_key: "a_chuc_mung", dialect: "both" },
        { id: "it_w_0211", item_type: "word", vi_text: "sinh nhật", vi_text_no_diacritics: "sinh nhat", audio_key: "a_sinh_nhat", dialect: "both" },
        { id: "it_w_0212", item_type: "word", vi_text: "quà", vi_text_no_diacritics: "qua_gift", audio_key: "a_qua_gift", dialect: "both" },
        { id: "it_w_0213", item_type: "word", vi_text: "tiệc", vi_text_no_diacritics: "tiec", audio_key: "a_tiec", dialect: "both" },
        { id: "it_s_0214", item_type: "sentence", vi_text: "Chúc mừng sinh nhật!", vi_text_no_diacritics: "Chuc mung sinh nhat!", audio_key: "a_chuc_mung_sn", dialect: "both" },
        { id: "it_s_0215", item_type: "sentence", vi_text: "Vui quá!", vi_text_no_diacritics: "Vui qua!", audio_key: "a_vui_qua", dialect: "both" },
        { id: "it_w_0216", item_type: "word", vi_text: "chụp hình", vi_text_no_diacritics: "chup hinh", audio_key: "a_chup_hinh", dialect: "both" }
    ],
    translations: [
        { item_id: "it_w_0001", lang: "en", text: "hello (polite)" },
        { item_id: "it_w_0002", lang: "en", text: "hi / hello" },
        { item_id: "it_w_0003", lang: "en", text: "goodbye" },
        { item_id: "it_w_0004", lang: "en", text: "thank you" },
        { item_id: "it_w_0005", lang: "en", text: "yes (Northern)" },
        { item_id: "it_w_0006", lang: "en", text: "yes (Southern / polite response)" },
        { item_id: "it_w_0007", lang: "en", text: "no / not" },
        { item_id: "it_w_0008", lang: "en", text: "I / me" },
        { item_id: "it_w_0009", lang: "en", text: "you (friend)" },
        { item_id: "it_p_0010", lang: "en", text: "my name is {NAME}" },
        { item_id: "it_p_0011", lang: "en", text: "I am a {ROLE}" },
        { item_id: "it_s_0012", lang: "en", text: "What is your name?" },
        { item_id: "it_s_0013", lang: "en", text: "Nice to meet you." },
        { item_id: "it_w_0014", lang: "en", text: "sorry / excuse me" },
        { item_id: "it_w_0015", lang: "en", text: "please (as a request)" },
        { item_id: "it_s_0016", lang: "en", text: "I don't understand." },
        { item_id: "it_s_0017", lang: "en", text: "Can you speak more slowly?" },
        { item_id: "it_w_0020", lang: "en", text: "one" },
        { item_id: "it_w_0021", lang: "en", text: "two" },
        { item_id: "it_w_0022", lang: "en", text: "three" },
        { item_id: "it_w_0023", lang: "en", text: "four" },
        { item_id: "it_w_0024", lang: "en", text: "five" },
        { item_id: "it_w_0025", lang: "en", text: "six" },
        { item_id: "it_w_0026", lang: "en", text: "seven" },
        { item_id: "it_w_0027", lang: "en", text: "eight" },
        { item_id: "it_w_0028", lang: "en", text: "nine" },
        { item_id: "it_w_0029", lang: "en", text: "ten" },
        { item_id: "it_w_0030", lang: "en", text: "coffee" },
        { item_id: "it_w_0031", lang: "en", text: "tea" },
        { item_id: "it_w_0032", lang: "en", text: "water" },
        { item_id: "it_s_0033", lang: "en", text: "Give me a coffee, please." },
        { item_id: "it_s_0034", lang: "en", text: "I want a tea." },
        { item_id: "it_w_0035", lang: "en", text: "to want" },
        { item_id: "it_w_0036", lang: "en", text: "give (request form: “cho tôi…”)" },
        { item_id: "it_s_0037", lang: "en", text: "Thank you!" },
        // Unit 2 translations
        { item_id: "it_w_0040", lang: "en", text: "iced milk coffee" },
        { item_id: "it_w_0041", lang: "en", text: "milk" },
        { item_id: "it_w_0042", lang: "en", text: "ice" },
        { item_id: "it_w_0043", lang: "en", text: "hot" },
        { item_id: "it_s_0044", lang: "en", text: "Give me an iced milk coffee." },
        { item_id: "it_w_0045", lang: "en", text: "pho (noodle soup)" },
        { item_id: "it_w_0046", lang: "en", text: "Vietnamese sandwich" },
        { item_id: "it_w_0047", lang: "en", text: "rice noodles" },
        { item_id: "it_w_0048", lang: "en", text: "rice" },
        { item_id: "it_s_0049", lang: "en", text: "I want a bowl of pho." },
        { item_id: "it_w_0050", lang: "en", text: "bowl" },
        { item_id: "it_w_0051", lang: "en", text: "delicious" },
        { item_id: "it_w_0052", lang: "en", text: "how much / how many" },
        { item_id: "it_w_0053", lang: "en", text: "money" },
        { item_id: "it_s_0054", lang: "en", text: "How much does this cost?" },
        { item_id: "it_w_0055", lang: "en", text: "this (thing)" },
        { item_id: "it_w_0056", lang: "en", text: "expensive" },
        { item_id: "it_w_0057", lang: "en", text: "cheap" },
        // Unit 3 translations
        { item_id: "it_w_0060", lang: "en", text: "color" },
        { item_id: "it_w_0061", lang: "en", text: "red" },
        { item_id: "it_w_0062", lang: "en", text: "blue / green" },
        { item_id: "it_w_0063", lang: "en", text: "white" },
        { item_id: "it_w_0064", lang: "en", text: "black" },
        { item_id: "it_w_0065", lang: "en", text: "yellow" },
        { item_id: "it_w_0066", lang: "en", text: "big / large" },
        { item_id: "it_w_0067", lang: "en", text: "small / little" },
        { item_id: "it_w_0068", lang: "en", text: "beautiful / pretty" },
        { item_id: "it_w_0069", lang: "en", text: "ugly / bad" },
        { item_id: "it_w_0070", lang: "en", text: "to buy" },
        { item_id: "it_w_0071", lang: "en", text: "to sell" },
        { item_id: "it_w_0072", lang: "en", text: "expensive (Southern)" },
        { item_id: "it_w_0073", lang: "en", text: "to reduce / discount" },
        { item_id: "it_w_0074", lang: "en", text: "to reduce / lower" },
        { item_id: "it_s_0075", lang: "en", text: "Too expensive! Lower the price." },
        { item_id: "it_s_0076", lang: "en", text: "I want to buy this." },
        { item_id: "it_w_0077", lang: "en", text: "is that ok? / can you?" },
        { item_id: "it_w_0080", lang: "en", text: "fruit" },
        { item_id: "it_w_0081", lang: "en", text: "orange" },
        { item_id: "it_w_0082", lang: "en", text: "mango" },
        { item_id: "it_w_0083", lang: "en", text: "coconut" },
        { item_id: "it_w_0084", lang: "en", text: "watermelon" },
        { item_id: "it_w_0085", lang: "en", text: "vegetable" },
        { item_id: "it_w_0086", lang: "en", text: "tomato" },
        { item_id: "it_w_0087", lang: "en", text: "potato / sweet potato" },
        { item_id: "it_w_0090", lang: "en", text: "hundred" },
        { item_id: "it_w_0091", lang: "en", text: "thousand (Northern)" },
        { item_id: "it_w_0092", lang: "en", text: "thousand (Southern)" },
        { item_id: "it_w_0093", lang: "en", text: "million" },
        { item_id: "it_w_0094", lang: "en", text: "bill / receipt" },
        { item_id: "it_s_0095", lang: "en", text: "The bill, please." },
        // Unit 4 translations
        { item_id: "it_w_0100", lang: "en", text: "to go" },
        { item_id: "it_w_0101", lang: "en", text: "road / street" },
        { item_id: "it_w_0102", lang: "en", text: "left side" },
        { item_id: "it_w_0103", lang: "en", text: "right side" },
        { item_id: "it_w_0104", lang: "en", text: "straight" },
        { item_id: "it_w_0105", lang: "en", text: "near / close" },
        { item_id: "it_w_0106", lang: "en", text: "far" },
        { item_id: "it_s_0107", lang: "en", text: "Go straight then turn left." },
        { item_id: "it_w_0110", lang: "en", text: "vehicle" },
        { item_id: "it_w_0111", lang: "en", text: "motorbike taxi" },
        { item_id: "it_w_0112", lang: "en", text: "stop" },
        { item_id: "it_w_0113", lang: "en", text: "here" },
        { item_id: "it_w_0114", lang: "en", text: "to arrive / to" },
        { item_id: "it_s_0115", lang: "en", text: "Take me to the hotel." },
        { item_id: "it_s_0116", lang: "en", text: "Stop here, please." },
        { item_id: "it_w_0120", lang: "en", text: "hotel" },
        { item_id: "it_w_0121", lang: "en", text: "room" },
        { item_id: "it_w_0122", lang: "en", text: "key" },
        { item_id: "it_w_0123", lang: "en", text: "bed" },
        { item_id: "it_w_0124", lang: "en", text: "bathroom / toilet" },
        { item_id: "it_s_0125", lang: "en", text: "Does the room have wifi?" },
        { item_id: "it_w_0130", lang: "en", text: "to help" },
        { item_id: "it_w_0131", lang: "en", text: "to find / to look for" },
        { item_id: "it_w_0132", lang: "en", text: "to be lost" },
        { item_id: "it_w_0133", lang: "en", text: "to need" },
        { item_id: "it_w_0134", lang: "en", text: "to call" },
        { item_id: "it_s_0135", lang: "en", text: "Help me!" },
        { item_id: "it_s_0136", lang: "en", text: "I am lost." },
        // Unit 5 translations
        { item_id: "it_w_0140", lang: "en", text: "hour / o'clock" },
        { item_id: "it_w_0141", lang: "en", text: "minute" },
        { item_id: "it_w_0142", lang: "en", text: "morning" },
        { item_id: "it_w_0143", lang: "en", text: "afternoon" },
        { item_id: "it_w_0144", lang: "en", text: "evening / night" },
        { item_id: "it_w_0145", lang: "en", text: "today" },
        { item_id: "it_w_0146", lang: "en", text: "tomorrow" },
        { item_id: "it_w_0147", lang: "en", text: "yesterday" },
        { item_id: "it_s_0148", lang: "en", text: "What time is it?" },
        { item_id: "it_w_0150", lang: "en", text: "sky / weather" },
        { item_id: "it_w_0151", lang: "en", text: "rain" },
        { item_id: "it_w_0152", lang: "en", text: "sunny" },
        { item_id: "it_w_0153", lang: "en", text: "wind / windy" },
        { item_id: "it_w_0154", lang: "en", text: "cold" },
        { item_id: "it_w_0155", lang: "en", text: "cool / pleasant" },
        { item_id: "it_s_0156", lang: "en", text: "The weather is so nice today!" },
        { item_id: "it_w_0160", lang: "en", text: "father (Northern)" },
        { item_id: "it_w_0161", lang: "en", text: "father (Southern)" },
        { item_id: "it_w_0162", lang: "en", text: "mother (Northern)" },
        { item_id: "it_w_0163", lang: "en", text: "mother (Southern)" },
        { item_id: "it_w_0164", lang: "en", text: "older brother" },
        { item_id: "it_w_0165", lang: "en", text: "older sister" },
        { item_id: "it_w_0166", lang: "en", text: "younger sibling" },
        { item_id: "it_w_0167", lang: "en", text: "child" },
        { item_id: "it_w_0168", lang: "en", text: "wife" },
        { item_id: "it_w_0169", lang: "en", text: "husband" },
        { item_id: "it_w_0170", lang: "en", text: "house / home" },
        { item_id: "it_w_0171", lang: "en", text: "kitchen" },
        { item_id: "it_w_0172", lang: "en", text: "bedroom" },
        { item_id: "it_w_0173", lang: "en", text: "living room" },
        { item_id: "it_w_0174", lang: "en", text: "door" },
        { item_id: "it_w_0175", lang: "en", text: "chair" },
        { item_id: "it_w_0176", lang: "en", text: "table / desk" },
        // Unit 6 translations
        { item_id: "it_w_0180", lang: "en", text: "to like / to enjoy" },
        { item_id: "it_w_0181", lang: "en", text: "to hang out / go out" },
        { item_id: "it_w_0182", lang: "en", text: "to watch movies" },
        { item_id: "it_w_0183", lang: "en", text: "to listen to music" },
        { item_id: "it_w_0184", lang: "en", text: "to cook" },
        { item_id: "it_w_0185", lang: "en", text: "to read books" },
        { item_id: "it_s_0186", lang: "en", text: "What do you like to do?" },
        { item_id: "it_w_0190", lang: "en", text: "happy / fun" },
        { item_id: "it_w_0191", lang: "en", text: "sad" },
        { item_id: "it_w_0192", lang: "en", text: "tired" },
        { item_id: "it_w_0193", lang: "en", text: "hungry" },
        { item_id: "it_w_0194", lang: "en", text: "thirsty" },
        { item_id: "it_w_0195", lang: "en", text: "scared / afraid" },
        { item_id: "it_s_0196", lang: "en", text: "I am so tired." },
        { item_id: "it_w_0200", lang: "en", text: "weekend" },
        { item_id: "it_w_0201", lang: "en", text: "free (available)" },
        { item_id: "it_w_0202", lang: "en", text: "busy" },
        { item_id: "it_w_0203", lang: "en", text: "together" },
        { item_id: "it_w_0204", lang: "en", text: "to make an appointment" },
        { item_id: "it_s_0205", lang: "en", text: "Are you free this weekend?" },
        { item_id: "it_s_0206", lang: "en", text: "Do you want to hang out with me?" },
        { item_id: "it_w_0210", lang: "en", text: "congratulations" },
        { item_id: "it_w_0211", lang: "en", text: "birthday" },
        { item_id: "it_w_0212", lang: "en", text: "gift / present" },
        { item_id: "it_w_0213", lang: "en", text: "party / feast" },
        { item_id: "it_s_0214", lang: "en", text: "Happy birthday!" },
        { item_id: "it_s_0215", lang: "en", text: "So fun!" },
        { item_id: "it_w_0216", lang: "en", text: "to take a photo" }
    ],
    exercises: [
        { id: "ex_001_01", lesson_id: "lesson_001", exercise_type: "match_pairs", prompt: { instruction: "Match the pairs", pairs: [{ left_item_id: "it_w_0001", right_text_en: "hello (polite)" }, { left_item_id: "it_w_0003", right_text_en: "goodbye" }, { left_item_id: "it_w_0004", right_text_en: "thank you" }] } },
        { id: "ex_001_02", lesson_id: "lesson_001", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "Hello!", choices_vi: ["Xin chào!", "Tạm biệt!", "Cảm ơn!"], answer_vi: "Xin chào!", accepted_answers_vi: ["xin chào", "Xin chào", "Xin chào!"] } },
        { id: "ex_001_03", lesson_id: "lesson_001", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0003", choices_vi: ["tạm biệt", "xin chào", "cảm ơn"], answer_vi: "tạm biệt" } },
        { id: "ex_001_04", lesson_id: "lesson_001", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Chào bạn!", tokens: ["bạn", "Chào", "!"], answer_tokens: ["Chào", "bạn", "!"] } },
        { id: "ex_001_05", lesson_id: "lesson_001", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0004", answer_vi: "cảm ơn", accepted_answers_vi: ["cảm ơn", "Cảm ơn", "cảm ơn!"] } },
        { id: "ex_001_06", lesson_id: "lesson_001", exercise_type: "speaking_repeat", prompt: { instruction: "Repeat the phrase", audio_item_id: "it_w_0001", target_vi: "xin chào", scoring: { type: "asr_similarity", min_score: 0.65 } } },
        { id: "ex_002_01", lesson_id: "lesson_002", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "What is your name?", choices_vi: ["Bạn tên là gì?", "Tạm biệt!", "Tôi không hiểu."], answer_vi: "Bạn tên là gì?", item_refs: ["it_s_0012"] } },
        { id: "ex_002_02", lesson_id: "lesson_002", exercise_type: "fill_blank", prompt: { instruction: "Fill in the blank", template_vi: "Tôi tên là ____.", choices_vi: ["An", "bạn", "không"], answer_vi: "An", slots: [{ key: "NAME", type: "person_name", value: "An" }] } },
        { id: "ex_002_03", lesson_id: "lesson_002", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Tôi tên là An.", tokens: ["là", "An", "Tôi", "tên"], answer_tokens: ["Tôi", "tên", "là", "An"] } },
        { id: "ex_002_04", lesson_id: "lesson_002", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_s_0013", choices_vi: ["Rất vui được gặp bạn.", "Bạn tên là gì?", "Xin lỗi."], answer_vi: "Rất vui được gặp bạn." } },
        { id: "ex_002_05", lesson_id: "lesson_002", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "Tôi tên là An.", choices_en: ["My name is An.", "I don't understand.", "Goodbye."], answer_en: "My name is An." } },
        { id: "ex_002_06", lesson_id: "lesson_002", exercise_type: "speaking_repeat", prompt: { instruction: "Repeat the sentence", audio_item_id: "it_s_0013", target_vi: "Rất vui được gặp bạn.", scoring: { type: "asr_similarity", min_score: 0.62 } } },
        { id: "ex_003_01", lesson_id: "lesson_003", exercise_type: "match_pairs", prompt: { instruction: "Match the pairs", pairs: [{ left_item_id: "it_w_0014", right_text_en: "sorry / excuse me" }, { left_item_id: "it_w_0015", right_text_en: "please" }, { left_item_id: "it_s_0016", right_text_en: "I don't understand." }] } },
        { id: "ex_003_02", lesson_id: "lesson_003", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "Sorry.", choices_vi: ["Xin lỗi.", "Cảm ơn.", "Xin chào."], answer_vi: "Xin lỗi.", accepted_answers_vi: ["xin lỗi", "Xin lỗi", "Xin lỗi."] } },
        { id: "ex_003_03", lesson_id: "lesson_003", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_s_0016", choices_vi: ["Tôi không hiểu.", "Tôi tên là An.", "Tạm biệt."], answer_vi: "Tôi không hiểu." } },
        { id: "ex_003_04", lesson_id: "lesson_003", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Bạn có thể nói chậm lại không?", tokens: ["lại", "nói", "thể", "không", "chậm", "Bạn", "có"], answer_tokens: ["Bạn", "có", "thể", "nói", "chậm", "lại", "không"] } },
        { id: "ex_003_05", lesson_id: "lesson_003", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0015", answer_vi: "làm ơn", accepted_answers_vi: ["làm ơn", "Làm ơn"] } },
        { id: "ex_003_06", lesson_id: "lesson_003", exercise_type: "speaking_repeat", prompt: { instruction: "Repeat the sentence", audio_item_id: "it_s_0017", target_vi: "Bạn có thể nói chậm lại không?", scoring: { type: "asr_similarity", min_score: 0.6 } } },
        { id: "ex_004_01", lesson_id: "lesson_004", exercise_type: "match_pairs", prompt: { instruction: "Match Vietnamese to numbers", pairs: [{ left_item_id: "it_w_0020", right_text_en: "1" }, { left_item_id: "it_w_0021", right_text_en: "2" }, { left_item_id: "it_w_0022", right_text_en: "3" }, { left_item_id: "it_w_0029", right_text_en: "10" }] } },
        { id: "ex_004_02", lesson_id: "lesson_004", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0027", choices_vi: ["bảy", "tám", "chín"], answer_vi: "tám" } },
        { id: "ex_004_03", lesson_id: "lesson_004", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "năm", choices_en: ["five", "seven", "nine"], answer_en: "five" } },
        { id: "ex_004_04", lesson_id: "lesson_004", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0023", answer_vi: "bốn", accepted_answers_vi: ["bốn", "Bốn"] } },
        { id: "ex_004_05", lesson_id: "lesson_004", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "nine", choices_vi: ["chín", "tám", "mười"], answer_vi: "chín" } },
        { id: "ex_004_06", lesson_id: "lesson_004", exercise_type: "speaking_repeat", prompt: { instruction: "Say the number", audio_item_id: "it_w_0025", target_vi: "sáu", scoring: { type: "asr_similarity", min_score: 0.65 } } },
        { id: "ex_005_01", lesson_id: "lesson_005", exercise_type: "match_pairs", prompt: { instruction: "Match the pairs", pairs: [{ left_item_id: "it_w_0030", right_text_en: "coffee" }, { left_item_id: "it_w_0031", right_text_en: "tea" }, { left_item_id: "it_w_0032", right_text_en: "water" }] } },
        { id: "ex_005_02", lesson_id: "lesson_005", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "I want a tea.", choices_vi: ["Tôi muốn một trà.", "Cho tôi một cà phê.", "Tôi không hiểu."], answer_vi: "Tôi muốn một trà.", item_refs: ["it_s_0034"] } },
        { id: "ex_005_03", lesson_id: "lesson_005", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_s_0033", choices_vi: ["Cho tôi một cà phê, làm ơn.", "Tôi muốn một trà.", "Xin chào."], answer_vi: "Cho tôi một cà phê, làm ơn." } },
        { id: "ex_005_04", lesson_id: "lesson_005", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Cho tôi một nước, làm ơn.", tokens: ["làm", "Cho", "nước", "một", "tôi", "ơn"], answer_tokens: ["Cho", "tôi", "một", "nước", "làm", "ơn"] } },
        { id: "ex_005_05", lesson_id: "lesson_005", exercise_type: "diacritics_choice", prompt: { instruction: "Choose the correct spelling", source_text_en: "coffee", choices_vi: ["cà phê", "ca phe", "cà phe"], answer_vi: "cà phê", note: "Vietnamese meaning changes without tone marks." } },
        { id: "ex_005_06", lesson_id: "lesson_005", exercise_type: "speaking_repeat", prompt: { instruction: "Repeat the sentence", audio_item_id: "it_s_0033", target_vi: "Cho tôi một cà phê, làm ơn.", scoring: { type: "asr_similarity", min_score: 0.58 } } },
        // Lesson 006: Café Ordering
        { id: "ex_006_01", lesson_id: "lesson_006", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "iced milk coffee", choices_vi: ["cà phê sữa đá", "cà phê nóng", "trà đá"], answer_vi: "cà phê sữa đá" } },
        { id: "ex_006_02", lesson_id: "lesson_006", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0041", choices_vi: ["sữa", "nước", "đá"], answer_vi: "sữa" } },
        { id: "ex_006_03", lesson_id: "lesson_006", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Cho tôi một cà phê sữa đá.", tokens: ["đá", "Cho", "cà phê", "sữa", "một", "tôi"], answer_tokens: ["Cho", "tôi", "một", "cà phê", "sữa", "đá"] } },
        { id: "ex_006_04", lesson_id: "lesson_006", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "nóng", choices_en: ["hot", "cold", "ice"], answer_en: "hot" } },
        { id: "ex_006_05", lesson_id: "lesson_006", exercise_type: "diacritics_choice", prompt: { instruction: "Choose the correct spelling", source_text_en: "milk", choices_vi: ["sữa", "sua", "sưa"], answer_vi: "sữa" } },
        { id: "ex_006_06", lesson_id: "lesson_006", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0042", answer_vi: "đá", accepted_answers_vi: ["đá", "Đá"] } },
        // Lesson 007: Vietnamese Food
        { id: "ex_007_01", lesson_id: "lesson_007", exercise_type: "match_pairs", prompt: { instruction: "Match the pairs", pairs: [{ left_item_id: "it_w_0045", right_text_en: "pho" }, { left_item_id: "it_w_0046", right_text_en: "sandwich" }, { left_item_id: "it_w_0048", right_text_en: "rice" }] } },
        { id: "ex_007_02", lesson_id: "lesson_007", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "I want a bowl of pho.", choices_vi: ["Tôi muốn một bát phở.", "Cho tôi một cà phê.", "Tôi không hiểu."], answer_vi: "Tôi muốn một bát phở." } },
        { id: "ex_007_03", lesson_id: "lesson_007", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0046", choices_vi: ["bánh mì", "phở", "bún"], answer_vi: "bánh mì" } },
        { id: "ex_007_04", lesson_id: "lesson_007", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "ngon", choices_en: ["delicious", "expensive", "cheap"], answer_en: "delicious" } },
        { id: "ex_007_05", lesson_id: "lesson_007", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Tôi muốn một bát phở.", tokens: ["phở", "Tôi", "bát", "muốn", "một"], answer_tokens: ["Tôi", "muốn", "một", "bát", "phở"] } },
        { id: "ex_007_06", lesson_id: "lesson_007", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0051", answer_vi: "ngon", accepted_answers_vi: ["ngon", "Ngon"] } },
        // Lesson 008: How Much?
        { id: "ex_008_01", lesson_id: "lesson_008", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "How much does this cost?", choices_vi: ["Cái này bao nhiêu tiền?", "Tôi muốn một cà phê.", "Bạn tên là gì?"], answer_vi: "Cái này bao nhiêu tiền?" } },
        { id: "ex_008_02", lesson_id: "lesson_008", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0052", choices_vi: ["bao nhiêu", "bao giờ", "bao lâu"], answer_vi: "bao nhiêu" } },
        { id: "ex_008_03", lesson_id: "lesson_008", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Cái này bao nhiêu tiền?", tokens: ["tiền", "Cái", "bao nhiêu", "này"], answer_tokens: ["Cái", "này", "bao nhiêu", "tiền"] } },
        { id: "ex_008_04", lesson_id: "lesson_008", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "đắt", choices_en: ["expensive", "cheap", "delicious"], answer_en: "expensive" } },
        { id: "ex_008_05", lesson_id: "lesson_008", exercise_type: "diacritics_choice", prompt: { instruction: "Choose the correct spelling", source_text_en: "money", choices_vi: ["tiền", "tien", "tiên"], answer_vi: "tiền" } },
        { id: "ex_008_06", lesson_id: "lesson_008", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0057", answer_vi: "rẻ", accepted_answers_vi: ["rẻ", "Rẻ"] } },
        // Lesson 009: Colors & Descriptions
        { id: "ex_009_01", lesson_id: "lesson_009", exercise_type: "match_pairs", prompt: { instruction: "Match the colors", pairs: [{ left_item_id: "it_w_0061", right_text_en: "red" }, { left_item_id: "it_w_0062", right_text_en: "blue/green" }, { left_item_id: "it_w_0063", right_text_en: "white" }, { left_item_id: "it_w_0064", right_text_en: "black" }] } },
        { id: "ex_009_02", lesson_id: "lesson_009", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "yellow", choices_vi: ["vàng", "xanh", "đỏ"], answer_vi: "vàng" } },
        { id: "ex_009_03", lesson_id: "lesson_009", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "đẹp", choices_en: ["beautiful", "ugly", "big"], answer_en: "beautiful" } },
        { id: "ex_009_04", lesson_id: "lesson_009", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0067", choices_vi: ["nhỏ", "to", "đẹp"], answer_vi: "nhỏ" } },
        { id: "ex_009_05", lesson_id: "lesson_009", exercise_type: "diacritics_choice", prompt: { instruction: "Choose the correct spelling", source_text_en: "white", choices_vi: ["trắng", "trang", "trăng"], answer_vi: "trắng" } },
        { id: "ex_009_06", lesson_id: "lesson_009", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0068", answer_vi: "đẹp", accepted_answers_vi: ["đẹp", "Đẹp"] } },
        // Lesson 010: Haggling
        { id: "ex_010_01", lesson_id: "lesson_010", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "to buy", choices_vi: ["mua", "bán", "bớt"], answer_vi: "mua" } },
        { id: "ex_010_02", lesson_id: "lesson_010", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "bán", choices_en: ["to sell", "to buy", "to reduce"], answer_en: "to sell" } },
        { id: "ex_010_03", lesson_id: "lesson_010", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Tôi muốn mua cái này.", tokens: ["cái", "mua", "Tôi", "này", "muốn"], answer_tokens: ["Tôi", "muốn", "mua", "cái", "này"] } },
        { id: "ex_010_04", lesson_id: "lesson_010", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "Too expensive! Lower the price.", choices_vi: ["Mắc quá! Bớt đi.", "Tôi muốn mua.", "Cảm ơn!"], answer_vi: "Mắc quá! Bớt đi." } },
        { id: "ex_010_05", lesson_id: "lesson_010", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0074", choices_vi: ["giảm", "mua", "bán"], answer_vi: "giảm" } },
        { id: "ex_010_06", lesson_id: "lesson_010", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0073", answer_vi: "bớt", accepted_answers_vi: ["bớt", "Bớt"] } },
        // Lesson 011: Fruits & Vegetables
        { id: "ex_011_01", lesson_id: "lesson_011", exercise_type: "match_pairs", prompt: { instruction: "Match the pairs", pairs: [{ left_item_id: "it_w_0081", right_text_en: "orange" }, { left_item_id: "it_w_0082", right_text_en: "mango" }, { left_item_id: "it_w_0083", right_text_en: "coconut" }, { left_item_id: "it_w_0084", right_text_en: "watermelon" }] } },
        { id: "ex_011_02", lesson_id: "lesson_011", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "rau", choices_en: ["vegetable", "fruit", "potato"], answer_en: "vegetable" } },
        { id: "ex_011_03", lesson_id: "lesson_011", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "tomato", choices_vi: ["cà chua", "cam", "khoai"], answer_vi: "cà chua" } },
        { id: "ex_011_04", lesson_id: "lesson_011", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0082", choices_vi: ["xoài", "dừa", "cam"], answer_vi: "xoài" } },
        { id: "ex_011_05", lesson_id: "lesson_011", exercise_type: "diacritics_choice", prompt: { instruction: "Choose the correct spelling", source_text_en: "watermelon", choices_vi: ["dưa hấu", "dua hau", "dưa hầu"], answer_vi: "dưa hấu" } },
        { id: "ex_011_06", lesson_id: "lesson_011", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0083", answer_vi: "dừa", accepted_answers_vi: ["dừa", "Dừa"] } },
        // Lesson 012: Big Numbers
        { id: "ex_012_01", lesson_id: "lesson_012", exercise_type: "match_pairs", prompt: { instruction: "Match the numbers", pairs: [{ left_item_id: "it_w_0090", right_text_en: "100" }, { left_item_id: "it_w_0091", right_text_en: "1,000" }, { left_item_id: "it_w_0093", right_text_en: "1,000,000" }] } },
        { id: "ex_012_02", lesson_id: "lesson_012", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "triệu", choices_en: ["million", "thousand", "hundred"], answer_en: "million" } },
        { id: "ex_012_03", lesson_id: "lesson_012", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "The bill, please.", choices_vi: ["Tính tiền, làm ơn.", "Bao nhiêu tiền?", "Cảm ơn."], answer_vi: "Tính tiền, làm ơn." } },
        { id: "ex_012_04", lesson_id: "lesson_012", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Tính tiền, làm ơn.", tokens: ["ơn", "Tính", "làm", "tiền"], answer_tokens: ["Tính", "tiền", "làm", "ơn"] } },
        { id: "ex_012_05", lesson_id: "lesson_012", exercise_type: "diacritics_choice", prompt: { instruction: "Choose the correct spelling", source_text_en: "million", choices_vi: ["triệu", "trieu", "triêu"], answer_vi: "triệu" } },
        { id: "ex_012_06", lesson_id: "lesson_012", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0094", answer_vi: "hóa đơn", accepted_answers_vi: ["hóa đơn", "Hóa đơn"] } },
        // Lesson 013: Where To?
        { id: "ex_013_01", lesson_id: "lesson_013", exercise_type: "match_pairs", prompt: { instruction: "Match the pairs", pairs: [{ left_item_id: "it_w_0102", right_text_en: "left" }, { left_item_id: "it_w_0103", right_text_en: "right" }, { left_item_id: "it_w_0104", right_text_en: "straight" }] } },
        { id: "ex_013_02", lesson_id: "lesson_013", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "gần", choices_en: ["near", "far", "straight"], answer_en: "near" } },
        { id: "ex_013_03", lesson_id: "lesson_013", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "road / street", choices_vi: ["đường", "nhà", "xe"], answer_vi: "đường" } },
        { id: "ex_013_04", lesson_id: "lesson_013", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Đi thẳng rồi quẹo trái.", tokens: ["trái", "Đi", "quẹo", "thẳng", "rồi"], answer_tokens: ["Đi", "thẳng", "rồi", "quẹo", "trái"] } },
        { id: "ex_013_05", lesson_id: "lesson_013", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0106", choices_vi: ["xa", "gần", "thẳng"], answer_vi: "xa" } },
        { id: "ex_013_06", lesson_id: "lesson_013", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0101", answer_vi: "đường", accepted_answers_vi: ["đường", "Đường"] } },
        // Lesson 014: Taxi & Grab
        { id: "ex_014_01", lesson_id: "lesson_014", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "xe ôm", choices_en: ["motorbike taxi", "car", "bus"], answer_en: "motorbike taxi" } },
        { id: "ex_014_02", lesson_id: "lesson_014", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "Stop here, please.", choices_vi: ["Dừng ở đây, làm ơn.", "Cho tôi đến khách sạn.", "Đi thẳng."], answer_vi: "Dừng ở đây, làm ơn." } },
        { id: "ex_014_03", lesson_id: "lesson_014", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Cho tôi đến khách sạn.", tokens: ["sạn", "Cho", "đến", "tôi", "khách"], answer_tokens: ["Cho", "tôi", "đến", "khách", "sạn"] } },
        { id: "ex_014_04", lesson_id: "lesson_014", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0112", choices_vi: ["dừng lại", "đi", "đến"], answer_vi: "dừng lại" } },
        { id: "ex_014_05", lesson_id: "lesson_014", exercise_type: "diacritics_choice", prompt: { instruction: "Choose the correct spelling", source_text_en: "here", choices_vi: ["ở đây", "o day", "ơ đây"], answer_vi: "ở đây" } },
        { id: "ex_014_06", lesson_id: "lesson_014", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0113", answer_vi: "ở đây", accepted_answers_vi: ["ở đây", "Ở đây"] } },
        // Lesson 015: At the Hotel
        { id: "ex_015_01", lesson_id: "lesson_015", exercise_type: "match_pairs", prompt: { instruction: "Match the pairs", pairs: [{ left_item_id: "it_w_0120", right_text_en: "hotel" }, { left_item_id: "it_w_0121", right_text_en: "room" }, { left_item_id: "it_w_0122", right_text_en: "key" }, { left_item_id: "it_w_0124", right_text_en: "bathroom" }] } },
        { id: "ex_015_02", lesson_id: "lesson_015", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "giường", choices_en: ["bed", "chair", "table"], answer_en: "bed" } },
        { id: "ex_015_03", lesson_id: "lesson_015", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "Does the room have wifi?", choices_vi: ["Phòng có wifi không?", "Cho tôi chìa khóa.", "Bao nhiêu tiền?"], answer_vi: "Phòng có wifi không?" } },
        { id: "ex_015_04", lesson_id: "lesson_015", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Phòng có wifi không?", tokens: ["không", "Phòng", "wifi", "có"], answer_tokens: ["Phòng", "có", "wifi", "không"] } },
        { id: "ex_015_05", lesson_id: "lesson_015", exercise_type: "diacritics_choice", prompt: { instruction: "Choose the correct spelling", source_text_en: "key", choices_vi: ["chìa khóa", "chia khoa", "chỉa khóa"], answer_vi: "chìa khóa" } },
        { id: "ex_015_06", lesson_id: "lesson_015", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0121", answer_vi: "phòng", accepted_answers_vi: ["phòng", "Phòng"] } },
        // Lesson 016: Asking for Help
        { id: "ex_016_01", lesson_id: "lesson_016", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "Help me!", choices_vi: ["Giúp tôi với!", "Tôi bị lạc.", "Xin lỗi."], answer_vi: "Giúp tôi với!" } },
        { id: "ex_016_02", lesson_id: "lesson_016", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "tìm", choices_en: ["to find", "to help", "to call"], answer_en: "to find" } },
        { id: "ex_016_03", lesson_id: "lesson_016", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Tôi bị lạc.", tokens: ["lạc", "Tôi", "bị"], answer_tokens: ["Tôi", "bị", "lạc"] } },
        { id: "ex_016_04", lesson_id: "lesson_016", exercise_type: "match_pairs", prompt: { instruction: "Match the pairs", pairs: [{ left_item_id: "it_w_0130", right_text_en: "to help" }, { left_item_id: "it_w_0131", right_text_en: "to find" }, { left_item_id: "it_w_0134", right_text_en: "to call" }] } },
        { id: "ex_016_05", lesson_id: "lesson_016", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0132", choices_vi: ["bị lạc", "giúp", "cần"], answer_vi: "bị lạc" } },
        { id: "ex_016_06", lesson_id: "lesson_016", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0133", answer_vi: "cần", accepted_answers_vi: ["cần", "Cần"] } },
        // Lesson 017: Time & Schedule
        { id: "ex_017_01", lesson_id: "lesson_017", exercise_type: "match_pairs", prompt: { instruction: "Match the pairs", pairs: [{ left_item_id: "it_w_0142", right_text_en: "morning" }, { left_item_id: "it_w_0143", right_text_en: "afternoon" }, { left_item_id: "it_w_0144", right_text_en: "evening" }] } },
        { id: "ex_017_02", lesson_id: "lesson_017", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "hôm nay", choices_en: ["today", "tomorrow", "yesterday"], answer_en: "today" } },
        { id: "ex_017_03", lesson_id: "lesson_017", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "What time is it?", choices_vi: ["Bây giờ là mấy giờ?", "Hôm nay là ngày mấy?", "Bạn tên là gì?"], answer_vi: "Bây giờ là mấy giờ?" } },
        { id: "ex_017_04", lesson_id: "lesson_017", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Bây giờ là mấy giờ?", tokens: ["giờ", "Bây", "mấy", "là", "giờ"], answer_tokens: ["Bây", "giờ", "là", "mấy", "giờ"] } },
        { id: "ex_017_05", lesson_id: "lesson_017", exercise_type: "diacritics_choice", prompt: { instruction: "Choose the correct spelling", source_text_en: "tomorrow", choices_vi: ["ngày mai", "ngay mai", "ngày mài"], answer_vi: "ngày mai" } },
        { id: "ex_017_06", lesson_id: "lesson_017", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0147", answer_vi: "hôm qua", accepted_answers_vi: ["hôm qua", "Hôm qua"] } },
        // Lesson 018: Weather & Seasons
        { id: "ex_018_01", lesson_id: "lesson_018", exercise_type: "match_pairs", prompt: { instruction: "Match the weather", pairs: [{ left_item_id: "it_w_0151", right_text_en: "rain" }, { left_item_id: "it_w_0152", right_text_en: "sunny" }, { left_item_id: "it_w_0153", right_text_en: "wind" }] } },
        { id: "ex_018_02", lesson_id: "lesson_018", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "lạnh", choices_en: ["cold", "hot", "cool"], answer_en: "cold" } },
        { id: "ex_018_03", lesson_id: "lesson_018", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "The weather is so nice today!", choices_vi: ["Hôm nay trời đẹp quá!", "Trời mưa.", "Hôm nay nóng."], answer_vi: "Hôm nay trời đẹp quá!" } },
        { id: "ex_018_04", lesson_id: "lesson_018", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Hôm nay trời đẹp quá!", tokens: ["quá", "Hôm", "đẹp", "nay", "trời"], answer_tokens: ["Hôm", "nay", "trời", "đẹp", "quá"] } },
        { id: "ex_018_05", lesson_id: "lesson_018", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0155", choices_vi: ["mát", "nóng", "lạnh"], answer_vi: "mát" } },
        { id: "ex_018_06", lesson_id: "lesson_018", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0151", answer_vi: "mưa", accepted_answers_vi: ["mưa", "Mưa"] } },
        // Lesson 019: Family
        { id: "ex_019_01", lesson_id: "lesson_019", exercise_type: "match_pairs", prompt: { instruction: "Match the family", pairs: [{ left_item_id: "it_w_0160", right_text_en: "father (N)" }, { left_item_id: "it_w_0162", right_text_en: "mother (N)" }, { left_item_id: "it_w_0164", right_text_en: "older brother" }, { left_item_id: "it_w_0166", right_text_en: "younger sibling" }] } },
        { id: "ex_019_02", lesson_id: "lesson_019", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "vợ", choices_en: ["wife", "husband", "child"], answer_en: "wife" } },
        { id: "ex_019_03", lesson_id: "lesson_019", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese (Northern)", source_text_en: "mother", choices_vi: ["mẹ", "má", "bố"], answer_vi: "mẹ" } },
        { id: "ex_019_04", lesson_id: "lesson_019", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "chồng", choices_en: ["husband", "wife", "older sister"], answer_en: "husband" } },
        { id: "ex_019_05", lesson_id: "lesson_019", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0165", choices_vi: ["chị", "anh", "em"], answer_vi: "chị" } },
        { id: "ex_019_06", lesson_id: "lesson_019", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0167", answer_vi: "con", accepted_answers_vi: ["con", "Con"] } },
        // Lesson 020: Around the House
        { id: "ex_020_01", lesson_id: "lesson_020", exercise_type: "match_pairs", prompt: { instruction: "Match the rooms", pairs: [{ left_item_id: "it_w_0171", right_text_en: "kitchen" }, { left_item_id: "it_w_0172", right_text_en: "bedroom" }, { left_item_id: "it_w_0173", right_text_en: "living room" }] } },
        { id: "ex_020_02", lesson_id: "lesson_020", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "cửa", choices_en: ["door", "window", "chair"], answer_en: "door" } },
        { id: "ex_020_03", lesson_id: "lesson_020", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "table / desk", choices_vi: ["bàn", "ghế", "cửa"], answer_vi: "bàn" } },
        { id: "ex_020_04", lesson_id: "lesson_020", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0175", choices_vi: ["ghế", "bàn", "cửa"], answer_vi: "ghế" } },
        { id: "ex_020_05", lesson_id: "lesson_020", exercise_type: "diacritics_choice", prompt: { instruction: "Choose the correct spelling", source_text_en: "bedroom", choices_vi: ["phòng ngủ", "phong ngu", "phòng ngù"], answer_vi: "phòng ngủ" } },
        { id: "ex_020_06", lesson_id: "lesson_020", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0170", answer_vi: "nhà", accepted_answers_vi: ["nhà", "Nhà"] } },
        // Lesson 021: Hobbies & Interests
        { id: "ex_021_01", lesson_id: "lesson_021", exercise_type: "match_pairs", prompt: { instruction: "Match the hobbies", pairs: [{ left_item_id: "it_w_0182", right_text_en: "watch movies" }, { left_item_id: "it_w_0183", right_text_en: "listen to music" }, { left_item_id: "it_w_0184", right_text_en: "cook" }, { left_item_id: "it_w_0185", right_text_en: "read books" }] } },
        { id: "ex_021_02", lesson_id: "lesson_021", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "thích", choices_en: ["to like", "to want", "to need"], answer_en: "to like" } },
        { id: "ex_021_03", lesson_id: "lesson_021", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "What do you like to do?", choices_vi: ["Bạn thích làm gì?", "Bạn tên là gì?", "Bạn ở đâu?"], answer_vi: "Bạn thích làm gì?" } },
        { id: "ex_021_04", lesson_id: "lesson_021", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Bạn thích làm gì?", tokens: ["gì", "Bạn", "làm", "thích"], answer_tokens: ["Bạn", "thích", "làm", "gì"] } },
        { id: "ex_021_05", lesson_id: "lesson_021", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0181", choices_vi: ["đi chơi", "đọc sách", "nấu ăn"], answer_vi: "đi chơi" } },
        { id: "ex_021_06", lesson_id: "lesson_021", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0180", answer_vi: "thích", accepted_answers_vi: ["thích", "Thích"] } },
        // Lesson 022: Feelings & Opinions
        { id: "ex_022_01", lesson_id: "lesson_022", exercise_type: "match_pairs", prompt: { instruction: "Match the feelings", pairs: [{ left_item_id: "it_w_0190", right_text_en: "happy" }, { left_item_id: "it_w_0191", right_text_en: "sad" }, { left_item_id: "it_w_0192", right_text_en: "tired" }, { left_item_id: "it_w_0193", right_text_en: "hungry" }] } },
        { id: "ex_022_02", lesson_id: "lesson_022", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "khát", choices_en: ["thirsty", "hungry", "scared"], answer_en: "thirsty" } },
        { id: "ex_022_03", lesson_id: "lesson_022", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "I am so tired.", choices_vi: ["Tôi mệt quá.", "Tôi vui quá.", "Tôi đói quá."], answer_vi: "Tôi mệt quá." } },
        { id: "ex_022_04", lesson_id: "lesson_022", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Tôi mệt quá.", tokens: ["quá", "Tôi", "mệt"], answer_tokens: ["Tôi", "mệt", "quá"] } },
        { id: "ex_022_05", lesson_id: "lesson_022", exercise_type: "diacritics_choice", prompt: { instruction: "Choose the correct spelling", source_text_en: "scared", choices_vi: ["sợ", "so", "sơ"], answer_vi: "sợ" } },
        { id: "ex_022_06", lesson_id: "lesson_022", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0191", answer_vi: "buồn", accepted_answers_vi: ["buồn", "Buồn"] } },
        // Lesson 023: Invitations
        { id: "ex_023_01", lesson_id: "lesson_023", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "cuối tuần", choices_en: ["weekend", "today", "tomorrow"], answer_en: "weekend" } },
        { id: "ex_023_02", lesson_id: "lesson_023", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "Are you free this weekend?", choices_vi: ["Cuối tuần bạn rảnh không?", "Bạn bận không?", "Bạn thích gì?"], answer_vi: "Cuối tuần bạn rảnh không?" } },
        { id: "ex_023_03", lesson_id: "lesson_023", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Đi chơi cùng tôi không?", tokens: ["không", "Đi", "tôi", "cùng", "chơi"], answer_tokens: ["Đi", "chơi", "cùng", "tôi", "không"] } },
        { id: "ex_023_04", lesson_id: "lesson_023", exercise_type: "match_pairs", prompt: { instruction: "Match the pairs", pairs: [{ left_item_id: "it_w_0201", right_text_en: "free (available)" }, { left_item_id: "it_w_0202", right_text_en: "busy" }, { left_item_id: "it_w_0203", right_text_en: "together" }] } },
        { id: "ex_023_05", lesson_id: "lesson_023", exercise_type: "listen_choose", prompt: { instruction: "Listen and choose", audio_item_id: "it_w_0201", choices_vi: ["rảnh", "bận", "cùng"], answer_vi: "rảnh" } },
        { id: "ex_023_06", lesson_id: "lesson_023", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0200", answer_vi: "cuối tuần", accepted_answers_vi: ["cuối tuần", "Cuối tuần"] } },
        // Lesson 024: At the Party
        { id: "ex_024_01", lesson_id: "lesson_024", exercise_type: "mcq_translate_to_vi", prompt: { instruction: "Translate to Vietnamese", source_text_en: "Happy birthday!", choices_vi: ["Chúc mừng sinh nhật!", "Chúc mừng!", "Cảm ơn!"], answer_vi: "Chúc mừng sinh nhật!" } },
        { id: "ex_024_02", lesson_id: "lesson_024", exercise_type: "mcq_translate_to_en", prompt: { instruction: "Translate to English", source_text_vi: "quà", choices_en: ["gift", "party", "birthday"], answer_en: "gift" } },
        { id: "ex_024_03", lesson_id: "lesson_024", exercise_type: "reorder_words", prompt: { instruction: "Put the words in order", target_vi: "Chúc mừng sinh nhật!", tokens: ["nhật", "Chúc", "sinh", "mừng"], answer_tokens: ["Chúc", "mừng", "sinh", "nhật"] } },
        { id: "ex_024_04", lesson_id: "lesson_024", exercise_type: "match_pairs", prompt: { instruction: "Match the pairs", pairs: [{ left_item_id: "it_w_0210", right_text_en: "congratulations" }, { left_item_id: "it_w_0211", right_text_en: "birthday" }, { left_item_id: "it_w_0213", right_text_en: "party" }] } },
        { id: "ex_024_05", lesson_id: "lesson_024", exercise_type: "diacritics_choice", prompt: { instruction: "Choose the correct spelling", source_text_en: "to take a photo", choices_vi: ["chụp hình", "chup hinh", "chụp hình"], answer_vi: "chụp hình" } },
        { id: "ex_024_06", lesson_id: "lesson_024", exercise_type: "dictation", prompt: { instruction: "Type what you hear", audio_item_id: "it_w_0210", answer_vi: "chúc mừng", accepted_answers_vi: ["chúc mừng", "Chúc mừng"] } }
    ],
    lesson_blueprints: [
        { lesson_id: "lesson_001", focus: ["greetings", "basic_yes_no"], introduced_items: ["it_w_0001", "it_w_0003", "it_w_0004", "it_w_0007", "it_w_0009"] },
        { lesson_id: "lesson_002", focus: ["introductions", "question_form"], introduced_items: ["it_s_0012", "it_p_0010", "it_s_0013"] },
        { lesson_id: "lesson_003", focus: ["polite_requests", "repair_phrases"], introduced_items: ["it_w_0014", "it_w_0015", "it_s_0016", "it_s_0017"] },
        { lesson_id: "lesson_004", focus: ["numbers_1_10"], introduced_items: ["it_w_0020", "it_w_0021", "it_w_0022", "it_w_0023", "it_w_0024", "it_w_0025", "it_w_0026", "it_w_0027", "it_w_0028", "it_w_0029"] },
        { lesson_id: "lesson_005", focus: ["ordering", "diacritics_awareness"], introduced_items: ["it_w_0030", "it_w_0031", "it_w_0032", "it_w_0035", "it_s_0033", "it_s_0034"] },
        { lesson_id: "lesson_006", focus: ["cafe_ordering", "drinks"], introduced_items: ["it_w_0040", "it_w_0041", "it_w_0042", "it_w_0043", "it_s_0044"] },
        { lesson_id: "lesson_007", focus: ["food_vocabulary"], introduced_items: ["it_w_0045", "it_w_0046", "it_w_0047", "it_w_0048", "it_w_0050", "it_w_0051", "it_s_0049"] },
        { lesson_id: "lesson_008", focus: ["prices", "haggling"], introduced_items: ["it_w_0052", "it_w_0053", "it_w_0055", "it_w_0056", "it_w_0057", "it_s_0054"] },
        // Unit 3
        { lesson_id: "lesson_009", focus: ["colors", "descriptions"], introduced_items: ["it_w_0060", "it_w_0061", "it_w_0062", "it_w_0063", "it_w_0064", "it_w_0065", "it_w_0066", "it_w_0067", "it_w_0068", "it_w_0069"] },
        { lesson_id: "lesson_010", focus: ["haggling", "shopping"], introduced_items: ["it_w_0070", "it_w_0071", "it_w_0072", "it_w_0073", "it_w_0074", "it_s_0075", "it_s_0076", "it_w_0077"] },
        { lesson_id: "lesson_011", focus: ["fruits", "vegetables"], introduced_items: ["it_w_0080", "it_w_0081", "it_w_0082", "it_w_0083", "it_w_0084", "it_w_0085", "it_w_0086", "it_w_0087"] },
        { lesson_id: "lesson_012", focus: ["big_numbers", "bills"], introduced_items: ["it_w_0090", "it_w_0091", "it_w_0092", "it_w_0093", "it_w_0094", "it_s_0095"] },
        // Unit 4
        { lesson_id: "lesson_013", focus: ["directions"], introduced_items: ["it_w_0100", "it_w_0101", "it_w_0102", "it_w_0103", "it_w_0104", "it_w_0105", "it_w_0106", "it_s_0107"] },
        { lesson_id: "lesson_014", focus: ["transport", "taxi"], introduced_items: ["it_w_0110", "it_w_0111", "it_w_0112", "it_w_0113", "it_w_0114", "it_s_0115", "it_s_0116"] },
        { lesson_id: "lesson_015", focus: ["hotel", "accommodation"], introduced_items: ["it_w_0120", "it_w_0121", "it_w_0122", "it_w_0123", "it_w_0124", "it_s_0125"] },
        { lesson_id: "lesson_016", focus: ["emergency", "help"], introduced_items: ["it_w_0130", "it_w_0131", "it_w_0132", "it_w_0133", "it_w_0134", "it_s_0135", "it_s_0136"] },
        // Unit 5
        { lesson_id: "lesson_017", focus: ["time", "schedule"], introduced_items: ["it_w_0140", "it_w_0141", "it_w_0142", "it_w_0143", "it_w_0144", "it_w_0145", "it_w_0146", "it_w_0147", "it_s_0148"] },
        { lesson_id: "lesson_018", focus: ["weather"], introduced_items: ["it_w_0150", "it_w_0151", "it_w_0152", "it_w_0153", "it_w_0154", "it_w_0155", "it_s_0156"] },
        { lesson_id: "lesson_019", focus: ["family", "kinship"], introduced_items: ["it_w_0160", "it_w_0161", "it_w_0162", "it_w_0163", "it_w_0164", "it_w_0165", "it_w_0166", "it_w_0167", "it_w_0168", "it_w_0169"] },
        { lesson_id: "lesson_020", focus: ["house", "rooms"], introduced_items: ["it_w_0170", "it_w_0171", "it_w_0172", "it_w_0173", "it_w_0174", "it_w_0175", "it_w_0176"] },
        // Unit 6
        { lesson_id: "lesson_021", focus: ["hobbies"], introduced_items: ["it_w_0180", "it_w_0181", "it_w_0182", "it_w_0183", "it_w_0184", "it_w_0185", "it_s_0186"] },
        { lesson_id: "lesson_022", focus: ["feelings", "emotions"], introduced_items: ["it_w_0190", "it_w_0191", "it_w_0192", "it_w_0193", "it_w_0194", "it_w_0195", "it_s_0196"] },
        { lesson_id: "lesson_023", focus: ["invitations", "plans"], introduced_items: ["it_w_0200", "it_w_0201", "it_w_0202", "it_w_0203", "it_w_0204", "it_s_0205", "it_s_0206"] },
        { lesson_id: "lesson_024", focus: ["celebrations", "party"], introduced_items: ["it_w_0210", "it_w_0211", "it_w_0212", "it_w_0213", "it_s_0214", "it_s_0215", "it_w_0216"] }
    ]
};

// Initialize DB if empty
const initDB = () => {
    if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify(INIT_DATA));
    }
};

const getDB = () => {
    initDB();
    return JSON.parse(localStorage.getItem(DB_KEY));
};

const saveDB = (data) => {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
};

// --- Units API ---
// Maps the new db.units format to what the UI is expecting
export const getUnits = () => {
    const db = getDB();
    return db.units.map((u, index) => ({
        id: u.id,
        order_index: u.unit_index || (index + 1),
        title: u.title,
        subtitle: "", // or mapped if added
        themeColor: "#10B981", // or map if added
        unlockCondition: "free"
    })).sort((a, b) => a.order_index - b.order_index);
};

export const addUnit = (unitData) => {
    const db = getDB();
    const newUnit = {
        id: `unit_${Date.now()}`,
        unit_index: db.units.length + 1,
        ...unitData
    };
    db.units.push(newUnit);
    saveDB(db);
    return newUnit; // returning raw for now
};

// --- Nodes API ---
export const getNodesForUnit = (unitId) => {
    const db = getDB();
    const nodes = db.path_nodes || db.nodes || [];
    return nodes
        .filter(n => n.unit_id === unitId)
        .map(n => {
            // Find lesson title if it's a lesson
            let label = n.label || "";
            if (n.node_type === 'lesson' && n.lesson_id) {
                const lesson = (db.lessons || []).find(l => l.id === n.lesson_id);
                if (lesson) label = lesson.title;
            }
            return {
                id: n.id,
                unit_id: n.unit_id,
                order_index: n.node_index || n.order_index || 0,
                type: n.node_type || n.type,
                label: n.label || label,
                content_ref_id: n.lesson_id || n.content_ref_id,
                practice_route: n.practice_route || null,
                skill_content: n.skill_content || null,
                status: n.status || 'locked'
            };
        })
        .sort((a, b) => a.order_index - b.order_index);
};

export const addNode = (nodeData) => {
    const db = getDB();
    const unitNodes = getNodesForUnit(nodeData.unit_id);

    const newNode = {
        id: `node_${Date.now()}`,
        node_index: unitNodes.length + 1,
        status: 'locked',
        ...nodeData
    };

    if (!db.path_nodes) { db.path_nodes = []; }
    db.path_nodes.push(newNode);
    saveDB(db);
    return newNode;
};

export const updateNode = (nodeId, updates) => {
    const db = getDB();
    const nodes = db.path_nodes || [];
    const idx = nodes.findIndex(n => n.id === nodeId);
    if (idx >= 0) {
        Object.assign(nodes[idx], updates);
        saveDB(db);
    }
};

export const deleteNode = (nodeId) => {
    const db = getDB();
    db.path_nodes = (db.path_nodes || []).filter(n => n.id !== nodeId);
    saveDB(db);
};

export const updateUnit = (unitId, updates) => {
    const db = getDB();
    const idx = db.units.findIndex(u => u.id === unitId);
    if (idx >= 0) {
        Object.assign(db.units[idx], updates);
        saveDB(db);
    }
};

export const deleteUnit = (unitId) => {
    const db = getDB();
    db.units = db.units.filter(u => u.id !== unitId);
    db.path_nodes = (db.path_nodes || []).filter(n => n.unit_id !== unitId);
    saveDB(db);
};

// --- Get node by ID ---
export const getNodeById = (nodeId) => {
    const db = getDB();
    return (db.path_nodes || []).find(n => n.id === nodeId) || null;
};

// --- Get all lesson exercises for a unit (for unit tests) ---
export const getExercisesForUnit = (unitId) => {
    const db = getDB();
    const unitNodes = (db.path_nodes || []).filter(n => n.unit_id === unitId && n.node_type === 'lesson');
    const lessonIds = unitNodes.map(n => n.lesson_id).filter(Boolean);
    return (db.exercises || []).filter(ex => lessonIds.includes(ex.lesson_id));
};

// --- Node lookup by lessonId ---
export const getNodeByLessonId = (lessonId) => {
    const db = getDB();
    const nodes = db.path_nodes || [];
    return nodes.find(n => n.lesson_id === lessonId) || null;
};

// --- Dynamic node status based on completed nodes ---
export const getNodesForUnitWithProgress = (unitId, completedNodeIds) => {
    const db = getDB();
    const nodes = db.path_nodes || [];
    const unitNodes = nodes.filter(n => n.unit_id === unitId);

    return unitNodes.map(n => {
        let status;
        if (completedNodeIds.has(n.id)) {
            status = 'completed';
        } else {
            const requires = n.unlock_rule?.requires || [];
            const allMet = requires.every(req => {
                if (req.type === 'node_completed') return completedNodeIds.has(req.node_id);
                return false;
            });
            status = (requires.length === 0 || allMet) ? 'active' : 'locked';
        }

        let label = n.label || '';
        if (n.node_type === 'lesson' && n.lesson_id) {
            const lesson = (db.lessons || []).find(l => l.id === n.lesson_id);
            if (lesson) label = lesson.title;
        }

        return {
            id: n.id,
            unit_id: n.unit_id,
            order_index: n.node_index || n.order_index || 0,
            type: n.node_type || n.type,
            label,
            content_ref_id: n.lesson_id || n.content_ref_id,
            practice_route: n.practice_route || null,
            skill_content: n.skill_content || null,
            status
        };
    }).sort((a, b) => a.order_index - b.order_index);
};

// --- Get lesson blueprint for word summary ---
export const getLessonBlueprint = (lessonId) => {
    const db = getDB();
    const blueprint = (db.lesson_blueprints || []).find(bp => bp.lesson_id === lessonId);
    if (!blueprint) return null;

    const words = (blueprint.introduced_items || []).map(itemId => {
        const item = (db.items || []).find(i => i.id === itemId);
        const translation = (db.translations || []).find(t => t.item_id === itemId && t.lang === 'en');
        if (item && translation) {
            return { id: item.id, vietnamese: item.vi_text, english: translation.text };
        }
        return null;
    }).filter(Boolean);

    return { lessonId, focus: blueprint.focus, words };
};

// --- Vocab Items API ---
export const getItems = () => {
    const db = getDB();
    return (db.items || []).map(item => {
        const translation = (db.translations || []).find(t => t.item_id === item.id && t.lang === 'en');
        return { ...item, en: translation ? translation.text : '' };
    });
};

// --- Lesson Content API ---
export const getLessonContent = (contentRefId) => {
    const db = getDB();

    // First try the old generic format in case it was created via CMS
    if (db.lessonContent) {
        const found = db.lessonContent.find(c => c.id === contentRefId);
        if (found) return found;
    }

    // Support the new format
    const lesson = (db.lessons || []).find(l => l.id === contentRefId);
    if (!lesson) return null;

    // Map items/translations into simple sentences for the UI to consume
    const exercisesForLesson = (db.exercises || []).filter(ex => ex.lesson_id === lesson.id);

    // Let's create sentences loosely from blueprints or exercises
    const blueprint = (db.lesson_blueprints || []).find(bp => bp.lesson_id === lesson.id);
    const sentences = [];

    if (blueprint && blueprint.introduced_items) {
        blueprint.introduced_items.forEach(itemId => {
            const item = (db.items || []).find(i => i.id === itemId);
            const translation = (db.translations || []).find(t => t.item_id === itemId && t.lang === 'en');
            if (item && translation) {
                sentences.push({
                    vietnamese: item.vi_text,
                    english: translation.text
                });
            }
        });
    }

    return {
        id: lesson.id,
        goal: lesson.title,
        sentences: sentences
    };
};

export const saveLessonContent = (contentData) => {
    const db = getDB();

    // 1. Update Lesson Metadata if exists
    const lessonIndex = db.lessons.findIndex(l => l.id === contentData.id);
    if (lessonIndex >= 0) {
        db.lessons[lessonIndex].title = contentData.goal || db.lessons[lessonIndex].title;
    }

    // 2. Clear old exercises for this lesson and regenerate
    if (!db.exercises) db.exercises = [];
    db.exercises = db.exercises.filter(ex => ex.lesson_id !== contentData.id);

    const sentences = contentData.sentences || [];

    // Generate a few different exercise types for each sentence to make it "playable"
    sentences.forEach((s, idx) => {
        const baseId = `${contentData.id}_${idx}`;

        // Exercise 1: MCQ Translate English -> Vietnamese
        db.exercises.push({
            id: `${baseId}_mcq_vi`,
            lesson_id: contentData.id,
            exercise_type: "mcq_translate_to_vi",
            prompt: {
                instruction: "Translate to Vietnamese",
                source_text_en: s.english,
                choices_vi: [s.vietnamese, "Tôi không hiểu", "Chào bạn"], // Hardcoded distractors for MVP
                answer_vi: s.vietnamese
            }
        });

        // Exercise 2: Word Reordering
        const tokens = s.vietnamese.split(' ').filter(t => t.trim());
        if (tokens.length > 1) {
            db.exercises.push({
                id: `${baseId}_reorder`,
                lesson_id: contentData.id,
                exercise_type: "reorder_words",
                prompt: {
                    instruction: "Put the words in order",
                    target_vi: s.vietnamese,
                    tokens: [...tokens].sort(() => Math.random() - 0.5),
                    answer_tokens: tokens
                }
            });
        }

        // Exercise 3: Dictation (Simple text entry)
        db.exercises.push({
            id: `${baseId}_dictation`,
            lesson_id: contentData.id,
            exercise_type: "dictation", // Note: LessonGame uses this for simple text input
            prompt: {
                instruction: "Type in Vietnamese",
                source_text_en: s.english,
                answer_vi: s.vietnamese,
                accepted_answers_vi: [s.vietnamese, s.vietnamese.toLowerCase()]
            }
        });
    });

    // 3. Fallback for old lessonContent array (for compatibility with existing UI logic)
    if (!db.lessonContent) db.lessonContent = [];
    const index = db.lessonContent.findIndex(c => c.id === contentData.id);
    if (index >= 0) {
        db.lessonContent[index] = contentData;
    } else {
        db.lessonContent.push(contentData);
    }

    saveDB(db);
    return contentData;
};
