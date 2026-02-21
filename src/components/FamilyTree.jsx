import React from 'react';
import './FamilyTree.css';
import { User, Users } from 'lucide-react';

const GenerationRow = ({ label, members, onSelectMember, selectedMemberId }) => {
    if (!members || members.length === 0) return null;

    return (
        <div className="gen-row">
            <div className="gen-label">{label}</div>
            <div className="gen-members">
                {members.map(member => (
                    <div
                        key={member.id}
                        className={`family-node ${member.gender} ${selectedMemberId === member.id ? 'selected' : ''} ${member.relationType === 'self' ? 'self-node' : ''}`}
                        onClick={() => onSelectMember(member)}
                    >
                        <div className="node-icon">
                            {member.relationType === 'self' ? <User size={20} /> : <Users size={20} />}
                        </div>
                        <span className="node-label">{member.label}</span>
                        {member.age && <span className="node-age">({member.age})</span>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function FamilyTree({ familyData, onSelectMember, selectedMemberId }) {
    // Group by generation
    const gen2 = familyData.filter(m => m.generation === 2);
    const gen1 = familyData.filter(m => m.generation === 1);
    const gen0 = familyData.filter(m => m.generation === 0);
    const genMin1 = familyData.filter(m => m.generation === -1);

    return (
        <div className="family-tree-container">
            <GenerationRow label="Grandparents" members={gen2} onSelectMember={onSelectMember} selectedMemberId={selectedMemberId} />
            <div className="tree-connector">|</div>
            <GenerationRow label="Parents & Uncles/Aunts" members={gen1} onSelectMember={onSelectMember} selectedMemberId={selectedMemberId} />
            <div className="tree-connector">|</div>
            <GenerationRow label="You & Siblings" members={gen0} onSelectMember={onSelectMember} selectedMemberId={selectedMemberId} />
            {genMin1.length > 0 && (
                <>
                    <div className="tree-connector">|</div>
                    <GenerationRow label="Children" members={genMin1} onSelectMember={onSelectMember} selectedMemberId={selectedMemberId} />
                </>
            )}
        </div>
    );
}
