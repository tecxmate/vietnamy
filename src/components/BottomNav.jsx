import React from 'react';
import { Map, Dumbbell, Presentation, UserRound } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'roadmap', icon: <Map size={24} />, label: 'Roadmap' },
        { id: 'practice', icon: <Dumbbell size={24} />, label: 'Practice' },
        { id: 'watch', icon: <Presentation size={24} />, label: 'Watch' },
        { id: 'me', icon: <UserRound size={24} />, label: 'Me' }
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
