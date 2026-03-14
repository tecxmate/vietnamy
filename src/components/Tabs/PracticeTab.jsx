import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Music, Users, Hash, PenTool, Type, Keyboard, MessageCircle, Activity, SlidersHorizontal } from 'lucide-react';

const CATEGORY_STYLES = {
    Phonetics: { color: '#1CB0F6', dark: '#0D8ECF', bg: 'rgba(28,176,246,0.12)' },
    Numbers:   { color: '#FFB703', dark: '#CC9202', bg: 'rgba(255,183,3,0.12)' },
    Pronouns:  { color: '#A78BFA', dark: '#7C3AED', bg: 'rgba(167,139,250,0.12)' },
    Typing:    { color: '#06D6A0', dark: '#05A67D', bg: 'rgba(6,214,160,0.12)' },
};

const practiceModules = [
    // ── Phonetics ──
    { id: 'tones-1', title: 'Tones: Level & Rising', icon: Music, level: 'Beginner', link: '/practice/tones-1', category: 'Phonetics' },
    { id: 'tones-2', title: 'Tones: + Falling', icon: Music, level: 'Beginner', link: '/practice/tones-2', category: 'Phonetics' },
    { id: 'tones-3', title: 'Tones: + Dipping', icon: Music, level: 'Intermediate', link: '/practice/tones-3', category: 'Phonetics' },
    { id: 'tones-4', title: 'Tones: All 6', icon: Music, level: 'Intermediate', link: '/practice/tones-4', category: 'Phonetics' },
    { id: 'pitch-1', title: 'Pitch: Easy Tones', icon: Activity, level: 'Intermediate', link: '/practice/pitch-1', category: 'Phonetics' },
    { id: 'pitch-2', title: 'Pitch: Hard Tones', icon: Activity, level: 'Advanced', link: '/practice/pitch-2', category: 'Phonetics' },
    { id: 'tonemarks-basic', title: 'Tone Marks: Basics', icon: PenTool, level: 'Beginner', link: '/practice/tonemarks-basic', category: 'Phonetics' },
    { id: 'tonemarks-special', title: 'Tone Marks: Special', icon: PenTool, level: 'Intermediate', link: '/practice/tonemarks-special', category: 'Phonetics' },
    { id: 'tonemarks-master', title: 'Tone Marks: Master', icon: PenTool, level: 'Advanced', link: '/practice/tonemarks-master', category: 'Phonetics' },
    { id: 'vowels-single-1', title: 'Vowels: Basics', icon: Type, level: 'Beginner', link: '/practice/vowels-single-1', category: 'Phonetics' },
    { id: 'vowels-single-2', title: 'Vowels: Special', icon: Type, level: 'Beginner', link: '/practice/vowels-single-2', category: 'Phonetics' },
    { id: 'vowels-diph-1', title: 'Vowels: Centering', icon: Type, level: 'Intermediate', link: '/practice/vowels-diph-1', category: 'Phonetics' },
    { id: 'vowels-diph-2', title: 'Vowels: Gliding', icon: Type, level: 'Intermediate', link: '/practice/vowels-diph-2', category: 'Phonetics' },
    { id: 'vowels-diph-3', title: 'Vowels: Advanced', icon: Type, level: 'Advanced', link: '/practice/vowels-diph-3', category: 'Phonetics' },
    // ── Numbers ──
    { id: 'numbers-1', title: 'Numbers: 0-10', icon: Hash, level: 'Beginner', link: '/practice/numbers-1', category: 'Numbers' },
    { id: 'numbers-2', title: 'Numbers: Compounds', icon: Hash, level: 'Intermediate', link: '/practice/numbers-2', category: 'Numbers' },
    { id: 'numbers-3', title: 'Numbers: Challenge', icon: Hash, level: 'Advanced', link: '/practice/numbers-3', category: 'Numbers' },
    // ── Pronouns ──
    { id: 'kinship-foundation', title: 'Kinship Terms', icon: Users, level: 'Beginner', link: '/practice/kinship-foundation', category: 'Pronouns' },
    { id: 'pronouns-1', title: 'Pronouns: Core', icon: Users, level: 'Beginner', link: '/practice/pronouns-1', category: 'Pronouns' },
    { id: 'pronouns-2', title: 'Pronouns: Extended', icon: Users, level: 'Intermediate', link: '/practice/pronouns-2', category: 'Pronouns' },
    { id: 'kinship-engine', title: 'Pronoun Engine', icon: SlidersHorizontal, level: 'Advanced', link: '/practice/kinship-engine', category: 'Pronouns' },
    // ── Typing ──
    { id: 'telex-1', title: 'TELEX: Tone Keys', icon: Keyboard, level: 'Beginner', link: '/practice/telex-1', category: 'Typing' },
    { id: 'telex-2', title: 'TELEX: Vowel Mods', icon: Keyboard, level: 'Beginner', link: '/practice/telex-2', category: 'Typing' },
    { id: 'telex-3', title: 'TELEX: Full Challenge', icon: Keyboard, level: 'Intermediate', link: '/practice/telex-3', category: 'Typing' },
    { id: 'teencode-1', title: 'Teen Code: Basics', icon: MessageCircle, level: 'Intermediate', link: '/practice/teencode-1', category: 'Typing' },
    { id: 'teencode-2', title: 'Teen Code: People', icon: MessageCircle, level: 'Intermediate', link: '/practice/teencode-2', category: 'Typing' },
    { id: 'teencode-3', title: 'Teen Code: Life', icon: MessageCircle, level: 'Advanced', link: '/practice/teencode-3', category: 'Typing' },
];

const categories = ['Phonetics', 'Numbers', 'Pronouns', 'Typing'];
const groupedModules = categories.map(cat => ({
    name: cat,
    style: CATEGORY_STYLES[cat],
    modules: practiceModules.filter(m => m.category === cat),
}));

const PracticeTab = () => {
    const [activeFilters, setActiveFilters] = useState(new Set(categories));

    const toggleFilter = (cat) => {
        setActiveFilters(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const visibleGroups = groupedModules.filter(g => activeFilters.has(g.name));

    return (
        <div style={{ padding: '16px', paddingBottom: '100px' }}>
            {/* Category filter chips */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
                {groupedModules.map(group => {
                    const isActive = activeFilters.has(group.name);
                    const s = group.style;
                    return (
                        <button
                            key={group.name}
                            onClick={() => toggleFilter(group.name)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 14px', borderRadius: 20,
                                border: `2px solid ${isActive ? s.color : 'var(--border-color)'}`,
                                backgroundColor: isActive ? s.bg : 'transparent',
                                color: isActive ? s.color : 'var(--text-muted)',
                                fontWeight: 700, fontSize: 13,
                                cursor: 'pointer', whiteSpace: 'nowrap',
                                transition: 'all 0.15s',
                            }}
                        >
                            {group.name}
                        </button>
                    );
                })}
            </div>
            {visibleGroups.map((group, gi) => (
                <div key={group.name}>
                    <h2 style={{
                        fontSize: 18,
                        fontWeight: 700,
                        margin: gi === 0 ? '0 0 12px' : '28px 0 12px',
                        color: 'var(--text-main)',
                    }}>
                        {group.name}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {group.modules.map((mod) => {
                            const Icon = mod.icon;
                            const s = group.style;
                            return (
                                <Link
                                    key={mod.id}
                                    to={mod.link}
                                    style={{
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        padding: '12px 16px',
                                        borderRadius: 16,
                                        border: `2px solid ${s.color}`,
                                        backgroundColor: s.bg,
                                        boxShadow: `0 3px 0 ${s.dark}`,
                                        transition: 'transform 0.1s',
                                    }}
                                >
                                    <div style={{
                                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: s.color,
                                        color: '#fff',
                                    }}>
                                        <Icon size={22} fill="#fff" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {mod.title}
                                        </div>
                                        <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 2 }}>
                                            {mod.level}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PracticeTab;
