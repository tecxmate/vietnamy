import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Layers, Pen, Music, Library, Users } from 'lucide-react';
import { useT } from '../../lib/i18n';

/**
 * ReferenceHomeTab — search-first home for the Dictionary experience
 * (HANZII-style): a prominent search that hands off to the Dictionary tab,
 * plus a grid of reference tools. In-shell tabs route via onNavigateTab;
 * standalone tools route via the router.
 */
const ReferenceHomeTab = ({ onSearchWord, onNavigateTab }) => {
    const t = useT();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const submit = (e) => {
        e?.preventDefault();
        const q = query.trim();
        if (q && onSearchWord) onSearchWord(q);
    };

    const tools = [
        { key: 'dictionary', icon: Search, label: t('nav_dictionary'), color: '#F26B5A', onClick: () => onNavigateTab?.('dictionary') },
        { key: 'flashcards', icon: Layers, label: t('ref_home_flashcards', 'Flashcards'), color: '#118AB2', onClick: () => onNavigateTab?.('library') },
        { key: 'grammar', icon: Pen, label: t('nav_grammar'), color: '#06D6A0', onClick: () => onNavigateTab?.('grammar') },
        { key: 'sounds', icon: Music, label: t('nav_sounds'), color: '#FFB703', onClick: () => onNavigateTab?.('sounds') },
        { key: 'library', icon: Library, label: t('nav_library'), color: '#9B5DE5', onClick: () => onNavigateTab?.('library') },
        { key: 'kinship', icon: Users, label: t('ref_home_kinship', 'Kinship'), color: '#EF476F', onClick: () => navigate('/practice/kinship-calculator') },
    ];

    return (
        <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            {/* Hero */}
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
                <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800 }}>{t('ref_home_title', 'Vietnamy Dictionary')}</h1>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.4 }}>{t('ref_home_subtitle', 'Look up any Vietnamese word — meanings, examples, pronunciation.')}</p>
            </div>

            {/* Search */}
            <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-color)', borderRadius: 16 }}>
                    <Search size={20} color="var(--text-muted)" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('ref_home_search_placeholder', 'Search Vietnamese, English, or Chinese…')}
                        style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontSize: 16, color: 'var(--text-main)' }}
                    />
                </div>
                <button type="submit" className="primary" style={{ borderRadius: 16, padding: '0 18px', display: 'flex', alignItems: 'center' }} aria-label={t('nav_dictionary')}>
                    <Search size={20} />
                </button>
            </form>

            {/* Tools grid */}
            <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12 }}>{t('ref_home_tools', 'Tools')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {tools.map(tool => {
                        const Icon = tool.icon;
                        return (
                            <button
                                key={tool.key}
                                onClick={tool.onClick}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '18px 8px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 16, cursor: 'pointer' }}
                            >
                                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${tool.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={22} color={tool.color} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{tool.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ReferenceHomeTab;
