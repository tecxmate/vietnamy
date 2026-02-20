import React from 'react';
import { Ear, Languages, Mic2, FileAudio, BookA } from 'lucide-react';

const PracticeTab = () => {
    const practiceModules = [
        { title: 'Tones & Diacritics', icon: <BookA className="practice-icon" />, level: 'Beginner' },
        { title: 'Pronunciation Coach', icon: <Mic2 className="practice-icon" />, level: 'All Levels' },
        { title: 'Listening Comprehension', icon: <Ear className="practice-icon" />, level: 'Beginner' },
        { title: 'Speaking Roleplay', icon: <Languages className="practice-icon" />, level: 'Intermediate' },
        { title: 'Vocabulary Flashcards', icon: <FileAudio className="practice-icon" />, level: 'Dynamic SRS' },
    ];

    return (
        <div style={{ padding: 'var(--spacing-4)', paddingBottom: '100px' }}>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Targeted Practice</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Focus on specific skills for quick wins.</p>

            <div className="practice-grid">
                {practiceModules.map((mod, idx) => (
                    <div key={idx} className="practice-card">
                        {mod.icon}
                        <h3 style={{ fontSize: 16, margin: 0 }}>{mod.title}</h3>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{mod.level}</span>
                    </div>
                ))}

                {/* Placeholder for future module to keep grid balanced */}
                <div className="practice-card" style={{ borderStyle: 'dashed', backgroundColor: 'transparent', opacity: 0.5 }}>
                    <div className="practice-icon flex items-center justify-center">+</div>
                    <h3 style={{ fontSize: 16, margin: 0 }}>More coming</h3>
                </div>
            </div>
        </div>
    );
};

export default PracticeTab;
