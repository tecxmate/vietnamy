import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Users, Hash, PenTool, Type, Keyboard, Layers, MessageCircle } from 'lucide-react';

const practiceModules = [
    { id: 'tones', title: 'Tone Mastery', icon: <Music size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/tones' },
    { id: 'pronouns', title: 'Pronouns', icon: <Users size={24} className="practice-icon" />, level: 'All Levels', link: '/practice/pronouns' },
    { id: 'numbers', title: 'Numbers', icon: <Hash size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/numbers' },
    { id: 'tonemarks', title: 'Tone Marks', icon: <PenTool size={24} className="practice-icon" />, level: 'Intermediate', link: '/practice/tonemarks' },
    { id: 'vowels', title: 'Vowels', icon: <Type size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/vowels' },
    { id: 'telex', title: 'TELEX Typing', icon: <Keyboard size={24} className="practice-icon" />, level: 'Beginner', link: '/practice/telex' },
    { id: 'teencode', title: 'Teen Code', icon: <MessageCircle size={24} className="practice-icon" />, level: 'Intermediate', link: '/practice/teencode' },
    { id: 'flashcards', title: 'Flashcard Decks', icon: <Layers size={24} className="practice-icon" />, level: 'All Levels', link: '/practice/flashcards' },
];

const PracticeTab = () => {
    return (
        <div style={{ padding: 'var(--spacing-4)', paddingBottom: '100px' }}>
            <div className="practice-grid">
                {practiceModules.map((mod, idx) => (
                    <Link
                        key={idx}
                        to={mod.link}
                        className="practice-card"
                        style={{
                            textDecoration: 'none',
                            color: 'inherit',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        {mod.icon}
                        <h3 style={{ fontSize: 16, margin: 0, marginTop: 12 }}>{mod.title}</h3>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{mod.level}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default PracticeTab;
