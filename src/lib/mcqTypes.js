export const MCQ_TYPE_OPTIONS = [
    {
        id: 'mcq_translate_to_en',
        label: 'Vietnamese to English',
        description: 'Show Vietnamese, choose the English meaning.',
    },
    {
        id: 'mcq_translate_to_vi',
        label: 'English to Vietnamese',
        description: 'Show English, choose the Vietnamese phrase.',
    },
    {
        id: 'listen_choose',
        label: 'Listen and choose',
        description: 'Play audio, choose the heard answer.',
    },
    {
        id: 'picture_choice',
        label: 'Picture choice',
        description: 'Show an image or emoji, choose Vietnamese.',
    },
    {
        id: 'fill_blank',
        label: 'Fill blank choice',
        description: 'Show a sentence blank, choose the missing word.',
    },
    {
        id: 'match_pairs',
        label: 'Match pairs',
        description: 'Tap matching Vietnamese and English cards.',
    },
];

export const CHOICE_EXERCISE_TYPES = new Set(MCQ_TYPE_OPTIONS.map(option => option.id));

export function normalizeMcqTypeIds(value) {
    if (!Array.isArray(value)) return [];
    const allowed = new Set(MCQ_TYPE_OPTIONS.map(option => option.id));
    return [...new Set(value.filter(id => allowed.has(id)))];
}
