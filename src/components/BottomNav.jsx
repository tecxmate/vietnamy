import React from 'react';
import { Map, Dumbbell, Book, BookOpen, Trophy } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'roadmap', icon: <Map size={24} />, label: 'Roadmap' },
        { id: 'practice', icon: <Dumbbell size={24} />, label: 'Practice' },
        { id: 'dictionary', icon: <Book size={24} />, label: 'Dictionary' },
        { id: 'grammar', icon: <BookOpen size={24} />, label: 'Grammar' },
        { id: 'leaderboard', icon: <Trophy size={24} />, label: 'Leaderboard' }
    ];

    return (
        <nav className="bottom-nav">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                </button>
            ))}
        </nav>
    );
};

export default BottomNav;
