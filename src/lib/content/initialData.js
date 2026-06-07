// Static curriculum seed data and builders for the local mock DB.

import { SCENE_LOCATIONS, SCENES } from './sceneSeedData';

// ── Diacritics stripping ──
const stripDiacritics = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/ơ/g, 'o').replace(/Ơ/g, 'O')
    .replace(/ư/g, 'u').replace(/Ư/g, 'U');


// ── Canonical content bundle ──
// Single source of truth for lesson content (see docs/CONTENT_SCHEMA.md).
import canonicalDB from '../../../content/curriculum.json';

// content/ grammar-tag ids are gtag_NNN; the store keeps the GTNNN form that
// exerciseGenerator.js depends on.
const gtagToGT = (id) => id.replace(/^gtag_/, 'GT');

/**
 * Build internal store structures from content/curriculum.json.
 * Verified equivalent to the former unified_db.json path
 * (scripts/verify-seed-equivalence.mjs).
 */
function buildFromCanonical(db) {
    const items = [];
    const translations = [];
    const blueprints = [];
    const lessons = [];
    const pathNodes = [];

    (db.words || []).forEach(v => {
        const audioKey = "a_" + v.vi.replace(/[^a-zA-ZàáạảãăắằặẳẵâấầậẩẫèéẹẻẽêếềệểễìíịỉĩòóọỏõôốồộổỗơớờợởỡùúụủũưứừựửữỳýỵỷỹđĐ ]/g, '').replace(/ +/g, '_').toLowerCase();
        items.push({
            id: v.id,
            item_type: v.pos === 'phrase' ? 'phrase' : 'word',
            vi_text: v.vi,
            vi_text_no_diacritics: stripDiacritics(v.vi),
            audio_key: audioKey,
            dialect: v.dialect || 'both',
            emoji: v.emoji,
            pos: v.pos,
            frequency: v.frequencyRank,
            hasImage: v.hasImage,
        });
        if (v.en) translations.push({ item_id: v.id, lang: 'en', text: v.en, is_alternate: false });
        if (v.zh) translations.push({ item_id: v.id, lang: 'zh', text: v.zh, is_alternate: false });
    });

    (db.sentences || []).forEach(s => {
        const audioKey = "a_" + s.vi.replace(/[^a-zA-ZàáạảãăắằặẳẵâấầậẩẫèéẹẻẽêếềệểễìíịỉĩòóọỏõôốồộổỗơớờợởỡùúụủũưứừựửữỳýỵỷỹđĐ ]/g, '').replace(/ +/g, '_').toLowerCase();
        items.push({
            id: s.id,
            item_type: 'sentence',
            vi_text: s.vi,
            vi_text_no_diacritics: stripDiacritics(s.vi),
            audio_key: audioKey,
            dialect: 'both',
            token_count: s.tokenCount,
            tags: (s.grammarTagIds || []).map(gtagToGT),
            note: s.note,
            accepted: [s.en, ...(s.accepted || [])].filter(Boolean),
        });
        if (s.en) translations.push({ item_id: s.id, lang: 'en', text: s.en, is_alternate: false });
        (s.accepted || []).forEach(alt => translations.push({ item_id: s.id, lang: 'en', text: alt, is_alternate: true }));
        if (s.zh) translations.push({ item_id: s.id, lang: 'zh', text: s.zh, is_alternate: false });
    });

    (db.lessons || []).forEach(lesson => {
        const lessonVocab = (db.words || []).filter(v => v.lessonId === lesson.id);
        const lessonSentences = (db.sentences || []).filter(s => s.lessonId === lesson.id);
        const itemIds = [...lessonVocab.map(v => v.id), ...lessonSentences.map(s => s.id)];

        lessons.push({
            id: lesson.id,
            course_id: "course_vi_en_v1",
            skill_id: `skill_${lesson.id}`,
            lesson_index: lesson.orderIndex,
            title: lesson.title,
            target_xp: lesson.xpReward || 10,
            exercise_profile_id: lesson.exerciseProfileId || null,
        });

        blueprints.push({
            lesson_id: lesson.id,
            focus: lesson.focus || [],
            introduced_items: itemIds,
        });

        if (lesson.nodeId) {
            pathNodes.push({
                id: lesson.nodeId,
                course_id: "course_vi_en_v1",
                unit_id: lesson.unitId,
                node_index: lesson.orderIndex,
                node_type: "lesson",
                module_type: "orange",
                lesson_id: lesson.id,
                difficulty: lesson.difficulty || 1,
                cefr_level: lesson.cefrLevel || "A1.1",
                vocab_introduces: itemIds,
                vocab_requires: [],
            });

            if (lesson.quizId) {
                pathNodes.push({
                    id: lesson.quizId,
                    course_id: "course_vi_en_v1",
                    unit_id: lesson.unitId,
                    node_index: lesson.orderIndex + 1,
                    node_type: "test",
                    module_type: "test",
                    label: `${lesson.title} Quiz`,
                    test_scope: "module",
                    source_node_id: lesson.nodeId,
                    difficulty: lesson.difficulty || 1,
                    cefr_level: lesson.cefrLevel || "A1.1",
                    vocab_introduces: [],
                    vocab_requires: [],
                });
            }
        }
    });

    return { items, translations, blueprints, lessons, pathNodes };
}



// Build the runtime store from the canonical content bundle
const _built = buildFromCanonical(canonicalDB);


const _mergedBuilt = _built;

// Units definition
const LEGACY_UNITS = [
    { id: "phase_0_foundations", course_id: "course_vi_en_v1", unit_index: -1, title: "Unit 0 — Foundations" },
    { id: "phase_1_first_words", course_id: "course_vi_en_v1", unit_index: 0, title: "Unit 1 — First Words" },
    { id: "phase_2_polite", course_id: "course_vi_en_v1", unit_index: 2, title: "Unit 2 — Polite Survival" },
    { id: "phase_3_cafe", course_id: "course_vi_en_v1", unit_index: 3, title: "Unit 3 — Ordering & Café" },
    { id: "phase_4_food", course_id: "course_vi_en_v1", unit_index: 4, title: "Unit 4 — Food & Prices" },
    { id: "phase_5_market", course_id: "course_vi_en_v1", unit_index: 5, title: "Unit 5 — Market Life" },
    { id: "phase_6_numbers", course_id: "course_vi_en_v1", unit_index: 6, title: "Unit 6 — Numbers Advanced" },
    { id: "phase_7_transport", course_id: "course_vi_en_v1", unit_index: 7, title: "Unit 7 — Getting Around" },
    { id: "phase_8_daily", course_id: "course_vi_en_v1", unit_index: 8, title: "Unit 8 — Daily Life" },
    { id: "phase_9_social", course_id: "course_vi_en_v1", unit_index: 9, title: "Unit 9 — Social Life" },
    { id: "phase_10_past", course_id: "course_vi_en_v1", unit_index: 10, title: "Unit 10 — Past Experiences" },
    { id: "phase_11_health", course_id: "course_vi_en_v1", unit_index: 11, title: "Unit 11 — Health & Body" },
    { id: "phase_12_work", course_id: "course_vi_en_v1", unit_index: 12, title: "Unit 12 — Work & Career" },
    { id: "phase_13_travel_vn", course_id: "course_vi_en_v1", unit_index: 13, title: "Unit 13 — Travel in Vietnam" },
    { id: "phase_14_tech", course_id: "course_vi_en_v1", unit_index: 14, title: "Unit 14 — Communication & Tech" },
    { id: "phase_15_festivals", course_id: "course_vi_en_v1", unit_index: 15, title: "Unit 15 — Festivals & Culture" },
    { id: "phase_16_opinions", course_id: "course_vi_en_v1", unit_index: 16, title: "Unit 16 — Opinions & Discussion" },
    { id: "phase_17_news", course_id: "course_vi_en_v1", unit_index: 17, title: "Unit 17 — News & Society" },
    { id: "phase_18_dreams", course_id: "course_vi_en_v1", unit_index: 18, title: "Unit 18 — Dreams & Future" },
    { id: "phase_19_idioms", course_id: "course_vi_en_v1", unit_index: 19, title: "Unit 19 — Idioms & Sayings" },
    { id: "phase_20_workplace", course_id: "course_vi_en_v1", unit_index: 20, title: "Unit 20 — Workplace Scenarios" },
    { id: "phase_21_storytelling", course_id: "course_vi_en_v1", unit_index: 21, title: "Unit 21 — Storytelling" },
    { id: "phase_22_debate", course_id: "course_vi_en_v1", unit_index: 22, title: "Unit 22 — Debate & Argument" },
    { id: "phase_23_media", course_id: "course_vi_en_v1", unit_index: 23, title: "Unit 23 — Media & Film" },
    { id: "phase_24_abstract", course_id: "course_vi_en_v1", unit_index: 24, title: "Unit 24 — Abstract Concepts" },
    { id: "phase_25_environment", course_id: "course_vi_en_v1", unit_index: 25, title: "Unit 25 — Environment & Sustainability" },
    { id: "phase_26_education", course_id: "course_vi_en_v1", unit_index: 26, title: "Unit 26 — Education & Learning" },
    { id: "phase_27_economy", course_id: "course_vi_en_v1", unit_index: 27, title: "Unit 27 — Economy & Business" },
    { id: "phase_28_relationships", course_id: "course_vi_en_v1", unit_index: 28, title: "Unit 28 — Relationships & Conflict" },
    { id: "phase_29_history", course_id: "course_vi_en_v1", unit_index: 29, title: "Unit 29 — Vietnamese History" },
    { id: "phase_30_arts", course_id: "course_vi_en_v1", unit_index: 30, title: "Unit 30 — Arts, Music & Literature" },
    { id: "phase_31_law", course_id: "course_vi_en_v1", unit_index: 31, title: "Unit 31 — Law & Civic Life" },
    { id: "phase_32_healthcare", course_id: "course_vi_en_v1", unit_index: 32, title: "Unit 32 — Healthcare in Depth" },
    { id: "phase_33_regional", course_id: "course_vi_en_v1", unit_index: 33, title: "Unit 33 — Regional Vietnam & Dialects" },
    { id: "phase_34_rhetoric", course_id: "course_vi_en_v1", unit_index: 34, title: "Unit 34 — Formal Writing & Rhetoric" },
    { id: "phase_35_religion", course_id: "course_vi_en_v1", unit_index: 35, title: "Unit 35 — Religion & Spirituality" },
    { id: "phase_36_diplomacy", course_id: "course_vi_en_v1", unit_index: 36, title: "Unit 36 — Negotiation & Diplomacy" },
    { id: "phase_37_science", course_id: "course_vi_en_v1", unit_index: 37, title: "Unit 37 — Science & Technology" },
    { id: "phase_38_cuisine", course_id: "course_vi_en_v1", unit_index: 38, title: "Unit 38 — Regional Cuisine in Depth" },
    { id: "phase_39_hospitality", course_id: "course_vi_en_v1", unit_index: 39, title: "Unit 39 — Hospitality & Service Excellence" }
];

export const INIT_DATA = {
    course: {
        id: "course_vi_en_v1",
        code: "vi_en",
        version: 1,
        title: "Vietnamese (English UI)",
        dialect_default: "both"
    },
    // Keep legacy units for compatibility with existing manual path_nodes
    units: LEGACY_UNITS,
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
    lessons: [..._mergedBuilt.lessons],
    path_nodes: [
        // ═══ Lesson + quiz nodes from unified_db + legacy ═══
        ..._mergedBuilt.pathNodes,
        // ═══ Unit 0 — Foundations: tone/script on-ramp, wired to existing Practice modules ═══
        // Each is a skill node pointing at a tone/vowel drill; one pass completes it
        // (sessions_required: 1). The checkpoint carries test_scope:'unit', which gates Unit 1.
        { id: "f0_tones", course_id: "course_vi_en_v1", unit_id: "phase_0_foundations", node_index: 0, node_type: "skill", module_type: "orange", label: "Hear the 6 tones", practice_route: "/practice/tonemarks-basic", sessions_required: 1, difficulty: 1, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },
        { id: "f0_marks", course_id: "course_vi_en_v1", unit_id: "phase_0_foundations", node_index: 1, node_type: "skill", module_type: "orange", label: "Read the tone marks", practice_route: "/practice/tonemarks-special", sessions_required: 1, difficulty: 1, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },
        { id: "f0_vowels", course_id: "course_vi_en_v1", unit_id: "phase_0_foundations", node_index: 2, node_type: "skill", module_type: "orange", label: "Vietnamese vowels", practice_route: "/practice/vowels-single-1", sessions_required: 1, difficulty: 1, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },
        { id: "f0_check", course_id: "course_vi_en_v1", unit_id: "phase_0_foundations", node_index: 3, node_type: "skill", module_type: "test", label: "Foundations checkpoint", practice_route: "/practice/tonemarks-master", test_scope: "unit", sessions_required: 1, difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },

        // ═══ Manual nodes (tests, scenes only) ═══
        // Practice modules & grammar units removed - now accessible from Library tab
        { id: "p1_T", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 16, node_type: "test", module_type: "test", label: "Unit 1 Test", test_scope: "unit", difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p2_T", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 10, node_type: "test", module_type: "test", label: "Unit 2 Test", test_scope: "unit", difficulty: 5, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p3_T", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 9, node_type: "test", module_type: "test", label: "Unit 3 Test", test_scope: "unit", difficulty: 7, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p3_SC1", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 10, node_type: "scene", module_type: "green", label: "☕ At the Café", scene_id: "scene_cafe_001", difficulty: 7, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p4_T", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 9, node_type: "test", module_type: "test", label: "Unit 4 Test", test_scope: "unit", difficulty: 7, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p4_SC1", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 10, node_type: "scene", module_type: "green", label: "🛵 Street Food Stall", scene_id: "scene_streetfood_001", difficulty: 7, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p5_T", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 11, node_type: "test", module_type: "test", label: "Unit 5 Test", test_scope: "unit", difficulty: 7, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p5_SC1", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 12, node_type: "scene", module_type: "green", label: "🛒 At the Market", scene_id: "scene_market_001", difficulty: 7, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p6_T", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 13, node_type: "test", module_type: "test", label: "Unit 6 Test", test_scope: "unit", difficulty: 8, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p6_SC1", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 14, node_type: "scene", module_type: "green", label: "🍜 At the Restaurant", scene_id: "scene_restaurant_001", difficulty: 8, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p7_T", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 17, node_type: "test", module_type: "test", label: "Unit 7 Test", test_scope: "unit", difficulty: 9, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p7_SC1", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 18, node_type: "scene", module_type: "green", label: "🚕 Getting a Taxi", scene_id: "scene_taxi_001", difficulty: 8, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p7_SC2", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 19, node_type: "scene", module_type: "green", label: "✈️ At the Airport", scene_id: "scene_airport_001", difficulty: 8, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p8_T", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 21, node_type: "test", module_type: "test", label: "Unit 8 Test", test_scope: "unit", difficulty: 10, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p8_SC1", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 22, node_type: "scene", module_type: "green", label: "🏨 Checking into a Hotel", scene_id: "scene_hotel_001", difficulty: 9, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p9_T", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 17, node_type: "test", module_type: "test", label: "Unit 9 Test", test_scope: "unit", difficulty: 10, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p9_SC1", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 18, node_type: "scene", module_type: "green", label: "🎉 At a Party", scene_id: "scene_party_001", difficulty: 9, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p10_T", course_id: "course_vi_en_v1", unit_id: "phase_10_past", node_index: 9, node_type: "test", module_type: "test", label: "Unit 10 Test", test_scope: "unit", difficulty: 10, cefr_level: "A2", vocab_introduces: [], vocab_requires: [] },
        { id: "p11_T", course_id: "course_vi_en_v1", unit_id: "phase_11_health", node_index: 9, node_type: "test", module_type: "test", label: "Unit 11 Test", test_scope: "unit", difficulty: 10, cefr_level: "A2", vocab_introduces: [], vocab_requires: [] },
        { id: "p12_T", course_id: "course_vi_en_v1", unit_id: "phase_12_work", node_index: 7, node_type: "test", module_type: "test", label: "Unit 12 Test", test_scope: "unit", difficulty: 10, cefr_level: "A2", vocab_introduces: [], vocab_requires: [] },
        { id: "p13_T", course_id: "course_vi_en_v1", unit_id: "phase_13_travel_vn", node_index: 9, node_type: "test", module_type: "test", label: "Unit 13 Test", test_scope: "unit", difficulty: 10, cefr_level: "A2", vocab_introduces: [], vocab_requires: [] },
        { id: "p14_T", course_id: "course_vi_en_v1", unit_id: "phase_14_tech", node_index: 7, node_type: "test", module_type: "test", label: "Unit 14 Test", test_scope: "unit", difficulty: 10, cefr_level: "A2", vocab_introduces: [], vocab_requires: [] },
        { id: "p15_T", course_id: "course_vi_en_v1", unit_id: "phase_15_festivals", node_index: 7, node_type: "test", module_type: "test", label: "Unit 15 Test", test_scope: "unit", difficulty: 10, cefr_level: "B1", vocab_introduces: [], vocab_requires: [] },
        { id: "p16_T", course_id: "course_vi_en_v1", unit_id: "phase_16_opinions", node_index: 7, node_type: "test", module_type: "test", label: "Unit 16 Test", test_scope: "unit", difficulty: 10, cefr_level: "B1", vocab_introduces: [], vocab_requires: [] },
        { id: "p17_T", course_id: "course_vi_en_v1", unit_id: "phase_17_news", node_index: 7, node_type: "test", module_type: "test", label: "Unit 17 Test", test_scope: "unit", difficulty: 10, cefr_level: "B1", vocab_introduces: [], vocab_requires: [] },
        { id: "p18_T", course_id: "course_vi_en_v1", unit_id: "phase_18_dreams", node_index: 7, node_type: "test", module_type: "test", label: "Unit 18 Test", test_scope: "unit", difficulty: 10, cefr_level: "B1", vocab_introduces: [], vocab_requires: [] },
        { id: "p19_T", course_id: "course_vi_en_v1", unit_id: "phase_19_idioms", node_index: 7, node_type: "test", module_type: "test", label: "Unit 19 Test", test_scope: "unit", difficulty: 10, cefr_level: "B1", vocab_introduces: [], vocab_requires: [] },
        { id: "p20_T", course_id: "course_vi_en_v1", unit_id: "phase_20_workplace", node_index: 9, node_type: "test", module_type: "test", label: "Unit 20 Test", test_scope: "unit", difficulty: 10, cefr_level: "B1", vocab_introduces: [], vocab_requires: [] },
        { id: "p21_T", course_id: "course_vi_en_v1", unit_id: "phase_21_storytelling", node_index: 7, node_type: "test", module_type: "test", label: "Unit 21 Test", test_scope: "unit", difficulty: 10, cefr_level: "B1", vocab_introduces: [], vocab_requires: [] },
        { id: "p22_T", course_id: "course_vi_en_v1", unit_id: "phase_22_debate", node_index: 7, node_type: "test", module_type: "test", label: "Unit 22 Test", test_scope: "unit", difficulty: 10, cefr_level: "B2", vocab_introduces: [], vocab_requires: [] },
        { id: "p23_T", course_id: "course_vi_en_v1", unit_id: "phase_23_media", node_index: 7, node_type: "test", module_type: "test", label: "Unit 23 Test", test_scope: "unit", difficulty: 10, cefr_level: "B2", vocab_introduces: [], vocab_requires: [] },
        { id: "p24_T", course_id: "course_vi_en_v1", unit_id: "phase_24_abstract", node_index: 7, node_type: "test", module_type: "test", label: "Unit 24 Test", test_scope: "unit", difficulty: 10, cefr_level: "B2", vocab_introduces: [], vocab_requires: [] },
        { id: "p25_T", course_id: "course_vi_en_v1", unit_id: "phase_25_environment", node_index: 9, node_type: "test", module_type: "test", label: "Unit 25 Test", test_scope: "unit", difficulty: 10, cefr_level: "B2", vocab_introduces: [], vocab_requires: [] },
        { id: "p26_T", course_id: "course_vi_en_v1", unit_id: "phase_26_education", node_index: 7, node_type: "test", module_type: "test", label: "Unit 26 Test", test_scope: "unit", difficulty: 10, cefr_level: "B2", vocab_introduces: [], vocab_requires: [] },
        { id: "p27_T", course_id: "course_vi_en_v1", unit_id: "phase_27_economy", node_index: 9, node_type: "test", module_type: "test", label: "Unit 27 Test", test_scope: "unit", difficulty: 10, cefr_level: "B2", vocab_introduces: [], vocab_requires: [] },
        { id: "p28_T", course_id: "course_vi_en_v1", unit_id: "phase_28_relationships", node_index: 7, node_type: "test", module_type: "test", label: "Unit 28 Test", test_scope: "unit", difficulty: 10, cefr_level: "C1", vocab_introduces: [], vocab_requires: [] },
        { id: "p29_T", course_id: "course_vi_en_v1", unit_id: "phase_29_history", node_index: 9, node_type: "test", module_type: "test", label: "Unit 29 Test", test_scope: "unit", difficulty: 10, cefr_level: "C1", vocab_introduces: [], vocab_requires: [] },
        { id: "p30_T", course_id: "course_vi_en_v1", unit_id: "phase_30_arts", node_index: 7, node_type: "test", module_type: "test", label: "Unit 30 Test", test_scope: "unit", difficulty: 10, cefr_level: "C1", vocab_introduces: [], vocab_requires: [] },
        { id: "p31_T", course_id: "course_vi_en_v1", unit_id: "phase_31_law", node_index: 7, node_type: "test", module_type: "test", label: "Unit 31 Test", test_scope: "unit", difficulty: 10, cefr_level: "C1", vocab_introduces: [], vocab_requires: [] },
        { id: "p32_T", course_id: "course_vi_en_v1", unit_id: "phase_32_healthcare", node_index: 9, node_type: "test", module_type: "test", label: "Unit 32 Test", test_scope: "unit", difficulty: 10, cefr_level: "C1", vocab_introduces: [], vocab_requires: [] },
        { id: "p33_T", course_id: "course_vi_en_v1", unit_id: "phase_33_regional", node_index: 7, node_type: "test", module_type: "test", label: "Unit 33 Test", test_scope: "unit", difficulty: 10, cefr_level: "C1", vocab_introduces: [], vocab_requires: [] },
        { id: "p34_T", course_id: "course_vi_en_v1", unit_id: "phase_34_rhetoric", node_index: 9, node_type: "test", module_type: "test", label: "Unit 34 Test", test_scope: "unit", difficulty: 10, cefr_level: "C2", vocab_introduces: [], vocab_requires: [] },
        { id: "p35_T", course_id: "course_vi_en_v1", unit_id: "phase_35_religion", node_index: 7, node_type: "test", module_type: "test", label: "Unit 35 Test", test_scope: "unit", difficulty: 10, cefr_level: "C2", vocab_introduces: [], vocab_requires: [] },
        { id: "p36_T", course_id: "course_vi_en_v1", unit_id: "phase_36_diplomacy", node_index: 7, node_type: "test", module_type: "test", label: "Unit 36 Test", test_scope: "unit", difficulty: 10, cefr_level: "C2", vocab_introduces: [], vocab_requires: [] },
        { id: "p37_T", course_id: "course_vi_en_v1", unit_id: "phase_37_science", node_index: 9, node_type: "test", module_type: "test", label: "Unit 37 Test", test_scope: "unit", difficulty: 10, cefr_level: "C2", vocab_introduces: [], vocab_requires: [] },
        { id: "p38_T", course_id: "course_vi_en_v1", unit_id: "phase_38_cuisine", node_index: 7, node_type: "test", module_type: "test", label: "Unit 38 Test", test_scope: "unit", difficulty: 10, cefr_level: "C2", vocab_introduces: [], vocab_requires: [] },
        { id: "p39_T", course_id: "course_vi_en_v1", unit_id: "phase_39_hospitality", node_index: 7, node_type: "test", module_type: "test", label: "Final Test", test_scope: "unit", difficulty: 10, cefr_level: "C2", vocab_introduces: [], vocab_requires: [] }
    ],
    items: [..._mergedBuilt.items],
    translations: [..._mergedBuilt.translations],
    exercises: [
        // Exercises are now auto-generated at runtime by exerciseGenerator.js
    ],
    lesson_blueprints: [..._mergedBuilt.blueprints],

    scene_locations: SCENE_LOCATIONS,
    scenes: SCENES

};
