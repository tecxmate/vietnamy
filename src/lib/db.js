// A mock database using localStorage to simulate a backend for the 100-levels proposal.

const DB_KEY = 'vnme_mock_db_v2'; // Changed key to force re-init with new data

const INIT_DATA = {
    course: {
        id: "course_vi_en_v1",
        code: "vi_en",
        version: 1,
        title: "Vietnamese (English UI)",
        dialect_default: "both"
    },
    units: [
        { id: "unit_1_basics", course_id: "course_vi_en_v1", unit_index: 1, title: "Unit 1 — Basics" }
    ],
    skills: [
        { id: "skill_greetings_1", course_id: "course_vi_en_v1", key: "greetings_1", title: "Greetings", skill_type: "vocab" },
        { id: "skill_introduce_1", course_id: "course_vi_en_v1", key: "introduce_1", title: "Introduce Yourself", skill_type: "grammar" },
        { id: "skill_polite_1", course_id: "course_vi_en_v1", key: "polite_1", title: "Polite Phrases", skill_type: "vocab" },
        { id: "skill_numbers_1", course_id: "course_vi_en_v1", key: "numbers_1", title: "Numbers 1–10", skill_type: "vocab" },
        { id: "skill_order_1", course_id: "course_vi_en_v1", key: "order_1", title: "Ordering Drinks", skill_type: "grammar" }
    ],
    lessons: [
        { id: "lesson_001", course_id: "course_vi_en_v1", skill_id: "skill_greetings_1", lesson_index: 1, title: "Hello & Goodbye", target_xp: 10 },
        { id: "lesson_002", course_id: "course_vi_en_v1", skill_id: "skill_introduce_1", lesson_index: 1, title: "My Name Is…", target_xp: 12 },
        { id: "lesson_003", course_id: "course_vi_en_v1", skill_id: "skill_polite_1", lesson_index: 1, title: "Please & Sorry", target_xp: 12 },
        { id: "lesson_004", course_id: "course_vi_en_v1", skill_id: "skill_numbers_1", lesson_index: 1, title: "1 to 10", target_xp: 12 },
        { id: "lesson_005", course_id: "course_vi_en_v1", skill_id: "skill_order_1", lesson_index: 1, title: "I Want…", target_xp: 14 }
    ],
    path_nodes: [
        { id: "node_001", course_id: "course_vi_en_v1", unit_id: "unit_1_basics", node_index: 1, node_type: "lesson", lesson_id: "lesson_001", skill_id: "skill_greetings_1", unlock_rule: { requires: [] }, status: "completed" },
        { id: "node_002", course_id: "course_vi_en_v1", unit_id: "unit_1_basics", node_index: 2, node_type: "lesson", lesson_id: "lesson_002", skill_id: "skill_introduce_1", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_001" }] }, status: "active" },
        { id: "node_003", course_id: "course_vi_en_v1", unit_id: "unit_1_basics", node_index: 3, node_type: "lesson", lesson_id: "lesson_003", skill_id: "skill_polite_1", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_002" }] }, status: "locked" },
        { id: "node_004", course_id: "course_vi_en_v1", unit_id: "unit_1_basics", node_index: 4, node_type: "lesson", lesson_id: "lesson_004", skill_id: "skill_numbers_1", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_003" }] }, status: "locked" },
        { id: "node_005", course_id: "course_vi_en_v1", unit_id: "unit_1_basics", node_index: 5, node_type: "lesson", lesson_id: "lesson_005", skill_id: "skill_order_1", unlock_rule: { requires: [{ type: "node_completed", node_id: "node_004" }] }, status: "locked" }
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
        { id: "it_s_0037", item_type: "sentence", vi_text: "Cảm ơn!", vi_text_no_diacritics: "Cam on!", audio_key: "a_cam_on_2", dialect: "both" }
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
        { item_id: "it_s_0037", lang: "en", text: "Thank you!" }
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
        { id: "ex_005_06", lesson_id: "lesson_005", exercise_type: "speaking_repeat", prompt: { instruction: "Repeat the sentence", audio_item_id: "it_s_0033", target_vi: "Cho tôi một cà phê, làm ơn.", scoring: { type: "asr_similarity", min_score: 0.58 } } }
    ],
    lesson_blueprints: [
        { lesson_id: "lesson_001", focus: ["greetings", "basic_yes_no"], introduced_items: ["it_w_0001", "it_w_0003", "it_w_0004", "it_w_0007", "it_w_0009"] },
        { lesson_id: "lesson_002", focus: ["introductions", "question_form"], introduced_items: ["it_s_0012", "it_p_0010", "it_s_0013"] },
        { lesson_id: "lesson_003", focus: ["polite_requests", "repair_phrases"], introduced_items: ["it_w_0014", "it_w_0015", "it_s_0016", "it_s_0017"] },
        { lesson_id: "lesson_004", focus: ["numbers_1_10"], introduced_items: ["it_w_0020", "it_w_0021", "it_w_0022", "it_w_0023", "it_w_0024", "it_w_0025", "it_w_0026", "it_w_0027", "it_w_0028", "it_w_0029"] },
        { lesson_id: "lesson_005", focus: ["ordering", "diacritics_awareness"], introduced_items: ["it_w_0030", "it_w_0031", "it_w_0032", "it_w_0035", "it_s_0033", "it_s_0034"] }
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
                label: label,
                content_ref_id: n.lesson_id || n.content_ref_id,
                status: n.status || 'locked' // Need to compute status natively ideally
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
