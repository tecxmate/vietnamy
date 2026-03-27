// A mock database using localStorage to simulate a backend for the 100-levels proposal.

const DB_KEY = 'vnme_mock_db_v17'; // v17: add missing phonetics nodes (tones-1, vowels-1, tonemarks-basic, consonants initial+final)

const INIT_DATA = {
    course: {
        id: "course_vi_en_v1",
        code: "vi_en",
        version: 1,
        title: "Vietnamese (English UI)",
        dialect_default: "both"
    },
    units: [
        { id: "phase_1_first_words", course_id: "course_vi_en_v1", unit_index: 0, title: "Unit 1 — First Words" },
        { id: "phase_2_polite", course_id: "course_vi_en_v1", unit_index: 2, title: "Unit 2 — Polite Survival" },
        { id: "phase_3_cafe", course_id: "course_vi_en_v1", unit_index: 3, title: "Unit 3 — Ordering & Café" },
        { id: "phase_4_food", course_id: "course_vi_en_v1", unit_index: 4, title: "Unit 4 — Food & Prices" },
        { id: "phase_5_market", course_id: "course_vi_en_v1", unit_index: 5, title: "Unit 5 — Market Life" },
        { id: "phase_6_numbers", course_id: "course_vi_en_v1", unit_index: 6, title: "Unit 6 — Numbers Advanced" },
        { id: "phase_7_transport", course_id: "course_vi_en_v1", unit_index: 7, title: "Unit 7 — Getting Around" },
        { id: "phase_8_daily", course_id: "course_vi_en_v1", unit_index: 8, title: "Unit 8 — Daily Life" },
        { id: "phase_9_social", course_id: "course_vi_en_v1", unit_index: 9, title: "Unit 9 — Social Life" }
    ],
    skills: [
        { id: "skill_greetings_1", course_id: "course_vi_en_v1", key: "greetings_1", title: "Greetings", skill_type: "vocab" },
        { id: "skill_introduce_1", course_id: "course_vi_en_v1", key: "introduce_1", title: "Introduce Yourself", skill_type: "grammar" },
        { id: "skill_polite_1", course_id: "course_vi_en_v1", key: "polite_1", title: "Polite Phrases", skill_type: "vocab" },
        { id: "skill_numbers_1", course_id: "course_vi_en_v1", key: "numbers_1", title: "Numbers 1–5", skill_type: "vocab" },
        { id: "skill_numbers_2", course_id: "course_vi_en_v1", key: "numbers_2", title: "Numbers 6–10", skill_type: "vocab" },
        { id: "skill_order_1", course_id: "course_vi_en_v1", key: "order_1", title: "Ordering Drinks", skill_type: "grammar" },
        { id: "skill_cafe_1", course_id: "course_vi_en_v1", key: "cafe_1", title: "At the Café", skill_type: "vocab" },
        { id: "skill_food_1", course_id: "course_vi_en_v1", key: "food_1", title: "Food Vocabulary", skill_type: "vocab" },
        { id: "skill_market_1", course_id: "course_vi_en_v1", key: "market_1", title: "At the Market", skill_type: "grammar" },
        // Unit 3 skills
        { id: "skill_colors_1", course_id: "course_vi_en_v1", key: "colors_1", title: "Colors", skill_type: "vocab" },
        { id: "skill_adjectives_1", course_id: "course_vi_en_v1", key: "adjectives_1", title: "Size & Beauty", skill_type: "vocab" },
        { id: "skill_haggle_1", course_id: "course_vi_en_v1", key: "haggle_1", title: "Haggling", skill_type: "grammar" },
        { id: "skill_fruit_1", course_id: "course_vi_en_v1", key: "fruit_1", title: "Fruits", skill_type: "vocab" },
        { id: "skill_veggies_1", course_id: "course_vi_en_v1", key: "veggies_1", title: "Vegetables", skill_type: "vocab" },
        { id: "skill_bignums_1", course_id: "course_vi_en_v1", key: "bignums_1", title: "Big Numbers", skill_type: "vocab" },
        // Unit 4 skills
        { id: "skill_directions_1", course_id: "course_vi_en_v1", key: "directions_1", title: "Directions", skill_type: "vocab" },
        { id: "skill_distance_1", course_id: "course_vi_en_v1", key: "distance_1", title: "Near & Far", skill_type: "vocab" },
        { id: "skill_taxi_1", course_id: "course_vi_en_v1", key: "taxi_1", title: "Taxi & Grab", skill_type: "grammar" },
        { id: "skill_hotel_1", course_id: "course_vi_en_v1", key: "hotel_1", title: "At the Hotel", skill_type: "vocab" },
        { id: "skill_help_1", course_id: "course_vi_en_v1", key: "help_1", title: "Asking for Help", skill_type: "grammar" },
        // Unit 5 skills
        { id: "skill_time_1", course_id: "course_vi_en_v1", key: "time_1", title: "Time of Day", skill_type: "vocab" },
        { id: "skill_days_1", course_id: "course_vi_en_v1", key: "days_1", title: "Days & Dates", skill_type: "vocab" },
        { id: "skill_weather_1", course_id: "course_vi_en_v1", key: "weather_1", title: "Weather", skill_type: "vocab" },
        { id: "skill_family_1", course_id: "course_vi_en_v1", key: "family_1", title: "Parents", skill_type: "vocab" },
        { id: "skill_family_2", course_id: "course_vi_en_v1", key: "family_2", title: "Siblings & Spouses", skill_type: "vocab" },
        { id: "skill_house_1", course_id: "course_vi_en_v1", key: "house_1", title: "Rooms", skill_type: "vocab" },
        { id: "skill_furniture_1", course_id: "course_vi_en_v1", key: "furniture_1", title: "Furniture", skill_type: "vocab" },
        // Unit 6 skills
        { id: "skill_hobbies_1", course_id: "course_vi_en_v1", key: "hobbies_1", title: "Hobbies & Interests", skill_type: "vocab" },
        { id: "skill_feelings_1", course_id: "course_vi_en_v1", key: "feelings_1", title: "Feelings & Opinions", skill_type: "vocab" },
        { id: "skill_invite_1", course_id: "course_vi_en_v1", key: "invite_1", title: "Invitations", skill_type: "grammar" },
        { id: "skill_party_1", course_id: "course_vi_en_v1", key: "party_1", title: "At the Party", skill_type: "vocab" }
    ],
    lessons: [
        { id: "lesson_001", course_id: "course_vi_en_v1", skill_id: "skill_greetings_1", lesson_index: 1, title: "Say Hello", target_xp: 10 },
        { id: "lesson_002", course_id: "course_vi_en_v1", skill_id: "skill_introduce_1", lesson_index: 1, title: "Introduce Yourself", target_xp: 12 },
        { id: "lesson_003", course_id: "course_vi_en_v1", skill_id: "skill_polite_1", lesson_index: 1, title: "Be Polite", target_xp: 12 },
        { id: "lesson_004", course_id: "course_vi_en_v1", skill_id: "skill_numbers_1", lesson_index: 1, title: "Count to 5", target_xp: 12 },
        { id: "lesson_025", course_id: "course_vi_en_v1", skill_id: "skill_numbers_2", lesson_index: 1, title: "Count to 10", target_xp: 12 },
        { id: "lesson_005", course_id: "course_vi_en_v1", skill_id: "skill_order_1", lesson_index: 1, title: "Order Something", target_xp: 14 },
        { id: "lesson_006", course_id: "course_vi_en_v1", skill_id: "skill_cafe_1", lesson_index: 1, title: "At the Café", target_xp: 14 },
        { id: "lesson_007", course_id: "course_vi_en_v1", skill_id: "skill_food_1", lesson_index: 1, title: "Talk About Food", target_xp: 14 },
        { id: "lesson_008", course_id: "course_vi_en_v1", skill_id: "skill_market_1", lesson_index: 1, title: "Ask the Price", target_xp: 16 },
        // Unit 3
        { id: "lesson_009", course_id: "course_vi_en_v1", skill_id: "skill_colors_1", lesson_index: 1, title: "Learn Colors", target_xp: 16 },
        { id: "lesson_026", course_id: "course_vi_en_v1", skill_id: "skill_adjectives_1", lesson_index: 1, title: "Describe Things", target_xp: 16 },
        { id: "lesson_010", course_id: "course_vi_en_v1", skill_id: "skill_haggle_1", lesson_index: 1, title: "Haggle at the Market", target_xp: 16 },
        { id: "lesson_011", course_id: "course_vi_en_v1", skill_id: "skill_fruit_1", lesson_index: 1, title: "Pick Some Fruit", target_xp: 16 },
        { id: "lesson_027", course_id: "course_vi_en_v1", skill_id: "skill_veggies_1", lesson_index: 1, title: "Buy Vegetables", target_xp: 16 },
        { id: "lesson_012", course_id: "course_vi_en_v1", skill_id: "skill_bignums_1", lesson_index: 1, title: "Handle Big Numbers", target_xp: 18 },
        // Unit 4
        { id: "lesson_013", course_id: "course_vi_en_v1", skill_id: "skill_directions_1", lesson_index: 1, title: "Ask for Directions", target_xp: 18 },
        { id: "lesson_030", course_id: "course_vi_en_v1", skill_id: "skill_distance_1", lesson_index: 1, title: "Near & Far", target_xp: 18 },
        { id: "lesson_014", course_id: "course_vi_en_v1", skill_id: "skill_taxi_1", lesson_index: 1, title: "Take a Taxi", target_xp: 18 },
        { id: "lesson_015", course_id: "course_vi_en_v1", skill_id: "skill_hotel_1", lesson_index: 1, title: "Check Into a Hotel", target_xp: 18 },
        { id: "lesson_016", course_id: "course_vi_en_v1", skill_id: "skill_help_1", lesson_index: 1, title: "Ask for Help", target_xp: 20 },
        // Unit 5
        { id: "lesson_017", course_id: "course_vi_en_v1", skill_id: "skill_time_1", lesson_index: 1, title: "Time of Day", target_xp: 20 },
        { id: "lesson_028", course_id: "course_vi_en_v1", skill_id: "skill_days_1", lesson_index: 1, title: "Today & Tomorrow", target_xp: 20 },
        { id: "lesson_018", course_id: "course_vi_en_v1", skill_id: "skill_weather_1", lesson_index: 1, title: "Discuss the Weather", target_xp: 20 },
        { id: "lesson_019", course_id: "course_vi_en_v1", skill_id: "skill_family_1", lesson_index: 1, title: "Meet the Parents", target_xp: 20 },
        { id: "lesson_029", course_id: "course_vi_en_v1", skill_id: "skill_family_2", lesson_index: 1, title: "Siblings & Spouses", target_xp: 20 },
        { id: "lesson_020", course_id: "course_vi_en_v1", skill_id: "skill_house_1", lesson_index: 1, title: "Rooms in the House", target_xp: 22 },
        { id: "lesson_031", course_id: "course_vi_en_v1", skill_id: "skill_furniture_1", lesson_index: 1, title: "Home Furnishings", target_xp: 22 },
        // Unit 6
        { id: "lesson_021", course_id: "course_vi_en_v1", skill_id: "skill_hobbies_1", lesson_index: 1, title: "Share Your Hobbies", target_xp: 22 },
        { id: "lesson_022", course_id: "course_vi_en_v1", skill_id: "skill_feelings_1", lesson_index: 1, title: "Express Feelings", target_xp: 22 },
        { id: "lesson_023", course_id: "course_vi_en_v1", skill_id: "skill_invite_1", lesson_index: 1, title: "Make Plans", target_xp: 22 },
        { id: "lesson_024", course_id: "course_vi_en_v1", skill_id: "skill_party_1", lesson_index: 1, title: "Celebrate Together", target_xp: 24 }
    ],
    path_nodes: [
        // ═══ Unit 1: First Words ═══
        // Textbook flow: Conversation → Quiz → Grammar → Pronunciation (basic→advanced)
        { id: "p1_L001", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 1, node_type: "lesson", module_type: "orange", lesson_id: "lesson_001", difficulty: 1, cefr_level: "A1.1", vocab_introduces: ["it_w_0001", "it_w_0002", "it_w_0003", "it_w_0004", "it_w_0007", "it_w_0008", "it_w_0009", "it_s_0037"], vocab_requires: [], unlock_rule: { requires: [] } },
        { id: "p1_Q001", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 2, node_type: "test", module_type: "test", label: "Greetings Quiz", test_scope: "module", source_node_id: "p1_L001", difficulty: 1, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p1_L001" }] } },
        { id: "p1_G1", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 3, node_type: "skill", module_type: "purple", label: "Grammar: I + You (tôi, bạn)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M06_U01a" }, difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: ["it_w_0008", "it_w_0009"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p1_Q001" }] } },
        { id: "p1_P0", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 4, node_type: "skill", module_type: "blue", label: "Tones: Introduction", skill_content: { type: "practice_module", route: "/practice/tones-1" }, difficulty: 1, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p1_G1" }] } },
        { id: "p1_S1", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 5, node_type: "skill", module_type: "blue", label: "Tones: Level & Rising", skill_content: { type: "practice_module", route: "/practice/tones-2" }, difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p1_P0" }] } },
        { id: "p1_P1", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 6, node_type: "skill", module_type: "blue", label: "Vowels: Core 12", skill_content: { type: "practice_module", route: "/practice/vowels-single-1" }, difficulty: 1, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p1_S1" }] } },
        { id: "p1_P2", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 7, node_type: "skill", module_type: "blue", label: "Tone Marks: Basic", skill_content: { type: "practice_module", route: "/practice/tonemarks-basic" }, difficulty: 1, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p1_P1" }] } },
        { id: "p1_L002", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 8, node_type: "lesson", module_type: "orange", lesson_id: "lesson_002", difficulty: 2, cefr_level: "A1.1", vocab_introduces: ["it_p_0010", "it_p_0011", "it_s_0012", "it_s_0013"], vocab_requires: ["it_w_0008", "it_w_0009"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p1_P2" }] } },
        { id: "p1_Q002", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 9, node_type: "test", module_type: "test", label: "Introductions Quiz", test_scope: "module", source_node_id: "p1_L002", difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p1_L002" }] } },
        { id: "p1_G2", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 10, node_type: "skill", module_type: "purple", label: "Grammar: Subject + là", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M01_U01" }, difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: ["it_w_0008", "it_w_0009"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p1_Q002" }] } },
        { id: "p1_S2", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 11, node_type: "skill", module_type: "blue", label: "Vowels: Special", skill_content: { type: "practice_module", route: "/practice/vowels-single-2" }, difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p1_G2" }] } },
        { id: "p1_T", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 12, node_type: "test", module_type: "test", label: "Unit 1 Test", test_scope: "unit", difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p1_S2" }] } },

        // ═══ Unit 2: Polite Survival ═══
        // Polite phrases + numbers 0-10
        { id: "p2_L003", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 1, node_type: "lesson", module_type: "orange", lesson_id: "lesson_003", difficulty: 3, cefr_level: "A1.1", vocab_introduces: ["it_w_0005", "it_w_0006", "it_w_0014", "it_w_0015", "it_s_0016", "it_s_0017"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p1_T" }] } },
        { id: "p2_Q003", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 2, node_type: "test", module_type: "test", label: "Polite Phrases Quiz", test_scope: "module", source_node_id: "p2_L003", difficulty: 3, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p2_L003" }] } },
        { id: "p2_G1", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 3, node_type: "skill", module_type: "purple", label: "Grammar: Negation (không)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M08_U01" }, difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: ["it_w_0008", "it_w_0009", "it_w_0007"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p2_Q003" }] } },
        { id: "p2_S1", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 3, node_type: "skill", module_type: "purple", label: "Numbers: 0–10", skill_content: { type: "practice_module", route: "/practice/numbers-1" }, difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p2_G1" }] } },
        { id: "p2_L004", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 4, node_type: "lesson", module_type: "orange", lesson_id: "lesson_004", difficulty: 4, cefr_level: "A1.1", vocab_introduces: ["it_w_0020", "it_w_0021", "it_w_0022", "it_w_0023", "it_w_0024", "it_s_0220", "it_s_0221"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p2_S1" }] } },
        { id: "p2_Q004", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 5, node_type: "test", module_type: "test", label: "Numbers 1–5 Quiz", test_scope: "module", source_node_id: "p2_L004", difficulty: 4, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p2_L004" }] } },
        { id: "p2_L025", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 6, node_type: "lesson", module_type: "orange", lesson_id: "lesson_025", difficulty: 5, cefr_level: "A1.1", vocab_introduces: ["it_w_0025", "it_w_0026", "it_w_0027", "it_w_0028", "it_w_0029", "it_s_0222", "it_s_0223"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p2_Q004" }] } },
        { id: "p2_Q025", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 7, node_type: "test", module_type: "test", label: "Numbers 6–10 Quiz", test_scope: "module", source_node_id: "p2_L025", difficulty: 5, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p2_L025" }] } },
        { id: "p2_S2", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 8, node_type: "skill", module_type: "blue", label: "Tone Marks: Special", skill_content: { type: "practice_module", route: "/practice/tonemarks-special" }, difficulty: 3, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p2_Q025" }] } },
        { id: "p2_S3", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 9, node_type: "skill", module_type: "purple", label: "Particles: Politeness", skill_content: { type: "practice_module", route: "/practice/particles-1" }, difficulty: 3, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p2_S2" }] } },
        { id: "p2_T", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 10, node_type: "test", module_type: "test", label: "Unit 2 Test", test_scope: "unit", difficulty: 5, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p2_S3" }] } },

        // ═══ Unit 3: Ordering & Café ═══
        // First real situations + grammar basics
        { id: "p3_L005", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 1, node_type: "lesson", module_type: "orange", lesson_id: "lesson_005", difficulty: 5, cefr_level: "A1.2", vocab_introduces: ["it_w_0030", "it_w_0031", "it_w_0032", "it_w_0035", "it_w_0036", "it_s_0033", "it_s_0034"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p2_T" }] } },
        { id: "p3_Q005", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 2, node_type: "test", module_type: "test", label: "Ordering Quiz", test_scope: "module", source_node_id: "p3_L005", difficulty: 5, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p3_L005" }] } },
        { id: "p3_S1", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 3, node_type: "skill", module_type: "blue", label: "Tones: + Dipping", skill_content: { type: "practice_module", route: "/practice/tones-3" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p3_Q005" }] } },
        { id: "p3_P1", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 4, node_type: "skill", module_type: "blue", label: "Consonants: Initial", skill_content: { type: "practice_module", route: "/practice/consonants" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p3_S1" }] } },
        { id: "p3_L006", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 5, node_type: "lesson", module_type: "orange", lesson_id: "lesson_006", difficulty: 6, cefr_level: "A1.2", vocab_introduces: ["it_w_0040", "it_w_0041", "it_w_0042", "it_w_0043", "it_s_0044"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p3_P1" }] } },
        { id: "p3_Q006", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 6, node_type: "test", module_type: "orange", label: "Café Quiz", test_scope: "module", source_node_id: "p3_L006", difficulty: 6, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p3_L006" }] } },
        { id: "p3_G1", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 7, node_type: "skill", module_type: "purple", label: "Grammar: Want to (muốn)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M25_U01" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: ["it_w_0035", "it_w_0030", "it_w_0031", "it_w_0032"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p3_Q006" }] } },
        { id: "p3_S3", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 8, node_type: "skill", module_type: "purple", label: "Classifiers: Basics", skill_content: { type: "practice_module", route: "/practice/classifiers-1" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p3_G1" }] } },
        { id: "p3_T", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 9, node_type: "test", module_type: "test", label: "Unit 3 Test", test_scope: "unit", difficulty: 7, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p3_S3" }] } },
        { id: "p3_SC1", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 10, node_type: "scene", module_type: "green", label: "☕ At the Café", scene_id: "scene_cafe_001", difficulty: 7, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p3_T" }] } },

        // ═══ Unit 4: Food & Prices ═══
        // Expand vocab + numbers 11-99 + typing intro
        { id: "p4_L007", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 1, node_type: "lesson", module_type: "orange", lesson_id: "lesson_007", difficulty: 6, cefr_level: "A1.2", vocab_introduces: ["it_w_0045", "it_w_0046", "it_w_0047", "it_w_0048", "it_w_0050", "it_w_0051", "it_s_0049"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p3_T" }] } },
        { id: "p4_Q007", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 2, node_type: "test", module_type: "orange", label: "Food Quiz", test_scope: "module", source_node_id: "p4_L007", difficulty: 6, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p4_L007" }] } },
        { id: "p4_G1", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 3, node_type: "skill", module_type: "purple", label: "Grammar: Counters (cái)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M14_U01" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: ["it_w_0055", "it_w_0045", "it_w_0046"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p4_Q007" }] } },
        { id: "p4_S1", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 3, node_type: "skill", module_type: "purple", label: "TELEX: Tone Keys", skill_content: { type: "practice_module", route: "/practice/telex-1" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p4_G1" }] } },
        { id: "p4_L008", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 4, node_type: "lesson", module_type: "orange", lesson_id: "lesson_008", difficulty: 7, cefr_level: "A1.2", vocab_introduces: ["it_w_0052", "it_w_0053", "it_w_0055", "it_w_0056", "it_w_0057", "it_s_0054"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p4_S1" }] } },
        { id: "p4_Q008", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 5, node_type: "test", module_type: "orange", label: "Prices Quiz", test_scope: "module", source_node_id: "p4_L008", difficulty: 7, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p4_L008" }] } },
        { id: "p4_S2", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 6, node_type: "skill", module_type: "blue", label: "Vowels: Centering Diph.", skill_content: { type: "practice_module", route: "/practice/vowels-diph-1" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p4_Q008" }] } },
        { id: "p4_S3", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 7, node_type: "skill", module_type: "purple", label: "Numbers: 11–99", skill_content: { type: "practice_module", route: "/practice/numbers-2" }, difficulty: 5, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p4_S2" }] } },
        { id: "p4_S4", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 8, node_type: "skill", module_type: "purple", label: "Question Words", skill_content: { type: "practice_module", route: "/practice/question-words-1" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p4_S3" }] } },
        { id: "p4_T", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 9, node_type: "test", module_type: "test", label: "Unit 4 Test", test_scope: "unit", difficulty: 7, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p4_S4" }] } },

        // ═══ Unit 5: Market Life ═══
        // Descriptions + haggling + tone mark mastery
        { id: "p5_L009", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 1, node_type: "lesson", module_type: "orange", lesson_id: "lesson_009", difficulty: 5, cefr_level: "A1.3", vocab_introduces: ["it_w_0060", "it_w_0061", "it_w_0062", "it_w_0063", "it_w_0064", "it_w_0065", "it_s_0224", "it_s_0225"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p4_T" }] } },
        { id: "p5_Q009", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 2, node_type: "test", module_type: "test", label: "Colors Quiz", test_scope: "module", source_node_id: "p5_L009", difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p5_L009" }] } },
        { id: "p5_L026", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 3, node_type: "lesson", module_type: "orange", lesson_id: "lesson_026", difficulty: 6, cefr_level: "A1.3", vocab_introduces: ["it_w_0066", "it_w_0067", "it_w_0068", "it_w_0069", "it_s_0226", "it_s_0227"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p5_Q009" }] } },
        { id: "p5_Q026", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 4, node_type: "test", module_type: "test", label: "Adjectives Quiz", test_scope: "module", source_node_id: "p5_L026", difficulty: 6, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p5_L026" }] } },
        { id: "p5_S1", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 5, node_type: "skill", module_type: "blue", label: "Tone Marks: Master", skill_content: { type: "practice_module", route: "/practice/tonemarks-master" }, difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p5_Q026" }] } },
        { id: "p5_L010", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 6, node_type: "lesson", module_type: "orange", lesson_id: "lesson_010", difficulty: 7, cefr_level: "A1.3", vocab_introduces: ["it_w_0070", "it_w_0071", "it_w_0072", "it_w_0073", "it_w_0074", "it_s_0075", "it_s_0076", "it_w_0077"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p5_S1" }] } },
        { id: "p5_Q010", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 7, node_type: "test", module_type: "test", label: "Haggling Quiz", test_scope: "module", source_node_id: "p5_L010", difficulty: 7, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p5_L010" }] } },
        { id: "p5_S2", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 8, node_type: "skill", module_type: "purple", label: "Grammar: Adjectives", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M09_U01" }, difficulty: 4, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: ["it_w_0068", "it_w_0066", "it_w_0067", "it_w_0056", "it_w_0057"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p5_Q010" }] } },
        { id: "p5_G1", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 9, node_type: "skill", module_type: "purple", label: "Grammar: Very (rất)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M26_U01" }, difficulty: 4, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: ["it_w_0068", "it_w_0066", "it_w_0067", "it_w_0056", "it_w_0057"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p5_S2" }] } },
        { id: "p5_S3", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 9, node_type: "skill", module_type: "purple", label: "Classifiers: Extended", skill_content: { type: "practice_module", route: "/practice/classifiers-2" }, difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p5_G1" }] } },
        { id: "p5_S4", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 10, node_type: "skill", module_type: "purple", label: "Prepositions", skill_content: { type: "practice_module", route: "/practice/prepositions" }, difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p5_S3" }] } },
        { id: "p5_T", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 11, node_type: "test", module_type: "test", label: "Unit 5 Test", test_scope: "unit", difficulty: 7, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p5_S4" }] } },

        // ═══ Unit 6: Numbers Advanced ═══
        // 0-999 + triphthongs + pitch training intro
        { id: "p6_L011", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 1, node_type: "lesson", module_type: "orange", lesson_id: "lesson_011", difficulty: 5, cefr_level: "A1.3", vocab_introduces: ["it_w_0080", "it_w_0081", "it_w_0082", "it_w_0083", "it_w_0084", "it_s_0228", "it_s_0229"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p5_T" }] } },
        { id: "p6_Q011", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 2, node_type: "test", module_type: "test", label: "Fruits Quiz", test_scope: "module", source_node_id: "p6_L011", difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p6_L011" }] } },
        { id: "p6_L027", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 3, node_type: "lesson", module_type: "orange", lesson_id: "lesson_027", difficulty: 6, cefr_level: "A1.3", vocab_introduces: ["it_w_0085", "it_w_0086", "it_w_0087", "it_s_0230", "it_s_0231"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p6_Q011" }] } },
        { id: "p6_Q027", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 4, node_type: "test", module_type: "test", label: "Vegetables Quiz", test_scope: "module", source_node_id: "p6_L027", difficulty: 6, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p6_L027" }] } },
        { id: "p6_S1", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 5, node_type: "skill", module_type: "purple", label: "Numbers: Challenge", skill_content: { type: "practice_module", route: "/practice/numbers-3" }, difficulty: 7, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p6_Q027" }] } },
        { id: "p6_L012", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 6, node_type: "lesson", module_type: "orange", lesson_id: "lesson_012", difficulty: 7, cefr_level: "A1.3", vocab_introduces: ["it_w_0090", "it_w_0091", "it_w_0092", "it_w_0093", "it_w_0094", "it_s_0095"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p6_S1" }] } },
        { id: "p6_Q012", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 7, node_type: "test", module_type: "test", label: "Big Numbers Quiz", test_scope: "module", source_node_id: "p6_L012", difficulty: 7, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p6_L012" }] } },
        { id: "p6_G1", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 8, node_type: "skill", module_type: "purple", label: "Grammar: Plurals (những/các)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M07_U01" }, difficulty: 4, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: ["it_w_0080", "it_w_0081", "it_w_0082", "it_w_0086", "it_w_0085"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p6_Q012" }] } },
        { id: "p6_S2", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 9, node_type: "skill", module_type: "blue", label: "Vowels: Gliding Diph.", skill_content: { type: "practice_module", route: "/practice/vowels-diph-2" }, difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p6_G1" }] } },
        { id: "p6_P1", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 10, node_type: "skill", module_type: "blue", label: "Consonants: Final", skill_content: { type: "practice_module", route: "/practice/consonants-final" }, difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p6_S2" }] } },
        { id: "p6_S3", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 11, node_type: "skill", module_type: "blue", label: "Pitch: Easy Tones", skill_content: { type: "practice_module", route: "/practice/pitch-1" }, difficulty: 4, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p6_P1" }] } },
        { id: "p6_S4", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 12, node_type: "skill", module_type: "purple", label: "Quantifiers", skill_content: { type: "practice_module", route: "/practice/quantifiers" }, difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p6_S3" }] } },
        { id: "p6_T", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 13, node_type: "test", module_type: "test", label: "Unit 6 Test", test_scope: "unit", difficulty: 8, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p6_S4" }] } },

        // ═══ Unit 7: Getting Around ═══
        // Directions + transport + full TELEX + pitch advanced
        { id: "p7_L013", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 1, node_type: "lesson", module_type: "orange", lesson_id: "lesson_013", difficulty: 5, cefr_level: "A2.1", vocab_introduces: ["it_w_0100", "it_w_0101", "it_w_0102", "it_w_0103", "it_w_0104", "it_s_0107"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p6_T" }] } },
        { id: "p7_Q013", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 2, node_type: "test", module_type: "test", label: "Directions Quiz", test_scope: "module", source_node_id: "p7_L013", difficulty: 5, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_L013" }] } },
        { id: "p7_L030", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 3, node_type: "lesson", module_type: "orange", lesson_id: "lesson_030", difficulty: 6, cefr_level: "A2.1", vocab_introduces: ["it_w_0105", "it_w_0106", "it_s_0242", "it_s_0243"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_Q013" }] } },
        { id: "p7_Q030", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 4, node_type: "test", module_type: "test", label: "Distance Quiz", test_scope: "module", source_node_id: "p7_L030", difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_L030" }] } },
        { id: "p7_S1", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 5, node_type: "skill", module_type: "purple", label: "TELEX: Vowel Mods", skill_content: { type: "practice_module", route: "/practice/telex-2" }, difficulty: 5, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_Q030" }] } },
        { id: "p7_L014", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 6, node_type: "lesson", module_type: "orange", lesson_id: "lesson_014", difficulty: 7, cefr_level: "A2.1", vocab_introduces: ["it_w_0110", "it_w_0111", "it_w_0112", "it_w_0113", "it_w_0114", "it_s_0115", "it_s_0116"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_S1" }] } },
        { id: "p7_Q014", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 7, node_type: "test", module_type: "test", label: "Taxi Quiz", test_scope: "module", source_node_id: "p7_L014", difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_L014" }] } },
        { id: "p7_S2", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 8, node_type: "skill", module_type: "purple", label: "Grammar: Directions", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M27_U01" }, difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: ["it_w_0100", "it_w_0102", "it_w_0103", "it_w_0104", "it_w_0105", "it_w_0106"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_Q014" }] } },
        { id: "p7_G1", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 9, node_type: "skill", module_type: "purple", label: "Grammar: Location (ở)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M11_U01" }, difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: ["it_w_0113", "it_w_0120", "it_w_0121", "it_w_0124"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_S2" }] } },
        { id: "p7_L015", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 9, node_type: "lesson", module_type: "orange", lesson_id: "lesson_015", difficulty: 8, cefr_level: "A2.1", vocab_introduces: ["it_w_0120", "it_w_0121", "it_w_0122", "it_w_0123", "it_w_0124", "it_s_0125"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_G1" }] } },
        { id: "p7_Q015", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 10, node_type: "test", module_type: "test", label: "Hotel Quiz", test_scope: "module", source_node_id: "p7_L015", difficulty: 8, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_L015" }] } },
        { id: "p7_S3", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 11, node_type: "skill", module_type: "purple", label: "TELEX: Full Challenge", skill_content: { type: "practice_module", route: "/practice/telex-3" }, difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_Q015" }] } },
        { id: "p7_L016", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 12, node_type: "lesson", module_type: "orange", lesson_id: "lesson_016", difficulty: 9, cefr_level: "A2.1", vocab_introduces: ["it_w_0130", "it_w_0131", "it_w_0132", "it_w_0133", "it_w_0134", "it_s_0135", "it_s_0136"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_S3" }] } },
        { id: "p7_Q016", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 13, node_type: "test", module_type: "test", label: "Help Quiz", test_scope: "module", source_node_id: "p7_L016", difficulty: 9, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_L016" }] } },
        { id: "p7_S4", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 14, node_type: "skill", module_type: "blue", label: "Pitch: Hard Tones", skill_content: { type: "practice_module", route: "/practice/pitch-2" }, difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_Q016" }] } },
        { id: "p7_S5", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 15, node_type: "skill", module_type: "purple", label: "Question Words: Advanced", skill_content: { type: "practice_module", route: "/practice/question-words-2" }, difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_S4" }] } },
        { id: "p7_S6", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 16, node_type: "skill", module_type: "purple", label: "Connectors: Và/Còn/Nhưng", skill_content: { type: "practice_module", route: "/practice/connectors" }, difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_S5" }] } },
        { id: "p7_T", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 17, node_type: "test", module_type: "test", label: "Unit 7 Test", test_scope: "unit", difficulty: 9, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_S6" }] } },

        // ═══ Unit 8: Daily Life ═══
        // Time + weather + family pronouns
        { id: "p8_L017", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 1, node_type: "lesson", module_type: "orange", lesson_id: "lesson_017", difficulty: 5, cefr_level: "A2.1", vocab_introduces: ["it_w_0140", "it_w_0141", "it_w_0142", "it_w_0143", "it_w_0144", "it_s_0232", "it_s_0233"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p7_T" }] } },
        { id: "p8_Q017", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 2, node_type: "test", module_type: "test", label: "Time Quiz", test_scope: "module", source_node_id: "p8_L017", difficulty: 5, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_L017" }] } },
        { id: "p8_L028", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 3, node_type: "lesson", module_type: "orange", lesson_id: "lesson_028", difficulty: 6, cefr_level: "A2.1", vocab_introduces: ["it_w_0145", "it_w_0146", "it_w_0147", "it_s_0148"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_Q017" }] } },
        { id: "p8_Q028", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 4, node_type: "test", module_type: "test", label: "Days Quiz", test_scope: "module", source_node_id: "p8_L028", difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_L028" }] } },
        { id: "p8_S1", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 5, node_type: "skill", module_type: "purple", label: "Pronouns: Core Family", skill_content: { type: "practice_module", route: "/practice/pronouns-1" }, difficulty: 5, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_Q028" }] } },
        { id: "p8_L018", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 6, node_type: "lesson", module_type: "orange", lesson_id: "lesson_018", difficulty: 7, cefr_level: "A2.1", vocab_introduces: ["it_w_0150", "it_w_0151", "it_w_0152", "it_w_0153", "it_w_0154", "it_w_0155", "it_s_0156"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_S1" }] } },
        { id: "p8_Q018", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 7, node_type: "test", module_type: "test", label: "Weather Quiz", test_scope: "module", source_node_id: "p8_L018", difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_L018" }] } },
        { id: "p8_S2", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 8, node_type: "skill", module_type: "purple", label: "Grammar: Days & Dates", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M15_U01" }, difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_Q018" }] } },
        { id: "p8_G1", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 9, node_type: "skill", module_type: "purple", label: "Grammar: Present Tense", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M02_U01" }, difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: ["it_w_0145", "it_w_0142", "it_w_0143", "it_w_0144", "it_w_0100", "it_w_0151", "it_w_0152"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_S2" }] } },
        { id: "p8_L019", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 9, node_type: "lesson", module_type: "orange", lesson_id: "lesson_019", difficulty: 8, cefr_level: "A2.1", vocab_introduces: ["it_w_0160", "it_w_0161", "it_w_0162", "it_w_0163", "it_w_0164", "it_w_0165", "it_s_0234", "it_s_0235"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_G1" }] } },
        { id: "p8_Q019", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 10, node_type: "test", module_type: "test", label: "Parents Quiz", test_scope: "module", source_node_id: "p8_L019", difficulty: 8, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_L019" }] } },
        { id: "p8_L029", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 11, node_type: "lesson", module_type: "orange", lesson_id: "lesson_029", difficulty: 9, cefr_level: "A2.1", vocab_introduces: ["it_w_0166", "it_w_0167", "it_w_0168", "it_w_0169", "it_s_0236", "it_s_0237"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_Q019" }] } },
        { id: "p8_Q029", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 12, node_type: "test", module_type: "test", label: "Siblings Quiz", test_scope: "module", source_node_id: "p8_L029", difficulty: 9, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_L029" }] } },
        { id: "p8_S3", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 13, node_type: "skill", module_type: "purple", label: "Pronouns: Extended Family", skill_content: { type: "practice_module", route: "/practice/pronouns-2" }, difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_Q029" }] } },
        { id: "p8_L020", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 14, node_type: "lesson", module_type: "orange", lesson_id: "lesson_020", difficulty: 9, cefr_level: "A2.1", vocab_introduces: ["it_w_0170", "it_w_0171", "it_w_0172", "it_w_0173", "it_s_0238", "it_s_0239"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_S3" }] } },
        { id: "p8_Q020", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 15, node_type: "test", module_type: "test", label: "Rooms Quiz", test_scope: "module", source_node_id: "p8_L020", difficulty: 9, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_L020" }] } },
        { id: "p8_L031", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 16, node_type: "lesson", module_type: "orange", lesson_id: "lesson_031", difficulty: 10, cefr_level: "A2.1", vocab_introduces: ["it_w_0174", "it_w_0175", "it_w_0176", "it_s_0240", "it_s_0241"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_Q020" }] } },
        { id: "p8_Q031", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 17, node_type: "test", module_type: "test", label: "Furniture Quiz", test_scope: "module", source_node_id: "p8_L031", difficulty: 10, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_L031" }] } },
        { id: "p8_S4", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 18, node_type: "skill", module_type: "blue", label: "Vowels: Triph. & More", skill_content: { type: "practice_module", route: "/practice/vowels-diph-3" }, difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_Q031" }] } },
        { id: "p8_S5", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 19, node_type: "skill", module_type: "purple", label: "Aspect Markers", skill_content: { type: "practice_module", route: "/practice/aspect-markers" }, difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_S4" }] } },
        { id: "p8_S6", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 20, node_type: "skill", module_type: "purple", label: "Intensifiers: Rất/Lắm/Quá", skill_content: { type: "practice_module", route: "/practice/intensifiers" }, difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_S5" }] } },
        { id: "p8_T", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 21, node_type: "test", module_type: "test", label: "Unit 8 Test", test_scope: "unit", difficulty: 10, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_S6" }] } },

        // ═══ Unit 9: Social Life ═══
        // Feelings + hobbies + teen code + final test
        { id: "p9_L021", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 1, node_type: "lesson", module_type: "orange", lesson_id: "lesson_021", difficulty: 6, cefr_level: "A2.2", vocab_introduces: ["it_w_0180", "it_w_0181", "it_w_0182", "it_w_0183", "it_w_0184", "it_w_0185", "it_s_0186"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p8_T" }] } },
        { id: "p9_Q021", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 2, node_type: "test", module_type: "orange", label: "Hobbies Quiz", test_scope: "module", source_node_id: "p9_L021", difficulty: 6, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_L021" }] } },
        { id: "p9_S1", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 3, node_type: "skill", module_type: "purple", label: "Teen Code: Basics", skill_content: { type: "practice_module", route: "/practice/teencode-1" }, difficulty: 5, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_Q021" }] } },
        { id: "p9_L022", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 4, node_type: "lesson", module_type: "orange", lesson_id: "lesson_022", difficulty: 7, cefr_level: "A2.2", vocab_introduces: ["it_w_0190", "it_w_0191", "it_w_0192", "it_w_0193", "it_w_0194", "it_w_0195", "it_s_0196"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_S1" }] } },
        { id: "p9_Q022", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 5, node_type: "test", module_type: "orange", label: "Feelings Quiz", test_scope: "module", source_node_id: "p9_L022", difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_L022" }] } },
        { id: "p9_S2", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 6, node_type: "skill", module_type: "blue", label: "Tones: All 6", skill_content: { type: "practice_module", route: "/practice/tones-4" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_Q022" }] } },
        { id: "p9_L023", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 7, node_type: "lesson", module_type: "orange", lesson_id: "lesson_023", difficulty: 8, cefr_level: "A2.2", vocab_introduces: ["it_w_0200", "it_w_0201", "it_w_0202", "it_w_0203", "it_w_0204", "it_s_0205", "it_s_0206"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_S2" }] } },
        { id: "p9_Q023", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 8, node_type: "test", module_type: "orange", label: "Invitations Quiz", test_scope: "module", source_node_id: "p9_L023", difficulty: 8, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_L023" }] } },
        { id: "p9_S3", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 9, node_type: "skill", module_type: "purple", label: "Grammar: Should & Shouldn't", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M20_U01" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: ["it_w_0100", "it_w_0181", "it_w_0191", "it_w_0190"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_Q023" }] } },
        { id: "p9_G1", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 10, node_type: "skill", module_type: "purple", label: "Grammar: Because (vì)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M17_U01" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: ["it_w_0190", "it_w_0192", "it_w_0191", "it_w_0151", "it_w_0030"], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_S3" }] } },
        { id: "p9_S4", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 10, node_type: "skill", module_type: "purple", label: "Teen Code: People", skill_content: { type: "practice_module", route: "/practice/teencode-2" }, difficulty: 6, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_G1" }] } },
        { id: "p9_L024", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 11, node_type: "lesson", module_type: "orange", lesson_id: "lesson_024", difficulty: 9, cefr_level: "A2.2", vocab_introduces: ["it_w_0210", "it_w_0211", "it_w_0212", "it_w_0213", "it_s_0214", "it_s_0215", "it_w_0216"], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_S4" }] } },
        { id: "p9_Q024", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 12, node_type: "test", module_type: "orange", label: "Party Quiz", test_scope: "module", source_node_id: "p9_L024", difficulty: 9, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_L024" }] } },
        { id: "p9_S5", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 13, node_type: "skill", module_type: "purple", label: "Teen Code: Life & Internet", skill_content: { type: "practice_module", route: "/practice/teencode-3" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_Q024" }] } },
        { id: "p9_S6", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 14, node_type: "skill", module_type: "purple", label: "Particles: Emotion", skill_content: { type: "practice_module", route: "/practice/particles-2" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_S5" }] } },
        { id: "p9_S7", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 15, node_type: "skill", module_type: "purple", label: "Degree Adverbs", skill_content: { type: "practice_module", route: "/practice/degree-adverbs" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_S6" }] } },
        { id: "p9_S8", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 16, node_type: "skill", module_type: "purple", label: "Vision Verbs", skill_content: { type: "practice_module", route: "/practice/vision-verbs" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_S7" }] } },
        { id: "p9_T", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 17, node_type: "test", module_type: "test", label: "Final Test", test_scope: "unit", difficulty: 10, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [], unlock_rule: { requires: [{ type: "node_completed", node_id: "p9_S8" }] } }
    ],
    items: [
        { id: "it_w_0001", item_type: "word", vi_text: "xin chào", vi_text_no_diacritics: "xin chao", audio_key: "a_xin_chao", dialect: "both", emoji: "👋" },
        { id: "it_w_0002", item_type: "word", vi_text: "chào", vi_text_no_diacritics: "chao", audio_key: "a_chao", dialect: "both", emoji: "👋" },
        { id: "it_w_0003", item_type: "word", vi_text: "tạm biệt", vi_text_no_diacritics: "tam biet", audio_key: "a_tam_biet", dialect: "both", emoji: "👋" },
        { id: "it_w_0004", item_type: "word", vi_text: "cảm ơn", vi_text_no_diacritics: "cam on", audio_key: "a_cam_on", dialect: "both", emoji: "🙏" },
        { id: "it_w_0005", item_type: "word", vi_text: "vâng", vi_text_no_diacritics: "vang", audio_key: "a_vang", dialect: "north", emoji: "✅" },
        { id: "it_w_0006", item_type: "word", vi_text: "dạ", vi_text_no_diacritics: "da", audio_key: "a_da", dialect: "south", emoji: "✅" },
        { id: "it_w_0007", item_type: "word", vi_text: "không", vi_text_no_diacritics: "khong", audio_key: "a_khong", dialect: "both", emoji: "❌" },
        { id: "it_w_0008", item_type: "word", vi_text: "tôi", vi_text_no_diacritics: "toi", audio_key: "a_toi", dialect: "both", emoji: "👤" },
        { id: "it_w_0009", item_type: "word", vi_text: "bạn", vi_text_no_diacritics: "ban", audio_key: "a_ban", dialect: "both", emoji: "👥" },
        { id: "it_p_0010", item_type: "phrase", vi_text: "tôi tên là {NAME}", vi_text_no_diacritics: "toi ten la {NAME}", audio_key: "a_toi_ten_la_name", dialect: "both" },
        { id: "it_p_0011", item_type: "phrase", vi_text: "tôi là {ROLE}", vi_text_no_diacritics: "toi la {ROLE}", audio_key: "a_toi_la_role", dialect: "both" },
        { id: "it_s_0012", item_type: "sentence", vi_text: "Bạn tên là gì?", vi_text_no_diacritics: "Ban ten la gi?", audio_key: "a_ban_ten_la_gi", dialect: "both" },
        { id: "it_s_0013", item_type: "sentence", vi_text: "Rất vui được gặp bạn.", vi_text_no_diacritics: "Rat vui duoc gap ban.", audio_key: "a_rat_vui_duoc_gap_ban", dialect: "both" },
        { id: "it_w_0014", item_type: "word", vi_text: "xin lỗi", vi_text_no_diacritics: "xin loi", audio_key: "a_xin_loi", dialect: "both", emoji: "🙇" },
        { id: "it_w_0015", item_type: "word", vi_text: "làm ơn", vi_text_no_diacritics: "lam on", audio_key: "a_lam_on", dialect: "both", emoji: "🙏" },
        { id: "it_s_0016", item_type: "sentence", vi_text: "Tôi không hiểu.", vi_text_no_diacritics: "Toi khong hieu.", audio_key: "a_toi_khong_hieu", dialect: "both" },
        { id: "it_s_0017", item_type: "sentence", vi_text: "Nói chậm lại.", vi_text_no_diacritics: "Noi cham lai.", audio_key: "a_noi_cham_lai", dialect: "both" },
        { id: "it_w_0020", item_type: "word", vi_text: "một", vi_text_no_diacritics: "mot", audio_key: "a_mot", dialect: "both", emoji: "1️⃣" },
        { id: "it_w_0021", item_type: "word", vi_text: "hai", vi_text_no_diacritics: "hai", audio_key: "a_hai", dialect: "both", emoji: "2️⃣" },
        { id: "it_w_0022", item_type: "word", vi_text: "ba", vi_text_no_diacritics: "ba", audio_key: "a_ba", dialect: "both", emoji: "3️⃣" },
        { id: "it_w_0023", item_type: "word", vi_text: "bốn", vi_text_no_diacritics: "bon", audio_key: "a_bon", dialect: "both", emoji: "4️⃣" },
        { id: "it_w_0024", item_type: "word", vi_text: "năm", vi_text_no_diacritics: "nam", audio_key: "a_nam", dialect: "both", emoji: "5️⃣" },
        { id: "it_s_0220", item_type: "sentence", vi_text: "Một, hai, ba!", vi_text_no_diacritics: "Mot, hai, ba!", audio_key: "a_mot_hai_ba", dialect: "both" },
        { id: "it_s_0221", item_type: "sentence", vi_text: "Tôi có năm bạn.", vi_text_no_diacritics: "Toi co nam ban.", audio_key: "a_toi_co_nam_ban", dialect: "both" },
        { id: "it_w_0025", item_type: "word", vi_text: "sáu", vi_text_no_diacritics: "sau", audio_key: "a_sau", dialect: "both", emoji: "6️⃣" },
        { id: "it_w_0026", item_type: "word", vi_text: "bảy", vi_text_no_diacritics: "bay", audio_key: "a_bay", dialect: "both", emoji: "7️⃣" },
        { id: "it_w_0027", item_type: "word", vi_text: "tám", vi_text_no_diacritics: "tam", audio_key: "a_tam", dialect: "both", emoji: "8️⃣" },
        { id: "it_w_0028", item_type: "word", vi_text: "chín", vi_text_no_diacritics: "chin", audio_key: "a_chin", dialect: "both", emoji: "9️⃣" },
        { id: "it_w_0029", item_type: "word", vi_text: "mười", vi_text_no_diacritics: "muoi", audio_key: "a_muoi", dialect: "both", emoji: "🔟" },
        { id: "it_s_0222", item_type: "sentence", vi_text: "Tám hay chín?", vi_text_no_diacritics: "Tam hay chin?", audio_key: "a_tam_hay_chin", dialect: "both" },
        { id: "it_s_0223", item_type: "sentence", vi_text: "Từ sáu đến mười.", vi_text_no_diacritics: "Tu sau den muoi.", audio_key: "a_tu_sau_den_muoi", dialect: "both" },
        { id: "it_w_0030", item_type: "word", vi_text: "cà phê", vi_text_no_diacritics: "ca phe", audio_key: "a_ca_phe", dialect: "both", emoji: "☕" },
        { id: "it_w_0031", item_type: "word", vi_text: "trà", vi_text_no_diacritics: "tra", audio_key: "a_tra", dialect: "both", emoji: "🍵" },
        { id: "it_w_0032", item_type: "word", vi_text: "nước", vi_text_no_diacritics: "nuoc", audio_key: "a_nuoc", dialect: "both", emoji: "💧" },
        { id: "it_s_0033", item_type: "sentence", vi_text: "Cho tôi cà phê.", vi_text_no_diacritics: "Cho toi ca phe.", audio_key: "a_cho_toi_mot_ca_phe", dialect: "both" },
        { id: "it_s_0034", item_type: "sentence", vi_text: "Tôi muốn một trà.", vi_text_no_diacritics: "Toi muon mot tra.", audio_key: "a_toi_muon_mot_tra", dialect: "both" },
        { id: "it_w_0035", item_type: "word", vi_text: "muốn", vi_text_no_diacritics: "muon", audio_key: "a_muon", dialect: "both", emoji: "💭" },
        { id: "it_w_0036", item_type: "word", vi_text: "cho", vi_text_no_diacritics: "cho", audio_key: "a_cho", dialect: "both", emoji: "🤲" },
        { id: "it_s_0037", item_type: "sentence", vi_text: "Cảm ơn!", vi_text_no_diacritics: "Cam on!", audio_key: "a_cam_on_2", dialect: "both" },
        // Unit 2 items
        { id: "it_w_0040", item_type: "word", vi_text: "cà phê sữa đá", vi_text_no_diacritics: "ca phe sua da", audio_key: "a_ca_phe_sua_da", dialect: "both", emoji: "☕" },
        { id: "it_w_0041", item_type: "word", vi_text: "sữa", vi_text_no_diacritics: "sua", audio_key: "a_sua", dialect: "both", emoji: "🥛" },
        { id: "it_w_0042", item_type: "word", vi_text: "đá", vi_text_no_diacritics: "da_ice", audio_key: "a_da_ice", dialect: "both", emoji: "🧊" },
        { id: "it_w_0043", item_type: "word", vi_text: "nóng", vi_text_no_diacritics: "nong", audio_key: "a_nong", dialect: "both", emoji: "🔥" },
        { id: "it_s_0044", item_type: "sentence", vi_text: "Tôi muốn cà phê sữa đá.", vi_text_no_diacritics: "Toi muon ca phe sua da.", audio_key: "a_cho_toi_csda", dialect: "both" },
        { id: "it_w_0045", item_type: "word", vi_text: "phở", vi_text_no_diacritics: "pho", audio_key: "a_pho", dialect: "both", emoji: "🍜" },
        { id: "it_w_0046", item_type: "word", vi_text: "bánh mì", vi_text_no_diacritics: "banh mi", audio_key: "a_banh_mi", dialect: "both", emoji: "🥖" },
        { id: "it_w_0047", item_type: "word", vi_text: "bún", vi_text_no_diacritics: "bun", audio_key: "a_bun", dialect: "both", emoji: "🍜" },
        { id: "it_w_0048", item_type: "word", vi_text: "cơm", vi_text_no_diacritics: "com", audio_key: "a_com", dialect: "both", emoji: "🍚" },
        { id: "it_s_0049", item_type: "sentence", vi_text: "Tôi muốn một bát phở.", vi_text_no_diacritics: "Toi muon mot bat pho.", audio_key: "a_toi_muon_pho", dialect: "both" },
        { id: "it_w_0050", item_type: "word", vi_text: "bát", vi_text_no_diacritics: "bat", audio_key: "a_bat", dialect: "both", emoji: "🥣" },
        { id: "it_w_0051", item_type: "word", vi_text: "ngon", vi_text_no_diacritics: "ngon", audio_key: "a_ngon", dialect: "both", emoji: "😋" },
        { id: "it_w_0052", item_type: "word", vi_text: "bao nhiêu", vi_text_no_diacritics: "bao nhieu", audio_key: "a_bao_nhieu", dialect: "both", emoji: "🔢" },
        { id: "it_w_0053", item_type: "word", vi_text: "tiền", vi_text_no_diacritics: "tien", audio_key: "a_tien", dialect: "both", emoji: "💰" },
        { id: "it_s_0054", item_type: "sentence", vi_text: "Cái này bao nhiêu tiền?", vi_text_no_diacritics: "Cai nay bao nhieu tien?", audio_key: "a_bao_nhieu_tien", dialect: "both" },
        { id: "it_w_0055", item_type: "word", vi_text: "cái này", vi_text_no_diacritics: "cai nay", audio_key: "a_cai_nay", dialect: "both", emoji: "👆" },
        { id: "it_w_0056", item_type: "word", vi_text: "đắt", vi_text_no_diacritics: "dat", audio_key: "a_dat", dialect: "both", emoji: "💸" },
        { id: "it_w_0057", item_type: "word", vi_text: "rẻ", vi_text_no_diacritics: "re", audio_key: "a_re", dialect: "both", emoji: "🏷️" },
        // Unit 3: Market Life
        // Lesson 009: Colors & Descriptions
        { id: "it_w_0060", item_type: "word", vi_text: "màu", vi_text_no_diacritics: "mau", audio_key: "a_mau", dialect: "both", emoji: "🎨" },
        { id: "it_w_0061", item_type: "word", vi_text: "đỏ", vi_text_no_diacritics: "do", audio_key: "a_do", dialect: "both", emoji: "🔴" },
        { id: "it_w_0062", item_type: "word", vi_text: "xanh", vi_text_no_diacritics: "xanh", audio_key: "a_xanh", dialect: "both", emoji: "🟢" },
        { id: "it_w_0063", item_type: "word", vi_text: "trắng", vi_text_no_diacritics: "trang", audio_key: "a_trang", dialect: "both", emoji: "⚪" },
        { id: "it_w_0064", item_type: "word", vi_text: "đen", vi_text_no_diacritics: "den", audio_key: "a_den", dialect: "both", emoji: "⚫" },
        { id: "it_w_0065", item_type: "word", vi_text: "vàng", vi_text_no_diacritics: "vang_color", audio_key: "a_vang_color", dialect: "both", emoji: "🟡" },
        { id: "it_s_0224", item_type: "sentence", vi_text: "Tôi thích màu đỏ.", vi_text_no_diacritics: "Toi thich mau do.", audio_key: "a_toi_thich_mau_do", dialect: "both" },
        { id: "it_s_0225", item_type: "sentence", vi_text: "Cái áo màu xanh.", vi_text_no_diacritics: "Cai ao mau xanh.", audio_key: "a_cai_ao_mau_xanh", dialect: "both" },
        { id: "it_w_0066", item_type: "word", vi_text: "to", vi_text_no_diacritics: "to", audio_key: "a_to", dialect: "both", emoji: "📏" },
        { id: "it_w_0067", item_type: "word", vi_text: "nhỏ", vi_text_no_diacritics: "nho", audio_key: "a_nho", dialect: "both", emoji: "🔹" },
        { id: "it_w_0068", item_type: "word", vi_text: "đẹp", vi_text_no_diacritics: "dep", audio_key: "a_dep", dialect: "both", emoji: "✨" },
        { id: "it_w_0069", item_type: "word", vi_text: "xấu", vi_text_no_diacritics: "xau", audio_key: "a_xau", dialect: "both", emoji: "👎" },
        { id: "it_s_0226", item_type: "sentence", vi_text: "Cái nhà to quá!", vi_text_no_diacritics: "Cai nha to qua!", audio_key: "a_cai_nha_to_qua", dialect: "both" },
        { id: "it_s_0227", item_type: "sentence", vi_text: "Hoa đẹp quá!", vi_text_no_diacritics: "Hoa dep qua!", audio_key: "a_hoa_dep_qua", dialect: "both" },
        // Lesson 010: Haggling
        { id: "it_w_0070", item_type: "word", vi_text: "mua", vi_text_no_diacritics: "mua", audio_key: "a_mua", dialect: "both", emoji: "🛒" },
        { id: "it_w_0071", item_type: "word", vi_text: "bán", vi_text_no_diacritics: "ban_sell", audio_key: "a_ban_sell", dialect: "both", emoji: "🏪" },
        { id: "it_w_0072", item_type: "word", vi_text: "mắc", vi_text_no_diacritics: "mac", audio_key: "a_mac", dialect: "south", emoji: "💸" },
        { id: "it_w_0073", item_type: "word", vi_text: "bớt", vi_text_no_diacritics: "bot", audio_key: "a_bot", dialect: "both", emoji: "⬇️" },
        { id: "it_w_0074", item_type: "word", vi_text: "giảm", vi_text_no_diacritics: "giam", audio_key: "a_giam", dialect: "both", emoji: "📉" },
        { id: "it_s_0075", item_type: "sentence", vi_text: "Mắc quá! Bớt đi.", vi_text_no_diacritics: "Mac qua! Bot di.", audio_key: "a_mac_qua_bot_di", dialect: "south" },
        { id: "it_s_0076", item_type: "sentence", vi_text: "Tôi muốn mua cái này.", vi_text_no_diacritics: "Toi muon mua cai nay.", audio_key: "a_toi_muon_mua", dialect: "both" },
        { id: "it_w_0077", item_type: "word", vi_text: "được không", vi_text_no_diacritics: "duoc khong", audio_key: "a_duoc_khong", dialect: "both", emoji: "❓" },
        // Lesson 011: Fruits & Vegetables
        { id: "it_w_0080", item_type: "word", vi_text: "trái cây", vi_text_no_diacritics: "trai cay", audio_key: "a_trai_cay", dialect: "both", emoji: "🍎" },
        { id: "it_w_0081", item_type: "word", vi_text: "cam", vi_text_no_diacritics: "cam", audio_key: "a_cam_fruit", dialect: "both", emoji: "🍊" },
        { id: "it_w_0082", item_type: "word", vi_text: "xoài", vi_text_no_diacritics: "xoai", audio_key: "a_xoai", dialect: "both", emoji: "🥭" },
        { id: "it_w_0083", item_type: "word", vi_text: "dừa", vi_text_no_diacritics: "dua_coconut", audio_key: "a_dua_coconut", dialect: "both", emoji: "🥥" },
        { id: "it_w_0084", item_type: "word", vi_text: "dưa hấu", vi_text_no_diacritics: "dua hau", audio_key: "a_dua_hau", dialect: "both", emoji: "🍉" },
        { id: "it_s_0228", item_type: "sentence", vi_text: "Tôi muốn mua cam.", vi_text_no_diacritics: "Toi muon mua cam.", audio_key: "a_toi_muon_mua_cam", dialect: "both" },
        { id: "it_s_0229", item_type: "sentence", vi_text: "Xoài rất ngon.", vi_text_no_diacritics: "Xoai rat ngon.", audio_key: "a_xoai_rat_ngon", dialect: "both" },
        { id: "it_w_0085", item_type: "word", vi_text: "rau", vi_text_no_diacritics: "rau", audio_key: "a_rau", dialect: "both", emoji: "🥬" },
        { id: "it_w_0086", item_type: "word", vi_text: "cà chua", vi_text_no_diacritics: "ca chua", audio_key: "a_ca_chua", dialect: "both", emoji: "🍅" },
        { id: "it_w_0087", item_type: "word", vi_text: "khoai", vi_text_no_diacritics: "khoai", audio_key: "a_khoai", dialect: "both", emoji: "🥔" },
        { id: "it_s_0230", item_type: "sentence", vi_text: "Tôi ăn rau mỗi ngày.", vi_text_no_diacritics: "Toi an rau moi ngay.", audio_key: "a_toi_an_rau_moi_ngay", dialect: "both" },
        { id: "it_s_0231", item_type: "sentence", vi_text: "Cà chua màu đỏ.", vi_text_no_diacritics: "Ca chua mau do.", audio_key: "a_ca_chua_mau_do", dialect: "both" },
        // Lesson 012: Big Numbers
        { id: "it_w_0090", item_type: "word", vi_text: "trăm", vi_text_no_diacritics: "tram", audio_key: "a_tram", dialect: "both", emoji: "💯" },
        { id: "it_w_0091", item_type: "word", vi_text: "nghìn", vi_text_no_diacritics: "nghin", audio_key: "a_nghin", dialect: "north", emoji: "🔢" },
        { id: "it_w_0092", item_type: "word", vi_text: "ngàn", vi_text_no_diacritics: "ngan", audio_key: "a_ngan", dialect: "south", emoji: "🔢" },
        { id: "it_w_0093", item_type: "word", vi_text: "triệu", vi_text_no_diacritics: "trieu", audio_key: "a_trieu", dialect: "both", emoji: "💎" },
        { id: "it_w_0094", item_type: "word", vi_text: "hóa đơn", vi_text_no_diacritics: "hoa don", audio_key: "a_hoa_don", dialect: "both", emoji: "🧾" },
        { id: "it_s_0095", item_type: "sentence", vi_text: "Tính tiền, làm ơn.", vi_text_no_diacritics: "Tinh tien, lam on.", audio_key: "a_tinh_tien", dialect: "both" },
        // Unit 4: Getting Around
        // Lesson 013: Where To?
        { id: "it_w_0100", item_type: "word", vi_text: "đi", vi_text_no_diacritics: "di", audio_key: "a_di", dialect: "both", emoji: "🚶" },
        { id: "it_w_0101", item_type: "word", vi_text: "đường", vi_text_no_diacritics: "duong", audio_key: "a_duong", dialect: "both", emoji: "🛤️" },
        { id: "it_w_0102", item_type: "word", vi_text: "bên trái", vi_text_no_diacritics: "ben trai", audio_key: "a_ben_trai", dialect: "both", emoji: "⬅️" },
        { id: "it_w_0103", item_type: "word", vi_text: "bên phải", vi_text_no_diacritics: "ben phai", audio_key: "a_ben_phai", dialect: "both", emoji: "➡️" },
        { id: "it_w_0104", item_type: "word", vi_text: "thẳng", vi_text_no_diacritics: "thang", audio_key: "a_thang", dialect: "both", emoji: "⬆️" },
        { id: "it_w_0105", item_type: "word", vi_text: "gần", vi_text_no_diacritics: "gan", audio_key: "a_gan", dialect: "both", emoji: "📍" },
        { id: "it_w_0106", item_type: "word", vi_text: "xa", vi_text_no_diacritics: "xa", audio_key: "a_xa", dialect: "both", emoji: "🌍" },
        { id: "it_s_0242", item_type: "sentence", vi_text: "Nhà tôi gần đây.", vi_text_no_diacritics: "Nha toi gan day.", audio_key: "a_nha_toi_gan_day", dialect: "both" },
        { id: "it_s_0243", item_type: "sentence", vi_text: "Có xa không?", vi_text_no_diacritics: "Co xa khong?", audio_key: "a_co_xa_khong", dialect: "both" },
        { id: "it_s_0107", item_type: "sentence", vi_text: "Đi thẳng rồi quẹo trái.", vi_text_no_diacritics: "Di thang roi queo trai.", audio_key: "a_di_thang_queo", dialect: "south" },
        // Lesson 014: Taxi & Grab
        { id: "it_w_0110", item_type: "word", vi_text: "xe", vi_text_no_diacritics: "xe", audio_key: "a_xe", dialect: "both", emoji: "🏍️" },
        { id: "it_w_0111", item_type: "word", vi_text: "xe ôm", vi_text_no_diacritics: "xe om", audio_key: "a_xe_om", dialect: "both", emoji: "🏍️" },
        { id: "it_w_0112", item_type: "word", vi_text: "dừng lại", vi_text_no_diacritics: "dung lai", audio_key: "a_dung_lai", dialect: "both", emoji: "🛑" },
        { id: "it_w_0113", item_type: "word", vi_text: "ở đây", vi_text_no_diacritics: "o day", audio_key: "a_o_day", dialect: "both", emoji: "📍" },
        { id: "it_w_0114", item_type: "word", vi_text: "đến", vi_text_no_diacritics: "den_arrive", audio_key: "a_den_arrive", dialect: "both", emoji: "📍" },
        { id: "it_s_0115", item_type: "sentence", vi_text: "Cho tôi đến khách sạn.", vi_text_no_diacritics: "Cho toi den khach san.", audio_key: "a_cho_toi_den_ks", dialect: "both" },
        { id: "it_s_0116", item_type: "sentence", vi_text: "Dừng ở đây, làm ơn.", vi_text_no_diacritics: "Dung o day, lam on.", audio_key: "a_dung_o_day", dialect: "both" },
        // Lesson 015: At the Hotel
        { id: "it_w_0120", item_type: "word", vi_text: "khách sạn", vi_text_no_diacritics: "khach san", audio_key: "a_khach_san", dialect: "both", emoji: "🏨" },
        { id: "it_w_0121", item_type: "word", vi_text: "phòng", vi_text_no_diacritics: "phong", audio_key: "a_phong", dialect: "both", emoji: "🚪" },
        { id: "it_w_0122", item_type: "word", vi_text: "chìa khóa", vi_text_no_diacritics: "chia khoa", audio_key: "a_chia_khoa", dialect: "both", emoji: "🔑" },
        { id: "it_w_0123", item_type: "word", vi_text: "giường", vi_text_no_diacritics: "giuong", audio_key: "a_giuong", dialect: "both", emoji: "🛏️" },
        { id: "it_w_0124", item_type: "word", vi_text: "nhà vệ sinh", vi_text_no_diacritics: "nha ve sinh", audio_key: "a_nha_ve_sinh", dialect: "both", emoji: "🚽" },
        { id: "it_s_0125", item_type: "sentence", vi_text: "Phòng có wifi không?", vi_text_no_diacritics: "Phong co wifi khong?", audio_key: "a_phong_co_wifi", dialect: "both" },
        // Lesson 016: Asking for Help
        { id: "it_w_0130", item_type: "word", vi_text: "giúp", vi_text_no_diacritics: "giup", audio_key: "a_giup", dialect: "both", emoji: "🆘" },
        { id: "it_w_0131", item_type: "word", vi_text: "tìm", vi_text_no_diacritics: "tim", audio_key: "a_tim", dialect: "both", emoji: "🔍" },
        { id: "it_w_0132", item_type: "word", vi_text: "bị lạc", vi_text_no_diacritics: "bi lac", audio_key: "a_bi_lac", dialect: "both", emoji: "😰" },
        { id: "it_w_0133", item_type: "word", vi_text: "cần", vi_text_no_diacritics: "can", audio_key: "a_can", dialect: "both", emoji: "❗" },
        { id: "it_w_0134", item_type: "word", vi_text: "gọi", vi_text_no_diacritics: "goi", audio_key: "a_goi", dialect: "both", emoji: "📞" },
        { id: "it_s_0135", item_type: "sentence", vi_text: "Giúp tôi với!", vi_text_no_diacritics: "Giup toi voi!", audio_key: "a_giup_toi_voi", dialect: "both" },
        { id: "it_s_0136", item_type: "sentence", vi_text: "Tôi bị lạc.", vi_text_no_diacritics: "Toi bi lac.", audio_key: "a_toi_bi_lac", dialect: "both" },
        // Unit 5: Daily Life
        // Lesson 017: Time & Schedule
        { id: "it_w_0140", item_type: "word", vi_text: "giờ", vi_text_no_diacritics: "gio", audio_key: "a_gio", dialect: "both", emoji: "🕐" },
        { id: "it_w_0141", item_type: "word", vi_text: "phút", vi_text_no_diacritics: "phut", audio_key: "a_phut", dialect: "both", emoji: "⏱️" },
        { id: "it_w_0142", item_type: "word", vi_text: "sáng", vi_text_no_diacritics: "sang", audio_key: "a_sang", dialect: "both", emoji: "🌅" },
        { id: "it_w_0143", item_type: "word", vi_text: "chiều", vi_text_no_diacritics: "chieu", audio_key: "a_chieu", dialect: "both", emoji: "🌇" },
        { id: "it_w_0144", item_type: "word", vi_text: "tối", vi_text_no_diacritics: "toi_evening", audio_key: "a_toi_evening", dialect: "both", emoji: "🌙" },
        { id: "it_s_0232", item_type: "sentence", vi_text: "Sáng hay chiều?", vi_text_no_diacritics: "Sang hay chieu?", audio_key: "a_sang_hay_chieu", dialect: "both" },
        { id: "it_s_0233", item_type: "sentence", vi_text: "Mấy giờ rồi?", vi_text_no_diacritics: "May gio roi?", audio_key: "a_may_gio_roi", dialect: "both" },
        { id: "it_w_0145", item_type: "word", vi_text: "hôm nay", vi_text_no_diacritics: "hom nay", audio_key: "a_hom_nay", dialect: "both", emoji: "📅" },
        { id: "it_w_0146", item_type: "word", vi_text: "ngày mai", vi_text_no_diacritics: "ngay mai", audio_key: "a_ngay_mai", dialect: "both", emoji: "📆" },
        { id: "it_w_0147", item_type: "word", vi_text: "hôm qua", vi_text_no_diacritics: "hom qua", audio_key: "a_hom_qua", dialect: "both", emoji: "⏪" },
        { id: "it_s_0148", item_type: "sentence", vi_text: "Bây giờ là mấy giờ?", vi_text_no_diacritics: "Bay gio la may gio?", audio_key: "a_may_gio", dialect: "both" },
        // Lesson 018: Weather & Seasons
        { id: "it_w_0150", item_type: "word", vi_text: "trời", vi_text_no_diacritics: "troi", audio_key: "a_troi", dialect: "both", emoji: "🌤️" },
        { id: "it_w_0151", item_type: "word", vi_text: "mưa", vi_text_no_diacritics: "mua_rain", audio_key: "a_mua_rain", dialect: "both", emoji: "🌧️" },
        { id: "it_w_0152", item_type: "word", vi_text: "nắng", vi_text_no_diacritics: "nang", audio_key: "a_nang", dialect: "both", emoji: "☀️" },
        { id: "it_w_0153", item_type: "word", vi_text: "gió", vi_text_no_diacritics: "gio_wind", audio_key: "a_gio_wind", dialect: "both", emoji: "💨" },
        { id: "it_w_0154", item_type: "word", vi_text: "lạnh", vi_text_no_diacritics: "lanh", audio_key: "a_lanh", dialect: "both", emoji: "🥶" },
        { id: "it_w_0155", item_type: "word", vi_text: "mát", vi_text_no_diacritics: "mat", audio_key: "a_mat", dialect: "both", emoji: "🌬️" },
        { id: "it_s_0156", item_type: "sentence", vi_text: "Hôm nay trời đẹp quá!", vi_text_no_diacritics: "Hom nay troi dep qua!", audio_key: "a_troi_dep_qua", dialect: "both" },
        // Lesson 019: Family
        { id: "it_w_0160", item_type: "word", vi_text: "bố", vi_text_no_diacritics: "bo", audio_key: "a_bo", dialect: "north", emoji: "👨" },
        { id: "it_w_0161", item_type: "word", vi_text: "ba", vi_text_no_diacritics: "ba_dad", audio_key: "a_ba_dad", dialect: "south", emoji: "3️⃣" },
        { id: "it_w_0162", item_type: "word", vi_text: "mẹ", vi_text_no_diacritics: "me", audio_key: "a_me", dialect: "north", emoji: "👩" },
        { id: "it_w_0163", item_type: "word", vi_text: "má", vi_text_no_diacritics: "ma", audio_key: "a_ma", dialect: "south", emoji: "👩" },
        { id: "it_w_0164", item_type: "word", vi_text: "anh", vi_text_no_diacritics: "anh", audio_key: "a_anh", dialect: "both", emoji: "👦" },
        { id: "it_w_0165", item_type: "word", vi_text: "chị", vi_text_no_diacritics: "chi", audio_key: "a_chi", dialect: "both", emoji: "👧" },
        { id: "it_s_0234", item_type: "sentence", vi_text: "Bố mẹ tôi khỏe.", vi_text_no_diacritics: "Bo me toi khoe.", audio_key: "a_bo_me_toi_khoe", dialect: "both" },
        { id: "it_s_0235", item_type: "sentence", vi_text: "Anh chị khỏe không?", vi_text_no_diacritics: "Anh chi khoe khong?", audio_key: "a_anh_chi_khoe_khong", dialect: "both" },
        { id: "it_w_0166", item_type: "word", vi_text: "em", vi_text_no_diacritics: "em", audio_key: "a_em", dialect: "both", emoji: "🧒" },
        { id: "it_w_0167", item_type: "word", vi_text: "con", vi_text_no_diacritics: "con", audio_key: "a_con", dialect: "both", emoji: "👶" },
        { id: "it_w_0168", item_type: "word", vi_text: "vợ", vi_text_no_diacritics: "vo", audio_key: "a_vo", dialect: "both", emoji: "💑" },
        { id: "it_w_0169", item_type: "word", vi_text: "chồng", vi_text_no_diacritics: "chong", audio_key: "a_chong", dialect: "both", emoji: "💏" },
        { id: "it_s_0236", item_type: "sentence", vi_text: "Em tôi còn nhỏ.", vi_text_no_diacritics: "Em toi con nho.", audio_key: "a_em_toi_con_nho", dialect: "both" },
        { id: "it_s_0237", item_type: "sentence", vi_text: "Vợ chồng tôi rất vui.", vi_text_no_diacritics: "Vo chong toi rat vui.", audio_key: "a_vo_chong_toi_rat_vui", dialect: "both" },
        // Lesson 020: Around the House
        { id: "it_w_0170", item_type: "word", vi_text: "nhà", vi_text_no_diacritics: "nha", audio_key: "a_nha", dialect: "both", emoji: "🏠" },
        { id: "it_w_0171", item_type: "word", vi_text: "nhà bếp", vi_text_no_diacritics: "nha bep", audio_key: "a_nha_bep", dialect: "both", emoji: "🍳" },
        { id: "it_w_0172", item_type: "word", vi_text: "phòng ngủ", vi_text_no_diacritics: "phong ngu", audio_key: "a_phong_ngu", dialect: "both", emoji: "🛏️" },
        { id: "it_w_0173", item_type: "word", vi_text: "phòng khách", vi_text_no_diacritics: "phong khach", audio_key: "a_phong_khach", dialect: "both", emoji: "🛋️" },
        { id: "it_s_0238", item_type: "sentence", vi_text: "Nhà bếp rất sạch.", vi_text_no_diacritics: "Nha bep rat sach.", audio_key: "a_nha_bep_rat_sach", dialect: "both" },
        { id: "it_s_0239", item_type: "sentence", vi_text: "Phòng khách rất to.", vi_text_no_diacritics: "Phong khach rat to.", audio_key: "a_phong_khach_rat_to", dialect: "both" },
        { id: "it_w_0174", item_type: "word", vi_text: "cửa", vi_text_no_diacritics: "cua", audio_key: "a_cua", dialect: "both", emoji: "🚪" },
        { id: "it_w_0175", item_type: "word", vi_text: "ghế", vi_text_no_diacritics: "ghe", audio_key: "a_ghe", dialect: "both", emoji: "💺" },
        { id: "it_w_0176", item_type: "word", vi_text: "bàn", vi_text_no_diacritics: "ban_table", audio_key: "a_ban_table", dialect: "both", emoji: "🪑" },
        { id: "it_s_0240", item_type: "sentence", vi_text: "Ngồi trên ghế đi.", vi_text_no_diacritics: "Ngoi tren ghe di.", audio_key: "a_ngoi_tren_ghe_di", dialect: "both" },
        { id: "it_s_0241", item_type: "sentence", vi_text: "Đặt trên bàn.", vi_text_no_diacritics: "Dat tren ban.", audio_key: "a_dat_tren_ban", dialect: "both" },
        // Unit 6: Making Friends
        // Lesson 021: Hobbies & Interests
        { id: "it_w_0180", item_type: "word", vi_text: "thích", vi_text_no_diacritics: "thich", audio_key: "a_thich", dialect: "both", emoji: "❤️" },
        { id: "it_w_0181", item_type: "word", vi_text: "đi chơi", vi_text_no_diacritics: "di choi", audio_key: "a_di_choi", dialect: "both", emoji: "🎉" },
        { id: "it_w_0182", item_type: "word", vi_text: "xem phim", vi_text_no_diacritics: "xem phim", audio_key: "a_xem_phim", dialect: "both", emoji: "🎬" },
        { id: "it_w_0183", item_type: "word", vi_text: "nghe nhạc", vi_text_no_diacritics: "nghe nhac", audio_key: "a_nghe_nhac", dialect: "both", emoji: "🎵" },
        { id: "it_w_0184", item_type: "word", vi_text: "nấu ăn", vi_text_no_diacritics: "nau an", audio_key: "a_nau_an", dialect: "both", emoji: "🍳" },
        { id: "it_w_0185", item_type: "word", vi_text: "đọc sách", vi_text_no_diacritics: "doc sach", audio_key: "a_doc_sach", dialect: "both", emoji: "📖" },
        { id: "it_s_0186", item_type: "sentence", vi_text: "Bạn thích làm gì?", vi_text_no_diacritics: "Ban thich lam gi?", audio_key: "a_ban_thich_lam_gi", dialect: "both" },
        // Lesson 022: Feelings & Opinions
        { id: "it_w_0190", item_type: "word", vi_text: "vui", vi_text_no_diacritics: "vui", audio_key: "a_vui", dialect: "both", emoji: "😊" },
        { id: "it_w_0191", item_type: "word", vi_text: "buồn", vi_text_no_diacritics: "buon", audio_key: "a_buon", dialect: "both", emoji: "😢" },
        { id: "it_w_0192", item_type: "word", vi_text: "mệt", vi_text_no_diacritics: "met", audio_key: "a_met", dialect: "both", emoji: "😩" },
        { id: "it_w_0193", item_type: "word", vi_text: "đói", vi_text_no_diacritics: "doi", audio_key: "a_doi", dialect: "both", emoji: "🤤" },
        { id: "it_w_0194", item_type: "word", vi_text: "khát", vi_text_no_diacritics: "khat", audio_key: "a_khat", dialect: "both", emoji: "🥤" },
        { id: "it_w_0195", item_type: "word", vi_text: "sợ", vi_text_no_diacritics: "so", audio_key: "a_so", dialect: "both", emoji: "😨" },
        { id: "it_s_0196", item_type: "sentence", vi_text: "Tôi mệt quá.", vi_text_no_diacritics: "Toi met qua.", audio_key: "a_toi_met_qua", dialect: "both" },
        // Lesson 023: Invitations
        { id: "it_w_0200", item_type: "word", vi_text: "cuối tuần", vi_text_no_diacritics: "cuoi tuan", audio_key: "a_cuoi_tuan", dialect: "both", emoji: "🗓️" },
        { id: "it_w_0201", item_type: "word", vi_text: "rảnh", vi_text_no_diacritics: "ranh", audio_key: "a_ranh", dialect: "both", emoji: "🆓" },
        { id: "it_w_0202", item_type: "word", vi_text: "bận", vi_text_no_diacritics: "ban_busy", audio_key: "a_ban_busy", dialect: "both", emoji: "📋" },
        { id: "it_w_0203", item_type: "word", vi_text: "cùng", vi_text_no_diacritics: "cung", audio_key: "a_cung", dialect: "both", emoji: "🤝" },
        { id: "it_w_0204", item_type: "word", vi_text: "hẹn", vi_text_no_diacritics: "hen", audio_key: "a_hen", dialect: "both", emoji: "📅" },
        { id: "it_s_0205", item_type: "sentence", vi_text: "Cuối tuần bạn rảnh không?", vi_text_no_diacritics: "Cuoi tuan ban ranh khong?", audio_key: "a_cuoi_tuan_ranh", dialect: "both" },
        { id: "it_s_0206", item_type: "sentence", vi_text: "Đi chơi cùng tôi không?", vi_text_no_diacritics: "Di choi cung toi khong?", audio_key: "a_di_choi_cung_toi", dialect: "both" },
        // Lesson 024: At the Party
        { id: "it_w_0210", item_type: "word", vi_text: "chúc mừng", vi_text_no_diacritics: "chuc mung", audio_key: "a_chuc_mung", dialect: "both", emoji: "🎊" },
        { id: "it_w_0211", item_type: "word", vi_text: "sinh nhật", vi_text_no_diacritics: "sinh nhat", audio_key: "a_sinh_nhat", dialect: "both", emoji: "🎂" },
        { id: "it_w_0212", item_type: "word", vi_text: "quà", vi_text_no_diacritics: "qua_gift", audio_key: "a_qua_gift", dialect: "both", emoji: "🎁" },
        { id: "it_w_0213", item_type: "word", vi_text: "tiệc", vi_text_no_diacritics: "tiec", audio_key: "a_tiec", dialect: "both", emoji: "🎉" },
        { id: "it_s_0214", item_type: "sentence", vi_text: "Chúc mừng sinh nhật!", vi_text_no_diacritics: "Chuc mung sinh nhat!", audio_key: "a_chuc_mung_sn", dialect: "both" },
        { id: "it_s_0215", item_type: "sentence", vi_text: "Vui quá!", vi_text_no_diacritics: "Vui qua!", audio_key: "a_vui_qua", dialect: "both" },
        { id: "it_w_0216", item_type: "word", vi_text: "chụp hình", vi_text_no_diacritics: "chup hinh", audio_key: "a_chup_hinh", dialect: "both", emoji: "📸" }
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
        { item_id: "it_s_0017", lang: "en", text: "Speak more slowly." },
        { item_id: "it_w_0020", lang: "en", text: "one" },
        { item_id: "it_w_0021", lang: "en", text: "two" },
        { item_id: "it_w_0022", lang: "en", text: "three" },
        { item_id: "it_w_0023", lang: "en", text: "four" },
        { item_id: "it_w_0024", lang: "en", text: "five" },
        { item_id: "it_s_0220", lang: "en", text: "One, two, three!" },
        { item_id: "it_s_0221", lang: "en", text: "I have five friends." },
        { item_id: "it_w_0025", lang: "en", text: "six" },
        { item_id: "it_w_0026", lang: "en", text: "seven" },
        { item_id: "it_w_0027", lang: "en", text: "eight" },
        { item_id: "it_w_0028", lang: "en", text: "nine" },
        { item_id: "it_w_0029", lang: "en", text: "ten" },
        { item_id: "it_s_0222", lang: "en", text: "Eight or nine?" },
        { item_id: "it_s_0223", lang: "en", text: "From six to ten." },
        { item_id: "it_w_0030", lang: "en", text: "coffee" },
        { item_id: "it_w_0031", lang: "en", text: "tea" },
        { item_id: "it_w_0032", lang: "en", text: "water" },
        { item_id: "it_s_0033", lang: "en", text: "Give me coffee." },
        { item_id: "it_s_0034", lang: "en", text: "I want a tea." },
        { item_id: "it_w_0035", lang: "en", text: "to want" },
        { item_id: "it_w_0036", lang: "en", text: "give (request form: “cho tôi…”)" },
        { item_id: "it_s_0037", lang: "en", text: "Thank you!" },
        // Unit 2 translations
        { item_id: "it_w_0040", lang: "en", text: "iced milk coffee" },
        { item_id: "it_w_0041", lang: "en", text: "milk" },
        { item_id: "it_w_0042", lang: "en", text: "ice" },
        { item_id: "it_w_0043", lang: "en", text: "hot" },
        { item_id: "it_s_0044", lang: "en", text: "I want iced milk coffee." },
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
        { item_id: "it_s_0224", lang: "en", text: "I like the color red." },
        { item_id: "it_s_0225", lang: "en", text: "The blue shirt." },
        { item_id: "it_w_0066", lang: "en", text: "big / large" },
        { item_id: "it_w_0067", lang: "en", text: "small / little" },
        { item_id: "it_w_0068", lang: "en", text: "beautiful / pretty" },
        { item_id: "it_w_0069", lang: "en", text: "ugly / bad" },
        { item_id: "it_s_0226", lang: "en", text: "The house is so big!" },
        { item_id: "it_s_0227", lang: "en", text: "The flowers are so beautiful!" },
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
        { item_id: "it_s_0228", lang: "en", text: "I want to buy oranges." },
        { item_id: "it_s_0229", lang: "en", text: "Mango is very delicious." },
        { item_id: "it_w_0085", lang: "en", text: "vegetable" },
        { item_id: "it_w_0086", lang: "en", text: "tomato" },
        { item_id: "it_w_0087", lang: "en", text: "potato / sweet potato" },
        { item_id: "it_s_0230", lang: "en", text: "I eat vegetables every day." },
        { item_id: "it_s_0231", lang: "en", text: "Tomatoes are red." },
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
        { item_id: "it_s_0242", lang: "en", text: "My house is nearby." },
        { item_id: "it_s_0243", lang: "en", text: "Is it far?" },
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
        { item_id: "it_s_0232", lang: "en", text: "Morning or afternoon?" },
        { item_id: "it_s_0233", lang: "en", text: "What time is it?" },
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
        { item_id: "it_s_0234", lang: "en", text: "My parents are well." },
        { item_id: "it_s_0235", lang: "en", text: "Are you well? (to older sibling)" },
        { item_id: "it_w_0166", lang: "en", text: "younger sibling" },
        { item_id: "it_w_0167", lang: "en", text: "child" },
        { item_id: "it_w_0168", lang: "en", text: "wife" },
        { item_id: "it_w_0169", lang: "en", text: "husband" },
        { item_id: "it_s_0236", lang: "en", text: "My younger sibling is still small." },
        { item_id: "it_s_0237", lang: "en", text: "My wife/husband and I are very happy." },
        { item_id: "it_w_0170", lang: "en", text: "house / home" },
        { item_id: "it_w_0171", lang: "en", text: "kitchen" },
        { item_id: "it_w_0172", lang: "en", text: "bedroom" },
        { item_id: "it_w_0173", lang: "en", text: "living room" },
        { item_id: "it_s_0238", lang: "en", text: "The kitchen is very clean." },
        { item_id: "it_s_0239", lang: "en", text: "The living room is very big." },
        { item_id: "it_w_0174", lang: "en", text: "door" },
        { item_id: "it_w_0175", lang: "en", text: "chair" },
        { item_id: "it_w_0176", lang: "en", text: "table / desk" },
        { item_id: "it_s_0240", lang: "en", text: "Sit on the chair." },
        { item_id: "it_s_0241", lang: "en", text: "Put it on the table." },
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
        // Exercises are now auto-generated at runtime by exerciseGenerator.js
    ],
    lesson_blueprints: [
        { lesson_id: "lesson_001", focus: ["greetings", "basic_yes_no"], introduced_items: ["it_w_0001", "it_w_0002", "it_w_0003", "it_w_0004", "it_w_0007", "it_w_0008", "it_w_0009", "it_s_0037"] },
        { lesson_id: "lesson_002", focus: ["introductions", "question_form"], introduced_items: ["it_p_0010", "it_p_0011", "it_s_0012", "it_s_0013"] },
        { lesson_id: "lesson_003", focus: ["polite_requests", "repair_phrases"], introduced_items: ["it_w_0005", "it_w_0006", "it_w_0014", "it_w_0015", "it_s_0016", "it_s_0017"] },
        { lesson_id: "lesson_004", focus: ["numbers_1_5"], introduced_items: ["it_w_0020", "it_w_0021", "it_w_0022", "it_w_0023", "it_w_0024", "it_s_0220", "it_s_0221"] },
        { lesson_id: "lesson_025", focus: ["numbers_6_10"], introduced_items: ["it_w_0025", "it_w_0026", "it_w_0027", "it_w_0028", "it_w_0029", "it_s_0222", "it_s_0223"] },
        { lesson_id: "lesson_005", focus: ["ordering", "diacritics_awareness"], introduced_items: ["it_w_0030", "it_w_0031", "it_w_0032", "it_w_0035", "it_w_0036", "it_s_0033", "it_s_0034"] },
        { lesson_id: "lesson_006", focus: ["cafe_ordering", "drinks"], introduced_items: ["it_w_0040", "it_w_0041", "it_w_0042", "it_w_0043", "it_s_0044"] },
        { lesson_id: "lesson_007", focus: ["food_vocabulary"], introduced_items: ["it_w_0045", "it_w_0046", "it_w_0047", "it_w_0048", "it_w_0050", "it_w_0051", "it_s_0049"] },
        { lesson_id: "lesson_008", focus: ["prices", "haggling"], introduced_items: ["it_w_0052", "it_w_0053", "it_w_0055", "it_w_0056", "it_w_0057", "it_s_0054"] },
        // Unit 3
        { lesson_id: "lesson_009", focus: ["colors"], introduced_items: ["it_w_0060", "it_w_0061", "it_w_0062", "it_w_0063", "it_w_0064", "it_w_0065", "it_s_0224", "it_s_0225"] },
        { lesson_id: "lesson_026", focus: ["descriptions", "adjectives"], introduced_items: ["it_w_0066", "it_w_0067", "it_w_0068", "it_w_0069", "it_s_0226", "it_s_0227"] },
        { lesson_id: "lesson_010", focus: ["haggling", "shopping"], introduced_items: ["it_w_0070", "it_w_0071", "it_w_0072", "it_w_0073", "it_w_0074", "it_s_0075", "it_s_0076", "it_w_0077"] },
        { lesson_id: "lesson_011", focus: ["fruits"], introduced_items: ["it_w_0080", "it_w_0081", "it_w_0082", "it_w_0083", "it_w_0084", "it_s_0228", "it_s_0229"] },
        { lesson_id: "lesson_027", focus: ["vegetables"], introduced_items: ["it_w_0085", "it_w_0086", "it_w_0087", "it_s_0230", "it_s_0231"] },
        { lesson_id: "lesson_012", focus: ["big_numbers", "bills"], introduced_items: ["it_w_0090", "it_w_0091", "it_w_0092", "it_w_0093", "it_w_0094", "it_s_0095"] },
        // Unit 4
        { lesson_id: "lesson_013", focus: ["directions"], introduced_items: ["it_w_0100", "it_w_0101", "it_w_0102", "it_w_0103", "it_w_0104", "it_s_0107"] },
        { lesson_id: "lesson_030", focus: ["distance"], introduced_items: ["it_w_0105", "it_w_0106", "it_s_0242", "it_s_0243"] },
        { lesson_id: "lesson_014", focus: ["transport", "taxi"], introduced_items: ["it_w_0110", "it_w_0111", "it_w_0112", "it_w_0113", "it_w_0114", "it_s_0115", "it_s_0116"] },
        { lesson_id: "lesson_015", focus: ["hotel", "accommodation"], introduced_items: ["it_w_0120", "it_w_0121", "it_w_0122", "it_w_0123", "it_w_0124", "it_s_0125"] },
        { lesson_id: "lesson_016", focus: ["emergency", "help"], introduced_items: ["it_w_0130", "it_w_0131", "it_w_0132", "it_w_0133", "it_w_0134", "it_s_0135", "it_s_0136"] },
        // Unit 5
        { lesson_id: "lesson_017", focus: ["time", "time_of_day"], introduced_items: ["it_w_0140", "it_w_0141", "it_w_0142", "it_w_0143", "it_w_0144", "it_s_0232", "it_s_0233"] },
        { lesson_id: "lesson_028", focus: ["days", "schedule"], introduced_items: ["it_w_0145", "it_w_0146", "it_w_0147", "it_s_0148"] },
        { lesson_id: "lesson_018", focus: ["weather"], introduced_items: ["it_w_0150", "it_w_0151", "it_w_0152", "it_w_0153", "it_w_0154", "it_w_0155", "it_s_0156"] },
        { lesson_id: "lesson_019", focus: ["family", "parents"], introduced_items: ["it_w_0160", "it_w_0161", "it_w_0162", "it_w_0163", "it_w_0164", "it_w_0165", "it_s_0234", "it_s_0235"] },
        { lesson_id: "lesson_029", focus: ["family", "extended"], introduced_items: ["it_w_0166", "it_w_0167", "it_w_0168", "it_w_0169", "it_s_0236", "it_s_0237"] },
        { lesson_id: "lesson_020", focus: ["house", "rooms"], introduced_items: ["it_w_0170", "it_w_0171", "it_w_0172", "it_w_0173", "it_s_0238", "it_s_0239"] },
        { lesson_id: "lesson_031", focus: ["furniture"], introduced_items: ["it_w_0174", "it_w_0175", "it_w_0176", "it_s_0240", "it_s_0241"] },
        // Unit 6
        { lesson_id: "lesson_021", focus: ["hobbies"], introduced_items: ["it_w_0180", "it_w_0181", "it_w_0182", "it_w_0183", "it_w_0184", "it_w_0185", "it_s_0186"] },
        { lesson_id: "lesson_022", focus: ["feelings", "emotions"], introduced_items: ["it_w_0190", "it_w_0191", "it_w_0192", "it_w_0193", "it_w_0194", "it_w_0195", "it_s_0196"] },
        { lesson_id: "lesson_023", focus: ["invitations", "plans"], introduced_items: ["it_w_0200", "it_w_0201", "it_w_0202", "it_w_0203", "it_w_0204", "it_s_0205", "it_s_0206"] },
        { lesson_id: "lesson_024", focus: ["celebrations", "party"], introduced_items: ["it_w_0210", "it_w_0211", "it_w_0212", "it_w_0213", "it_s_0214", "it_s_0215", "it_w_0216"] }
    ],

    // ── Scene Locations (neighborhoods) ──
    scene_locations: [
        {
            id: "loc_saigon_street",
            name: "Saigon Street Food District",
            name_vi: "Khu phố ẩm thực Sài Gòn",
            emoji: "🏙️",
            gradient: "linear-gradient(135deg, #1a1208 0%, #3d2a10 50%, #1a1208 100%)",
            description: "Bustling sidewalk cafés, bánh mì carts, and noodle stalls.",
            locked: false,
        },
        {
            id: "loc_hanoi_oldquarter",
            name: "Hanoi Old Quarter",
            name_vi: "Phố cổ Hà Nội",
            emoji: "🏮",
            gradient: "linear-gradient(135deg, #2d0a0a 0%, #4a1a1a 50%, #2d0a0a 100%)",
            description: "Narrow alleys, phở shops, and traditional markets.",
            locked: true,
        },
        {
            id: "loc_beach_town",
            name: "Coastal Beach Town",
            name_vi: "Thị trấn ven biển",
            emoji: "🏖️",
            gradient: "linear-gradient(135deg, #0a2d3d 0%, #1a4a5a 50%, #0a2d3d 100%)",
            description: "Seafood restaurants, boat tours, and seaside bargaining.",
            locked: true,
        },
    ],

    // ── Immersive Scene Lessons ──
    scenes: [
        {
            id: "scene_cafe_001",
            lesson_id: "lesson_006",
            location_id: "loc_saigon_street",
            difficulty: "beginner",
            title: "At the Café",
            title_vi: "Ở quán cà phê",
            scene_type: "narrative",
            setting: {
                background_emoji: "☕",
                background_css: "linear-gradient(135deg, #1a1208 0%, #2d1f0e 100%)"
            },
            characters: [
                { id: "waiter", name: "Anh Minh", role: "Waiter", emoji: "👨‍🍳", personality: "friendly but busy" },
                { id: "friend", name: "Chị Lan", role: "Your friend", emoji: "👩", personality: "helpful" },
                { id: "player", name: "You", role: "You", emoji: "🧑‍🎓" }
            ],
            vocab_items: ["it_w_0030", "it_w_0031", "it_w_0040", "it_w_0041", "it_w_0042", "it_w_0046"],
            grammar_card: {
                title: "Ordering Pattern",
                structure: "Cho tôi + [quantity] + [item]",
                example: "Cho tôi một cà phê sữa đá.",
                translation: "Give me one iced milk coffee."
            },
            phases: [
                {
                    type: "explore",
                    config: {
                        instruction: "You just sat down at a sidewalk café. Tap items on the menu to learn the words.",
                        min_taps: 4,
                        show_grammar_card: true,
                        hotspots: [
                            { id: "hs_caphe", label: "Cà phê đen", translation: "Black coffee", audio_key: "a_ca_phe", item_id: "it_w_0030", emoji: "☕", price: "25.000₫", position: { row: 1, col: 1 } },
                            { id: "hs_caphesuada", label: "Cà phê sữa đá", translation: "Iced milk coffee", audio_key: "a_ca_phe_sua_da", item_id: "it_w_0040", emoji: "🥛", price: "30.000₫", position: { row: 1, col: 2 } },
                            { id: "hs_tra", label: "Trà đá", translation: "Iced tea", audio_key: "a_tra", item_id: "it_w_0031", emoji: "🍵", price: "10.000₫", position: { row: 2, col: 1 } },
                            { id: "hs_nuoc", label: "Nước suối", translation: "Water", audio_key: "a_nuoc", item_id: "it_w_0032", emoji: "💧", price: "8.000₫", position: { row: 2, col: 2 } },
                            { id: "hs_banhmi", label: "Bánh mì", translation: "Bread / Sandwich", audio_key: "a_banh_mi", item_id: "it_w_0046", emoji: "🥖", price: "20.000₫", position: { row: 3, col: 1 } },
                            { id: "hs_sua", label: "Sữa tươi", translation: "Fresh milk", audio_key: "a_sua", item_id: "it_w_0041", emoji: "🥛", price: "15.000₫", position: { row: 3, col: 2 } }
                        ]
                    }
                },
                {
                    type: "observe",
                    config: {
                        instruction: "Watch how your friend Lan orders. Tap any word you don't know.",
                        script: [
                            { speaker: "waiter", text_vi: "Chào chị! Chị dùng gì ạ?", text_en: "Hello! What would you like?", hints: { "dùng": "to have", "gì": "what", "ạ": "(polite)" }, emotion: "friendly" },
                            { speaker: "friend", text_vi: "Cho tôi một cà phê sữa đá.", text_en: "Give me one iced milk coffee.", hints: { "cho": "give", "một": "one" }, emotion: "confident", grammar_highlight: "Cho tôi + [item]" },
                            { speaker: "waiter", text_vi: "Dạ. Còn gì nữa không ạ?", text_en: "Sure. Anything else?", hints: { "còn": "more", "nữa": "else", "không": "no?" }, emotion: "attentive" },
                            { speaker: "friend", text_vi: "Dạ, hết rồi. Cảm ơn anh.", text_en: "That's all. Thank you.", hints: { "hết": "finished", "rồi": "already" }, emotion: "satisfied" }
                        ]
                    }
                },
                {
                    type: "perform",
                    config: {
                        instruction: "Your turn to order!",
                        challenges: [
                            {
                                id: "ch_01",
                                type: "dialogue_choice",
                                scene_beat: "The waiter turns to you. Your friend nudges you under the table.",
                                speaker_prompt: { speaker: "waiter", text_vi: "Còn anh? Dùng gì ạ?", text_en: "And you? What would you like?", emotion: "waiting" },
                                choices: [
                                    { text_vi: "Cho tôi một cà phê đen.", correct: true, response_vi: "Dạ, được ạ!", response_en: "Sure thing!", response_emotion: "pleased" },
                                    { text_vi: "Tôi là cà phê.", correct: false, response_vi: "Anh... là cà phê?", response_en: "You... are coffee?", response_emotion: "confused" },
                                    { text_vi: "Cà phê, cảm ơn.", correct: true, partial: true, tip: "Correct! 'Cho tôi...' is more natural.", response_vi: "Dạ!", response_en: "Sure!", response_emotion: "friendly" }
                                ]
                            },
                            {
                                id: "ch_02",
                                type: "build_sentence",
                                scene_beat: "The waiter asks if you want ice.",
                                speaker_prompt: { speaker: "waiter", text_vi: "Có đá không ạ?", text_en: "With ice?", emotion: "helpful" },
                                answer_tokens: ["Không", "đá"],
                                distractor_tokens: ["sữa", "một"],
                                answer_en: "No ice."
                            },
                            {
                                id: "ch_03",
                                type: "fill_response",
                                scene_beat: "Your friend asks what you ordered.",
                                speaker_prompt: { speaker: "friend", text_vi: "Bạn gọi gì?", text_en: "What did you order?", emotion: "curious" },
                                template_vi: "Tôi gọi ____ đen.",
                                answer: "cà phê",
                                choices: ["cà phê", "trà", "bánh mì", "nước"]
                            },
                            {
                                id: "ch_04",
                                type: "free_speak",
                                scene_beat: "The waiter places a perfect black coffee in front of you. The aroma rises.",
                                speaker_prompt: { speaker: "waiter", text_vi: "Cà phê đen đây ạ.", text_en: "Here's your black coffee.", emotion: "friendly" },
                                target_vi: "Cảm ơn anh!",
                                accept_variations: ["cảm ơn", "cảm ơn anh", "cảm ơn ạ", "cam on", "cam on anh"]
                            }
                        ],
                        wrong_answer_reactions: [
                            { speaker: "friend", text_vi: "Không phải vậy...", text_en: "(whispers) Not like that...", emotion: "nervous" },
                            { speaker: "waiter", text_vi: "Dạ... xin lỗi?", text_en: "Um... sorry?", emotion: "confused" }
                        ],
                        endings: {
                            perfect: { scene_beat: "The waiter smiles. Lan looks impressed. You sip your cà phê đen like a local.", bonus_dong: 5 },
                            good: { scene_beat: "A few stumbles, but you got your coffee! Lan gives you a thumbs up.", bonus_dong: 2 },
                            retry: { scene_beat: "The waiter is patient. Lan helps you out. You'll nail it next time!", bonus_dong: 0 }
                        }
                    }
                }
            ]
        }
    ]
};

// ── Migration: old 6-unit node IDs → new 10-phase node IDs ──
// Used by DongContext to preserve user progress across the curriculum restructure
const NODE_ID_MIGRATION = {
    // Old Unit 1 → Unit 1-2
    "node_001": "p1_L001", "node_mt_001": "p1_Q001",
    "node_002": "p1_L002", "node_mt_002": "p1_Q002",
    "node_003": "p2_L003", "node_mt_003": "p2_Q003",
    "node_004": "p2_L004", "node_mt_004": "p2_Q004",
    "node_005": "p3_L005", "node_mt_005": "p3_Q005",
    "node_t01": "p2_T",
    // Old Unit 2 → Unit 3-4
    "node_006": "p3_L006", "node_mt_006": "p3_Q006",
    "node_007": "p4_L007", "node_mt_007": "p4_Q007",
    "node_s04": "p3_S1", "node_s03": "p1_G2",
    "node_008": "p4_L008", "node_mt_008": "p4_Q008",
    "node_t02": "p4_T",
    // Old Unit 3 → Unit 5-6
    "node_009": "p5_L009", "node_mt_009": "p5_Q009",
    "node_010": "p5_L010", "node_mt_010": "p5_Q010",
    "node_s06": "p6_S1", "node_s05": "p5_S2",
    "node_011": "p6_L011", "node_mt_011": "p6_Q011",
    "node_012": "p6_L012", "node_mt_012": "p6_Q012",
    "node_t03": "p5_T",
    // Old Unit 4 → Unit 7
    "node_013": "p7_L013", "node_mt_013": "p7_Q013",
    "node_014": "p7_L014", "node_mt_014": "p7_Q014",
    "node_s08": "p7_S1", "node_s07": "p7_S2",
    "node_015": "p7_L015", "node_mt_015": "p7_Q015",
    "node_016": "p7_L016", "node_mt_016": "p7_Q016",
    "node_t04": "p7_T",
    // Old Unit 5 → Unit 8
    "node_017": "p8_L017", "node_mt_017": "p8_Q017",
    "node_018": "p8_L018", "node_mt_018": "p8_Q018",
    "node_s10": "p8_S1", "node_s09": "p8_S2",
    "node_019": "p8_L019", "node_mt_019": "p8_Q019",
    "node_020": "p8_L020", "node_mt_020": "p8_Q020",
    "node_t05": "p8_T",
    // Old Unit 6 → Unit 9
    "node_021": "p9_L021", "node_mt_021": "p9_Q021",
    "node_022": "p9_L022", "node_mt_022": "p9_Q022",
    "node_s12": "p9_S1", "node_s11": "p9_S3",
    "node_023": "p9_L023", "node_mt_023": "p9_Q023",
    "node_024": "p9_L024", "node_mt_024": "p9_Q024",
    "node_t06": "p9_T",
};
export { NODE_ID_MIGRATION };

// ── Vocab prerequisite validator ──
// Walks all path_nodes in unit → node_index order and checks that every node's
// vocab_requires items have been covered by preceding nodes' vocab_introduces.
// Returns an array of error objects. Empty array = all good.
export const validateVocabPrerequisites = () => {
    const db = getDB();
    const units = [...db.units].sort((a, b) => a.unit_index - b.unit_index);
    const cumulativeVocab = new Set();
    const errors = [];

    for (const unit of units) {
        const unitNodes = db.path_nodes
            .filter(n => n.unit_id === unit.id)
            .sort((a, b) => a.node_index - b.node_index);

        for (const node of unitNodes) {
            // First, add this node's introduced vocab
            (node.vocab_introduces || []).forEach(id => cumulativeVocab.add(id));

            // Then check this node's required vocab
            for (const reqId of (node.vocab_requires || [])) {
                if (!cumulativeVocab.has(reqId)) {
                    const item = db.items.find(i => i.id === reqId);
                    errors.push({
                        node_id: node.id,
                        unit_id: node.unit_id,
                        label: node.label || node.lesson_id || node.id,
                        missing_item: reqId,
                        missing_word: item ? item.vi_text : '(unknown)',
                        message: `Node "${node.label || node.id}" requires "${item ? item.vi_text : reqId}" but it hasn't been introduced yet`
                    });
                }
            }
        }
    }
    return errors;
};

// Initialize DB — always overwrite units and path_nodes from INIT_DATA
// (items, lessons, lesson_blueprints, exercises are preserved from localStorage)
const CURRICULUM_VERSION = 9; // v9: add tones-1, vowels-1, tonemarks-basic, consonants initial+final to roadmap
const initDB = () => {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
        localStorage.setItem(DB_KEY, JSON.stringify(INIT_DATA));
        localStorage.setItem(DB_KEY + '_cv', String(CURRICULUM_VERSION));
        return;
    }
    const storedVersion = parseInt(localStorage.getItem(DB_KEY + '_cv') || '1', 10);
    if (storedVersion < CURRICULUM_VERSION) {
        // Overwrite units + path_nodes but keep user-edited content (items, exercises, etc.)
        const existing = JSON.parse(raw);
        existing.units = INIT_DATA.units;
        existing.path_nodes = INIT_DATA.path_nodes;
        existing.scenes = INIT_DATA.scenes;
        existing.scene_locations = INIT_DATA.scene_locations;
        localStorage.setItem(DB_KEY, JSON.stringify(existing));
        localStorage.setItem(DB_KEY + '_cv', String(CURRICULUM_VERSION));
    }
};

export const getDB = () => {
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
                module_type: n.module_type || null,
                test_scope: n.test_scope || null,
                source_node_id: n.source_node_id || null,
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

// --- Get next node in the roadmap after the given node ---
export const getNextNode = (nodeId) => {
    const db = getDB();
    const currentNode = (db.path_nodes || []).find(n => n.id === nodeId);
    if (!currentNode) return null;

    // Get all nodes in the same unit, sorted by index
    const unitNodes = (db.path_nodes || [])
        .filter(n => n.unit_id === currentNode.unit_id)
        .sort((a, b) => (a.node_index || 0) - (b.node_index || 0));

    const currentIdx = unitNodes.findIndex(n => n.id === nodeId);
    if (currentIdx >= 0 && currentIdx < unitNodes.length - 1) {
        return unitNodes[currentIdx + 1];
    }

    // If last in unit, find first node of next unit
    const currentUnit = db.units.find(u => u.id === currentNode.unit_id);
    if (!currentUnit) return null;
    const nextUnit = db.units
        .sort((a, b) => (a.unit_index || 0) - (b.unit_index || 0))
        .find(u => (u.unit_index || 0) > (currentUnit.unit_index || 0));
    if (!nextUnit) return null;

    const nextUnitNodes = (db.path_nodes || [])
        .filter(n => n.unit_id === nextUnit.id)
        .sort((a, b) => (a.node_index || 0) - (b.node_index || 0));
    return nextUnitNodes[0] || null;
};

// --- Build route for a node (mirrors RoadmapTab.navigateNode) ---
export const getNodeRoute = (node) => {
    if (!node) return '/';
    const type = node.node_type || node.type;
    if (type === 'lesson') return `/lesson/${node.lesson_id || node.content_ref_id}`;
    if (type === 'test') return `/test/${node.id}`;
    if (type === 'scene') return `/scene/${node.scene_id}`;
    if (type === 'skill') {
        if (node.skill_content?.type === 'grammar_lesson') return `/grammar-lesson/${node.id}`;
        if (node.skill_content?.route) return `${node.skill_content.route}?nodeId=${node.id}`;
        if (node.practice_route) return `${node.practice_route}?nodeId=${node.id}`;
    }
    return '/';
};

// --- Exercise Generation (auto-generate from items) ---
import { generateExercises } from './exerciseGenerator';
import { getImageForWord } from '../utils/vocabImageLookup';
import { getDueItemIds } from './srs';
import { getWeakItems as _getWeakItems, extractItemIds as _extractItemIds } from './wordGrades';
import modules from '../data/lessons.json';

// Session-level cache so exercises aren't regenerated on every render
const exerciseCache = new Map();

// Get the user's name for template substitution
const getUserName = () => {
    try {
        const raw = localStorage.getItem('vnme_user_profile');
        if (raw) {
            const profile = JSON.parse(raw);
            return profile.name || 'Bạn';
        }
    } catch { /* ignore */ }
    return 'Bạn';
};

// Resolve lesson items with their translations into full objects
const resolveItems = (db, itemIds) => {
    const userName = getUserName();
    return itemIds.map(itemId => {
        const item = (db.items || []).find(i => i.id === itemId);
        const translation = (db.translations || []).find(t => t.item_id === itemId && t.lang === 'en');
        if (!item || !translation) return null;
        return {
            id: item.id,
            vi_text: item.vi_text.replace(/\{NAME\}/g, userName),
            vi_text_no_diacritics: item.vi_text_no_diacritics?.replace(/\{NAME\}/g, userName) || null,
            en_text: translation.text.replace(/\{NAME\}/g, userName),
            audio_key: item.audio_key,
            item_type: item.item_type
        };
    }).filter(Boolean);
};

// Compute all items introduced up to and including the given lesson.
// Uses unit_index + node_index for canonical curriculum ordering.
const getKnownVocabulary = (lessonId) => {
    const db = getDB();
    const targetNode = (db.path_nodes || []).find(n => n.lesson_id === lessonId);
    if (!targetNode) return { knownItemIds: new Set(), knownItems: [] };

    const targetUnit = (db.units || []).find(u => u.id === targetNode.unit_id);
    if (!targetUnit) return { knownItemIds: new Set(), knownItems: [] };

    // Get all lesson nodes sorted by curriculum order
    const allLessonNodes = (db.path_nodes || [])
        .filter(n => n.node_type === 'lesson' && n.lesson_id)
        .map(n => {
            const unit = (db.units || []).find(u => u.id === n.unit_id);
            return { ...n, _unitIndex: unit ? (unit.unit_index ?? 999) : 999 };
        })
        .sort((a, b) => a._unitIndex - b._unitIndex || (a.node_index || 0) - (b.node_index || 0));

    const knownItemIds = new Set();
    for (const node of allLessonNodes) {
        const bp = (db.lesson_blueprints || []).find(b => b.lesson_id === node.lesson_id);
        if (bp) {
            (bp.introduced_items || []).forEach(id => knownItemIds.add(id));
        }
        if (node.lesson_id === lessonId) break;
    }

    const knownItems = resolveItems(db, [...knownItemIds]);
    return { knownItemIds, knownItems };
};

// Get distractor pool: items from earlier lessons (curriculum-aware)
const getDistractorPool = (db, lessonId) => {
    const { knownItems } = getKnownVocabulary(lessonId);
    const blueprint = (db.lesson_blueprints || []).find(b => b.lesson_id === lessonId);
    const currentItemIds = new Set(blueprint?.introduced_items || []);
    // Exclude current lesson's own items (they're already in the main items list)
    return knownItems.filter(item => !currentItemIds.has(item.id));
};

// Max total items per lesson (new + review combined)
const MAX_LESSON_ITEMS = 8;
// Number of new words introduced per session (Duolingo-style progressive introduction)
const ITEMS_PER_SESSION = 2;

// Main function: generate exercises for a lesson from its blueprint items
// session parameter (0-3) varies the exercise mix across repeat sessions
export const getExercisesGenerated = (lessonId, session = 0) => {
    // Cache key includes today's date so SRS review items refresh daily
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `${lessonId}_s${session}_${today}`;
    if (exerciseCache.has(cacheKey)) return exerciseCache.get(cacheKey);

    const db = getDB();
    const blueprint = (db.lesson_blueprints || []).find(bp => bp.lesson_id === lessonId);
    if (!blueprint) return [];

    const allBlueprintItems = resolveItems(db, blueprint.introduced_items || []);
    if (allBlueprintItems.length === 0) return [];

    // Progressive introduction: each session introduces 1-2 new words
    // Session 0: items[0:2], Session 1: items[2:4], etc.
    const newStart = session * ITEMS_PER_SESSION;
    const sessionNewItems = allBlueprintItems.slice(newStart, newStart + ITEMS_PER_SESSION);
    const previouslyIntroduced = allBlueprintItems.slice(0, newStart);

    // If session exceeds blueprint items, treat as pure review session
    const newItems = sessionNewItems.length > 0 ? sessionNewItems : [];
    let reviewFromLesson = previouslyIntroduced;

    // Sessions 2-3: prioritize items the learner got wrong
    if (session >= 2 && reviewFromLesson.length > 0) {
        const weakOrder = _getWeakItems(reviewFromLesson.map(i => i.id));
        const byId = new Map(reviewFromLesson.map(i => [i.id, i]));
        reviewFromLesson = weakOrder.map(id => byId.get(id)).filter(Boolean);
    }

    // SRS review items: only inject items the user has actually studied
    const blueprintItemIds = new Set(blueprint.introduced_items || []);
    const { knownItemIds } = getKnownVocabulary(lessonId);
    const dueIds = getDueItemIds().filter(id => !blueprintItemIds.has(id) && knownItemIds.has(id));
    const srsSlots = Math.max(0, MAX_LESSON_ITEMS - newItems.length - reviewFromLesson.length);
    const srsReviewItems = resolveItems(db, dueIds.slice(0, srsSlots));

    // Combined pool: new items first, then lesson review, then SRS review
    const allItems = [...newItems, ...reviewFromLesson, ...srsReviewItems];
    if (allItems.length === 0) return [];

    const distractorPool = getDistractorPool(db, lessonId);

    // Build image map for picture_choice exercises
    const imageMap = {};
    allItems.forEach(item => {
        const imgData = getImageForWord(item.vi_text);
        if (imgData) {
            imageMap[item.vi_text.toLowerCase()] = imgData;
        } else if (item.emoji) {
            imageMap[item.vi_text.toLowerCase()] = { image: null, emoji: item.emoji };
        }
    });

    // Build word hints map for tappable translations
    const wordHints = {};
    allItems.forEach(item => {
        wordHints[item.vi_text.toLowerCase()] = item.en_text;
    });

    const exercises = generateExercises(lessonId, allItems, distractorPool, imageMap, session);

    // Attach wordHints to each exercise for tappable translations in the UI
    exercises.forEach(ex => { ex.wordHints = wordHints; });

    exerciseCache.set(cacheKey, exercises);
    return exercises;
};

// Clear exercise cache (call when DB content changes, e.g. after CMS save)
export const clearExerciseCache = () => exerciseCache.clear();

// --- Get all lesson exercises for a unit (for unit tests) ---
// Prioritizes exercises targeting weak items (from wordGrades) so the unit test
// adapts to what the learner struggles with most.
export const getExercisesForUnit = (unitId) => {
    const db = getDB();
    const unitNodes = (db.path_nodes || []).filter(n => n.unit_id === unitId && n.node_type === 'lesson');
    const lessonIds = unitNodes.map(n => n.lesson_id).filter(Boolean);
    const allExercises = [];
    for (const lid of lessonIds) {
        allExercises.push(...getExercisesGenerated(lid));
    }

    // Prioritize exercises that test weak items (from wordGrades)
    const allItemIds = [...new Set(allExercises.flatMap(ex => _extractItemIds(ex, db)))];
    if (allItemIds.length > 0) {
        const weakIds = new Set(_getWeakItems(allItemIds));
        allExercises.sort((a, b) => {
            const aWeak = _extractItemIds(a, db).some(id => weakIds.has(id)) ? 0 : 1;
            const bWeak = _extractItemIds(b, db).some(id => weakIds.has(id)) ? 0 : 1;
            if (aWeak !== bWeak) return aWeak - bWeak;
            return Math.random() - 0.5;
        });
    }

    return allExercises;
};

// --- Get exercises for a single module-scoped test node ---
export const getExercisesForNode = (nodeId) => {
    const db = getDB();
    const node = (db.path_nodes || []).find(n => n.id === nodeId);
    if (!node) return [];

    // If it's a module-scoped test, get exercises from the source node's lesson
    if (node.test_scope === 'module' && node.source_node_id) {
        const sourceNode = (db.path_nodes || []).find(n => n.id === node.source_node_id);
        if (sourceNode?.lesson_id) {
            return getExercisesGenerated(sourceNode.lesson_id);
        }
    }

    // For lesson nodes directly
    if (node.lesson_id) {
        return getExercisesGenerated(node.lesson_id);
    }

    return [];
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

        // All skill nodes (grammar_unit and practice_module) are now first-class roadmap nodes

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
            module_type: n.module_type || null,
            test_scope: n.test_scope || null,
            source_node_id: n.source_node_id || null,
            scene_id: n.scene_id || null,
            difficulty: n.difficulty || null,
            cefr_level: n.cefr_level || null,
            vocab_introduces: n.vocab_introduces || null,
            vocab_requires: n.vocab_requires || null,
            status
        };
    }).sort((a, b) => a.order_index - b.order_index);
};

// --- Get lesson blueprint for word summary ---
// session parameter controls which words are shown in the intro (progressive introduction)
export const getLessonBlueprint = (lessonId, session = 0) => {
    const db = getDB();
    const blueprint = (db.lesson_blueprints || []).find(bp => bp.lesson_id === lessonId);
    if (!blueprint) return null;

    // Check if we have rich content in lessons.json (mapping lesson_001 -> id: 1)
    const moduleId = parseInt(lessonId.replace('lesson_', ''));
    const moduleData = modules.find(m => m.id === moduleId);

    // Only show this session's new words in the intro screen
    const allItemIds = blueprint.introduced_items || [];
    const newStart = session * ITEMS_PER_SESSION;
    const sessionItemIds = allItemIds.slice(newStart, newStart + ITEMS_PER_SESSION);

    const words = sessionItemIds.map(itemId => {
        const item = (db.items || []).find(i => i.id === itemId);
        const translation = (db.translations || []).find(t => t.item_id === itemId && t.lang === 'en');
        if (item && translation) {
            const userName = getUserName();
            return { id: item.id, vietnamese: item.vi_text.replace(/\{NAME\}/g, userName), english: translation.text.replace(/\{NAME\}/g, userName) };
        }
        return null;
    }).filter(Boolean);

    return {
        lessonId,
        title: moduleData?.title || blueprint.title || 'Lesson',
        goal: moduleData?.goal || blueprint.goal || '',
        focus: blueprint.focus,
        words,
        dialogue: moduleData?.dialogue || null,
        patterns: moduleData?.patterns || null,
        pronunciation_focus: moduleData?.pronunciation_focus || null
    };
};

// --- CMS Helper Functions ---

export const getAvailableSkillRoutes = () => [
    { route: '/practice/tones', label: 'Tone Practice' },
    { route: '/practice/vowels', label: 'Vowels Practice' },
    { route: '/practice/numbers', label: 'Numbers Practice' },
    { route: '/practice/pronouns', label: 'Pronouns Practice' },
    { route: '/practice/tonemarks', label: 'Tone Marks' },
    { route: '/practice/telex', label: 'Telex Typing' },
    { route: '/practice/pitch', label: 'Tone Pitch Training' },
    { route: '/practice/flashcards', label: 'Flashcards' },
];

export const reindexUnitNodes = (unitId) => {
    const db = getDB();
    const unitNodes = (db.path_nodes || [])
        .filter(n => n.unit_id === unitId)
        .sort((a, b) => (a.node_index || 0) - (b.node_index || 0));
    unitNodes.forEach((n, i) => { n.node_index = i + 1; });
    saveDB(db);
};

export const addNodeWithQuiz = (nodeData) => {
    const db = getDB();
    const unitNodes = (db.path_nodes || []).filter(n => n.unit_id === nodeData.unit_id);
    const maxIndex = unitNodes.reduce((max, n) => Math.max(max, n.node_index || 0), 0);

    const newNode = {
        id: `node_${Date.now()}`,
        course_id: 'course_vi_en_v1',
        node_index: maxIndex + 1,
        status: 'locked',
        ...nodeData
    };

    if (!db.path_nodes) db.path_nodes = [];
    db.path_nodes.push(newNode);

    // Auto-create mini-test for lesson nodes
    if (nodeData.node_type === 'lesson') {
        const quizNode = {
            id: `node_mt_${Date.now()}`,
            course_id: 'course_vi_en_v1',
            unit_id: nodeData.unit_id,
            node_index: maxIndex + 2,
            node_type: 'test',
            module_type: nodeData.module_type || 'orange',
            label: `${nodeData.label || 'Lesson'} Quiz`,
            test_scope: 'module',
            source_node_id: newNode.id,
            unlock_rule: { requires: [{ type: 'node_completed', node_id: newNode.id }] }
        };
        db.path_nodes.push(quizNode);
    }

    saveDB(db);
    reindexUnitNodes(nodeData.unit_id);
    return newNode;
};

export const deleteNodeWithQuiz = (nodeId) => {
    const db = getDB();
    const node = (db.path_nodes || []).find(n => n.id === nodeId);
    if (!node) return;
    const unitId = node.unit_id;
    db.path_nodes = (db.path_nodes || []).filter(n =>
        n.id !== nodeId && n.source_node_id !== nodeId
    );
    saveDB(db);
    reindexUnitNodes(unitId);
};

export const moveNodeWithQuiz = (unitId, nodeId, direction) => {
    const db = getDB();
    const unitNodes = (db.path_nodes || [])
        .filter(n => n.unit_id === unitId)
        .sort((a, b) => (a.node_index || 0) - (b.node_index || 0));

    const node = unitNodes.find(n => n.id === nodeId);
    if (!node) return;

    // Collect the node and its mini-test as a "group"
    const isQuiz = node.test_scope === 'module' && node.source_node_id;
    if (isQuiz) return; // Don't move quiz nodes directly

    const group = [node];
    const quiz = unitNodes.find(n => n.source_node_id === nodeId && n.test_scope === 'module');
    if (quiz) group.push(quiz);

    // Find the adjacent group to swap with
    const groupIds = new Set(group.map(n => n.id));
    const nonGroupNodes = unitNodes.filter(n => !groupIds.has(n.id));

    // Find current position among top-level nodes (non-quiz nodes)
    const topLevel = unitNodes.filter(n => !(n.test_scope === 'module' && n.source_node_id));
    const topIdx = topLevel.findIndex(n => n.id === nodeId);
    const swapIdx = topIdx + direction;
    if (swapIdx < 0 || swapIdx >= topLevel.length) return;

    const swapNode = topLevel[swapIdx];
    const swapGroup = [swapNode];
    const swapQuiz = unitNodes.find(n => n.source_node_id === swapNode.id && n.test_scope === 'module');
    if (swapQuiz) swapGroup.push(swapQuiz);

    // Rebuild order: swap the two groups in place
    const ordered = [];
    for (const tl of topLevel) {
        let target = tl;
        if (tl.id === nodeId) target = swapNode;
        else if (tl.id === swapNode.id) target = node;

        ordered.push(target);
        const tQuiz = unitNodes.find(n => n.source_node_id === target.id && n.test_scope === 'module');
        if (tQuiz) ordered.push(tQuiz);
    }

    ordered.forEach((n, i) => { n.node_index = i + 1; });
    saveDB(db);
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

    // 1. Update Lesson Metadata
    const lessonIndex = db.lessons.findIndex(l => l.id === contentData.id);
    if (lessonIndex >= 0) {
        db.lessons[lessonIndex].title = contentData.goal || db.lessons[lessonIndex].title;
    }

    // 2. Update items and translations from sentences
    const sentences = contentData.sentences || [];
    const blueprint = (db.lesson_blueprints || []).find(bp => bp.lesson_id === contentData.id);

    if (sentences.length > 0) {
        // Create or update items/translations for each sentence
        const newItemIds = [];
        sentences.forEach((s, idx) => {
            const itemId = `it_cms_${contentData.id}_${idx}`;
            const isMultiWord = s.vietnamese.split(/\s+/).length >= 3;
            const itemType = isMultiWord ? 'sentence' : 'word';

            // Upsert item
            const existingIdx = (db.items || []).findIndex(i => i.id === itemId);
            const item = {
                id: itemId,
                item_type: itemType,
                vi_text: s.vietnamese,
                vi_text_no_diacritics: s.vietnamese.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
                audio_key: `a_${itemId}`,
                dialect: 'both'
            };
            if (existingIdx >= 0) db.items[existingIdx] = item;
            else db.items.push(item);

            // Upsert translation
            const transIdx = (db.translations || []).findIndex(t => t.item_id === itemId && t.lang === 'en');
            const trans = { item_id: itemId, lang: 'en', text: s.english };
            if (transIdx >= 0) db.translations[transIdx] = trans;
            else db.translations.push(trans);

            newItemIds.push(itemId);
        });

        // Update or create blueprint
        if (blueprint) {
            blueprint.introduced_items = newItemIds;
        } else {
            if (!db.lesson_blueprints) db.lesson_blueprints = [];
            db.lesson_blueprints.push({
                lesson_id: contentData.id,
                focus: [],
                introduced_items: newItemIds
            });
        }
    }

    // 3. Clear exercise cache so next load regenerates
    clearExerciseCache();

    // 4. Fallback for old lessonContent array
    if (!db.lessonContent) db.lessonContent = [];
    const index = db.lessonContent.findIndex(c => c.id === contentData.id);
    if (index >= 0) db.lessonContent[index] = contentData;
    else db.lessonContent.push(contentData);

    saveDB(db);
    return contentData;
};
