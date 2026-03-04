import VOCAB_WORDS from '../data/vocabWords';

const imageMap = new Map();
VOCAB_WORDS.forEach(w => {
    imageMap.set(w.vietnamese.toLowerCase(), { image: w.image, emoji: w.emoji });
});

export function getImageForWord(viText) {
    return imageMap.get(viText.toLowerCase()) || null;
}

export function getItemsWithImages(items) {
    return items.filter(item => imageMap.has(item.vi_text.toLowerCase()));
}
