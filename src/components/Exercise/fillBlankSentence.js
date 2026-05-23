const BLANK_RE = /_{2,}/g;

export function getFillBlankTemplate(source = {}) {
    return source.template_vi || source.sentence_with_blank || '';
}

export function buildFillBlankSentence(templateOrPrompt, answer = '') {
    const template = typeof templateOrPrompt === 'string'
        ? templateOrPrompt
        : getFillBlankTemplate(templateOrPrompt);

    const explicitSentence = typeof templateOrPrompt === 'object'
        ? templateOrPrompt.full_answer_vi || templateOrPrompt.answer_sentence_vi
        : '';

    if (!answer && explicitSentence) return explicitSentence;
    if (!template) return answer || explicitSentence || '';
    if (!answer) return template;

    return template
        .replace(BLANK_RE, answer)
        .replace(/\s+([,.!?;:])/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}

export function getFillBlankCorrectSentence(prompt = {}) {
    return buildFillBlankSentence(prompt, prompt.answer_vi || prompt.answer || '');
}
