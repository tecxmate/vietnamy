import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { useT } from '../lib/i18n';
import Modal from './Modal';

// Known grammar-tag `category` values → i18n key. Unknown keys fall back to a
// title-cased version of the raw key.
const CATEGORY_KEYS = {
    structure: 'grammar_cat_structure',
    tense: 'grammar_cat_tense',
    question: 'grammar_cat_question',
    pronoun: 'grammar_cat_pronoun',
    classifier: 'grammar_cat_classifier',
    particle: 'grammar_cat_particle',
    modifier: 'grammar_cat_modifier',
};

/**
 * GrammarGuidebook — a Duolingo-style pop-up listing the grammar points a unit
 * teaches, grouped by category. Derived from the unit's sentence tags.
 */
export default function GrammarGuidebook({ unitTitle, points, onClose }) {
    const t = useT();
    const categoryLabel = (key) =>
        CATEGORY_KEYS[key]
            ? t(CATEGORY_KEYS[key])
            : (key ? key.charAt(0).toUpperCase() + key.slice(1) : t('grammar_cat_other'));
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
        <Modal onClose={onClose} maxHeight="80vh">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(17,138,178,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookOpen size={22} color="var(--secondary-color)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-muted)', fontWeight: 700 }}>{t('grammar_guide_header')}</div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{unitTitle}</h3>
                    </div>
                    <button className="ghost" onClick={onClose} style={{ padding: 8, flexShrink: 0 }} aria-label={t('close')}>
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
        </Modal>
    );
}
