// Vocab Library — localStorage persistence for saved words & custom decks

const SAVED_KEY = 'vnme_saved_words';
const DECKS_KEY = 'vnme_custom_decks';

// ─── Saved Words ────────────────────────────────────────────────

function loadSaved() {
    try {
        const raw = localStorage.getItem(SAVED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveSaved(ids) {
    localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
}

export function getSavedWordIds() {
    return loadSaved();
}

export function isWordSaved(id) {
    return loadSaved().includes(id);
}

export function toggleSavedWord(id) {
    const ids = loadSaved();
    const idx = ids.indexOf(id);
    if (idx >= 0) {
        ids.splice(idx, 1);
    } else {
        ids.push(id);
    }
    saveSaved(ids);
    return ids;
}

// ─── Custom Decks ───────────────────────────────────────────────

function loadDecks() {
    try {
        const raw = localStorage.getItem(DECKS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveDecks(decks) {
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function getCustomDecks() {
    return loadDecks();
}

export function createCustomDeck(name) {
    const decks = loadDecks();
    const deck = { id: `custom_${Date.now()}`, name, wordIds: [] };
    decks.push(deck);
    saveDecks(decks);
    return deck;
}

export function deleteCustomDeck(deckId) {
    const decks = loadDecks().filter(d => d.id !== deckId);
    saveDecks(decks);
    return decks;
}

export function addWordToDeck(deckId, wordId) {
    const decks = loadDecks();
    const deck = decks.find(d => d.id === deckId);
    if (deck && !deck.wordIds.includes(wordId)) {
        deck.wordIds.push(wordId);
        saveDecks(decks);
    }
    return decks;
}

export function removeWordFromDeck(deckId, wordId) {
    const decks = loadDecks();
    const deck = decks.find(d => d.id === deckId);
    if (deck) {
        deck.wordIds = deck.wordIds.filter(id => id !== wordId);
        saveDecks(decks);
    }
    return decks;
}
