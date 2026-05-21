// Static curriculum seed data and builders for the local mock DB.

import { SCENE_LOCATIONS, SCENES } from './sceneSeedData';

// ── Diacritics stripping ──
const stripDiacritics = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/ơ/g, 'o').replace(/Ơ/g, 'O')
    .replace(/ư/g, 'u').replace(/Ư/g, 'U');

// ── Declarative lesson definitions ──
// Define words + sentences here → items, translations, blueprints, lessons, and path_nodes are auto-generated.
// To add a new lesson: just add an entry here. Everything else is derived.
const LESSON_DEFS = [
    // ═══ Unit 1: First Words ═══
    {
        id: "lesson_001a", unit: "phase_1_first_words", title: "Say Hello",
        nodeId: "p1_L001a", quizId: "p1_Q001a", quizLabel: "Greetings Quiz",
        nodeIndex: 1, difficulty: 1, cefr: "A1.1", xp: 8,
        topic: "greetings", // Learner mode topic filter
        focus: ["greetings", "farewell"],
        words: [
            { id: "it_w_0001", vi: "xin chào", en: "hello (polite)", emoji: "👋" },
            { id: "it_w_0002", vi: "chào", en: "hi / hello", emoji: "👋" },
            { id: "it_w_0003", vi: "tạm biệt", en: "goodbye", emoji: "👋" },
        ],
    },
    {
        id: "lesson_001b", unit: "phase_1_first_words", title: "Thank You",
        nodeId: "p1_L001b", quizId: "p1_Q001b", quizLabel: "Thank You Quiz",
        nodeIndex: 4, difficulty: 1, cefr: "A1.1", xp: 8,
        topic: "greetings", // Learner mode topic filter
        focus: ["politeness", "first_pronouns"],
        words: [
            { id: "it_w_0004", vi: "cảm ơn", en: "thank you", emoji: "🙏" },
            { id: "it_w_0007", vi: "không", en: "no / not", emoji: "❌" },
            { id: "it_w_0008", vi: "tôi", en: "I / me", emoji: "👤" },
            { id: "it_w_0009", vi: "bạn", en: "you (friend)", emoji: "👥" },
        ],
        sentences: [
            { id: "it_s_0037", vi: "Cảm ơn!", en: "Thank you!" },
        ],
    },
    {
        id: "lesson_002a", unit: "phase_1_first_words", title: "What's Your Name?",
        nodeId: "p1_L002a", quizId: "p1_Q002a", quizLabel: "Name Quiz",
        nodeIndex: 10, difficulty: 2, cefr: "A1.1", xp: 8,
        topic: "greetings", // Learner mode topic filter
        focus: ["introductions", "question_form"],
        sentences: [
            { id: "it_s_0012", vi: "Bạn tên là gì?", en: "What is your name?" },
        ],
    },
    {
        id: "lesson_002b", unit: "phase_1_first_words", title: "Nice to Meet You",
        nodeId: "p1_L002b", quizId: "p1_Q002b", quizLabel: "Meeting Quiz",
        nodeIndex: 13, difficulty: 2, cefr: "A1.1", xp: 8,
        topic: "greetings", // Learner mode topic filter
        focus: ["meeting_people"],
        sentences: [
            { id: "it_s_0013", vi: "Rất vui được gặp bạn.", en: "Nice to meet you." },
        ],
    },

    // ═══ Unit 2: Polite Survival ═══
    {
        id: "lesson_003", unit: "phase_2_polite", title: "Be Polite",
        nodeId: "p2_L003", quizId: "p2_Q003", quizLabel: "Polite Phrases Quiz",
        nodeIndex: 1, difficulty: 3, cefr: "A1.1", xp: 12,
        topic: "basics", // Learner mode topic filter
        focus: ["polite_requests", "repair_phrases"],
        words: [
            { id: "it_w_0005", vi: "vâng", en: "yes (Northern)", emoji: "✅", dialect: "north" },
            { id: "it_w_0006", vi: "dạ", en: "yes (Southern / polite response)", emoji: "✅", dialect: "south" },
            { id: "it_w_0014", vi: "xin lỗi", en: "sorry / excuse me", emoji: "🙇" },
            { id: "it_w_0015", vi: "làm ơn", en: "please (as a request)", emoji: "🙏" },
        ],
        sentences: [
            { id: "it_s_0016", vi: "Tôi không hiểu.", en: "I don't understand." },
            { id: "it_s_0017", vi: "Nói chậm lại.", en: "Speak more slowly." },
        ],
    },
    {
        id: "lesson_004", unit: "phase_2_polite", title: "Count to 5",
        nodeId: "p2_L004", quizId: "p2_Q004", quizLabel: "Numbers 1–5 Quiz",
        nodeIndex: 4, difficulty: 4, cefr: "A1.1", xp: 12,
        topic: "basics", // Learner mode topic filter
        focus: ["numbers_1_5"],
        words: [
            { id: "it_w_0020", vi: "một", en: "one", emoji: "1️⃣" },
            { id: "it_w_0021", vi: "hai", en: "two", emoji: "2️⃣" },
            { id: "it_w_0022", vi: "ba", en: "three", emoji: "3️⃣" },
            { id: "it_w_0023", vi: "bốn", en: "four", emoji: "4️⃣" },
            { id: "it_w_0024", vi: "năm", en: "five", emoji: "5️⃣" },
        ],
        sentences: [
            { id: "it_s_0220", vi: "Một, hai, ba!", en: "One, two, three!" },
            { id: "it_s_0221", vi: "Tôi có năm bạn.", en: "I have five friends." },
        ],
    },
    {
        id: "lesson_025", unit: "phase_2_polite", title: "Count to 10",
        nodeId: "p2_L025", quizId: "p2_Q025", quizLabel: "Numbers 6–10 Quiz",
        nodeIndex: 6, difficulty: 5, cefr: "A1.1", xp: 12,
        topic: "basics", // Learner mode topic filter
        focus: ["numbers_6_10"],
        words: [
            { id: "it_w_0025", vi: "sáu", en: "six", emoji: "6️⃣" },
            { id: "it_w_0026", vi: "bảy", en: "seven", emoji: "7️⃣" },
            { id: "it_w_0027", vi: "tám", en: "eight", emoji: "8️⃣" },
            { id: "it_w_0028", vi: "chín", en: "nine", emoji: "9️⃣" },
            { id: "it_w_0029", vi: "mười", en: "ten", emoji: "🔟" },
        ],
        sentences: [
            { id: "it_s_0222", vi: "Tám hay chín?", en: "Eight or nine?" },
            { id: "it_s_0223", vi: "Từ sáu đến mười.", en: "From six to ten." },
        ],
    },

    // ═══ Unit 3: Ordering & Café ═══
    {
        id: "lesson_005", unit: "phase_3_cafe", title: "Order Something",
        nodeId: "p3_L005", quizId: "p3_Q005", quizLabel: "Ordering Quiz",
        nodeIndex: 1, difficulty: 5, cefr: "A1.2", xp: 14,
        topic: "restaurant", // Learner mode topic filter
        focus: ["ordering", "diacritics_awareness"],
        words: [
            { id: "it_w_0030", vi: "cà phê", en: "coffee", emoji: "☕" },
            { id: "it_w_0031", vi: "trà", en: "tea", emoji: "🍵" },
            { id: "it_w_0032", vi: "nước", en: "water", emoji: "💧" },
            { id: "it_w_0035", vi: "muốn", en: "to want", emoji: "💭" },
            { id: "it_w_0036", vi: "cho", en: "give (request form)", emoji: "🤲" },
        ],
        sentences: [
            { id: "it_s_0033", vi: "Cho tôi cà phê.", en: "Give me coffee." },
            { id: "it_s_0034", vi: "Tôi muốn một trà.", en: "I want a tea." },
        ],
    },
    {
        id: "lesson_006", unit: "phase_3_cafe", title: "At the Café",
        nodeId: "p3_L006", quizId: "p3_Q006", quizLabel: "Café Quiz",
        nodeIndex: 5, difficulty: 6, cefr: "A1.2", xp: 14,
        topic: "restaurant", // Learner mode topic filter
        focus: ["cafe_ordering", "drinks"],
        words: [
            { id: "it_w_0040", vi: "cà phê sữa đá", en: "iced milk coffee", emoji: "☕" },
            { id: "it_w_0041", vi: "sữa", en: "milk", emoji: "🥛" },
            { id: "it_w_0042", vi: "đá", en: "ice", emoji: "🧊" },
            { id: "it_w_0043", vi: "nóng", en: "hot", emoji: "🔥" },
        ],
        sentences: [
            { id: "it_s_0044", vi: "Tôi muốn cà phê sữa đá.", en: "I want iced milk coffee." },
        ],
    },

    // ═══ Unit 4: Food & Prices ═══
    {
        id: "lesson_007", unit: "phase_4_food", title: "Talk About Food",
        nodeId: "p4_L007", quizId: "p4_Q007", quizLabel: "Food Quiz",
        nodeIndex: 1, difficulty: 6, cefr: "A1.2", xp: 14,
        topic: "restaurant", // Learner mode topic filter
        focus: ["food_vocabulary"],
        words: [
            { id: "it_w_0045", vi: "phở", en: "pho (noodle soup)", emoji: "🍜" },
            { id: "it_w_0046", vi: "bánh mì", en: "Vietnamese sandwich", emoji: "🥖" },
            { id: "it_w_0047", vi: "bún", en: "rice noodles", emoji: "🍜" },
            { id: "it_w_0048", vi: "cơm", en: "rice", emoji: "🍚" },
            { id: "it_w_0050", vi: "bát", en: "bowl", emoji: "🥣" },
            { id: "it_w_0051", vi: "ngon", en: "delicious", emoji: "😋" },
        ],
        sentences: [
            { id: "it_s_0049", vi: "Tôi muốn một bát phở.", en: "I want a bowl of pho." },
        ],
    },
    {
        id: "lesson_008", unit: "phase_4_food", title: "Ask the Price",
        nodeId: "p4_L008", quizId: "p4_Q008", quizLabel: "Prices Quiz",
        nodeIndex: 4, difficulty: 7, cefr: "A1.2", xp: 16,
        topic: "money", // Learner mode topic filter
        focus: ["prices", "haggling"],
        words: [
            { id: "it_w_0052", vi: "bao nhiêu", en: "how much / how many", emoji: "🔢" },
            { id: "it_w_0053", vi: "tiền", en: "money", emoji: "💰" },
            { id: "it_w_0055", vi: "cái này", en: "this (thing)", emoji: "👆" },
            { id: "it_w_0056", vi: "đắt", en: "expensive", emoji: "💸" },
            { id: "it_w_0057", vi: "rẻ", en: "cheap", emoji: "🏷️" },
        ],
        sentences: [
            { id: "it_s_0054", vi: "Cái này bao nhiêu tiền?", en: "How much does this cost?" },
        ],
    },

    // ═══ Unit 5: Market Life ═══
    {
        id: "lesson_009", unit: "phase_5_market", title: "Learn Colors",
        nodeId: "p5_L009", quizId: "p5_Q009", quizLabel: "Colors Quiz",
        nodeIndex: 1, difficulty: 5, cefr: "A1.3", xp: 16,
        topic: "shopping", // Learner mode topic filter
        focus: ["colors"],
        words: [
            { id: "it_w_0060", vi: "màu", en: "color", emoji: "🎨" },
            { id: "it_w_0061", vi: "đỏ", en: "red", emoji: "🔴" },
            { id: "it_w_0062", vi: "xanh", en: "blue / green", emoji: "🟢" },
            { id: "it_w_0063", vi: "trắng", en: "white", emoji: "⚪" },
            { id: "it_w_0064", vi: "đen", en: "black", emoji: "⚫" },
            { id: "it_w_0065", vi: "vàng", en: "yellow", emoji: "🟡" },
        ],
        sentences: [
            { id: "it_s_0224", vi: "Tôi thích màu đỏ.", en: "I like the color red." },
            { id: "it_s_0225", vi: "Cái áo màu xanh.", en: "The blue shirt." },
        ],
    },
    {
        id: "lesson_026", unit: "phase_5_market", title: "Describe Things",
        nodeId: "p5_L026", quizId: "p5_Q026", quizLabel: "Adjectives Quiz",
        nodeIndex: 3, difficulty: 6, cefr: "A1.3", xp: 16,
        topic: "basics", // Learner mode topic filter
        focus: ["descriptions", "adjectives"],
        words: [
            { id: "it_w_0066", vi: "to", en: "big / large", emoji: "📏" },
            { id: "it_w_0067", vi: "nhỏ", en: "small / little", emoji: "🔹" },
            { id: "it_w_0068", vi: "đẹp", en: "beautiful / pretty", emoji: "✨" },
            { id: "it_w_0069", vi: "xấu", en: "ugly / bad", emoji: "👎" },
        ],
        sentences: [
            { id: "it_s_0226", vi: "Cái nhà to quá!", en: "The house is so big!" },
            { id: "it_s_0227", vi: "Hoa đẹp quá!", en: "The flowers are so beautiful!" },
        ],
    },
    {
        id: "lesson_010", unit: "phase_5_market", title: "Haggle at the Market",
        nodeId: "p5_L010", quizId: "p5_Q010", quizLabel: "Haggling Quiz",
        nodeIndex: 6, difficulty: 7, cefr: "A1.3", xp: 16,
        topic: "shopping", // Learner mode topic filter
        focus: ["haggling", "shopping"],
        words: [
            { id: "it_w_0070", vi: "mua", en: "to buy", emoji: "🛒" },
            { id: "it_w_0071", vi: "bán", en: "to sell", emoji: "🏪" },
            { id: "it_w_0072", vi: "mắc", en: "expensive (Southern)", emoji: "💸" },
            { id: "it_w_0073", vi: "bớt", en: "to reduce / discount", emoji: "⬇️" },
            { id: "it_w_0074", vi: "giảm", en: "to reduce / lower", emoji: "📉" },
            { id: "it_w_0077", vi: "được không", en: "is that ok? / can you?", emoji: "❓" },
        ],
        sentences: [
            { id: "it_s_0075", vi: "Mắc quá! Bớt đi.", en: "Too expensive! Lower the price." },
            { id: "it_s_0076", vi: "Tôi muốn mua cái này.", en: "I want to buy this." },
        ],
    },

    // ═══ Unit 6: Numbers Advanced ═══
    {
        id: "lesson_011", unit: "phase_6_numbers", title: "Pick Some Fruit",
        nodeId: "p6_L011", quizId: "p6_Q011", quizLabel: "Fruits Quiz",
        nodeIndex: 1, difficulty: 5, cefr: "A1.3", xp: 16,
        topic: "shopping", // Learner mode topic filter
        focus: ["fruits"],
        words: [
            { id: "it_w_0080", vi: "trái cây", en: "fruit", emoji: "🍎" },
            { id: "it_w_0081", vi: "cam", en: "orange", emoji: "🍊" },
            { id: "it_w_0082", vi: "xoài", en: "mango", emoji: "🥭" },
            { id: "it_w_0083", vi: "dừa", en: "coconut", emoji: "🥥" },
            { id: "it_w_0084", vi: "dưa hấu", en: "watermelon", emoji: "🍉" },
        ],
        sentences: [
            { id: "it_s_0228", vi: "Tôi muốn mua cam.", en: "I want to buy oranges." },
            { id: "it_s_0229", vi: "Xoài rất ngon.", en: "Mango is very delicious." },
        ],
    },
    {
        id: "lesson_027", unit: "phase_6_numbers", title: "Buy Vegetables",
        nodeId: "p6_L027", quizId: "p6_Q027", quizLabel: "Vegetables Quiz",
        nodeIndex: 3, difficulty: 6, cefr: "A1.3", xp: 16,
        topic: "shopping", // Learner mode topic filter
        focus: ["vegetables"],
        words: [
            { id: "it_w_0085", vi: "rau", en: "vegetable", emoji: "🥬" },
            { id: "it_w_0086", vi: "cà chua", en: "tomato", emoji: "🍅" },
            { id: "it_w_0087", vi: "khoai", en: "potato / sweet potato", emoji: "🥔" },
        ],
        sentences: [
            { id: "it_s_0230", vi: "Tôi ăn rau mỗi ngày.", en: "I eat vegetables every day." },
            { id: "it_s_0231", vi: "Cà chua màu đỏ.", en: "Tomatoes are red." },
        ],
    },
    {
        id: "lesson_012", unit: "phase_6_numbers", title: "Big Numbers & Bills",
        nodeId: "p6_L012", quizId: "p6_Q012", quizLabel: "Big Numbers Quiz",
        nodeIndex: 6, difficulty: 7, cefr: "A1.3", xp: 16,
        topic: "money", // Learner mode topic filter
        focus: ["big_numbers", "bills"],
        words: [
            { id: "it_w_0090", vi: "trăm", en: "hundred", emoji: "💯" },
            { id: "it_w_0091", vi: "nghìn", en: "thousand (Northern)", emoji: "🔢" },
            { id: "it_w_0092", vi: "ngàn", en: "thousand (Southern)", emoji: "🔢" },
            { id: "it_w_0093", vi: "triệu", en: "million", emoji: "💎" },
            { id: "it_w_0094", vi: "hóa đơn", en: "bill / receipt", emoji: "🧾" },
        ],
        sentences: [
            { id: "it_s_0095", vi: "Tính tiền, làm ơn.", en: "The bill, please." },
        ],
    },

    // ═══ Unit 7: Getting Around ═══
    {
        id: "lesson_013", unit: "phase_7_transport", title: "Directions",
        nodeId: "p7_L013", quizId: "p7_Q013", quizLabel: "Directions Quiz",
        nodeIndex: 1, difficulty: 5, cefr: "A2.1", xp: 14,
        topic: "directions", // Learner mode topic filter
        focus: ["directions"],
        words: [
            { id: "it_w_0100", vi: "đi", en: "to go", emoji: "🚶" },
            { id: "it_w_0101", vi: "đường", en: "road / street", emoji: "🛤️" },
            { id: "it_w_0102", vi: "bên trái", en: "left side", emoji: "⬅️" },
            { id: "it_w_0103", vi: "bên phải", en: "right side", emoji: "➡️" },
            { id: "it_w_0104", vi: "thẳng", en: "straight", emoji: "⬆️" },
        ],
        sentences: [
            { id: "it_s_0107", vi: "Đi thẳng rồi quẹo trái.", en: "Go straight then turn left." },
        ],
    },
    {
        id: "lesson_030", unit: "phase_7_transport", title: "Distance",
        nodeId: "p7_L030", quizId: "p7_Q030", quizLabel: "Distance Quiz",
        nodeIndex: 3, difficulty: 6, cefr: "A2.1", xp: 14,
        topic: "directions", // Learner mode topic filter
        focus: ["distance"],
        words: [
            { id: "it_w_0105", vi: "gần", en: "near / close", emoji: "📍" },
            { id: "it_w_0106", vi: "xa", en: "far", emoji: "🌍" },
        ],
        sentences: [
            { id: "it_s_0242", vi: "Nhà tôi gần đây.", en: "My house is nearby." },
            { id: "it_s_0243", vi: "Có xa không?", en: "Is it far?" },
        ],
    },
    {
        id: "lesson_014", unit: "phase_7_transport", title: "Taxi & Transport",
        nodeId: "p7_L014", quizId: "p7_Q014", quizLabel: "Taxi Quiz",
        nodeIndex: 6, difficulty: 7, cefr: "A2.1", xp: 16,
        topic: "transport", // Learner mode topic filter
        focus: ["transport", "taxi"],
        words: [
            { id: "it_w_0110", vi: "xe", en: "vehicle", emoji: "🏍️" },
            { id: "it_w_0111", vi: "xe ôm", en: "motorbike taxi", emoji: "🏍️" },
            { id: "it_w_0112", vi: "dừng lại", en: "stop", emoji: "🛑" },
            { id: "it_w_0113", vi: "ở đây", en: "here", emoji: "📍" },
            { id: "it_w_0114", vi: "đến", en: "to arrive / to", emoji: "📍" },
        ],
        sentences: [
            { id: "it_s_0115", vi: "Cho tôi đến khách sạn.", en: "Take me to the hotel." },
            { id: "it_s_0116", vi: "Dừng ở đây, làm ơn.", en: "Stop here, please." },
        ],
    },
    {
        id: "lesson_015", unit: "phase_7_transport", title: "At the Hotel",
        nodeId: "p7_L015", quizId: "p7_Q015", quizLabel: "Hotel Quiz",
        nodeIndex: 9, difficulty: 8, cefr: "A2.1", xp: 16,
        topic: "hotel", // Learner mode topic filter
        focus: ["hotel", "accommodation"],
        words: [
            { id: "it_w_0120", vi: "khách sạn", en: "hotel", emoji: "🏨" },
            { id: "it_w_0121", vi: "phòng", en: "room", emoji: "🚪" },
            { id: "it_w_0122", vi: "chìa khóa", en: "key", emoji: "🔑" },
            { id: "it_w_0123", vi: "giường", en: "bed", emoji: "🛏️" },
            { id: "it_w_0124", vi: "nhà vệ sinh", en: "bathroom / toilet", emoji: "🚽" },
        ],
        sentences: [
            { id: "it_s_0125", vi: "Phòng có wifi không?", en: "Does the room have wifi?" },
        ],
    },
    {
        id: "lesson_016", unit: "phase_7_transport", title: "Asking for Help",
        nodeId: "p7_L016", quizId: "p7_Q016", quizLabel: "Help Quiz",
        nodeIndex: 12, difficulty: 9, cefr: "A2.1", xp: 16,
        topic: "emergency", // Learner mode topic filter
        focus: ["emergency", "help"],
        words: [
            { id: "it_w_0130", vi: "giúp", en: "to help", emoji: "🆘" },
            { id: "it_w_0131", vi: "tìm", en: "to find / to look for", emoji: "🔍" },
            { id: "it_w_0132", vi: "bị lạc", en: "to be lost", emoji: "😰" },
            { id: "it_w_0133", vi: "cần", en: "to need", emoji: "❗" },
            { id: "it_w_0134", vi: "gọi", en: "to call", emoji: "📞" },
        ],
        sentences: [
            { id: "it_s_0135", vi: "Giúp tôi với!", en: "Help me!" },
            { id: "it_s_0136", vi: "Tôi bị lạc.", en: "I am lost." },
        ],
    },

    // ═══ Unit 8: Daily Life ═══
    {
        id: "lesson_017", unit: "phase_8_daily", title: "Time & Schedule",
        nodeId: "p8_L017", quizId: "p8_Q017", quizLabel: "Time Quiz",
        nodeIndex: 1, difficulty: 5, cefr: "A2.1", xp: 16,
        topic: "basics", // Learner mode topic filter
        focus: ["time", "time_of_day"],
        words: [
            { id: "it_w_0140", vi: "giờ", en: "hour / o'clock", emoji: "🕐" },
            { id: "it_w_0141", vi: "phút", en: "minute", emoji: "⏱️" },
            { id: "it_w_0142", vi: "sáng", en: "morning", emoji: "🌅" },
            { id: "it_w_0143", vi: "chiều", en: "afternoon", emoji: "🌇" },
            { id: "it_w_0144", vi: "tối", en: "evening / night", emoji: "🌙" },
        ],
        sentences: [
            { id: "it_s_0232", vi: "Sáng hay chiều?", en: "Morning or afternoon?" },
            { id: "it_s_0233", vi: "Mấy giờ rồi?", en: "What time is it?" },
        ],
    },
    {
        id: "lesson_028", unit: "phase_8_daily", title: "Days & Schedule",
        nodeId: "p8_L028", quizId: "p8_Q028", quizLabel: "Days Quiz",
        nodeIndex: 3, difficulty: 6, cefr: "A2.1", xp: 14,
        topic: "basics", // Learner mode topic filter
        focus: ["days", "schedule"],
        words: [
            { id: "it_w_0145", vi: "hôm nay", en: "today", emoji: "📅" },
            { id: "it_w_0146", vi: "ngày mai", en: "tomorrow", emoji: "📆" },
            { id: "it_w_0147", vi: "hôm qua", en: "yesterday", emoji: "⏪" },
        ],
        sentences: [
            { id: "it_s_0148", vi: "Bây giờ là mấy giờ?", en: "What time is it?" },
        ],
    },
    {
        id: "lesson_018", unit: "phase_8_daily", title: "Weather",
        nodeId: "p8_L018", quizId: "p8_Q018", quizLabel: "Weather Quiz",
        nodeIndex: 6, difficulty: 7, cefr: "A2.1", xp: 16,
        topic: "sightseeing", // Learner mode topic filter
        focus: ["weather"],
        words: [
            { id: "it_w_0150", vi: "trời", en: "sky / weather", emoji: "🌤️" },
            { id: "it_w_0151", vi: "mưa", en: "rain", emoji: "🌧️" },
            { id: "it_w_0152", vi: "nắng", en: "sunny", emoji: "☀️" },
            { id: "it_w_0153", vi: "gió", en: "wind / windy", emoji: "💨" },
            { id: "it_w_0154", vi: "lạnh", en: "cold", emoji: "🥶" },
            { id: "it_w_0155", vi: "mát", en: "cool / pleasant", emoji: "🌬️" },
        ],
        sentences: [
            { id: "it_s_0156", vi: "Hôm nay trời đẹp quá!", en: "The weather is so nice today!" },
        ],
    },
    {
        id: "lesson_019", unit: "phase_8_daily", title: "Family",
        nodeId: "p8_L019", quizId: "p8_Q019", quizLabel: "Parents Quiz",
        nodeIndex: 9, difficulty: 8, cefr: "A2.1", xp: 16,
        topic: "family", // Learner mode topic filter
        focus: ["family", "parents"],
        words: [
            { id: "it_w_0160", vi: "bố", en: "father (Northern)", emoji: "👨" },
            { id: "it_w_0161", vi: "ba", en: "father (Southern)", emoji: "👨" },
            { id: "it_w_0162", vi: "mẹ", en: "mother (Northern)", emoji: "👩" },
            { id: "it_w_0163", vi: "má", en: "mother (Southern)", emoji: "👩" },
            { id: "it_w_0164", vi: "anh", en: "older brother", emoji: "👦" },
            { id: "it_w_0165", vi: "chị", en: "older sister", emoji: "👧" },
        ],
        sentences: [
            { id: "it_s_0234", vi: "Bố mẹ tôi khỏe.", en: "My parents are well." },
            { id: "it_s_0235", vi: "Anh chị khỏe không?", en: "Are you well? (to older sibling)" },
        ],
    },
    {
        id: "lesson_029", unit: "phase_8_daily", title: "Family (Extended)",
        nodeId: "p8_L029", quizId: "p8_Q029", quizLabel: "Siblings Quiz",
        nodeIndex: 11, difficulty: 9, cefr: "A2.1", xp: 14,
        topic: "family", // Learner mode topic filter
        focus: ["family", "extended"],
        words: [
            { id: "it_w_0166", vi: "em", en: "younger sibling", emoji: "🧒" },
            { id: "it_w_0167", vi: "con", en: "child", emoji: "👶" },
            { id: "it_w_0168", vi: "vợ", en: "wife", emoji: "💑" },
            { id: "it_w_0169", vi: "chồng", en: "husband", emoji: "💏" },
        ],
        sentences: [
            { id: "it_s_0236", vi: "Em tôi còn nhỏ.", en: "My younger sibling is still small." },
            { id: "it_s_0237", vi: "Vợ chồng tôi rất vui.", en: "My wife/husband and I are very happy." },
        ],
    },
    {
        id: "lesson_020", unit: "phase_8_daily", title: "House & Rooms",
        nodeId: "p8_L020", quizId: "p8_Q020", quizLabel: "Rooms Quiz",
        nodeIndex: 14, difficulty: 9, cefr: "A2.1", xp: 16,
        topic: "home", // Learner mode topic filter
        focus: ["house", "rooms"],
        words: [
            { id: "it_w_0170", vi: "nhà", en: "house / home", emoji: "🏠" },
            { id: "it_w_0171", vi: "nhà bếp", en: "kitchen", emoji: "🍳" },
            { id: "it_w_0172", vi: "phòng ngủ", en: "bedroom", emoji: "🛏️" },
            { id: "it_w_0173", vi: "phòng khách", en: "living room", emoji: "🛋️" },
        ],
        sentences: [
            { id: "it_s_0238", vi: "Nhà bếp rất sạch.", en: "The kitchen is very clean." },
            { id: "it_s_0239", vi: "Phòng khách rất to.", en: "The living room is very big." },
        ],
    },
    {
        id: "lesson_031", unit: "phase_8_daily", title: "Furniture",
        nodeId: "p8_L031", quizId: "p8_Q031", quizLabel: "Furniture Quiz",
        nodeIndex: 16, difficulty: 10, cefr: "A2.1", xp: 14,
        topic: "home", // Learner mode topic filter
        focus: ["furniture"],
        words: [
            { id: "it_w_0174", vi: "cửa", en: "door", emoji: "🚪" },
            { id: "it_w_0175", vi: "ghế", en: "chair", emoji: "💺" },
            { id: "it_w_0176", vi: "bàn", en: "table / desk", emoji: "🪑" },
        ],
        sentences: [
            { id: "it_s_0240", vi: "Ngồi trên ghế đi.", en: "Sit on the chair." },
            { id: "it_s_0241", vi: "Đặt trên bàn.", en: "Put it on the table." },
        ],
    },

    // ═══ Unit 9: Social Life ═══
    {
        id: "lesson_021", unit: "phase_9_social", title: "Hobbies",
        nodeId: "p9_L021", quizId: "p9_Q021", quizLabel: "Hobbies Quiz",
        nodeIndex: 1, difficulty: 6, cefr: "A2.2", xp: 16,
        topic: "sightseeing", // Learner mode topic filter
        focus: ["hobbies"],
        words: [
            { id: "it_w_0180", vi: "thích", en: "to like / to enjoy", emoji: "❤️" },
            { id: "it_w_0181", vi: "đi chơi", en: "to hang out / go out", emoji: "🎉" },
            { id: "it_w_0182", vi: "xem phim", en: "to watch movies", emoji: "🎬" },
            { id: "it_w_0183", vi: "nghe nhạc", en: "to listen to music", emoji: "🎵" },
            { id: "it_w_0184", vi: "nấu ăn", en: "to cook", emoji: "🍳" },
            { id: "it_w_0185", vi: "đọc sách", en: "to read books", emoji: "📖" },
        ],
        sentences: [
            { id: "it_s_0186", vi: "Bạn thích làm gì?", en: "What do you like to do?" },
        ],
    },
    {
        id: "lesson_022", unit: "phase_9_social", title: "Feelings & Emotions",
        nodeId: "p9_L022", quizId: "p9_Q022", quizLabel: "Feelings Quiz",
        nodeIndex: 4, difficulty: 7, cefr: "A2.2", xp: 16,
        topic: "basics", // Learner mode topic filter
        focus: ["feelings", "emotions"],
        words: [
            { id: "it_w_0190", vi: "vui", en: "happy / fun", emoji: "😊" },
            { id: "it_w_0191", vi: "buồn", en: "sad", emoji: "😢" },
            { id: "it_w_0192", vi: "mệt", en: "tired", emoji: "😩" },
            { id: "it_w_0193", vi: "đói", en: "hungry", emoji: "🤤" },
            { id: "it_w_0194", vi: "khát", en: "thirsty", emoji: "🥤" },
            { id: "it_w_0195", vi: "sợ", en: "scared / afraid", emoji: "😨" },
        ],
        sentences: [
            { id: "it_s_0196", vi: "Tôi mệt quá.", en: "I am so tired." },
        ],
    },
    {
        id: "lesson_023", unit: "phase_9_social", title: "Make Plans",
        nodeId: "p9_L023", quizId: "p9_Q023", quizLabel: "Invitations Quiz",
        nodeIndex: 7, difficulty: 8, cefr: "A2.2", xp: 16,
        topic: "sightseeing", // Learner mode topic filter
        focus: ["invitations", "plans"],
        words: [
            { id: "it_w_0200", vi: "cuối tuần", en: "weekend", emoji: "🗓️" },
            { id: "it_w_0201", vi: "rảnh", en: "free (available)", emoji: "🆓" },
            { id: "it_w_0202", vi: "bận", en: "busy", emoji: "📋" },
            { id: "it_w_0203", vi: "cùng", en: "together", emoji: "🤝" },
            { id: "it_w_0204", vi: "hẹn", en: "to make an appointment", emoji: "📅" },
        ],
        sentences: [
            { id: "it_s_0205", vi: "Cuối tuần bạn rảnh không?", en: "Are you free this weekend?" },
            { id: "it_s_0206", vi: "Đi chơi cùng tôi không?", en: "Do you want to hang out with me?" },
        ],
    },
    {
        id: "lesson_024", unit: "phase_9_social", title: "Celebrate Together",
        nodeId: "p9_L024", quizId: "p9_Q024", quizLabel: "Party Quiz",
        nodeIndex: 11, difficulty: 9, cefr: "A2.2", xp: 24,
        topic: "traditions", // Learner mode topic filter
        focus: ["celebrations", "party"],
        words: [
            { id: "it_w_0210", vi: "chúc mừng", en: "congratulations", emoji: "🎊" },
            { id: "it_w_0211", vi: "sinh nhật", en: "birthday", emoji: "🎂" },
            { id: "it_w_0212", vi: "quà", en: "gift / present", emoji: "🎁" },
            { id: "it_w_0213", vi: "tiệc", en: "party / feast", emoji: "🎉" },
            { id: "it_w_0216", vi: "chụp hình", en: "to take a photo", emoji: "📸" },
        ],
        sentences: [
            { id: "it_s_0214", vi: "Chúc mừng sinh nhật!", en: "Happy birthday!" },
            { id: "it_s_0215", vi: "Vui quá!", en: "So fun!" },
        ],
    },
];

// ── Unified Database ──
// Import the unified database (combines legacy + curriculum data)
import unifiedDB from '../../data/unified_db.json';

/**
 * Build internal structures from unified_db.json
 * This replaces the old buildFromDefs(LESSON_DEFS) approach
 */
function buildFromUnifiedDB(db) {
    const items = [];
    const translations = [];
    const blueprints = [];
    const lessons = [];
    const pathNodes = [];

    // Build vocabulary items
    (db.vocabulary || []).forEach(v => {
        const audioKey = "a_" + v.vi_text.replace(/[^a-zA-ZàáạảãăắằặẳẵâấầậẩẫèéẹẻẽêếềệểễìíịỉĩòóọỏõôốồộổỗơớờợởỡùúụủũưứừựửữỳýỵỷỹđĐ ]/g, '').replace(/ +/g, '_').toLowerCase();
        items.push({
            id: v.id,
            item_type: v.pos === 'phrase' ? 'phrase' : 'word',
            vi_text: v.vi_text,
            vi_text_no_diacritics: stripDiacritics(v.vi_text),
            audio_key: audioKey,
            dialect: v.dialect || 'both',
            emoji: v.emoji,
            pos: v.pos,
            frequency: v.frequency_rank,
            hasImage: v.has_image,
        });
        // Add translations
        (v.translations || []).forEach(t => {
            translations.push({
                item_id: v.id,
                lang: t.lang,
                text: t.text,
                is_alternate: !t.is_primary,
            });
        });
    });

    // Build sentence items
    (db.sentences || []).forEach(s => {
        const audioKey = "a_" + s.vi_text.replace(/[^a-zA-ZàáạảãăắằặẳẵâấầậẩẫèéẹẻẽêếềệểễìíịỉĩòóọỏõôốồộổỗơớờợởỡùúụủũưứừựửữỳýỵỷỹđĐ ]/g, '').replace(/ +/g, '_').toLowerCase();
        items.push({
            id: s.id,
            item_type: 'sentence',
            vi_text: s.vi_text,
            vi_text_no_diacritics: stripDiacritics(s.vi_text),
            audio_key: audioKey,
            dialect: 'both',
            token_count: s.token_count,
            tags: s.grammar_tags,
            note: s.grammar_note,
            accepted: (s.translations || []).map(t => t.text),
        });
        // Add translations
        (s.translations || []).forEach(t => {
            translations.push({
                item_id: s.id,
                lang: t.lang,
                text: t.text,
                is_alternate: !t.is_primary,
            });
        });
    });

    // Build lessons, blueprints, and path_nodes from db.lessons
    (db.lessons || []).forEach(lesson => {
        // Find vocab and sentences for this lesson
        const lessonVocab = (db.vocabulary || []).filter(v => v.lesson_id === lesson.id);
        const lessonSentences = (db.sentences || []).filter(s => s.lesson_id === lesson.id);
        const itemIds = [...lessonVocab.map(v => v.id), ...lessonSentences.map(s => s.id)];

        lessons.push({
            id: lesson.id,
            course_id: "course_vi_en_v1",
            skill_id: `skill_${lesson.id}`,
            lesson_index: lesson.order_index,
            title: lesson.title,
            target_xp: lesson.xp_reward || 10,
        });

        blueprints.push({
            lesson_id: lesson.id,
            focus: lesson.focus || [],
            introduced_items: itemIds,
        });

        // Create lesson path_node
        if (lesson.node_id) {
            pathNodes.push({
                id: lesson.node_id,
                course_id: "course_vi_en_v1",
                unit_id: lesson.unit_id,
                node_index: lesson.order_index,
                node_type: "lesson",
                module_type: "orange",
                lesson_id: lesson.id,
                difficulty: lesson.difficulty || 1,
                cefr_level: lesson.cefr_level || "A1.1",
                vocab_introduces: itemIds,
                vocab_requires: [],
            });

            // Create quiz path_node
            if (lesson.quiz_id) {
                pathNodes.push({
                    id: lesson.quiz_id,
                    course_id: "course_vi_en_v1",
                    unit_id: lesson.unit_id,
                    node_index: lesson.order_index + 1,
                    node_type: "test",
                    module_type: "test",
                    label: `${lesson.title} Quiz`,
                    test_scope: "module",
                    source_node_id: lesson.node_id,
                    difficulty: lesson.difficulty || 1,
                    cefr_level: lesson.cefr_level || "A1.1",
                    vocab_introduces: [],
                    vocab_requires: [],
                });
            }
        }
    });

    return { items, translations, blueprints, lessons, pathNodes };
}

// Also keep the metadata lookup functions for backward compatibility
import curriculumMetadata from '../../data/curricula/metadata.json';

function getVocabMetadata(viText) {
    const key = viText.toLowerCase().trim();
    return curriculumMetadata.vocab[key] || null;
}

function getSentenceMetadata(viText) {
    const key = viText.toLowerCase().trim();
    return curriculumMetadata.sentences[key] || null;
}

// ── Build structured data from LESSON_DEFS ──
function buildFromDefs(defs) {
    const items = [];
    const translations = [];
    const blueprints = [];
    const lessons = [];
    const pathNodes = [];

    for (const def of defs) {
        const allEntries = [
            ...(def.words || []).map(w => ({ ...w, type: "word" })),
            ...(def.phrases || []).map(p => ({ ...p, type: "phrase" })),
            ...(def.sentences || []).map(s => ({ ...s, type: "sentence" })),
        ];

        const itemIds = [];
        for (const entry of allEntries) {
            const audioKey = "a_" + entry.vi.replace(/[^a-zA-ZàáạảãăắằặẳẵâấầậẩẫèéẹẻẽêếềệểễìíịỉĩòóọỏõôốồộổỗơớờợởỡùúụủũưứừựửữỳýỵỷỹđĐ ]/g, '').replace(/ +/g, '_').toLowerCase();

            // Look up curriculum metadata for this item
            const meta = entry.type === 'sentence'
                ? getSentenceMetadata(entry.vi)
                : getVocabMetadata(entry.vi);

            items.push({
                id: entry.id,
                item_type: entry.type,
                vi_text: entry.vi,
                vi_text_no_diacritics: stripDiacritics(entry.vi),
                audio_key: audioKey,
                dialect: entry.dialect || "both",
                ...(entry.emoji ? { emoji: entry.emoji } : {}),
                // Curriculum metadata (from metadata.json lookup)
                ...(meta?.pos ? { pos: meta.pos } : {}),
                ...(meta?.frequency ? { frequency: meta.frequency } : {}),
                ...(meta?.hasImage ? { hasImage: meta.hasImage } : {}),
                ...(meta?.accepted ? { accepted: meta.accepted } : {}),
                ...(meta?.tags ? { tags: meta.tags } : {}),
                ...(meta?.note ? { note: meta.note } : {}),
                ...(meta?.tokens ? { token_count: meta.tokens } : {}),
            });
            translations.push({ item_id: entry.id, lang: "en", text: entry.en });
            // Also store accepted translations if available from curriculum
            if (meta?.accepted && meta.accepted.length > 1) {
                meta.accepted.slice(1).forEach(alt => {
                    translations.push({ item_id: entry.id, lang: "en", text: alt, is_alternate: true });
                });
            }
            itemIds.push(entry.id);
        }

        blueprints.push({
            lesson_id: def.id,
            focus: def.focus || [],
            introduced_items: itemIds,
        });

        lessons.push({
            id: def.id,
            course_id: "course_vi_en_v1",
            skill_id: `skill_${def.id}`,
            lesson_index: 1,
            title: def.title,
            target_xp: def.xp || 10,
        });

        // Lesson path_node
        pathNodes.push({
            id: def.nodeId,
            course_id: "course_vi_en_v1",
            unit_id: def.unit,
            node_index: def.nodeIndex,
            node_type: "lesson",
            module_type: "orange",
            lesson_id: def.id,
            difficulty: def.difficulty || 1,
            cefr_level: def.cefr || "A1.1",
            vocab_introduces: itemIds,
            vocab_requires: [],
        });

        // Quiz path_node (auto-generated, right after lesson)
        if (def.quizId) {
            pathNodes.push({
                id: def.quizId,
                course_id: "course_vi_en_v1",
                unit_id: def.unit,
                node_index: def.nodeIndex + 1,
                node_type: "test",
                module_type: "test",
                label: def.quizLabel || `${def.title} Quiz`,
                test_scope: "module",
                source_node_id: def.nodeId,
                difficulty: def.difficulty || 1,
                cefr_level: def.cefr || "A1.1",
                vocab_introduces: [],
                vocab_requires: [],
            });
        }
    }

    return { items, translations, blueprints, lessons, pathNodes };
}

// Build from unified database (combines legacy content + curriculum metadata)
const _built = buildFromUnifiedDB(unifiedDB);

// Also build from LESSON_DEFS for any items not in unified_db (backward compatibility)
const _legacyBuilt = buildFromDefs(LESSON_DEFS);

// Merge: prefer unified_db, fallback to legacy for missing items
const mergeBuilt = () => {
    const unifiedItemIds = new Set(_built.items.map(i => i.id));
    const unifiedLessonIds = new Set(_built.lessons.map(l => l.id));

    // Add legacy items not in unified
    const extraItems = _legacyBuilt.items.filter(i => !unifiedItemIds.has(i.id));
    const extraTranslations = _legacyBuilt.translations.filter(t => !unifiedItemIds.has(t.item_id));
    const extraLessons = _legacyBuilt.lessons.filter(l => !unifiedLessonIds.has(l.id));
    const extraBlueprints = _legacyBuilt.blueprints.filter(b => !unifiedLessonIds.has(b.lesson_id));
    const extraPathNodes = _legacyBuilt.pathNodes.filter(n => !_built.pathNodes.some(bn => bn.id === n.id));

    return {
        items: [..._built.items, ...extraItems],
        translations: [..._built.translations, ...extraTranslations],
        blueprints: [..._built.blueprints, ...extraBlueprints],
        lessons: [..._built.lessons, ...extraLessons],
        pathNodes: [..._built.pathNodes, ...extraPathNodes],
    };
};

const _mergedBuilt = mergeBuilt();

// Units definition
const LEGACY_UNITS = [
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
