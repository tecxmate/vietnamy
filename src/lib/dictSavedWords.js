// Dictionary Saved Words — localStorage persistence for dictionary lookups & custom decks

const SAVED_KEY = 'vnme_dict_saved_words';
const DECKS_KEY = 'vnme_dict_decks';

// ─── Default Saved Words ───────────────────────────────────────

function loadSaved() {
    try {
        const raw = localStorage.getItem(SAVED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveSaved(words) {
    localStorage.setItem(SAVED_KEY, JSON.stringify(words));
}

export function getDictSavedWords() {
    return loadSaved();
}

export function isDictWordSaved(word) {
    return loadSaved().includes(word);
}

export function toggleDictSavedWord(word) {
    const words = loadSaved();
    const idx = words.indexOf(word);
    if (idx >= 0) {
        words.splice(idx, 1);
    } else {
        words.push(word);
    }
    saveSaved(words);
    return idx < 0; // returns true if word was added, false if removed
}

// ─── Custom Decks ──────────────────────────────────────────────

function loadDecks() {
    try {
        const raw = localStorage.getItem(DECKS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveDecks(decks) {
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

export function getDictDecks() {
    return loadDecks();
}

export function createDictDeck(name) {
    const decks = loadDecks();
    const deck = { id: `dict_${Date.now()}`, name, words: [], createdAt: Date.now() };
    decks.push(deck);
    saveDecks(decks);
    return deck;
}

export function deleteDictDeck(deckId) {
    const decks = loadDecks().filter(d => d.id !== deckId);
    saveDecks(decks);
    return decks;
}

export function addWordToDictDeck(deckId, word) {
    const decks = loadDecks();
    const deck = decks.find(d => d.id === deckId);
    if (deck && !deck.words.includes(word)) {
        deck.words.push(word);
        saveDecks(decks);
    }
    return decks;
}

export function removeWordFromDictDeck(deckId, word) {
    const decks = loadDecks();
    const deck = decks.find(d => d.id === deckId);
    if (deck) {
        deck.words = deck.words.filter(w => w !== word);
        saveDecks(decks);
    }
    return decks;
}

/** Returns array of deck IDs that contain this word */
export function getWordDeckMemberships(word) {
    return loadDecks().filter(d => d.words.includes(word)).map(d => d.id);
}
