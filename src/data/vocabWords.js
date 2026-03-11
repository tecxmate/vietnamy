// src/data/vocabWords.js
// Curated vocabulary with Unsplash images (simulating Google Image API)

const VOCAB_WORDS = [
    // ─── Food & Drink ─────────────────────────────────────────────
    {
        id: 1,
        vietnamese: 'phở',
        english: 'pho (noodle soup)',
        image: 'https://images.unsplash.com/photo-1503764654157-72d979d9af2f?w=400&h=300&fit=crop',
        emoji: '🍜',
        category: 'food',
        example: 'Cho tôi một bát phở.',
    },
    {
        id: 2,
        vietnamese: 'bánh mì',
        english: 'bread / sandwich',
        image: 'https://images.unsplash.com/photo-1600688640154-9619e002df30?w=400&h=300&fit=crop',
        emoji: '🥖',
        category: 'food',
        example: 'Bánh mì rất ngon.',
    },
    {
        id: 3,
        vietnamese: 'cà phê',
        english: 'coffee',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
        emoji: '☕',
        category: 'food',
        example: 'Tôi uống cà phê mỗi sáng.',
    },
    {
        id: 4,
        vietnamese: 'cơm',
        english: 'rice / meal',
        image: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&h=300&fit=crop',
        emoji: '🍚',
        category: 'food',
        example: 'Ăn cơm chưa?',
    },
    {
        id: 5,
        vietnamese: 'nước',
        english: 'water',
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop',
        emoji: '💧',
        category: 'food',
        example: 'Cho tôi một ly nước.',
    },
    {
        id: 6,
        vietnamese: 'trái cây',
        english: 'fruit',
        image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop',
        emoji: '🍎',
        category: 'food',
        example: 'Tôi thích ăn trái cây.',
    },
    {
        id: 7,
        vietnamese: 'thịt',
        english: 'meat',
        image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=300&fit=crop',
        emoji: '🥩',
        category: 'food',
        example: 'Thịt bò rất ngon.',
    },
    {
        id: 8,
        vietnamese: 'rau',
        english: 'vegetables',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
        emoji: '🥬',
        category: 'food',
        example: 'Ăn nhiều rau cho khỏe.',
    },

    // ─── Animals ───────────────────────────────────────────────────
    {
        id: 9,
        vietnamese: 'con mèo',
        english: 'cat',
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop',
        emoji: '🐱',
        category: 'animals',
        example: 'Con mèo rất đáng yêu.',
    },
    {
        id: 10,
        vietnamese: 'con chó',
        english: 'dog',
        image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
        emoji: '🐕',
        category: 'animals',
        example: 'Con chó chạy nhanh.',
    },
    {
        id: 11,
        vietnamese: 'con gà',
        english: 'chicken',
        image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&h=300&fit=crop',
        emoji: '🐔',
        category: 'animals',
        example: 'Con gà gáy sáng sớm.',
    },
    {
        id: 12,
        vietnamese: 'con cá',
        english: 'fish',
        image: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=400&h=300&fit=crop',
        emoji: '🐟',
        category: 'animals',
        example: 'Con cá bơi trong nước.',
    },
    {
        id: 13,
        vietnamese: 'con bò',
        english: 'cow',
        image: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=400&h=300&fit=crop',
        emoji: '🐄',
        category: 'animals',
        example: 'Con bò ăn cỏ.',
    },

    // ─── Daily Objects ─────────────────────────────────────────────
    {
        id: 14,
        vietnamese: 'nhà',
        english: 'house / home',
        image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=300&fit=crop',
        emoji: '🏠',
        category: 'objects',
        example: 'Nhà tôi ở Sài Gòn.',
    },
    {
        id: 15,
        vietnamese: 'xe',
        english: 'vehicle',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop',
        emoji: '🏍️',
        category: 'objects',
        example: 'Xe máy rất phổ biến.',
    },
    {
        id: 16,
        vietnamese: 'sách',
        english: 'book',
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop',
        emoji: '📖',
        category: 'objects',
        example: 'Tôi đọc sách mỗi ngày.',
    },
    {
        id: 17,
        vietnamese: 'bàn',
        english: 'table / desk',
        image: 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=400&h=300&fit=crop',
        emoji: '🪑',
        category: 'objects',
        example: 'Đặt trên bàn.',
    },
    {
        id: 18,
        vietnamese: 'ghế',
        english: 'chair',
        image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=300&fit=crop',
        emoji: '💺',
        category: 'objects',
        example: 'Ngồi trên ghế.',
    },
    {
        id: 19,
        vietnamese: 'điện thoại',
        english: 'phone',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
        emoji: '📱',
        category: 'objects',
        example: 'Điện thoại rất tiện.',
    },

    // ─── Nature ────────────────────────────────────────────────────
    {
        id: 20,
        vietnamese: 'mưa',
        english: 'rain',
        image: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=400&h=300&fit=crop',
        emoji: '🌧️',
        category: 'nature',
        example: 'Hôm nay trời mưa.',
    },
    {
        id: 21,
        vietnamese: 'nắng',
        english: 'sunshine',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        emoji: '☀️',
        category: 'nature',
        example: 'Trời nắng đẹp quá.',
    },
    {
        id: 22,
        vietnamese: 'biển',
        english: 'sea / beach',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
        emoji: '🏖️',
        category: 'nature',
        example: 'Đi biển cuối tuần.',
    },
    {
        id: 23,
        vietnamese: 'núi',
        english: 'mountain',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
        emoji: '⛰️',
        category: 'nature',
        example: 'Núi rất cao.',
    },
    {
        id: 24,
        vietnamese: 'hoa',
        english: 'flower',
        image: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop',
        emoji: '🌸',
        category: 'nature',
        example: 'Hoa sen rất đẹp.',
    },
    {
        id: 25,
        vietnamese: 'cây',
        english: 'tree',
        image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&h=300&fit=crop',
        emoji: '🌳',
        category: 'nature',
        example: 'Cây xanh cho bóng mát.',
    },

    // ─── People ────────────────────────────────────────────────────
    {
        id: 26,
        vietnamese: 'bạn',
        english: 'friend / you',
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
        emoji: '🤝',
        category: 'people',
        example: 'Bạn khỏe không?',
    },
    {
        id: 27,
        vietnamese: 'thầy giáo',
        english: 'male teacher',
        image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&h=300&fit=crop',
        emoji: '👨‍🏫',
        category: 'people',
        example: 'Thầy giáo dạy rất hay.',
    },
    {
        id: 28,
        vietnamese: 'em bé',
        english: 'baby',
        image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop',
        emoji: '👶',
        category: 'people',
        example: 'Em bé rất dễ thương.',
    },
    {
        id: 29,
        vietnamese: 'gia đình',
        english: 'family',
        image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop',
        emoji: '👨‍👩‍👧‍👦',
        category: 'people',
        example: 'Gia đình là quan trọng nhất.',
    },
    {
        id: 30,
        vietnamese: 'bác sĩ',
        english: 'doctor',
        image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=300&fit=crop',
        emoji: '👨‍⚕️',
        category: 'people',
        example: 'Bác sĩ khám bệnh.',
    },

    // ─── Body ─────────────────────────────────────────────────────
    {
        id: 31, vietnamese: 'đầu', english: 'head',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop',
        emoji: '🗣️', category: 'body', example: 'Tôi bị đau đầu.',
    },
    {
        id: 32, vietnamese: 'mắt', english: 'eye',
        image: 'https://images.unsplash.com/photo-1494869042583-f6c911f04b4c?w=400&h=300&fit=crop',
        emoji: '👁️', category: 'body', example: 'Mắt cô ấy rất đẹp.',
    },
    {
        id: 33, vietnamese: 'mũi', english: 'nose',
        image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=300&fit=crop',
        emoji: '👃', category: 'body', example: 'Mũi tôi bị nghẹt.',
    },
    {
        id: 34, vietnamese: 'miệng', english: 'mouth',
        image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=300&fit=crop',
        emoji: '👄', category: 'body', example: 'Mở miệng ra.',
    },
    {
        id: 35, vietnamese: 'tai', english: 'ear',
        image: 'https://images.unsplash.com/photo-1590698933947-a202b069a861?w=400&h=300&fit=crop',
        emoji: '👂', category: 'body', example: 'Tai tôi nghe không rõ.',
    },
    {
        id: 36, vietnamese: 'tay', english: 'hand / arm',
        image: 'https://images.unsplash.com/photo-1577512014534-55e646c13416?w=400&h=300&fit=crop',
        emoji: '🤚', category: 'body', example: 'Rửa tay trước khi ăn.',
    },
    {
        id: 37, vietnamese: 'chân', english: 'foot / leg',
        image: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=400&h=300&fit=crop',
        emoji: '🦶', category: 'body', example: 'Tôi bị đau chân.',
    },
    {
        id: 38, vietnamese: 'tóc', english: 'hair',
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop',
        emoji: '💇', category: 'body', example: 'Tóc em dài quá.',
    },
    {
        id: 39, vietnamese: 'răng', english: 'teeth',
        image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=300&fit=crop',
        emoji: '🦷', category: 'body', example: 'Đánh răng mỗi ngày.',
    },
    {
        id: 40, vietnamese: 'bụng', english: 'stomach / belly',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        emoji: '🤰', category: 'body', example: 'Tôi bị đau bụng.',
    },

    // ─── Clothing ─────────────────────────────────────────────────
    {
        id: 41, vietnamese: 'áo', english: 'shirt / top',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=300&fit=crop',
        emoji: '👕', category: 'clothing', example: 'Áo này đẹp quá.',
    },
    {
        id: 42, vietnamese: 'quần', english: 'pants / trousers',
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=300&fit=crop',
        emoji: '👖', category: 'clothing', example: 'Quần dài hay quần ngắn?',
    },
    {
        id: 43, vietnamese: 'giày', english: 'shoes',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
        emoji: '👟', category: 'clothing', example: 'Đôi giày mới.',
    },
    {
        id: 44, vietnamese: 'mũ', english: 'hat / cap',
        image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&h=300&fit=crop',
        emoji: '🧢', category: 'clothing', example: 'Đội mũ khi ra nắng.',
    },
    {
        id: 45, vietnamese: 'váy', english: 'skirt / dress',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=300&fit=crop',
        emoji: '👗', category: 'clothing', example: 'Cô ấy mặc váy đẹp.',
    },
    {
        id: 46, vietnamese: 'kính', english: 'glasses',
        image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=300&fit=crop',
        emoji: '👓', category: 'clothing', example: 'Tôi cần đeo kính.',
    },

    // ─── Colors ───────────────────────────────────────────────────
    {
        id: 47, vietnamese: 'đỏ', english: 'red',
        image: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=300&fit=crop',
        emoji: '🔴', category: 'colors', example: 'Màu đỏ là màu may mắn.',
    },
    {
        id: 48, vietnamese: 'xanh lá', english: 'green',
        image: 'https://images.unsplash.com/photo-1564429238961-bf8e5f3e4bff?w=400&h=300&fit=crop',
        emoji: '🟢', category: 'colors', example: 'Cây có lá xanh.',
    },
    {
        id: 49, vietnamese: 'xanh dương', english: 'blue',
        image: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&h=300&fit=crop',
        emoji: '🔵', category: 'colors', example: 'Trời xanh dương.',
    },
    {
        id: 50, vietnamese: 'vàng', english: 'yellow',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop',
        emoji: '🟡', category: 'colors', example: 'Hoa vàng rất đẹp.',
    },
    {
        id: 51, vietnamese: 'trắng', english: 'white',
        image: 'https://images.unsplash.com/photo-1533628635777-112b2239b1c7?w=400&h=300&fit=crop',
        emoji: '⚪', category: 'colors', example: 'Áo dài trắng.',
    },
    {
        id: 52, vietnamese: 'đen', english: 'black',
        image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=300&fit=crop',
        emoji: '⚫', category: 'colors', example: 'Tóc đen.',
    },
    {
        id: 53, vietnamese: 'nâu', english: 'brown',
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop',
        emoji: '🟤', category: 'colors', example: 'Cà phê màu nâu.',
    },
    {
        id: 54, vietnamese: 'hồng', english: 'pink',
        image: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=300&fit=crop',
        emoji: '🩷', category: 'colors', example: 'Hoa hồng màu hồng.',
    },

    // ─── Family ───────────────────────────────────────────────────
    {
        id: 55, vietnamese: 'mẹ', english: 'mother',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop',
        emoji: '👩', category: 'family', example: 'Mẹ nấu ăn rất ngon.',
    },
    {
        id: 56, vietnamese: 'ba', english: 'father (Southern)',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        emoji: '👨', category: 'family', example: 'Ba đi làm mỗi ngày.',
    },
    {
        id: 57, vietnamese: 'anh', english: 'older brother / Mr.',
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=300&fit=crop',
        emoji: '👦', category: 'family', example: 'Anh tôi cao lắm.',
    },
    {
        id: 58, vietnamese: 'chị', english: 'older sister / Ms.',
        image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=300&fit=crop',
        emoji: '👧', category: 'family', example: 'Chị ấy rất đẹp.',
    },
    {
        id: 59, vietnamese: 'em', english: 'younger sibling / you (younger)',
        image: 'https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=400&h=300&fit=crop',
        emoji: '🧒', category: 'family', example: 'Em trai tôi học lớp 5.',
    },
    {
        id: 60, vietnamese: 'ông', english: 'grandfather / Mr. (elderly)',
        image: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=300&fit=crop',
        emoji: '👴', category: 'family', example: 'Ông nội tôi 80 tuổi.',
    },
    {
        id: 61, vietnamese: 'bà', english: 'grandmother / Mrs. (elderly)',
        image: 'https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=400&h=300&fit=crop',
        emoji: '👵', category: 'family', example: 'Bà ngoại kể chuyện hay.',
    },
    {
        id: 62, vietnamese: 'vợ', english: 'wife',
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
        emoji: '💑', category: 'family', example: 'Vợ anh ấy rất tốt.',
    },
    {
        id: 63, vietnamese: 'chồng', english: 'husband',
        image: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=300&fit=crop',
        emoji: '💏', category: 'family', example: 'Chồng cô ấy là bác sĩ.',
    },
    {
        id: 64, vietnamese: 'con gái', english: 'daughter',
        image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop',
        emoji: '👧', category: 'family', example: 'Con gái tôi học giỏi.',
    },
    {
        id: 65, vietnamese: 'con trai', english: 'son',
        image: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&h=300&fit=crop',
        emoji: '👦', category: 'family', example: 'Con trai tôi thích bóng đá.',
    },

    // ─── Transport ────────────────────────────────────────────────
    {
        id: 66, vietnamese: 'xe buýt', english: 'bus',
        image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=300&fit=crop',
        emoji: '🚌', category: 'transport', example: 'Tôi đi xe buýt đến trường.',
    },
    {
        id: 67, vietnamese: 'máy bay', english: 'airplane',
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=400&h=300&fit=crop',
        emoji: '✈️', category: 'transport', example: 'Máy bay bay rất nhanh.',
    },
    {
        id: 68, vietnamese: 'tàu hỏa', english: 'train',
        image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=300&fit=crop',
        emoji: '🚂', category: 'transport', example: 'Tàu hỏa từ Sài Gòn đến Hà Nội.',
    },
    {
        id: 69, vietnamese: 'xe đạp', english: 'bicycle',
        image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop',
        emoji: '🚲', category: 'transport', example: 'Đạp xe đi học.',
    },
    {
        id: 70, vietnamese: 'taxi', english: 'taxi',
        image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400&h=300&fit=crop',
        emoji: '🚕', category: 'transport', example: 'Gọi taxi đi nhé.',
    },

    // ─── Weather ──────────────────────────────────────────────────
    {
        id: 71, vietnamese: 'nóng', english: 'hot',
        image: 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?w=400&h=300&fit=crop',
        emoji: '🥵', category: 'weather', example: 'Hôm nay trời nóng quá.',
    },
    {
        id: 72, vietnamese: 'lạnh', english: 'cold',
        image: 'https://images.unsplash.com/photo-1478719059408-592965723cbc?w=400&h=300&fit=crop',
        emoji: '🥶', category: 'weather', example: 'Mùa đông rất lạnh.',
    },
    {
        id: 73, vietnamese: 'gió', english: 'wind',
        image: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=400&h=300&fit=crop',
        emoji: '💨', category: 'weather', example: 'Hôm nay gió nhiều.',
    },
    {
        id: 74, vietnamese: 'mây', english: 'cloud',
        image: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&h=300&fit=crop',
        emoji: '☁️', category: 'weather', example: 'Trời nhiều mây.',
    },

    // ─── Professions ──────────────────────────────────────────────
    {
        id: 75, vietnamese: 'giáo viên', english: 'teacher',
        image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=400&h=300&fit=crop',
        emoji: '👩‍🏫', category: 'professions', example: 'Giáo viên dạy học sinh.',
    },
    {
        id: 76, vietnamese: 'cảnh sát', english: 'police',
        image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400&h=300&fit=crop',
        emoji: '👮', category: 'professions', example: 'Cảnh sát giữ an ninh.',
    },
    {
        id: 77, vietnamese: 'ca sĩ', english: 'singer',
        image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=300&fit=crop',
        emoji: '🎤', category: 'professions', example: 'Ca sĩ hát rất hay.',
    },
    {
        id: 78, vietnamese: 'sinh viên', english: 'university student',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=300&fit=crop',
        emoji: '🎓', category: 'professions', example: 'Sinh viên đi học.',
    },
    {
        id: 79, vietnamese: 'y tá', english: 'nurse',
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop',
        emoji: '👩‍⚕️', category: 'professions', example: 'Y tá chăm sóc bệnh nhân.',
    },
    {
        id: 80, vietnamese: 'đầu bếp', english: 'chef / cook',
        image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=300&fit=crop',
        emoji: '👨‍🍳', category: 'professions', example: 'Đầu bếp nấu ăn ngon.',
    },

    // ─── Emergency ────────────────────────────────────────────────
    {
        id: 81, vietnamese: 'bệnh viện', english: 'hospital',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop',
        emoji: '🏥', category: 'emergency', example: 'Đưa đi bệnh viện ngay.',
    },
    {
        id: 82, vietnamese: 'thuốc', english: 'medicine',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
        emoji: '💊', category: 'emergency', example: 'Uống thuốc mỗi ngày.',
    },
    {
        id: 83, vietnamese: 'giúp tôi', english: 'help me',
        image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=300&fit=crop',
        emoji: '🆘', category: 'emergency', example: 'Giúp tôi với!',
    },
    {
        id: 84, vietnamese: 'đau', english: 'pain / hurt',
        image: 'https://images.unsplash.com/photo-1616012480717-fd637acb80bc?w=400&h=300&fit=crop',
        emoji: '🤕', category: 'emergency', example: 'Tôi bị đau ở đây.',
    },
    {
        id: 85, vietnamese: 'nhà thuốc', english: 'pharmacy',
        image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=300&fit=crop',
        emoji: '💊', category: 'emergency', example: 'Nhà thuốc ở đâu?',
    },

    // ─── Time ─────────────────────────────────────────────────────
    {
        id: 86, vietnamese: 'hôm nay', english: 'today',
        image: 'https://images.unsplash.com/photo-1435527173128-983b87201f4d?w=400&h=300&fit=crop',
        emoji: '📅', category: 'time', example: 'Hôm nay là thứ mấy?',
    },
    {
        id: 87, vietnamese: 'ngày mai', english: 'tomorrow',
        image: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=400&h=300&fit=crop',
        emoji: '🔜', category: 'time', example: 'Ngày mai tôi đi Đà Nẵng.',
    },
    {
        id: 88, vietnamese: 'hôm qua', english: 'yesterday',
        image: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop',
        emoji: '⏪', category: 'time', example: 'Hôm qua trời mưa.',
    },
    {
        id: 89, vietnamese: 'sáng', english: 'morning',
        image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=300&fit=crop',
        emoji: '🌅', category: 'time', example: 'Buổi sáng tôi uống cà phê.',
    },
    {
        id: 90, vietnamese: 'tối', english: 'evening / night',
        image: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&h=300&fit=crop',
        emoji: '🌙', category: 'time', example: 'Buổi tối tôi xem phim.',
    },
];

export const CATEGORIES = [
    { key: 'all', label: 'All', emoji: '📚' },
    { key: 'food', label: 'Food & Drink', emoji: '🍜' },
    { key: 'animals', label: 'Animals', emoji: '🐾' },
    { key: 'objects', label: 'Objects', emoji: '🏠' },
    { key: 'nature', label: 'Nature', emoji: '🌿' },
    { key: 'people', label: 'People', emoji: '👥' },
    { key: 'body', label: 'Body', emoji: '🦴' },
    { key: 'clothing', label: 'Clothing', emoji: '👕' },
    { key: 'colors', label: 'Colors', emoji: '🎨' },
    { key: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
    { key: 'transport', label: 'Transport', emoji: '🚗' },
    { key: 'weather', label: 'Weather', emoji: '🌤️' },
    { key: 'professions', label: 'Professions', emoji: '💼' },
    { key: 'emergency', label: 'Emergency', emoji: '🚨' },
    { key: 'time', label: 'Time', emoji: '⏰' },
];

export default VOCAB_WORDS;
