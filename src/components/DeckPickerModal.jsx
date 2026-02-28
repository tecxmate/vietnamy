import React, { useState } from 'react';
import { X, Plus, Check, BookmarkCheck, Layers } from 'lucide-react';
import {
    isDictWordSaved, toggleDictSavedWord,
    getDictDecks, createDictDeck,
    addWordToDictDeck, removeWordFromDictDeck,
    getWordDeckMemberships,
} from '../lib/dictSavedWords';
import './DeckPickerModal.css';

export default function DeckPickerModal({ word, onClose, onChanged }) {
    const [decks, setDecks] = useState(() => getDictDecks());
    const [memberships, setMemberships] = useState(() => getWordDeckMemberships(word));
    const [savedDefault, setSavedDefault] = useState(() => isDictWordSaved(word));
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');

    const handleToggleDefault = () => {
        const added = toggleDictSavedWord(word);
        setSavedDefault(added);
        onChanged?.();
    };

    const handleToggleDeck = (deckId) => {
        if (memberships.includes(deckId)) {
            removeWordFromDictDeck(deckId, word);
            setMemberships(prev => prev.filter(id => id !== deckId));
        } else {
            addWordToDictDeck(deckId, word);
            setMemberships(prev => [...prev, deckId]);
        }
        onChanged?.();
    };

    const handleCreate = () => {
        if (!newName.trim()) return;
        const deck = createDictDeck(newName.trim());
        addWordToDictDeck(deck.id, word);
        setDecks(getDictDecks());
        setMemberships(prev => [...prev, deck.id]);
        setNewName('');
        setCreating(false);
        onChanged?.();
    };

    return (
        <div className="deck-picker-overlay" onClick={onClose}>
            <div className="deck-picker-modal" onClick={e => e.stopPropagation()}>
                <div className="deck-picker-header">
                    <h3 className="deck-picker-title">Save "{word}"</h3>
                    <button className="deck-picker-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="deck-picker-list">
                    {/* Default saved words */}
                    <button
                        className={`deck-picker-row ${savedDefault ? 'active' : ''}`}
                        onClick={handleToggleDefault}
                    >
                        <div className="deck-picker-row-icon saved">
                            <BookmarkCheck size={18} />
                        </div>
                        <span className="deck-picker-row-name">Saved Words</span>
                        {savedDefault && <Check size={18} className="deck-picker-check" />}
                    </button>

                    {/* Custom decks */}
                    {decks.map(deck => {
                        const inDeck = memberships.includes(deck.id);
                        return (
                            <button
                                key={deck.id}
                                className={`deck-picker-row ${inDeck ? 'active' : ''}`}
                                onClick={() => handleToggleDeck(deck.id)}
                            >
                                <div className="deck-picker-row-icon custom">
                                    <Layers size={18} />
                                </div>
                                <span className="deck-picker-row-name">{deck.name}</span>
                                {inDeck && <Check size={18} className="deck-picker-check" />}
                            </button>
                        );
                    })}
                </div>

                {/* Create new deck */}
                {creating ? (
                    <div className="deck-picker-create-form">
                        <input
                            type="text"
                            className="deck-picker-input"
                            placeholder="Deck name..."
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            autoFocus
                        />
                        <div className="deck-picker-create-actions">
                            <button className="deck-picker-btn primary" onClick={handleCreate} disabled={!newName.trim()}>
                                Create
                            </button>
                            <button className="deck-picker-btn ghost" onClick={() => { setCreating(false); setNewName(''); }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button className="deck-picker-new-btn" onClick={() => setCreating(true)}>
                        <Plus size={16} /> New Deck
                    </button>
                )}
            </div>
        </div>
    );
}
