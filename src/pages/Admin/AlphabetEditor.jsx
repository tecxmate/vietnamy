import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RotateCcw, Check, ArrowLeft } from 'lucide-react';
import { getAlphabet, ALPHABET_CMS_KEY } from '../../data/alphabet';
import { saveOverride, resetOverride } from '../../lib/contentOverrides';
import EntryTable from './EntryTable';

const FIELDS = [
    { key: 'letter', label: 'Letter' },
    { key: 'name', label: 'Name (Vietnamese)' },
    { key: 'sound', label: 'Sound · EN', wide: true },
    { key: 'soundZhS', label: 'Sound · 拼音 Pinyin (zh-s)', wide: true },
    { key: 'soundZhT', label: 'Sound · 注音 Bopomofo (zh-t)', wide: true },
];

export default function AlphabetEditor() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState(() => getAlphabet());
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);

    const update = (next) => { setEntries(next); setHasChanges(true); setSaved(false); };
    const save = () => { saveOverride(ALPHABET_CMS_KEY, entries); setHasChanges(false); setSaved(true); setTimeout(() => setSaved(false), 1800); };
    const reset = () => { if (!confirm('Restore the original alphabet?')) return; resetOverride(ALPHABET_CMS_KEY); setEntries(getAlphabet()); setHasChanges(false); };

    return (
        <div className="admin-roadmap" style={{ maxWidth: 760 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <button className="ghost" onClick={() => navigate('/admin/mapper')} style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={16} /> Roadmap Mapper</button>
                    <h1 style={{ fontSize: 28, margin: 0 }}>Edit Alphabet</h1>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{entries.length} letters · used by the Alphabet lesson and the Sounds tab</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="secondary" onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><RotateCcw size={16} /> Reset</button>
                    <button className="primary" onClick={save} disabled={!hasChanges} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save</>}</button>
                </div>
            </div>
            <div className="glass-panel" style={{ padding: 20 }}>
                <EntryTable entries={entries} fields={FIELDS} onChange={update} addLabel="Add letter" />
            </div>
        </div>
    );
}
