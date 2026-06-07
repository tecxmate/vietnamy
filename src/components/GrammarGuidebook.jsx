import React from 'react';
import { X, BookOpen } from 'lucide-react';

// Pretty labels for the grammar tag `category` field; falls back to the raw key.
const CATEGORY_LABELS = {
    structure: 'Sentence structure',
    tense: 'Tense & aspect',
    question: 'Questions',
    pronoun: 'Pronouns',
    classifier: 'Classifiers',
    particle: 'Particles',
    modifier: 'Modifiers',
};

const categoryLabel = (key) =>
    CATEGORY_LABELS[key] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Grammar');

/**
 * GrammarGuidebook — a Duolingo-style pop-up listing the grammar points a unit
 * teaches, grouped by category. Derived from the unit's sentence tags.
 */
export default function GrammarGuidebook({ unitTitle, points, onClose }) {
    // Group points by category, preserving first-seen order.
    const groups = [];
    const byKey = new Map();
    for (const p of points) {
        const key = p.category || 'other';
        if (!byKey.has(key)) {
            const g = { key, items: [] };
            byKey.set(key, g);
            groups.push(g);
        }
        byKey.get(key).items.push(p);
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'var(--surface-color)',
                    borderRadius: '20px 20px 0 0',
                    width: '100%', maxWidth: 480, maxHeight: '80vh',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(17,138,178,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookOpen size={22} color="var(--secondary-color)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-muted)', fontWeight: 700 }}>Grammar in this unit</div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{unitTitle}</h3>
                    </div>
                    <button className="ghost" onClick={onClose} style={{ padding: 8, flexShrink: 0 }} aria-label="Close">
                        <X size={22} color="var(--text-muted)" />
                    </button>
                </div>

                {/* Body */}
                <div style={{ overflowY: 'auto', padding: '0 20px calc(20px + var(--safe-area-bottom-effective, 0px))' }}>
                    {groups.map((g) => (
                        <div key={g.key} style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--secondary-color)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                                {categoryLabel(g.key)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {g.items.map((p) => (
                                    <div key={p.id} style={{ padding: '12px 14px', backgroundColor: 'var(--bg-color)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)' }}>{p.description || p.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
