// src/data/explainerData.js
// "Explainer" content type for the Narrated Reader — a topic = ordered slides
// (annotated real photos) + ordered sentences, where each sentence points at the
// slide shown while it is narrated. Backward-compatible with the article shape
// ({ vi, en, zh }) plus: type, slides[], and per-sentence { slide, note, save }.
//
// Schema:
//   slide:    { id, image, caption_en, caption_zh, tag, callouts:[{ x, y, label }] }
//             x/y are 0..1 normalized coords (render as pins over the photo).
//   sentence: { slide, vi, en, zh, note, save:[phrases] }
//             `note` powers Explain; `save` pre-flags high-value phrases.

const EXPLAINERS = [
    {
        id: 'exp_airport_arrival',
        type: 'explainer',
        title_vi: 'Ở sân bay',
        title_en: 'At the airport',
        title_zh: '在机场',
        category: 'travel',
        level: 'beginner',
        readingTimeMins: 3,
        image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=300&fit=crop',
        slides: [
            {
                id: 's1',
                tag: 'Arrival hall',
                image: 'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=700&h=500&fit=crop',
                caption_en: 'Landing & finding the Immigration signs',
                caption_zh: '降落并寻找“入境”指示牌',
                callouts: [
                    { x: 0.58, y: 0.30, label: 'Nhập cảnh →' },
                    { x: 0.20, y: 0.64, label: 'Follow signs' },
                ],
            },
            {
                id: 's2',
                tag: 'Immigration',
                image: 'https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?w=700&h=500&fit=crop',
                caption_en: 'Passport, visa & the officer’s question',
                caption_zh: '护照、签证与官员的提问',
                callouts: [
                    { x: 0.24, y: 0.34, label: 'Hộ chiếu' },
                    { x: 0.62, y: 0.58, label: 'Visa' },
                ],
            },
            {
                id: 's3',
                tag: 'Baggage claim',
                image: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=700&h=500&fit=crop',
                caption_en: 'Collecting luggage at the carousel',
                caption_zh: '在行李转盘领取行李',
                callouts: [
                    { x: 0.30, y: 0.42, label: 'Băng chuyền' },
                    { x: 0.66, y: 0.24, label: 'Màn hình ↗' },
                ],
            },
            {
                id: 's4',
                tag: 'Money & ATM',
                image: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=700&h=500&fit=crop',
                caption_en: 'How the đồng works, and where to get cash',
                caption_zh: '越南盾如何使用，以及在哪里取现',
                callouts: [
                    { x: 0.26, y: 0.30, label: '100.000đ ≈ $4' },
                    { x: 0.62, y: 0.62, label: 'máy ATM' },
                ],
            },
            {
                id: 's5',
                tag: 'Getting to town',
                image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=700&h=500&fit=crop',
                caption_en: 'Booking a Grab to your hotel',
                caption_zh: '用 Grab 叫车去酒店',
                callouts: [
                    { x: 0.28, y: 0.34, label: 'Mở app Grab' },
                    { x: 0.62, y: 0.60, label: '→ khách sạn' },
                ],
            },
        ],
        sentences: [
            {
                slide: 's1',
                vi: 'Xin chào! Hôm nay chúng ta tìm hiểu về sân bay ở Việt Nam.',
                en: 'Hello! Today we’ll learn about airports in Vietnam.',
                zh: '你好！今天我们来了解越南的机场。',
                note: '“tìm hiểu về …” = “to learn / find out about …”. A friendly, common way to open an explainer.',
                save: ['tìm hiểu', 'sân bay'],
            },
            {
                slide: 's1',
                vi: 'Khi máy bay hạ cánh, bạn đi theo biển “Nhập cảnh”.',
                en: 'When the plane lands, you follow the “Immigration” signs.',
                zh: '飞机降落后，你跟着“入境”指示牌走。',
                note: '“Khi …” = “When …”. Vietnamese puts the time clause first, then the action — no verb tense change needed.',
                save: ['hạ cánh', 'Nhập cảnh'],
            },
            {
                slide: 's2',
                vi: 'Bạn cần hộ chiếu và visa để nhập cảnh.',
                en: 'You need a passport and visa to enter.',
                zh: '你需要护照和签证才能入境。',
                note: '“để + verb” = “in order to …”. Here: “để nhập cảnh” = “in order to enter”.',
                save: ['hộ chiếu', 'nhập cảnh'],
            },
            {
                slide: 's2',
                vi: 'Nhân viên sẽ hỏi: “Bạn ở lại bao lâu?”',
                en: 'The officer will ask: “How long are you staying?”',
                zh: '工作人员会问：“你要待多久？”',
                note: '“sẽ” marks the future. “bao lâu” = “how long” and goes at the END of the question.',
                save: ['nhân viên', 'bao lâu'],
            },
            {
                slide: 's3',
                vi: 'Sau đó, bạn lấy hành lý ở băng chuyền.',
                en: 'After that, you collect your luggage at the carousel.',
                zh: '之后，你在行李转盘领取行李。',
                note: '“Sau đó” = “after that” — a sequencing word that keeps a how-to flowing step by step.',
                save: ['hành lý', 'băng chuyền'],
            },
            {
                slide: 's3',
                vi: 'Tìm số chuyến bay của bạn trên màn hình.',
                en: 'Find your flight number on the screen.',
                zh: '在屏幕上找到你的航班号。',
                note: '“của bạn” = “your” (literally “of you”). Possession comes AFTER the noun in Vietnamese.',
                save: ['chuyến bay', 'màn hình'],
            },
            {
                slide: 's4',
                vi: 'Tiền Việt Nam là “đồng”, viết tắt là “đ”.',
                en: 'Vietnamese money is the “dong”, abbreviated “đ”.',
                zh: '越南货币是“盾”，缩写为“đ”。',
                note: '“là” = “is/are”, used to link two nouns (X là Y). The currency symbol is đ, written after the number.',
                save: ['đồng', 'viết tắt'],
            },
            {
                slide: 's4',
                vi: 'Một trăm nghìn đồng khoảng bốn đô la.',
                en: 'One hundred thousand dong is about four dollars.',
                zh: '十万盾大约是四美元。',
                note: 'Big numbers feel scary at first: 100.000đ ≈ $4. “khoảng” = “about / roughly”.',
                save: ['khoảng', 'đô la'],
            },
            {
                slide: 's4',
                vi: 'Bạn nên rút tiền ở máy ATM trong sân bay.',
                en: 'You should withdraw cash at an ATM in the airport.',
                zh: '你应该在机场的 ATM 取现金。',
                note: '“nên” = “should” — soft advice. Put it right before the verb: nên + rút tiền.',
                save: ['nên', 'rút tiền'],
            },
            {
                slide: 's5',
                vi: 'Để về khách sạn, bạn mở ứng dụng Grab.',
                en: 'To get to your hotel, open the Grab app.',
                zh: '要去酒店，你打开 Grab 应用。',
                note: '“Để + …” opens a purpose clause: “(In order) to get to your hotel …”.',
                save: ['khách sạn', 'ứng dụng'],
            },
            {
                slide: 's5',
                vi: 'Grab giống như taxi, nhưng đặt bằng điện thoại.',
                en: 'Grab is like a taxi, but you book it by phone.',
                zh: 'Grab 像出租车，但用手机预订。',
                note: '“giống như” = “similar to / like”. “bằng” = “by means of” (bằng điện thoại = by phone).',
                save: ['giống như', 'điện thoại'],
            },
            {
                slide: 's5',
                vi: 'Chúc bạn có một chuyến đi vui vẻ!',
                en: 'Have a great trip!',
                zh: '祝你旅途愉快！',
                note: '“Chúc bạn …” = “I wish you …” — the standard way to wish someone well.',
                save: ['chuyến đi', 'vui vẻ'],
            },
        ],
    },
];

export default EXPLAINERS;
