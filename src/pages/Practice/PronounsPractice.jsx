import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import FamilyTree from '../../components/FamilyTree';
import { FAMILY_MEMBERS } from '../../data/kinshipData';
import { calculatePronoun } from '../../utils/pronounLogic';
import { User, RefreshCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PronounsPractice.css';
import SoundButton from '../../components/SoundButton';
import './PracticeShared.css'; // Add shared layout

export default function PronounsPractice() {
    const { userProfile, updateUserProfile } = useUser();
    const [selectedMember, setSelectedMember] = useState(null);
    const [revealAnswer, setRevealAnswer] = useState(false);

    // Filter out "Self" from selectable logic targets, but allow clicking to reset
    const handleMemberSelect = (member) => {
        if (member.relationType === 'self') {
            setSelectedMember(null);
            setRevealAnswer(false);
            return;
        }

        if (selectedMember && selectedMember.id === member.id) {
            setSelectedMember(null);
            setRevealAnswer(false);
            return;
        }

        setSelectedMember(member);
        setRevealAnswer(false);
    };

    const handleProfileChange = (key, value) => {
        updateUserProfile({ [key]: value });
        setRevealAnswer(false); // Reset to encourage re-checking logic
    };

    const pronounData = selectedMember ? calculatePronoun(userProfile, selectedMember) : null;

    return (
        <div className="practice-layout" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="practice-header">
                <h1 className="practice-header-title">
                    <Link to="/practice" style={{ color: 'var(--text-main)', display: 'flex' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    Kinship & Pronouns
                </h1>
            </div>

            <p className="practice-subtitle" style={{ textAlign: 'center', marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px' }}>
                Vietnamese pronouns change based on who you are talking to. Select a family member to see how to address them.
            </p>

            <div className="pronouns-content">
                <div className="profile-config-panel">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)' }}><User size={18} /> Your Persona</h3>
                    <div className="config-row">
                        <label>Gender:</label>
                        <div className="toggle-group">
                            <button
                                className={userProfile.gender === 'male' ? 'active' : ''}
                                onClick={() => handleProfileChange('gender', 'male')}
                            >
                                Male
                            </button>
                            <button
                                className={userProfile.gender === 'female' ? 'active' : ''}
                                onClick={() => handleProfileChange('gender', 'female')}
                            >
                                Female
                            </button>
                        </div>
                    </div>
                    <div className="config-row">
                        <label>Age: {userProfile.age}</label>
                        <input
                            type="range"
                            min="5"
                            max="80"
                            value={userProfile.age}
                            onChange={(e) => handleProfileChange('age', parseInt(e.target.value))}
                        />
                    </div>
                    <div className="persona-summary">
                        You are a <strong>{userProfile.age}</strong> year old <strong>{userProfile.gender}</strong>.
                    </div>
                </div>

                <div className="tree-section" style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
                    <FamilyTree
                        familyData={FAMILY_MEMBERS.map(m => ({
                            ...m,
                            age: m.relationType === 'self' ? userProfile.age : Math.max(1, userProfile.age + m.ageOffset) // Ensure no negative ages
                        }))}
                        onSelectMember={handleMemberSelect}
                        selectedMemberId={selectedMember?.id}
                    />
                </div>

                <div className="interaction-panel">
                    {selectedMember ? (
                        <div className="interaction-card">
                            <h3 style={{ textAlign: 'center', color: 'var(--text-main)', marginBottom: '16px' }}>Conversation Simulation</h3>
                            <div className="scenario-desc" style={{ textAlign: 'center', marginBottom: '24px', fontSize: '1.1rem' }}>
                                You are talking to your <strong style={{ color: 'var(--primary-color)' }}>{selectedMember.label}</strong>.
                            </div>

                            {!revealAnswer ? (
                                <SoundButton className="practice-action-btn primary" onClick={() => setRevealAnswer(true)}>
                                    How do we address each other?
                                </SoundButton>
                            ) : (
                                <div className="result-display" style={{ animation: 'slideUpResult 0.3s ease-out' }}>
                                    <div className="pronoun-equation">
                                        <div className="side">
                                            <span className="p-label">You call yourself</span>
                                            <span className="p-word">{pronounData.selfPronoun}</span>
                                        </div>
                                        <ArrowRight className="arrow" />
                                        <div className="side">
                                            <span className="p-label">You call them</span>
                                            <span className="p-word">{pronounData.targetPronoun}</span>
                                        </div>
                                    </div>
                                    <div className="explanation">
                                        <strong>Why?</strong> {pronounData.explanation}
                                    </div>
                                    <SoundButton className="practice-action-btn" sound="button" style={{ background: 'var(--surface-color)', border: '2px solid var(--border-color)', color: 'var(--text-main)', boxShadow: '0 4px 0 var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%' }} onClick={() => setRevealAnswer(false)}>
                                        <RefreshCcw size={18} /> Try Another
                                    </SoundButton>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="placeholder-card">
                            <p style={{ color: 'var(--text-muted)' }}>Select a family member from the tree above to start.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
