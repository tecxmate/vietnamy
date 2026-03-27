// A mock database using localStorage to simulate a backend for the 100-levels proposal.

const DB_KEY = 'vnme_mock_db_v21'; // v21: declarative LESSON_DEFS with auto-generated items/translations/blueprints

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
        focus: ["introductions", "question_form"],
        phrases: [
            { id: "it_p_0010", vi: "tôi tên là {NAME}", en: "my name is {NAME}" },
        ],
        sentences: [
            { id: "it_s_0012", vi: "Bạn tên là gì?", en: "What is your name?" },
        ],
    },
    {
        id: "lesson_002b", unit: "phase_1_first_words", title: "Nice to Meet You",
        nodeId: "p1_L002b", quizId: "p1_Q002b", quizLabel: "Meeting Quiz",
        nodeIndex: 13, difficulty: 2, cefr: "A1.1", xp: 8,
        focus: ["meeting_people"],
        phrases: [
            { id: "it_p_0011", vi: "tôi là {ROLE}", en: "I am a {ROLE}" },
        ],
        sentences: [
            { id: "it_s_0013", vi: "Rất vui được gặp bạn.", en: "Nice to meet you." },
        ],
    },

    // ═══ Unit 2: Polite Survival ═══
    {
        id: "lesson_003", unit: "phase_2_polite", title: "Be Polite",
        nodeId: "p2_L003", quizId: "p2_Q003", quizLabel: "Polite Phrases Quiz",
        nodeIndex: 1, difficulty: 3, cefr: "A1.1", xp: 12,
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
            items.push({
                id: entry.id,
                item_type: entry.type,
                vi_text: entry.vi,
                vi_text_no_diacritics: stripDiacritics(entry.vi),
                audio_key: audioKey,
                dialect: entry.dialect || "both",
                ...(entry.emoji ? { emoji: entry.emoji } : {}),
            });
            translations.push({ item_id: entry.id, lang: "en", text: entry.en });
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

const _built = buildFromDefs(LESSON_DEFS);

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
    lessons: [..._built.lessons],
    path_nodes: [
        // ═══ Unit 1: First Words ═══
        // Lesson + quiz nodes auto-generated from LESSON_DEFS; grammar/phonetics/test nodes manual
        ..._built.pathNodes,
        { id: "p1_P0", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 3, node_type: "skill", module_type: "blue", label: "Tones: Introduction", skill_content: { type: "practice_module", route: "/practice/tones-1" }, difficulty: 1, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p1_G1", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 6, node_type: "skill", module_type: "purple", label: "Grammar: I + You (tôi, bạn)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M06_U01a" }, difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: ["it_w_0008", "it_w_0009"] },
        { id: "p1_S1", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 7, node_type: "skill", module_type: "blue", label: "Tones: Level & Rising", skill_content: { type: "practice_module", route: "/practice/tones-2" }, difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p1_P1", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 8, node_type: "skill", module_type: "blue", label: "Vowels: Core 12", skill_content: { type: "practice_module", route: "/practice/vowels-single-1" }, difficulty: 1, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p1_P2", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 9, node_type: "skill", module_type: "blue", label: "Tone Marks: Basic", skill_content: { type: "practice_module", route: "/practice/tonemarks-basic" }, difficulty: 1, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p1_G2", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 12, node_type: "skill", module_type: "purple", label: "Grammar: Subject + là", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M01_U01" }, difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: ["it_w_0008", "it_w_0009"] },
        { id: "p1_S2", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 15, node_type: "skill", module_type: "blue", label: "Vowels: Special", skill_content: { type: "practice_module", route: "/practice/vowels-single-2" }, difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p1_T", course_id: "course_vi_en_v1", unit_id: "phase_1_first_words", node_index: 16, node_type: "test", module_type: "test", label: "Unit 1 Test", test_scope: "unit", difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },

        // ═══ Unit 2: Polite Survival ═══
        // Polite phrases + numbers 0-10
        { id: "p2_G1", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 3, node_type: "skill", module_type: "purple", label: "Grammar: Negation (không)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M08_U01" }, difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: ["it_w_0008", "it_w_0009", "it_w_0007"] },
        { id: "p2_S1", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 3, node_type: "skill", module_type: "purple", label: "Numbers: 0–10", skill_content: { type: "practice_module", route: "/practice/numbers-1" }, difficulty: 2, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p2_S2", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 8, node_type: "skill", module_type: "blue", label: "Tone Marks: Special", skill_content: { type: "practice_module", route: "/practice/tonemarks-special" }, difficulty: 3, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p2_S3", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 9, node_type: "skill", module_type: "purple", label: "Particles: Politeness", skill_content: { type: "practice_module", route: "/practice/particles-1" }, difficulty: 3, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p2_T", course_id: "course_vi_en_v1", unit_id: "phase_2_polite", node_index: 10, node_type: "test", module_type: "test", label: "Unit 2 Test", test_scope: "unit", difficulty: 5, cefr_level: "A1.1", vocab_introduces: [], vocab_requires: [] },

        // ═══ Unit 3: Ordering & Café ═══
        // First real situations + grammar basics
        { id: "p3_S1", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 3, node_type: "skill", module_type: "blue", label: "Tones: + Dipping", skill_content: { type: "practice_module", route: "/practice/tones-3" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p3_P1", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 4, node_type: "skill", module_type: "blue", label: "Consonants: Initial", skill_content: { type: "practice_module", route: "/practice/consonants" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p3_G1", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 7, node_type: "skill", module_type: "purple", label: "Grammar: Want to (muốn)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M25_U01" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: ["it_w_0035", "it_w_0030", "it_w_0031", "it_w_0032"] },
        { id: "p3_S3", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 8, node_type: "skill", module_type: "purple", label: "Classifiers: Basics", skill_content: { type: "practice_module", route: "/practice/classifiers-1" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p3_T", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 9, node_type: "test", module_type: "test", label: "Unit 3 Test", test_scope: "unit", difficulty: 7, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p3_SC1", course_id: "course_vi_en_v1", unit_id: "phase_3_cafe", node_index: 10, node_type: "scene", module_type: "green", label: "☕ At the Café", scene_id: "scene_cafe_001", difficulty: 7, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },

        // ═══ Unit 4: Food & Prices ═══
        // Expand vocab + numbers 11-99 + typing intro
        { id: "p4_G1", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 3, node_type: "skill", module_type: "purple", label: "Grammar: Counters (cái)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M14_U01" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: ["it_w_0055", "it_w_0045", "it_w_0046"] },
        { id: "p4_S1", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 3, node_type: "skill", module_type: "purple", label: "TELEX: Tone Keys", skill_content: { type: "practice_module", route: "/practice/telex-1" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p4_S2", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 6, node_type: "skill", module_type: "blue", label: "Vowels: Centering Diph.", skill_content: { type: "practice_module", route: "/practice/vowels-diph-1" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p4_S3", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 7, node_type: "skill", module_type: "purple", label: "Numbers: 11–99", skill_content: { type: "practice_module", route: "/practice/numbers-2" }, difficulty: 5, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p4_S4", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 8, node_type: "skill", module_type: "purple", label: "Question Words", skill_content: { type: "practice_module", route: "/practice/question-words-1" }, difficulty: 4, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p4_T", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 9, node_type: "test", module_type: "test", label: "Unit 4 Test", test_scope: "unit", difficulty: 7, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p4_SC1", course_id: "course_vi_en_v1", unit_id: "phase_4_food", node_index: 10, node_type: "scene", module_type: "green", label: "🛵 Street Food Stall", scene_id: "scene_streetfood_001", difficulty: 7, cefr_level: "A1.2", vocab_introduces: [], vocab_requires: [] },

        // ═══ Unit 5: Market Life ═══
        // Descriptions + haggling + tone mark mastery
        { id: "p5_S1", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 5, node_type: "skill", module_type: "blue", label: "Tone Marks: Master", skill_content: { type: "practice_module", route: "/practice/tonemarks-master" }, difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p5_S2", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 8, node_type: "skill", module_type: "purple", label: "Grammar: Adjectives", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M09_U01" }, difficulty: 4, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: ["it_w_0068", "it_w_0066", "it_w_0067", "it_w_0056", "it_w_0057"] },
        { id: "p5_G1", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 9, node_type: "skill", module_type: "purple", label: "Grammar: Very (rất)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M26_U01" }, difficulty: 4, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: ["it_w_0068", "it_w_0066", "it_w_0067", "it_w_0056", "it_w_0057"] },
        { id: "p5_S3", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 9, node_type: "skill", module_type: "purple", label: "Classifiers: Extended", skill_content: { type: "practice_module", route: "/practice/classifiers-2" }, difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p5_S4", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 10, node_type: "skill", module_type: "purple", label: "Prepositions", skill_content: { type: "practice_module", route: "/practice/prepositions" }, difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p5_T", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 11, node_type: "test", module_type: "test", label: "Unit 5 Test", test_scope: "unit", difficulty: 7, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p5_SC1", course_id: "course_vi_en_v1", unit_id: "phase_5_market", node_index: 12, node_type: "scene", module_type: "green", label: "🛒 At the Market", scene_id: "scene_market_001", difficulty: 7, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },

        // ═══ Unit 6: Numbers Advanced ═══
        // 0-999 + triphthongs + pitch training intro
        { id: "p6_S1", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 5, node_type: "skill", module_type: "purple", label: "Numbers: Challenge", skill_content: { type: "practice_module", route: "/practice/numbers-3" }, difficulty: 7, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p6_G1", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 8, node_type: "skill", module_type: "purple", label: "Grammar: Plurals (những/các)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M07_U01" }, difficulty: 4, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: ["it_w_0080", "it_w_0081", "it_w_0082", "it_w_0086", "it_w_0085"] },
        { id: "p6_S2", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 9, node_type: "skill", module_type: "blue", label: "Vowels: Gliding Diph.", skill_content: { type: "practice_module", route: "/practice/vowels-diph-2" }, difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p6_P1", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 10, node_type: "skill", module_type: "blue", label: "Consonants: Final", skill_content: { type: "practice_module", route: "/practice/consonants-final" }, difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p6_S3", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 11, node_type: "skill", module_type: "blue", label: "Pitch: Easy Tones", skill_content: { type: "practice_module", route: "/practice/pitch-1" }, difficulty: 4, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p6_S4", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 12, node_type: "skill", module_type: "purple", label: "Quantifiers", skill_content: { type: "practice_module", route: "/practice/quantifiers" }, difficulty: 5, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p6_T", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 13, node_type: "test", module_type: "test", label: "Unit 6 Test", test_scope: "unit", difficulty: 8, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },
        { id: "p6_SC1", course_id: "course_vi_en_v1", unit_id: "phase_6_numbers", node_index: 14, node_type: "scene", module_type: "green", label: "🍜 At the Restaurant", scene_id: "scene_restaurant_001", difficulty: 8, cefr_level: "A1.3", vocab_introduces: [], vocab_requires: [] },

        // ═══ Unit 7: Getting Around ═══
        // Directions + transport + full TELEX + pitch advanced
        { id: "p7_S1", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 5, node_type: "skill", module_type: "purple", label: "TELEX: Vowel Mods", skill_content: { type: "practice_module", route: "/practice/telex-2" }, difficulty: 5, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p7_S2", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 8, node_type: "skill", module_type: "purple", label: "Grammar: Directions", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M27_U01" }, difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: ["it_w_0100", "it_w_0102", "it_w_0103", "it_w_0104", "it_w_0105", "it_w_0106"] },
        { id: "p7_G1", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 9, node_type: "skill", module_type: "purple", label: "Grammar: Location (ở)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M11_U01" }, difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: ["it_w_0113", "it_w_0120", "it_w_0121", "it_w_0124"] },
        { id: "p7_S3", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 11, node_type: "skill", module_type: "purple", label: "TELEX: Full Challenge", skill_content: { type: "practice_module", route: "/practice/telex-3" }, difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p7_S4", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 14, node_type: "skill", module_type: "blue", label: "Pitch: Hard Tones", skill_content: { type: "practice_module", route: "/practice/pitch-2" }, difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p7_S5", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 15, node_type: "skill", module_type: "purple", label: "Question Words: Advanced", skill_content: { type: "practice_module", route: "/practice/question-words-2" }, difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p7_S6", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 16, node_type: "skill", module_type: "purple", label: "Connectors: Và/Còn/Nhưng", skill_content: { type: "practice_module", route: "/practice/connectors" }, difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p7_T", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 17, node_type: "test", module_type: "test", label: "Unit 7 Test", test_scope: "unit", difficulty: 9, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p7_SC1", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 18, node_type: "scene", module_type: "green", label: "🚕 Getting a Taxi", scene_id: "scene_taxi_001", difficulty: 8, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p7_SC2", course_id: "course_vi_en_v1", unit_id: "phase_7_transport", node_index: 19, node_type: "scene", module_type: "green", label: "✈️ At the Airport", scene_id: "scene_airport_001", difficulty: 8, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },

        // ═══ Unit 8: Daily Life ═══
        // Time + weather + family pronouns
        { id: "p8_S1", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 5, node_type: "skill", module_type: "purple", label: "Pronouns: Core Family", skill_content: { type: "practice_module", route: "/practice/pronouns-1" }, difficulty: 5, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p8_S2", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 8, node_type: "skill", module_type: "purple", label: "Grammar: Days & Dates", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M15_U01" }, difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p8_G1", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 9, node_type: "skill", module_type: "purple", label: "Grammar: Present Tense", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M02_U01" }, difficulty: 6, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: ["it_w_0145", "it_w_0142", "it_w_0143", "it_w_0144", "it_w_0100", "it_w_0151", "it_w_0152"] },
        { id: "p8_S3", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 13, node_type: "skill", module_type: "purple", label: "Pronouns: Extended Family", skill_content: { type: "practice_module", route: "/practice/pronouns-2" }, difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p8_S4", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 18, node_type: "skill", module_type: "blue", label: "Vowels: Triph. & More", skill_content: { type: "practice_module", route: "/practice/vowels-diph-3" }, difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p8_S5", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 19, node_type: "skill", module_type: "purple", label: "Aspect Markers", skill_content: { type: "practice_module", route: "/practice/aspect-markers" }, difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p8_S6", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 20, node_type: "skill", module_type: "purple", label: "Intensifiers: Rất/Lắm/Quá", skill_content: { type: "practice_module", route: "/practice/intensifiers" }, difficulty: 7, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p8_T", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 21, node_type: "test", module_type: "test", label: "Unit 8 Test", test_scope: "unit", difficulty: 10, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },
        { id: "p8_SC1", course_id: "course_vi_en_v1", unit_id: "phase_8_daily", node_index: 22, node_type: "scene", module_type: "green", label: "🏨 Checking into a Hotel", scene_id: "scene_hotel_001", difficulty: 9, cefr_level: "A2.1", vocab_introduces: [], vocab_requires: [] },

        // ═══ Unit 9: Social Life ═══
        // Feelings + hobbies + teen code + final test
        { id: "p9_S1", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 3, node_type: "skill", module_type: "purple", label: "Teen Code: Basics", skill_content: { type: "practice_module", route: "/practice/teencode-1" }, difficulty: 5, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p9_S2", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 6, node_type: "skill", module_type: "blue", label: "Tones: All 6", skill_content: { type: "practice_module", route: "/practice/tones-4" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p9_S3", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 9, node_type: "skill", module_type: "purple", label: "Grammar: Should & Shouldn't", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M20_U01" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: ["it_w_0100", "it_w_0181", "it_w_0191", "it_w_0190"] },
        { id: "p9_G1", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 10, node_type: "skill", module_type: "purple", label: "Grammar: Because (vì)", skill_content: { type: "grammar_unit", grammar_unit_id: "A1_M17_U01" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: ["it_w_0190", "it_w_0192", "it_w_0191", "it_w_0151", "it_w_0030"] },
        { id: "p9_S4", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 10, node_type: "skill", module_type: "purple", label: "Teen Code: People", skill_content: { type: "practice_module", route: "/practice/teencode-2" }, difficulty: 6, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p9_S5", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 13, node_type: "skill", module_type: "purple", label: "Teen Code: Life & Internet", skill_content: { type: "practice_module", route: "/practice/teencode-3" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p9_S6", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 14, node_type: "skill", module_type: "purple", label: "Particles: Emotion", skill_content: { type: "practice_module", route: "/practice/particles-2" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p9_S7", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 15, node_type: "skill", module_type: "purple", label: "Degree Adverbs", skill_content: { type: "practice_module", route: "/practice/degree-adverbs" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p9_S8", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 16, node_type: "skill", module_type: "purple", label: "Vision Verbs", skill_content: { type: "practice_module", route: "/practice/vision-verbs" }, difficulty: 7, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p9_T", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 17, node_type: "test", module_type: "test", label: "Final Test", test_scope: "unit", difficulty: 10, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [] },
        { id: "p9_SC1", course_id: "course_vi_en_v1", unit_id: "phase_9_social", node_index: 18, node_type: "scene", module_type: "green", label: "🎉 At a Party", scene_id: "scene_party_001", difficulty: 9, cefr_level: "A2.2", vocab_introduces: [], vocab_requires: [] }
    ],
    items: [..._built.items],
    translations: [..._built.translations],
    exercises: [
        // Exercises are now auto-generated at runtime by exerciseGenerator.js
    ],
    lesson_blueprints: [..._built.blueprints],

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
        {
            id: "loc_market",
            name: "Ben Thanh Market",
            name_vi: "Chợ Bến Thành",
            emoji: "🏪",
            gradient: "linear-gradient(135deg, #2d1a0a 0%, #5a3a1a 50%, #2d1a0a 100%)",
            description: "Colorful stalls selling clothes, souvenirs, and fresh produce.",
            locked: false,
        },
        {
            id: "loc_restaurant",
            name: "Local Restaurant",
            name_vi: "Nhà hàng",
            emoji: "🍜",
            gradient: "linear-gradient(135deg, #1a0a0a 0%, #3d1a1a 50%, #1a0a0a 100%)",
            description: "A busy local restaurant with plastic chairs and amazing phở.",
            locked: false,
        },
        {
            id: "loc_street_food",
            name: "Street Food Corner",
            name_vi: "Góc ẩm thực đường phố",
            emoji: "🛵",
            gradient: "linear-gradient(135deg, #1a1a08 0%, #3d3a10 50%, #1a1a08 100%)",
            description: "Tiny plastic stools, smoky grills, and the best bánh mì in town.",
            locked: false,
        },
        {
            id: "loc_taxi",
            name: "City Streets",
            name_vi: "Đường phố",
            emoji: "🚕",
            gradient: "linear-gradient(135deg, #0a1a2d 0%, #1a3a5a 50%, #0a1a2d 100%)",
            description: "Busy intersections, honking motorbikes, and Grab taxis.",
            locked: false,
        },
        {
            id: "loc_airport",
            name: "Tan Son Nhat Airport",
            name_vi: "Sân bay Tân Sơn Nhất",
            emoji: "✈️",
            gradient: "linear-gradient(135deg, #1a1a2d 0%, #2a2a4a 50%, #1a1a2d 100%)",
            description: "Arrivals hall, immigration, and finding your ride.",
            locked: false,
        },
        {
            id: "loc_hotel",
            name: "Budget Hotel",
            name_vi: "Khách sạn",
            emoji: "🏨",
            gradient: "linear-gradient(135deg, #0a2d1a 0%, #1a4a3a 50%, #0a2d1a 100%)",
            description: "A clean guesthouse in the backpacker district.",
            locked: false,
        },
        {
            id: "loc_party",
            name: "Rooftop Bar",
            name_vi: "Quán bar trên sân thượng",
            emoji: "🎉",
            gradient: "linear-gradient(135deg, #2d0a2d 0%, #4a1a4a 50%, #2d0a2d 100%)",
            description: "City lights, cold drinks, and making new Vietnamese friends.",
            locked: false,
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
        },

        // ── Scene 2: Street Food Stall (Unit 4) ──
        {
            id: "scene_streetfood_001",
            lesson_id: "lesson_008",
            location_id: "loc_street_food",
            difficulty: "beginner",
            title: "Street Food Stall",
            title_vi: "Quán ăn vỉa hè",
            scene_type: "narrative",
            setting: { background_emoji: "🛵", background_css: "linear-gradient(135deg, #1a1a08 0%, #3d3a10 100%)" },
            characters: [
                { id: "vendor", name: "Cô Ba", role: "Food vendor", emoji: "👩‍🍳", personality: "loud and cheerful" },
                { id: "friend", name: "Anh Tuấn", role: "Your friend", emoji: "👨", personality: "foodie" },
                { id: "player", name: "You", role: "You", emoji: "🧑‍🎓" }
            ],
            vocab_items: ["it_w_0045", "it_w_0046", "it_w_0047", "it_w_0048", "it_w_0050", "it_w_0051"],
            grammar_card: { title: "Asking Price", structure: "Cái này bao nhiêu tiền?", example: "Cái này bao nhiêu tiền?", translation: "How much is this?" },
            phases: [
                {
                    type: "explore",
                    config: {
                        instruction: "You're at a street food stall. Tap items to learn what's on the menu.",
                        min_taps: 4,
                        show_grammar_card: true,
                        hotspots: [
                            { id: "hs_pho", label: "Phở bò", translation: "Beef noodle soup", audio_key: "a_pho_bo", item_id: "it_w_0045", emoji: "🍜", price: "40.000₫", position: { row: 1, col: 1 } },
                            { id: "hs_banhmi2", label: "Bánh mì thịt", translation: "Meat sandwich", audio_key: "a_banh_mi_thit", item_id: "it_w_0046", emoji: "🥖", price: "25.000₫", position: { row: 1, col: 2 } },
                            { id: "hs_buncha", label: "Bún chả", translation: "Grilled pork noodles", audio_key: "a_bun_cha", item_id: "it_w_0047", emoji: "🥢", price: "45.000₫", position: { row: 2, col: 1 } },
                            { id: "hs_com", label: "Cơm tấm", translation: "Broken rice", audio_key: "a_com_tam", item_id: "it_w_0048", emoji: "🍚", price: "35.000₫", position: { row: 2, col: 2 } },
                            { id: "hs_goi", label: "Gỏi cuốn", translation: "Spring rolls", audio_key: "a_goi_cuon", item_id: "it_w_0050", emoji: "🥟", price: "20.000₫", position: { row: 3, col: 1 } },
                            { id: "hs_nuocmia", label: "Nước mía", translation: "Sugarcane juice", audio_key: "a_nuoc_mia", item_id: "it_w_0051", emoji: "🧃", price: "15.000₫", position: { row: 3, col: 2 } }
                        ]
                    }
                },
                {
                    type: "observe",
                    config: {
                        instruction: "Watch Tuấn order food. Tap any word you don't recognize.",
                        script: [
                            { speaker: "vendor", text_vi: "Ăn gì đi em?", text_en: "What'll you eat?", hints: { "ăn": "to eat", "đi": "(urging)" }, emotion: "friendly" },
                            { speaker: "friend", text_vi: "Cho tôi một phở bò. Tái nhé.", text_en: "One beef phở for me. Rare please.", hints: { "tái": "rare (meat)", "nhé": "okay?" }, emotion: "confident" },
                            { speaker: "vendor", text_vi: "Có ăn thêm gì không?", text_en: "Want anything extra?", hints: { "thêm": "more/extra" }, emotion: "attentive" },
                            { speaker: "friend", text_vi: "Thêm một gỏi cuốn nữa.", text_en: "Plus one more spring roll.", hints: { "thêm": "add", "nữa": "more" }, emotion: "satisfied" },
                            { speaker: "vendor", text_vi: "Được rồi! Ngồi đợi nhé!", text_en: "Got it! Sit and wait!", hints: { "ngồi": "sit", "đợi": "wait" }, emotion: "pleased" }
                        ]
                    }
                },
                {
                    type: "perform",
                    config: {
                        instruction: "Your turn to order street food!",
                        challenges: [
                            {
                                id: "ch_01", type: "dialogue_choice",
                                scene_beat: "Cô Ba looks at you expectantly, ladle in hand.",
                                speaker_prompt: { speaker: "vendor", text_vi: "Còn em? Ăn gì?", text_en: "And you? What'll you have?", emotion: "waiting" },
                                choices: [
                                    { text_vi: "Cho tôi một cơm tấm.", correct: true, response_vi: "Được! Cơm tấm một!", response_en: "Got it! One broken rice!", response_emotion: "pleased" },
                                    { text_vi: "Tôi muốn ăn.", correct: false, response_vi: "Ăn gì? Nói đi!", response_en: "Eat what? Tell me!", response_emotion: "impatient" },
                                    { text_vi: "Cơm tấm, cảm ơn cô.", correct: true, partial: true, tip: "Good! 'Cho tôi...' is the full pattern.", response_vi: "Dạ!", response_en: "Sure!", response_emotion: "friendly" }
                                ]
                            },
                            {
                                id: "ch_02", type: "build_sentence",
                                scene_beat: "The vendor asks how many spring rolls you want.",
                                speaker_prompt: { speaker: "vendor", text_vi: "Gỏi cuốn mấy cái?", text_en: "How many spring rolls?", emotion: "helpful" },
                                answer_tokens: ["Hai", "cái"],
                                distractor_tokens: ["một", "phở"],
                                answer_en: "Two."
                            },
                            {
                                id: "ch_03", type: "fill_response",
                                scene_beat: "You want to know the price.",
                                speaker_prompt: { speaker: "player", text_vi: "", text_en: "(You want to ask the price)", emotion: "curious" },
                                template_vi: "Cái này ____ tiền?",
                                answer: "bao nhiêu",
                                choices: ["bao nhiêu", "mấy", "gì", "sao"]
                            },
                            {
                                id: "ch_04", type: "free_speak",
                                scene_beat: "Cô Ba brings a steaming plate of cơm tấm with a fried egg on top.",
                                speaker_prompt: { speaker: "vendor", text_vi: "Cơm tấm đây nè!", text_en: "Here's your broken rice!", emotion: "pleased" },
                                target_vi: "Cảm ơn cô!",
                                accept_variations: ["cảm ơn", "cảm ơn cô", "cam on", "cam on co"]
                            }
                        ],
                        wrong_answer_reactions: [
                            { speaker: "friend", text_vi: "Nói lại đi...", text_en: "Try again...", emotion: "nervous" },
                            { speaker: "vendor", text_vi: "Hả? Cái gì?", text_en: "Huh? What?", emotion: "confused" }
                        ],
                        endings: {
                            perfect: { scene_beat: "Cô Ba gives you an extra spring roll. 'Ăn giỏi lắm!' she laughs.", bonus_dong: 5 },
                            good: { scene_beat: "The food arrives. Tuấn helps with the chili sauce. Delicious!", bonus_dong: 2 },
                            retry: { scene_beat: "Tuấn orders for you. Next time you'll do it yourself!", bonus_dong: 0 }
                        }
                    }
                }
            ]
        },

        // ── Scene 3: At the Market (Unit 5) ──
        {
            id: "scene_market_001",
            lesson_id: "lesson_010",
            location_id: "loc_market",
            difficulty: "elementary",
            title: "At the Market",
            title_vi: "Ở chợ",
            scene_type: "narrative",
            setting: { background_emoji: "🛒", background_css: "linear-gradient(135deg, #2d1a0a 0%, #5a3a1a 100%)" },
            characters: [
                { id: "seller", name: "Chị Hoa", role: "Market seller", emoji: "👩‍🌾", personality: "persuasive and warm" },
                { id: "friend", name: "Chị Lan", role: "Your friend", emoji: "👩", personality: "savvy shopper" },
                { id: "player", name: "You", role: "You", emoji: "🧑‍🎓" }
            ],
            vocab_items: ["it_w_0060", "it_w_0061", "it_w_0062", "it_w_0063", "it_w_0064", "it_w_0065"],
            grammar_card: { title: "Bargaining Pattern", structure: "Bớt cho tôi đi! / Rẻ hơn được không?", example: "Bớt cho tôi đi!", translation: "Give me a discount!" },
            phases: [
                {
                    type: "explore",
                    config: {
                        instruction: "You're browsing the market. Tap items to learn their names and prices.",
                        min_taps: 4,
                        show_grammar_card: true,
                        hotspots: [
                            { id: "hs_ao", label: "Áo thun", translation: "T-shirt", audio_key: "a_ao_thun", item_id: "it_w_0060", emoji: "👕", price: "150.000₫", position: { row: 1, col: 1 } },
                            { id: "hs_non", label: "Nón lá", translation: "Leaf hat", audio_key: "a_non_la", item_id: "it_w_0061", emoji: "🎩", price: "80.000₫", position: { row: 1, col: 2 } },
                            { id: "hs_dep", label: "Dép", translation: "Sandals", audio_key: "a_dep", item_id: "it_w_0062", emoji: "🩴", price: "120.000₫", position: { row: 2, col: 1 } },
                            { id: "hs_tui", label: "Túi xách", translation: "Bag", audio_key: "a_tui_xach", item_id: "it_w_0063", emoji: "👜", price: "200.000₫", position: { row: 2, col: 2 } },
                            { id: "hs_do", label: "Đỏ", translation: "Red", audio_key: "a_do", item_id: "it_w_0064", emoji: "🔴", price: "—", position: { row: 3, col: 1 } },
                            { id: "hs_xanh", label: "Xanh", translation: "Blue/Green", audio_key: "a_xanh", item_id: "it_w_0065", emoji: "🔵", price: "—", position: { row: 3, col: 2 } }
                        ]
                    }
                },
                {
                    type: "observe",
                    config: {
                        instruction: "Watch Lan bargain like a pro. Tap words you don't know.",
                        script: [
                            { speaker: "seller", text_vi: "Mua gì đi em! Đồ đẹp lắm!", text_en: "Buy something! Beautiful stuff!", hints: { "mua": "buy", "đồ": "stuff", "đẹp": "beautiful" }, emotion: "friendly" },
                            { speaker: "friend", text_vi: "Cái áo này bao nhiêu tiền?", text_en: "How much is this shirt?", hints: { "cái": "classifier", "bao nhiêu": "how much" }, emotion: "curious" },
                            { speaker: "seller", text_vi: "Hai trăm nghìn thôi.", text_en: "Only 200 thousand.", hints: { "trăm": "hundred", "nghìn": "thousand", "thôi": "only" }, emotion: "confident" },
                            { speaker: "friend", text_vi: "Mắc quá! Một trăm năm chục được không?", text_en: "Too expensive! 150k okay?", hints: { "mắc": "expensive", "quá": "too" }, emotion: "confident", grammar_highlight: "Bớt cho tôi đi!" },
                            { speaker: "seller", text_vi: "Được rồi, lấy đi em!", text_en: "Fine, take it!", hints: { "lấy": "take" }, emotion: "satisfied" }
                        ]
                    }
                },
                {
                    type: "perform",
                    config: {
                        instruction: "Your turn to bargain at the market!",
                        challenges: [
                            {
                                id: "ch_01", type: "dialogue_choice",
                                scene_beat: "You spot a beautiful nón lá (leaf hat). The seller notices your interest.",
                                speaker_prompt: { speaker: "seller", text_vi: "Nón đẹp lắm! Mua đi em!", text_en: "Beautiful hat! Buy it!", emotion: "friendly" },
                                choices: [
                                    { text_vi: "Cái này bao nhiêu tiền?", correct: true, response_vi: "Tám chục nghìn thôi!", response_en: "Only 80 thousand!", response_emotion: "confident" },
                                    { text_vi: "Tôi không thích.", correct: false, response_vi: "Ơ, nhưng mà đẹp mà!", response_en: "But it's pretty!", response_emotion: "confused" },
                                    { text_vi: "Bao nhiêu?", correct: true, partial: true, tip: "Add 'cái này' and 'tiền' for the full pattern.", response_vi: "Tám chục!", response_en: "Eighty!", response_emotion: "friendly" }
                                ]
                            },
                            {
                                id: "ch_02", type: "build_sentence",
                                scene_beat: "80k seems too much. Time to bargain!",
                                speaker_prompt: { speaker: "player", text_vi: "", text_en: "(You want to say: Too expensive!)", emotion: "confident" },
                                answer_tokens: ["Mắc", "quá"],
                                distractor_tokens: ["đẹp", "rẻ"],
                                answer_en: "Too expensive!"
                            },
                            {
                                id: "ch_03", type: "fill_response",
                                scene_beat: "The seller offers 70k. You counter.",
                                speaker_prompt: { speaker: "seller", text_vi: "Bảy chục nhé?", text_en: "70k okay?", emotion: "helpful" },
                                template_vi: "Năm ____ được không?",
                                answer: "chục",
                                choices: ["chục", "trăm", "nghìn", "mười"]
                            },
                            {
                                id: "ch_04", type: "free_speak",
                                scene_beat: "Deal! The seller wraps the hat and hands it to you with a smile.",
                                speaker_prompt: { speaker: "seller", text_vi: "Đây nè! Đội đẹp lắm!", text_en: "Here! Looks great on you!", emotion: "pleased" },
                                target_vi: "Cảm ơn chị!",
                                accept_variations: ["cảm ơn", "cảm ơn chị", "cam on", "cam on chi"]
                            }
                        ],
                        wrong_answer_reactions: [
                            { speaker: "friend", text_vi: "Nói lại đi bạn...", text_en: "Say it again...", emotion: "nervous" },
                            { speaker: "seller", text_vi: "Sao? Em nói gì?", text_en: "What? What'd you say?", emotion: "confused" }
                        ],
                        endings: {
                            perfect: { scene_beat: "Chị Hoa throws in a free keychain. 'Giỏi quá!' she says. Lan is impressed.", bonus_dong: 5 },
                            good: { scene_beat: "You got a decent price! Lan says you'll be a pro next time.", bonus_dong: 2 },
                            retry: { scene_beat: "Lan takes over the bargaining. You'll get there!", bonus_dong: 0 }
                        }
                    }
                }
            ]
        },

        // ── Scene 4: At the Restaurant (Unit 6) ──
        {
            id: "scene_restaurant_001",
            lesson_id: "lesson_012",
            location_id: "loc_restaurant",
            difficulty: "elementary",
            title: "At the Restaurant",
            title_vi: "Ở nhà hàng",
            scene_type: "narrative",
            setting: { background_emoji: "🍜", background_css: "linear-gradient(135deg, #1a0a0a 0%, #3d1a1a 100%)" },
            characters: [
                { id: "waiter", name: "Em Hà", role: "Waitress", emoji: "👩‍🍳", personality: "polite and efficient" },
                { id: "friend", name: "Chị Lan", role: "Your friend", emoji: "👩", personality: "helpful" },
                { id: "player", name: "You", role: "You", emoji: "🧑‍🎓" }
            ],
            vocab_items: ["it_w_0080", "it_w_0081", "it_w_0082", "it_w_0090", "it_w_0091", "it_w_0092"],
            grammar_card: { title: "Quantity Pattern", structure: "[Number] + [classifier] + [noun]", example: "Hai tô phở bò.", translation: "Two bowls of beef phở." },
            phases: [
                {
                    type: "explore",
                    config: {
                        instruction: "You're at a local restaurant. Tap dishes on the menu.",
                        min_taps: 4,
                        show_grammar_card: true,
                        hotspots: [
                            { id: "hs_pho2", label: "Phở bò", translation: "Beef noodle soup", audio_key: "a_pho_bo", item_id: "it_w_0080", emoji: "🍜", price: "50.000₫", position: { row: 1, col: 1 } },
                            { id: "hs_bun2", label: "Bún bò Huế", translation: "Huế spicy noodles", audio_key: "a_bun_bo_hue", item_id: "it_w_0081", emoji: "🥢", price: "55.000₫", position: { row: 1, col: 2 } },
                            { id: "hs_mi", label: "Mì xào", translation: "Stir-fried noodles", audio_key: "a_mi_xao", item_id: "it_w_0082", emoji: "🍝", price: "45.000₫", position: { row: 2, col: 1 } },
                            { id: "hs_com2", label: "Cơm chiên", translation: "Fried rice", audio_key: "a_com_chien", item_id: "it_w_0090", emoji: "🍚", price: "40.000₫", position: { row: 2, col: 2 } },
                            { id: "hs_rau", label: "Rau muống xào", translation: "Stir-fried morning glory", audio_key: "a_rau_muong", item_id: "it_w_0091", emoji: "🥬", price: "30.000₫", position: { row: 3, col: 1 } },
                            { id: "hs_bia", label: "Bia Sài Gòn", translation: "Saigon beer", audio_key: "a_bia", item_id: "it_w_0092", emoji: "🍺", price: "20.000₫", position: { row: 3, col: 2 } }
                        ]
                    }
                },
                {
                    type: "observe",
                    config: {
                        instruction: "Watch Lan order a full meal. Tap any new words.",
                        script: [
                            { speaker: "waiter", text_vi: "Chào anh chị! Dùng gì ạ?", text_en: "Hello! What would you like?", hints: { "dùng": "to have" }, emotion: "friendly" },
                            { speaker: "friend", text_vi: "Cho tôi hai tô phở bò.", text_en: "Give me two bowls of beef phở.", hints: { "tô": "bowl (classifier)", "hai": "two" }, emotion: "confident", grammar_highlight: "[Number] + [classifier] + [noun]" },
                            { speaker: "friend", text_vi: "Với một đĩa rau muống xào.", text_en: "And one plate of stir-fried morning glory.", hints: { "với": "and/with", "đĩa": "plate (classifier)" }, emotion: "confident" },
                            { speaker: "waiter", text_vi: "Uống gì ạ?", text_en: "What to drink?", hints: { "uống": "to drink" }, emotion: "attentive" },
                            { speaker: "friend", text_vi: "Hai bia Sài Gòn. Cảm ơn em.", text_en: "Two Saigon beers. Thanks.", hints: {}, emotion: "satisfied" }
                        ]
                    }
                },
                {
                    type: "perform",
                    config: {
                        instruction: "Order a meal for yourself!",
                        challenges: [
                            {
                                id: "ch_01", type: "dialogue_choice",
                                scene_beat: "The waitress turns to you with her notepad.",
                                speaker_prompt: { speaker: "waiter", text_vi: "Anh dùng gì ạ?", text_en: "What would you like?", emotion: "waiting" },
                                choices: [
                                    { text_vi: "Cho tôi một tô phở bò.", correct: true, response_vi: "Dạ được ạ!", response_en: "Sure!", response_emotion: "pleased" },
                                    { text_vi: "Phở bò tôi là.", correct: false, response_vi: "Dạ... anh nói lại?", response_en: "Sorry... say again?", response_emotion: "confused" },
                                    { text_vi: "Một phở bò.", correct: true, partial: true, tip: "Add 'tô' (bowl) for proper classifier usage!", response_vi: "Dạ!", response_en: "Got it!", response_emotion: "friendly" }
                                ]
                            },
                            {
                                id: "ch_02", type: "build_sentence",
                                scene_beat: "You also want fried rice.",
                                speaker_prompt: { speaker: "waiter", text_vi: "Còn gì nữa không ạ?", text_en: "Anything else?", emotion: "attentive" },
                                answer_tokens: ["Một", "đĩa", "cơm", "chiên"],
                                distractor_tokens: ["tô", "rau"],
                                answer_en: "One plate of fried rice."
                            },
                            {
                                id: "ch_03", type: "fill_response",
                                scene_beat: "Lan asks what you're drinking.",
                                speaker_prompt: { speaker: "friend", text_vi: "Bạn uống gì?", text_en: "What are you drinking?", emotion: "curious" },
                                template_vi: "Tôi uống ____ Sài Gòn.",
                                answer: "bia",
                                choices: ["bia", "nước", "trà", "cà phê"]
                            },
                            {
                                id: "ch_04", type: "free_speak",
                                scene_beat: "The waitress brings everything. Steam rises from the phở. It smells incredible.",
                                speaker_prompt: { speaker: "waiter", text_vi: "Phở bò và cơm chiên đây ạ. Chúc ngon miệng!", text_en: "Here's your phở and fried rice. Enjoy!", emotion: "pleased" },
                                target_vi: "Cảm ơn em!",
                                accept_variations: ["cảm ơn", "cảm ơn em", "cam on", "cam on em"]
                            }
                        ],
                        wrong_answer_reactions: [
                            { speaker: "friend", text_vi: "Gần đúng rồi...", text_en: "Almost right...", emotion: "nervous" },
                            { speaker: "waiter", text_vi: "Dạ... em chưa hiểu?", text_en: "Sorry... I didn't catch that?", emotion: "confused" }
                        ],
                        endings: {
                            perfect: { scene_beat: "The waitress smiles. Lan says 'Bạn giỏi lắm!' The phở is the best you've ever had.", bonus_dong: 5 },
                            good: { scene_beat: "A couple of mix-ups, but you got your meal! The phở makes it all worth it.", bonus_dong: 2 },
                            retry: { scene_beat: "Lan helps out. The food is still amazing. Practice makes perfect!", bonus_dong: 0 }
                        }
                    }
                }
            ]
        },

        // ── Scene 5: Getting a Taxi (Unit 7) ──
        {
            id: "scene_taxi_001",
            lesson_id: "lesson_014",
            location_id: "loc_taxi",
            difficulty: "elementary",
            title: "Getting a Taxi",
            title_vi: "Đi taxi",
            scene_type: "narrative",
            setting: { background_emoji: "🚕", background_css: "linear-gradient(135deg, #0a1a2d 0%, #1a3a5a 100%)" },
            characters: [
                { id: "driver", name: "Anh Hùng", role: "Taxi driver", emoji: "🧑‍✈️", personality: "chatty and helpful" },
                { id: "player", name: "You", role: "You", emoji: "🧑‍🎓" }
            ],
            vocab_items: ["it_w_0100", "it_w_0102", "it_w_0103", "it_w_0104", "it_w_0105", "it_w_0106"],
            grammar_card: { title: "Giving Directions", structure: "Cho tôi đến + [place]", example: "Cho tôi đến chợ Bến Thành.", translation: "Take me to Ben Thanh Market." },
            phases: [
                {
                    type: "explore",
                    config: {
                        instruction: "You need a taxi. Learn the key phrases for giving directions.",
                        min_taps: 4,
                        show_grammar_card: true,
                        hotspots: [
                            { id: "hs_rere", label: "Rẽ phải", translation: "Turn right", audio_key: "a_re_phai", item_id: "it_w_0100", emoji: "➡️", price: "—", position: { row: 1, col: 1 } },
                            { id: "hs_reli", label: "Rẽ trái", translation: "Turn left", audio_key: "a_re_trai", item_id: "it_w_0102", emoji: "⬅️", price: "—", position: { row: 1, col: 2 } },
                            { id: "hs_thang", label: "Đi thẳng", translation: "Go straight", audio_key: "a_di_thang", item_id: "it_w_0103", emoji: "⬆️", price: "—", position: { row: 2, col: 1 } },
                            { id: "hs_dung", label: "Dừng lại", translation: "Stop here", audio_key: "a_dung_lai", item_id: "it_w_0104", emoji: "🛑", price: "—", position: { row: 2, col: 2 } },
                            { id: "hs_gan", label: "Gần", translation: "Near", audio_key: "a_gan", item_id: "it_w_0105", emoji: "📍", price: "—", position: { row: 3, col: 1 } },
                            { id: "hs_xa", label: "Xa", translation: "Far", audio_key: "a_xa", item_id: "it_w_0106", emoji: "🗺️", price: "—", position: { row: 3, col: 2 } }
                        ]
                    }
                },
                {
                    type: "observe",
                    config: {
                        instruction: "Listen to a taxi ride conversation. Tap new words.",
                        script: [
                            { speaker: "driver", text_vi: "Chào anh! Đi đâu?", text_en: "Hello! Where to?", hints: { "đi": "go", "đâu": "where" }, emotion: "friendly" },
                            { speaker: "player", text_vi: "Cho tôi đến chợ Bến Thành.", text_en: "Take me to Ben Thanh Market.", hints: { "đến": "to/arrive" }, emotion: "confident", grammar_highlight: "Cho tôi đến + [place]" },
                            { speaker: "driver", text_vi: "Được rồi. Khoảng 15 phút nhé.", text_en: "Sure. About 15 minutes.", hints: { "khoảng": "about", "phút": "minutes" }, emotion: "helpful" },
                            { speaker: "driver", text_vi: "Rẽ phải hay rẽ trái ở đây?", text_en: "Turn right or left here?", hints: { "hay": "or", "ở đây": "here" }, emotion: "attentive" },
                            { speaker: "player", text_vi: "Rẽ phải, rồi đi thẳng.", text_en: "Turn right, then go straight.", hints: { "rồi": "then" }, emotion: "confident" },
                            { speaker: "driver", text_vi: "Đến rồi! Bốn chục nghìn.", text_en: "We're here! 40 thousand.", hints: { "đến rồi": "arrived" }, emotion: "pleased" }
                        ]
                    }
                },
                {
                    type: "perform",
                    config: {
                        instruction: "You need to get to your hotel. Take a taxi!",
                        challenges: [
                            {
                                id: "ch_01", type: "dialogue_choice",
                                scene_beat: "You flag down a taxi. The driver rolls down the window.",
                                speaker_prompt: { speaker: "driver", text_vi: "Chào anh! Đi đâu?", text_en: "Hello! Where to?", emotion: "friendly" },
                                choices: [
                                    { text_vi: "Cho tôi đến khách sạn.", correct: true, response_vi: "Được! Khách sạn nào?", response_en: "Sure! Which hotel?", response_emotion: "helpful" },
                                    { text_vi: "Tôi là khách sạn.", correct: false, response_vi: "Anh... là khách sạn?", response_en: "You... are a hotel?", response_emotion: "confused" },
                                    { text_vi: "Khách sạn, anh ơi.", correct: true, partial: true, tip: "Good! 'Cho tôi đến...' is the full pattern.", response_vi: "OK!", response_en: "OK!", response_emotion: "friendly" }
                                ]
                            },
                            {
                                id: "ch_02", type: "build_sentence",
                                scene_beat: "The driver reaches an intersection and asks you.",
                                speaker_prompt: { speaker: "driver", text_vi: "Ở đây rẽ đâu?", text_en: "Which way to turn here?", emotion: "attentive" },
                                answer_tokens: ["Rẽ", "trái"],
                                distractor_tokens: ["phải", "thẳng"],
                                answer_en: "Turn left."
                            },
                            {
                                id: "ch_03", type: "fill_response",
                                scene_beat: "You see the hotel ahead. Time to stop!",
                                speaker_prompt: { speaker: "player", text_vi: "", text_en: "(You need the driver to stop)", emotion: "confident" },
                                template_vi: "____ lại, anh ơi!",
                                answer: "Dừng",
                                choices: ["Dừng", "Đi", "Rẽ", "Đến"]
                            },
                            {
                                id: "ch_04", type: "free_speak",
                                scene_beat: "You've arrived! The meter says 40k. You hand over the money.",
                                speaker_prompt: { speaker: "driver", text_vi: "Đến rồi! Bốn chục nghìn nhé.", text_en: "We're here! 40 thousand.", emotion: "friendly" },
                                target_vi: "Cảm ơn anh!",
                                accept_variations: ["cảm ơn", "cảm ơn anh", "cam on", "cam on anh"]
                            }
                        ],
                        wrong_answer_reactions: [
                            { speaker: "driver", text_vi: "Hả? Đi đâu?", text_en: "Huh? Go where?", emotion: "confused" },
                            { speaker: "driver", text_vi: "Anh nói lại nhé.", text_en: "Say that again please.", emotion: "helpful" }
                        ],
                        endings: {
                            perfect: { scene_beat: "The driver says 'Anh nói tiếng Việt giỏi lắm!' and gives you his card for next time.", bonus_dong: 5 },
                            good: { scene_beat: "You made it! A couple of wrong turns, but you arrived safely.", bonus_dong: 2 },
                            retry: { scene_beat: "The driver used Google Maps instead. You'll navigate in Vietnamese next time!", bonus_dong: 0 }
                        }
                    }
                }
            ]
        },

        // ── Scene 6: At the Airport (Unit 7) ──
        {
            id: "scene_airport_001",
            lesson_id: "lesson_016",
            location_id: "loc_airport",
            difficulty: "elementary",
            title: "At the Airport",
            title_vi: "Ở sân bay",
            scene_type: "narrative",
            setting: { background_emoji: "✈️", background_css: "linear-gradient(135deg, #1a1a2d 0%, #2a2a4a 100%)" },
            characters: [
                { id: "officer", name: "Chị Mai", role: "Information desk", emoji: "👩‍💼", personality: "professional and patient" },
                { id: "driver", name: "Anh Bảo", role: "Pickup driver", emoji: "🧑‍✈️", personality: "friendly" },
                { id: "player", name: "You", role: "You", emoji: "🧑‍🎓" }
            ],
            vocab_items: ["it_w_0100", "it_w_0103", "it_w_0104", "it_w_0105", "it_w_0106"],
            grammar_card: { title: "Asking for Help", structure: "Xin lỗi, [question] ở đâu?", example: "Xin lỗi, nhà vệ sinh ở đâu?", translation: "Excuse me, where is the restroom?" },
            phases: [
                {
                    type: "explore",
                    config: {
                        instruction: "You just landed at the airport. Tap signs to learn key words.",
                        min_taps: 4,
                        show_grammar_card: true,
                        hotspots: [
                            { id: "hs_ra", label: "Lối ra", translation: "Exit", audio_key: "a_loi_ra", item_id: "it_w_0100", emoji: "🚪", price: "—", position: { row: 1, col: 1 } },
                            { id: "hs_wc", label: "Nhà vệ sinh", translation: "Restroom", audio_key: "a_nha_ve_sinh", item_id: "it_w_0103", emoji: "🚻", price: "—", position: { row: 1, col: 2 } },
                            { id: "hs_doi", label: "Đổi tiền", translation: "Currency exchange", audio_key: "a_doi_tien", item_id: "it_w_0104", emoji: "💱", price: "—", position: { row: 2, col: 1 } },
                            { id: "hs_taxi2", label: "Taxi", translation: "Taxi stand", audio_key: "a_taxi", item_id: "it_w_0105", emoji: "🚕", price: "—", position: { row: 2, col: 2 } },
                            { id: "hs_sim", label: "Mua SIM", translation: "Buy SIM card", audio_key: "a_mua_sim", item_id: "it_w_0106", emoji: "📱", price: "100.000₫", position: { row: 3, col: 1 } },
                            { id: "hs_hanhly", label: "Hành lý", translation: "Luggage", audio_key: "a_hanh_ly", item_id: "it_w_0100", emoji: "🧳", price: "—", position: { row: 3, col: 2 } }
                        ]
                    }
                },
                {
                    type: "observe",
                    config: {
                        instruction: "Watch how to ask for help at the information desk.",
                        script: [
                            { speaker: "player", text_vi: "Xin lỗi chị, lối ra ở đâu?", text_en: "Excuse me, where is the exit?", hints: { "xin lỗi": "excuse me", "lối ra": "exit", "ở đâu": "where" }, emotion: "curious" },
                            { speaker: "officer", text_vi: "Đi thẳng, rồi rẽ trái.", text_en: "Go straight, then turn left.", hints: { "đi thẳng": "go straight", "rẽ trái": "turn left" }, emotion: "helpful" },
                            { speaker: "player", text_vi: "Cảm ơn chị. Chỗ đổi tiền ở đâu?", text_en: "Thank you. Where's the currency exchange?", hints: { "chỗ": "place", "đổi tiền": "exchange money" }, emotion: "curious" },
                            { speaker: "officer", text_vi: "Ở bên phải, gần lối ra.", text_en: "On the right, near the exit.", hints: { "bên phải": "right side", "gần": "near" }, emotion: "friendly" },
                            { speaker: "player", text_vi: "Dạ, cảm ơn chị nhiều.", text_en: "Thank you very much.", hints: { "nhiều": "a lot" }, emotion: "satisfied" }
                        ]
                    }
                },
                {
                    type: "perform",
                    config: {
                        instruction: "Navigate the airport on your own!",
                        challenges: [
                            {
                                id: "ch_01", type: "dialogue_choice",
                                scene_beat: "You need to find the restroom. You see an information desk.",
                                speaker_prompt: { speaker: "officer", text_vi: "Tôi giúp gì cho anh?", text_en: "How can I help you?", emotion: "helpful" },
                                choices: [
                                    { text_vi: "Xin lỗi, nhà vệ sinh ở đâu?", correct: true, response_vi: "Đi thẳng, bên trái ạ.", response_en: "Go straight, on the left.", response_emotion: "helpful" },
                                    { text_vi: "Tôi muốn nhà vệ sinh.", correct: true, partial: true, tip: "'Ở đâu?' is the natural question pattern.", response_vi: "Ở bên trái ạ.", response_en: "On the left.", response_emotion: "friendly" },
                                    { text_vi: "Nhà vệ sinh tôi.", correct: false, response_vi: "Dạ... anh cần gì ạ?", response_en: "Sorry... what do you need?", response_emotion: "confused" }
                                ]
                            },
                            {
                                id: "ch_02", type: "fill_response",
                                scene_beat: "Your pickup driver is calling. He asks where you are.",
                                speaker_prompt: { speaker: "driver", text_vi: "Anh ở đâu rồi?", text_en: "Where are you now?", emotion: "curious" },
                                template_vi: "Tôi ở ____ lối ra.",
                                answer: "gần",
                                choices: ["gần", "xa", "trên", "trong"]
                            },
                            {
                                id: "ch_03", type: "build_sentence",
                                scene_beat: "The driver says he's in a white car outside. You need to tell him you're coming.",
                                speaker_prompt: { speaker: "driver", text_vi: "Xe trắng ở ngoài nhé!", text_en: "White car outside!", emotion: "friendly" },
                                answer_tokens: ["Tôi", "ra", "ngay"],
                                distractor_tokens: ["đi", "vào"],
                                answer_en: "I'm coming right out."
                            },
                            {
                                id: "ch_04", type: "free_speak",
                                scene_beat: "You find the car. Anh Bảo gets out and grabs your luggage.",
                                speaker_prompt: { speaker: "driver", text_vi: "Chào anh! Để tôi xách hành lý cho!", text_en: "Hello! Let me carry your luggage!", emotion: "friendly" },
                                target_vi: "Cảm ơn anh!",
                                accept_variations: ["cảm ơn", "cảm ơn anh", "cam on", "cam on anh", "cảm ơn anh nhiều"]
                            }
                        ],
                        wrong_answer_reactions: [
                            { speaker: "officer", text_vi: "Anh nói lại nhé?", text_en: "Can you repeat that?", emotion: "helpful" },
                            { speaker: "driver", text_vi: "Hả? Ở đâu?", text_en: "Huh? Where?", emotion: "confused" }
                        ],
                        endings: {
                            perfect: { scene_beat: "Anh Bảo is impressed. 'Anh nói tiếng Việt hay lắm!' You're off to a great start.", bonus_dong: 5 },
                            good: { scene_beat: "You made it out of the airport! A few hiccups but you found everything.", bonus_dong: 2 },
                            retry: { scene_beat: "You used the airport map instead. Next visit will be smoother!", bonus_dong: 0 }
                        }
                    }
                }
            ]
        },

        // ── Scene 7: Checking into a Hotel (Unit 8) ──
        {
            id: "scene_hotel_001",
            lesson_id: "lesson_020",
            location_id: "loc_hotel",
            difficulty: "intermediate",
            title: "Checking into a Hotel",
            title_vi: "Nhận phòng khách sạn",
            scene_type: "narrative",
            setting: { background_emoji: "🏨", background_css: "linear-gradient(135deg, #0a2d1a 0%, #1a4a3a 100%)" },
            characters: [
                { id: "receptionist", name: "Chị Thảo", role: "Receptionist", emoji: "👩‍💼", personality: "professional and warm" },
                { id: "player", name: "You", role: "You", emoji: "🧑‍🎓" }
            ],
            vocab_items: ["it_w_0145", "it_w_0146", "it_w_0147", "it_w_0166", "it_w_0167", "it_w_0168"],
            grammar_card: { title: "Duration Pattern", structure: "[Number] + đêm (nights) / ngày (days)", example: "Tôi ở ba đêm.", translation: "I'm staying three nights." },
            phases: [
                {
                    type: "explore",
                    config: {
                        instruction: "You're at the hotel front desk. Learn the key check-in vocabulary.",
                        min_taps: 4,
                        show_grammar_card: true,
                        hotspots: [
                            { id: "hs_phong", label: "Phòng đơn", translation: "Single room", audio_key: "a_phong_don", item_id: "it_w_0145", emoji: "🛏️", price: "400.000₫", position: { row: 1, col: 1 } },
                            { id: "hs_phong2", label: "Phòng đôi", translation: "Double room", audio_key: "a_phong_doi", item_id: "it_w_0146", emoji: "🛏️", price: "600.000₫", position: { row: 1, col: 2 } },
                            { id: "hs_dem", label: "Đêm", translation: "Night", audio_key: "a_dem", item_id: "it_w_0147", emoji: "🌙", price: "—", position: { row: 2, col: 1 } },
                            { id: "hs_wifi", label: "Wi-Fi", translation: "Wi-Fi", audio_key: "a_wifi", item_id: "it_w_0166", emoji: "📶", price: "Free", position: { row: 2, col: 2 } },
                            { id: "hs_buasan", label: "Bữa sáng", translation: "Breakfast", audio_key: "a_bua_sang", item_id: "it_w_0167", emoji: "🍳", price: "50.000₫", position: { row: 3, col: 1 } },
                            { id: "hs_chiakhoa", label: "Chìa khóa", translation: "Key", audio_key: "a_chia_khoa", item_id: "it_w_0168", emoji: "🔑", price: "—", position: { row: 3, col: 2 } }
                        ]
                    }
                },
                {
                    type: "observe",
                    config: {
                        instruction: "Watch a check-in conversation. Tap any new words.",
                        script: [
                            { speaker: "receptionist", text_vi: "Chào anh! Anh đặt phòng chưa?", text_en: "Hello! Have you booked a room?", hints: { "đặt": "book/reserve", "chưa": "yet?" }, emotion: "friendly" },
                            { speaker: "player", text_vi: "Rồi ạ. Tôi đặt phòng đôi, ba đêm.", text_en: "Yes. I booked a double room, three nights.", hints: { "rồi": "already/yes", "ba": "three" }, emotion: "confident" },
                            { speaker: "receptionist", text_vi: "Dạ, phòng 305. Có bữa sáng và Wi-Fi miễn phí.", text_en: "Room 305. Includes breakfast and free Wi-Fi.", hints: { "miễn phí": "free" }, emotion: "helpful" },
                            { speaker: "receptionist", text_vi: "Đây là chìa khóa. Thang máy ở bên phải.", text_en: "Here's the key. Elevator is on the right.", hints: { "thang máy": "elevator", "bên phải": "right side" }, emotion: "friendly" },
                            { speaker: "player", text_vi: "Cảm ơn chị!", text_en: "Thank you!", hints: {}, emotion: "satisfied" }
                        ]
                    }
                },
                {
                    type: "perform",
                    config: {
                        instruction: "Check into the hotel yourself!",
                        challenges: [
                            {
                                id: "ch_01", type: "dialogue_choice",
                                scene_beat: "You walk up to the front desk. The receptionist greets you.",
                                speaker_prompt: { speaker: "receptionist", text_vi: "Chào anh! Tôi giúp gì ạ?", text_en: "Hello! How can I help?", emotion: "friendly" },
                                choices: [
                                    { text_vi: "Tôi muốn đặt phòng đơn, hai đêm.", correct: true, response_vi: "Dạ, còn phòng ạ!", response_en: "Yes, we have rooms!", response_emotion: "pleased" },
                                    { text_vi: "Phòng. Hai.", correct: false, response_vi: "Dạ... phòng gì ạ?", response_en: "What kind of room?", response_emotion: "confused" },
                                    { text_vi: "Một phòng đơn.", correct: true, partial: true, tip: "Add how many nights: 'hai đêm'.", response_vi: "Mấy đêm ạ?", response_en: "How many nights?", response_emotion: "helpful" }
                                ]
                            },
                            {
                                id: "ch_02", type: "fill_response",
                                scene_beat: "The receptionist asks about breakfast.",
                                speaker_prompt: { speaker: "receptionist", text_vi: "Anh có muốn thêm bữa sáng không?", text_en: "Would you like to add breakfast?", emotion: "helpful" },
                                template_vi: "Có, tôi ____ bữa sáng.",
                                answer: "muốn",
                                choices: ["muốn", "là", "có", "ăn"]
                            },
                            {
                                id: "ch_03", type: "build_sentence",
                                scene_beat: "You want to ask about Wi-Fi.",
                                speaker_prompt: { speaker: "player", text_vi: "", text_en: "(Ask if there's Wi-Fi)", emotion: "curious" },
                                answer_tokens: ["Có", "Wi-Fi", "không"],
                                distractor_tokens: ["gì", "đâu"],
                                answer_en: "Is there Wi-Fi?"
                            },
                            {
                                id: "ch_04", type: "free_speak",
                                scene_beat: "The receptionist hands you the key card with a smile.",
                                speaker_prompt: { speaker: "receptionist", text_vi: "Đây là chìa khóa phòng 205. Chúc anh nghỉ ngơi vui vẻ!", text_en: "Here's the key for room 205. Have a pleasant stay!", emotion: "pleased" },
                                target_vi: "Cảm ơn chị nhiều!",
                                accept_variations: ["cảm ơn", "cảm ơn chị", "cảm ơn chị nhiều", "cam on", "cam on chi"]
                            }
                        ],
                        wrong_answer_reactions: [
                            { speaker: "receptionist", text_vi: "Dạ... anh nói lại nhé?", text_en: "Could you repeat that?", emotion: "helpful" },
                            { speaker: "receptionist", text_vi: "Em chưa hiểu ạ.", text_en: "I don't quite understand.", emotion: "confused" }
                        ],
                        endings: {
                            perfect: { scene_beat: "Chị Thảo upgrades you to a room with a city view. 'Anh nói tiếng Việt hay lắm!'", bonus_dong: 5 },
                            good: { scene_beat: "You're checked in! The room is cozy and the Wi-Fi password is on the key card.", bonus_dong: 2 },
                            retry: { scene_beat: "The receptionist switches to English to help. You'll check in fully in Vietnamese next time!", bonus_dong: 0 }
                        }
                    }
                }
            ]
        },

        // ── Scene 8: At a Party (Unit 9) ──
        {
            id: "scene_party_001",
            lesson_id: "lesson_024",
            location_id: "loc_party",
            difficulty: "intermediate",
            title: "At a Party",
            title_vi: "Ở bữa tiệc",
            scene_type: "narrative",
            setting: { background_emoji: "🎉", background_css: "linear-gradient(135deg, #2d0a2d 0%, #4a1a4a 100%)" },
            characters: [
                { id: "newguy", name: "Anh Phúc", role: "New friend", emoji: "🧑", personality: "outgoing and curious" },
                { id: "friend", name: "Chị Lan", role: "Your friend", emoji: "👩", personality: "introduces everyone" },
                { id: "player", name: "You", role: "You", emoji: "🧑‍🎓" }
            ],
            vocab_items: ["it_w_0181", "it_w_0190", "it_w_0191"],
            grammar_card: { title: "Expressing Likes", structure: "Tôi thích + [noun/verb]", example: "Tôi thích nghe nhạc.", translation: "I like listening to music." },
            phases: [
                {
                    type: "explore",
                    config: {
                        instruction: "You're at a rooftop party. Tap conversation topics to learn the words.",
                        min_taps: 4,
                        show_grammar_card: true,
                        hotspots: [
                            { id: "hs_nhac", label: "Nghe nhạc", translation: "Listen to music", audio_key: "a_nghe_nhac", item_id: "it_w_0181", emoji: "🎵", price: "—", position: { row: 1, col: 1 } },
                            { id: "hs_phim", label: "Xem phim", translation: "Watch movies", audio_key: "a_xem_phim", item_id: "it_w_0190", emoji: "🎬", price: "—", position: { row: 1, col: 2 } },
                            { id: "hs_dulich", label: "Du lịch", translation: "Travel", audio_key: "a_du_lich", item_id: "it_w_0191", emoji: "✈️", price: "—", position: { row: 2, col: 1 } },
                            { id: "hs_naubep", label: "Nấu ăn", translation: "Cook", audio_key: "a_nau_an", item_id: "it_w_0181", emoji: "👨‍🍳", price: "—", position: { row: 2, col: 2 } },
                            { id: "hs_theduc", label: "Tập thể dục", translation: "Exercise", audio_key: "a_tap_the_duc", item_id: "it_w_0190", emoji: "💪", price: "—", position: { row: 3, col: 1 } },
                            { id: "hs_chuphinh", label: "Chụp hình", translation: "Take photos", audio_key: "a_chup_hinh", item_id: "it_w_0191", emoji: "📸", price: "—", position: { row: 3, col: 2 } }
                        ]
                    }
                },
                {
                    type: "observe",
                    config: {
                        instruction: "Watch Lan introduce you to Phúc. Tap new words.",
                        script: [
                            { speaker: "friend", text_vi: "Phúc ơi, đây là bạn tôi! Bạn ấy đang học tiếng Việt.", text_en: "Phúc, this is my friend! They're learning Vietnamese.", hints: { "đây là": "this is", "đang": "currently", "học": "learn" }, emotion: "friendly" },
                            { speaker: "newguy", text_vi: "Ồ, hay quá! Bạn thích Việt Nam không?", text_en: "Oh, cool! Do you like Vietnam?", hints: { "hay": "cool/nice", "thích": "like" }, emotion: "curious" },
                            { speaker: "player", text_vi: "Tôi thích lắm! Đồ ăn ngon quá!", text_en: "I love it! The food is so good!", hints: { "lắm": "very", "ngon": "delicious" }, emotion: "confident" },
                            { speaker: "newguy", text_vi: "Bạn thích làm gì? Sở thích là gì?", text_en: "What do you like to do? What are your hobbies?", hints: { "sở thích": "hobbies", "làm gì": "do what" }, emotion: "curious" },
                            { speaker: "player", text_vi: "Tôi thích nghe nhạc và du lịch.", text_en: "I like listening to music and traveling.", hints: { "và": "and" }, emotion: "confident", grammar_highlight: "Tôi thích + [verb]" },
                            { speaker: "newguy", text_vi: "Tôi cũng thích du lịch! Bạn đã đi đâu rồi?", text_en: "I also like traveling! Where have you been?", hints: { "cũng": "also", "đã": "already" }, emotion: "pleased" }
                        ]
                    }
                },
                {
                    type: "perform",
                    config: {
                        instruction: "Make conversation at the party!",
                        challenges: [
                            {
                                id: "ch_01", type: "dialogue_choice",
                                scene_beat: "Phúc asks about your hobbies. The music is playing in the background.",
                                speaker_prompt: { speaker: "newguy", text_vi: "Bạn thích làm gì?", text_en: "What do you like to do?", emotion: "curious" },
                                choices: [
                                    { text_vi: "Tôi thích nghe nhạc và xem phim.", correct: true, response_vi: "Hay quá! Tôi cũng thích xem phim!", response_en: "Cool! I also like movies!", response_emotion: "pleased" },
                                    { text_vi: "Tôi là du lịch.", correct: false, response_vi: "Bạn... là du lịch?", response_en: "You... are travel?", response_emotion: "confused" },
                                    { text_vi: "Nghe nhạc.", correct: true, partial: true, tip: "Full sentence: 'Tôi thích nghe nhạc.'", response_vi: "Nhạc gì?", response_en: "What music?", response_emotion: "curious" }
                                ]
                            },
                            {
                                id: "ch_02", type: "build_sentence",
                                scene_beat: "Phúc asks if you like Vietnamese food.",
                                speaker_prompt: { speaker: "newguy", text_vi: "Bạn thích đồ ăn Việt Nam không?", text_en: "Do you like Vietnamese food?", emotion: "curious" },
                                answer_tokens: ["Tôi", "thích", "lắm"],
                                distractor_tokens: ["không", "là"],
                                answer_en: "I like it a lot!"
                            },
                            {
                                id: "ch_03", type: "fill_response",
                                scene_beat: "Phúc suggests meeting again tomorrow.",
                                speaker_prompt: { speaker: "newguy", text_vi: "Mai đi cà phê nhé?", text_en: "Coffee tomorrow?", emotion: "friendly" },
                                template_vi: "Được! Tôi ____ đi!",
                                answer: "muốn",
                                choices: ["muốn", "là", "có", "không"]
                            },
                            {
                                id: "ch_04", type: "free_speak",
                                scene_beat: "The party is winding down. Phúc gives you his number. Lan beams at you.",
                                speaker_prompt: { speaker: "newguy", text_vi: "Vui quá! Hẹn gặp lại nhé!", text_en: "So fun! See you again!", emotion: "pleased" },
                                target_vi: "Hẹn gặp lại!",
                                accept_variations: ["hẹn gặp lại", "hen gap lai", "tạm biệt", "tam biet", "bye"]
                            }
                        ],
                        wrong_answer_reactions: [
                            { speaker: "friend", text_vi: "Nói lại đi bạn...", text_en: "Try again...", emotion: "nervous" },
                            { speaker: "newguy", text_vi: "Hả? Sao?", text_en: "What? How?", emotion: "confused" }
                        ],
                        endings: {
                            perfect: { scene_beat: "Phúc invites you to karaoke next week. Lan whispers: 'Bạn giỏi lắm!' You made a real friend tonight.", bonus_dong: 5 },
                            good: { scene_beat: "Great conversation! Phúc teaches you some slang. A good start to your social life in Vietnam.", bonus_dong: 2 },
                            retry: { scene_beat: "Lan translates a bit. Phúc says your Vietnamese is 'dễ thương' (cute). You'll chat more next time!", bonus_dong: 0 }
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
    "node_001": "p1_L001a", "node_mt_001": "p1_Q001a",
    "p1_L001": "p1_L001a", "p1_Q001": "p1_Q001a",
    "node_002": "p1_L002a", "node_mt_002": "p1_Q002a",
    "p1_L002": "p1_L002a", "p1_Q002": "p1_Q002a",
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
const CURRICULUM_VERSION = 13; // v13: declarative LESSON_DEFS for Unit 1
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
// Get the unit test node ID for the previous unit (for cross-unit gating)
const getPreviousUnitTestId = (unitId) => {
    const db = getDB();
    const units = (db.units || []).sort((a, b) => (a.unit_index || 0) - (b.unit_index || 0));
    const idx = units.findIndex(u => u.id === unitId);
    if (idx <= 0) return null; // Unit 1 or not found — no prerequisite
    const prevUnitId = units[idx - 1].id;
    const prevTest = (db.path_nodes || []).find(n => n.unit_id === prevUnitId && n.test_scope === 'unit');
    return prevTest?.id || null;
};

export const getNodesForUnitWithProgress = (unitId, completedNodeIds) => {
    const db = getDB();
    const nodes = db.path_nodes || [];
    const unitNodes = nodes.filter(n => n.unit_id === unitId);

    // Sort by node_index — this IS the unlock order
    const sorted = unitNodes.sort((a, b) => (a.node_index || 0) - (b.node_index || 0));

    return sorted.map((n, i) => {
        // Auto-derive unlock status from sequential node_index order
        let status;
        if (completedNodeIds.has(n.id)) {
            status = 'completed';
        } else if (i === 0) {
            // First node in unit: gated by previous unit's test
            const prevTestId = getPreviousUnitTestId(unitId);
            status = (!prevTestId || completedNodeIds.has(prevTestId)) ? 'active' : 'locked';
        } else {
            // All other nodes: require previous node (by index) to be completed
            status = completedNodeIds.has(sorted[i - 1].id) ? 'active' : 'locked';
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
    });
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
            source_node_id: newNode.id
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
