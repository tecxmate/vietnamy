// src/lib/i18n.js — Lightweight i18n for the app
// Usage: const t = useT();  t('home') → "Home" or "首页" etc.

import { useUser } from '../context/UserContext';

const en = {
    // ── Bottom Nav ──
    nav_home: 'Home',
    nav_study: 'Study',
    nav_dictionary: 'Dictionary',
    nav_library: 'Library',
    nav_community: 'Community',

    // ── TopBar / Settings ──
    settings: 'Settings',
    learning: 'Learning',
    dialect: 'Dialect',
    app_language: 'App Language',
    daily_goal: 'Daily Goal',
    level: 'Level',
    dict_languages: 'Dictionary Languages',
    visible_languages: 'Visible Languages',
    voice_sound: 'Voice & Sound',
    tts_speed: 'Speech Speed',
    display: 'Display',
    font_size: 'Font Size',
    reminders: 'Reminders',
    daily_reminder: 'Daily Reminder',
    advanced: 'Advanced',
    test_mode: 'Test Mode (Unlock All)',
    admin_cms: 'Admin CMS',
    reset_progress: 'Reset All Progress',
    reset_confirm: 'Reset all progress and settings? This cannot be undone.',

    // ── TopBar Greetings ──
    good_morning: 'Good morning',
    good_afternoon: 'Good afternoon',
    good_evening: 'Good evening',

    // ── Home Tab ──
    daily_streak: 'Daily Streak',
    words: 'Words',
    lessons: 'Lessons',
    continue_lesson: 'Continue Lesson',
    cards_to_review: 'cards to review',
    words_of_the_day: 'Words of the Day',
    tips_tricks: 'Tips & Tricks',
    explore_vietnam: 'Explore Vietnam',
    search_placeholder: 'Type a word to search...',

    // ── Library Tab ──
    grammar: 'Grammar',
    readings: 'Readings',
    practice: 'Practice',
    vocabulary: 'Vocabulary',
    recent: 'Recent',
    name: 'Name',
    items: 'items',

    // ── Common ──
    start: 'Start',
    continue: 'Continue',
    cancel: 'Cancel',
    done: 'Done',
    back: 'Back',
};

const zh = {
    nav_home: '首页', nav_study: '学习', nav_dictionary: '词典', nav_library: '资料库', nav_community: '社区',
    settings: '设置', learning: '学习', dialect: '方言', app_language: '应用语言', daily_goal: '每日目标',
    level: '等级', dict_languages: '词典语言', visible_languages: '显示语言', voice_sound: '语音与声音',
    tts_speed: '语速', display: '显示', font_size: '字体大小', reminders: '提醒', daily_reminder: '每日提醒',
    advanced: '高级', test_mode: '测试模式（解锁全部）', admin_cms: '管理后台', reset_progress: '重置所有进度',
    reset_confirm: '重置所有进度和设置？此操作不可撤销。',
    good_morning: '早上好', good_afternoon: '下午好', good_evening: '晚上好',
    daily_streak: '连续天数', words: '单词', lessons: '课程', continue_lesson: '继续课程',
    cards_to_review: '张卡片待复习', words_of_the_day: '每日词汇', tips_tricks: '学习技巧', explore_vietnam: '探索越南',
    search_placeholder: '输入搜索词...',
    grammar: '语法', readings: '阅读', practice: '练习', vocabulary: '词汇',
    recent: '最近', name: '名称', items: '项',
    start: '开始', continue: '继续', cancel: '取消', done: '完成', back: '返回',
};

const ja = {
    nav_home: 'ホーム', nav_study: '学習', nav_dictionary: '辞書', nav_library: 'ライブラリ', nav_community: 'コミュニティ',
    settings: '設定', learning: '学習', dialect: '方言', app_language: 'アプリ言語', daily_goal: '毎日の目標',
    level: 'レベル', dict_languages: '辞書の言語', visible_languages: '表示言語', voice_sound: '音声・サウンド',
    tts_speed: '読み上げ速度', display: '表示', font_size: 'フォントサイズ', reminders: 'リマインダー', daily_reminder: '毎日のリマインダー',
    advanced: '詳細設定', test_mode: 'テストモード（全解放）', admin_cms: '管理画面', reset_progress: '進捗をリセット',
    reset_confirm: 'すべての進捗と設定をリセットしますか？元に戻せません。',
    good_morning: 'おはようございます', good_afternoon: 'こんにちは', good_evening: 'こんばんは',
    daily_streak: '連続日数', words: '単語', lessons: 'レッスン', continue_lesson: 'レッスンを続ける',
    cards_to_review: '枚復習カード', words_of_the_day: '今日の単語', tips_tricks: 'ヒント', explore_vietnam: 'ベトナムを探索',
    search_placeholder: '単語を入力...',
    grammar: '文法', readings: 'リーディング', practice: '練習', vocabulary: '語彙',
    recent: '最近', name: '名前', items: '件',
    start: '開始', continue: '続ける', cancel: 'キャンセル', done: '完了', back: '戻る',
};

const fr = {
    nav_home: 'Accueil', nav_study: 'Étudier', nav_dictionary: 'Dictionnaire', nav_library: 'Bibliothèque', nav_community: 'Communauté',
    settings: 'Paramètres', learning: 'Apprentissage', dialect: 'Dialecte', app_language: 'Langue de l\'appli', daily_goal: 'Objectif quotidien',
    level: 'Niveau', dict_languages: 'Langues du dictionnaire', visible_languages: 'Langues affichées', voice_sound: 'Voix et son',
    tts_speed: 'Vitesse de parole', display: 'Affichage', font_size: 'Taille de police', reminders: 'Rappels', daily_reminder: 'Rappel quotidien',
    advanced: 'Avancé', test_mode: 'Mode test (tout débloquer)', admin_cms: 'Admin CMS', reset_progress: 'Réinitialiser la progression',
    reset_confirm: 'Réinitialiser toute la progression ? Cette action est irréversible.',
    good_morning: 'Bonjour', good_afternoon: 'Bon après-midi', good_evening: 'Bonsoir',
    daily_streak: 'Série quotidienne', words: 'Mots', lessons: 'Leçons', continue_lesson: 'Continuer la leçon',
    cards_to_review: 'cartes à réviser', words_of_the_day: 'Mots du jour', tips_tricks: 'Astuces', explore_vietnam: 'Explorer le Vietnam',
    search_placeholder: 'Tapez un mot...',
    grammar: 'Grammaire', readings: 'Lectures', practice: 'Pratique', vocabulary: 'Vocabulaire',
    recent: 'Récent', name: 'Nom', items: 'éléments',
    start: 'Commencer', continue: 'Continuer', cancel: 'Annuler', done: 'Terminé', back: 'Retour',
};

const de = {
    nav_home: 'Start', nav_study: 'Lernen', nav_dictionary: 'Wörterbuch', nav_library: 'Bibliothek', nav_community: 'Community',
    settings: 'Einstellungen', learning: 'Lernen', dialect: 'Dialekt', app_language: 'App-Sprache', daily_goal: 'Tagesziel',
    level: 'Stufe', dict_languages: 'Wörterbuchsprachen', visible_languages: 'Sichtbare Sprachen', voice_sound: 'Stimme & Ton',
    tts_speed: 'Sprechgeschwindigkeit', display: 'Anzeige', font_size: 'Schriftgröße', reminders: 'Erinnerungen', daily_reminder: 'Tägliche Erinnerung',
    advanced: 'Erweitert', test_mode: 'Testmodus (Alles freischalten)', admin_cms: 'Admin CMS', reset_progress: 'Fortschritt zurücksetzen',
    reset_confirm: 'Alle Fortschritte zurücksetzen? Dies kann nicht rückgängig gemacht werden.',
    good_morning: 'Guten Morgen', good_afternoon: 'Guten Tag', good_evening: 'Guten Abend',
    daily_streak: 'Tages-Streak', words: 'Wörter', lessons: 'Lektionen', continue_lesson: 'Lektion fortsetzen',
    cards_to_review: 'Karten zur Wiederholung', words_of_the_day: 'Wörter des Tages', tips_tricks: 'Tipps & Tricks', explore_vietnam: 'Vietnam entdecken',
    search_placeholder: 'Wort eingeben...',
    grammar: 'Grammatik', readings: 'Lesen', practice: 'Übung', vocabulary: 'Wortschatz',
    recent: 'Zuletzt', name: 'Name', items: 'Elemente',
    start: 'Starten', continue: 'Weiter', cancel: 'Abbrechen', done: 'Fertig', back: 'Zurück',
};

const ru = {
    nav_home: 'Главная', nav_study: 'Учить', nav_dictionary: 'Словарь', nav_library: 'Библиотека', nav_community: 'Сообщество',
    settings: 'Настройки', learning: 'Обучение', dialect: 'Диалект', app_language: 'Язык приложения', daily_goal: 'Дневная цель',
    level: 'Уровень', dict_languages: 'Языки словаря', visible_languages: 'Видимые языки', voice_sound: 'Голос и звук',
    tts_speed: 'Скорость речи', display: 'Отображение', font_size: 'Размер шрифта', reminders: 'Напоминания', daily_reminder: 'Ежедневное напоминание',
    advanced: 'Дополнительно', test_mode: 'Тест-режим (Открыть всё)', admin_cms: 'Админ-панель', reset_progress: 'Сбросить прогресс',
    reset_confirm: 'Сбросить весь прогресс и настройки? Это нельзя отменить.',
    good_morning: 'Доброе утро', good_afternoon: 'Добрый день', good_evening: 'Добрый вечер',
    daily_streak: 'Серия дней', words: 'Слова', lessons: 'Уроки', continue_lesson: 'Продолжить урок',
    cards_to_review: 'карт на повторение', words_of_the_day: 'Слова дня', tips_tricks: 'Советы', explore_vietnam: 'Открой Вьетнам',
    search_placeholder: 'Введите слово...',
    grammar: 'Грамматика', readings: 'Чтение', practice: 'Практика', vocabulary: 'Словарный запас',
    recent: 'Недавние', name: 'Название', items: 'элементов',
    start: 'Начать', continue: 'Продолжить', cancel: 'Отмена', done: 'Готово', back: 'Назад',
};

const it = {
    nav_home: 'Home', nav_study: 'Studio', nav_dictionary: 'Dizionario', nav_library: 'Libreria', nav_community: 'Comunità',
    settings: 'Impostazioni', learning: 'Apprendimento', dialect: 'Dialetto', app_language: 'Lingua dell\'app', daily_goal: 'Obiettivo giornaliero',
    level: 'Livello', dict_languages: 'Lingue del dizionario', visible_languages: 'Lingue visibili', voice_sound: 'Voce e suono',
    tts_speed: 'Velocità vocale', display: 'Visualizzazione', font_size: 'Dimensione carattere', reminders: 'Promemoria', daily_reminder: 'Promemoria giornaliero',
    advanced: 'Avanzato', test_mode: 'Modalità test (Sblocca tutto)', admin_cms: 'Admin CMS', reset_progress: 'Resetta il progresso',
    reset_confirm: 'Resettare tutti i progressi? Questa azione non può essere annullata.',
    good_morning: 'Buongiorno', good_afternoon: 'Buon pomeriggio', good_evening: 'Buonasera',
    daily_streak: 'Serie giornaliera', words: 'Parole', lessons: 'Lezioni', continue_lesson: 'Continua lezione',
    cards_to_review: 'carte da rivedere', words_of_the_day: 'Parole del giorno', tips_tricks: 'Suggerimenti', explore_vietnam: 'Esplora il Vietnam',
    search_placeholder: 'Cerca una parola...',
    grammar: 'Grammatica', readings: 'Letture', practice: 'Pratica', vocabulary: 'Vocabolario',
    recent: 'Recenti', name: 'Nome', items: 'elementi',
    start: 'Inizia', continue: 'Continua', cancel: 'Annulla', done: 'Fatto', back: 'Indietro',
};

const no = {
    nav_home: 'Hjem', nav_study: 'Studer', nav_dictionary: 'Ordbok', nav_library: 'Bibliotek', nav_community: 'Fellesskap',
    settings: 'Innstillinger', learning: 'Læring', dialect: 'Dialekt', app_language: 'App-språk', daily_goal: 'Daglig mål',
    level: 'Nivå', dict_languages: 'Ordbokspråk', visible_languages: 'Synlige språk', voice_sound: 'Stemme og lyd',
    tts_speed: 'Talehastighet', display: 'Visning', font_size: 'Skriftstørrelse', reminders: 'Påminnelser', daily_reminder: 'Daglig påminnelse',
    advanced: 'Avansert', test_mode: 'Testmodus (Lås opp alt)', admin_cms: 'Admin CMS', reset_progress: 'Tilbakestill fremgang',
    reset_confirm: 'Tilbakestille all fremgang og innstillinger? Dette kan ikke angres.',
    good_morning: 'God morgen', good_afternoon: 'God ettermiddag', good_evening: 'God kveld',
    daily_streak: 'Dager på rad', words: 'Ord', lessons: 'Leksjoner', continue_lesson: 'Fortsett leksjonen',
    cards_to_review: 'kort å repetere', words_of_the_day: 'Dagens ord', tips_tricks: 'Tips og triks', explore_vietnam: 'Utforsk Vietnam',
    search_placeholder: 'Skriv et ord...',
    grammar: 'Grammatikk', readings: 'Lesing', practice: 'Øving', vocabulary: 'Ordforråd',
    recent: 'Nylig', name: 'Navn', items: 'elementer',
    start: 'Start', continue: 'Fortsett', cancel: 'Avbryt', done: 'Ferdig', back: 'Tilbake',
};

const es = {
    nav_home: 'Inicio', nav_study: 'Estudiar', nav_dictionary: 'Diccionario', nav_library: 'Biblioteca', nav_community: 'Comunidad',
    settings: 'Ajustes', learning: 'Aprendizaje', dialect: 'Dialecto', app_language: 'Idioma de la app', daily_goal: 'Meta diaria',
    level: 'Nivel', dict_languages: 'Idiomas del diccionario', visible_languages: 'Idiomas visibles', voice_sound: 'Voz y sonido',
    tts_speed: 'Velocidad de voz', display: 'Pantalla', font_size: 'Tamaño de fuente', reminders: 'Recordatorios', daily_reminder: 'Recordatorio diario',
    advanced: 'Avanzado', test_mode: 'Modo prueba (Desbloquear todo)', admin_cms: 'Admin CMS', reset_progress: 'Reiniciar progreso',
    reset_confirm: '¿Reiniciar todo el progreso? Esta acción no se puede deshacer.',
    good_morning: 'Buenos días', good_afternoon: 'Buenas tardes', good_evening: 'Buenas noches',
    daily_streak: 'Racha diaria', words: 'Palabras', lessons: 'Lecciones', continue_lesson: 'Continuar lección',
    cards_to_review: 'tarjetas por repasar', words_of_the_day: 'Palabras del día', tips_tricks: 'Consejos', explore_vietnam: 'Explora Vietnam',
    search_placeholder: 'Escribe una palabra...',
    grammar: 'Gramática', readings: 'Lecturas', practice: 'Práctica', vocabulary: 'Vocabulario',
    recent: 'Reciente', name: 'Nombre', items: 'elementos',
    start: 'Empezar', continue: 'Continuar', cancel: 'Cancelar', done: 'Listo', back: 'Volver',
};

const zht = {
    nav_home: '首頁', nav_study: '學習', nav_dictionary: '詞典', nav_library: '資料庫', nav_community: '社群',
    settings: '設定', learning: '學習', dialect: '方言', app_language: '應用語言', daily_goal: '每日目標',
    level: '等級', dict_languages: '詞典語言', visible_languages: '顯示語言', voice_sound: '語音與聲音',
    tts_speed: '語速', display: '顯示', font_size: '字型大小', reminders: '提醒', daily_reminder: '每日提醒',
    advanced: '進階', test_mode: '測試模式（解鎖全部）', admin_cms: '管理後台', reset_progress: '重置所有進度',
    reset_confirm: '重置所有進度和設定？此操作不可撤銷。',
    good_morning: '早安', good_afternoon: '午安', good_evening: '晚安',
    daily_streak: '連續天數', words: '單字', lessons: '課程', continue_lesson: '繼續課程',
    cards_to_review: '張卡片待複習', words_of_the_day: '每日詞彙', tips_tricks: '學習技巧', explore_vietnam: '探索越南',
    search_placeholder: '輸入搜尋詞...',
    grammar: '文法', readings: '閱讀', practice: '練習', vocabulary: '詞彙',
    recent: '最近', name: '名稱', items: '項',
    start: '開始', continue: '繼續', cancel: '取消', done: '完成', back: '返回',
};

const TRANSLATIONS = { en, zh, 'zh-t': zht, ja, fr, de, ru, it, no, es };

/** Get a translator function for a given language code */
export function getT(lang) {
    const dict = TRANSLATIONS[lang] || en;
    return (key) => dict[key] ?? en[key] ?? key;
}

/** React hook — reads nativeLang from UserContext */
export function useT() {
    const { userProfile } = useUser();
    return getT(userProfile.nativeLang || 'en');
}
