import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RotateCcw, Check, ArrowLeft } from 'lucide-react';
import { getVowels, VOWELS_CMS_KEY } from '../../data/vowels';
import { saveOverride, resetOverride } from '../../lib/contentOverrides';
import EntryTable from './EntryTable';

const SECTIONS = [
    { key: 'single', label: 'Single vowels', fields: [{ key: 'letter', label: 'Letter' }, { key: 'name', label: 'Name' }, { key: 'sound', label: 'Sound (HTML ok)', wide: true }, { key: 'example', label: 'Example' }, { key: 'exMeaning', label: 'Meaning' }] },
    { key: 'centering', label: 'Centering', fields: [{ key: 'group', label: 'Group' }, { key: 'open', label: 'Open' }, { key: 'closed', label: 'Closed' }, { key: 'approx', label: 'Approx (HTML ok)', wide: true }] },
    { key: 'gliding', label: 'Gliding', fields: [{ key: 'diph', label: 'Diph' }, { key: 'approx', label: 'Approx', wide: true }, { key: 'example', label: 'Example' }, { key: 'meaning', label: 'Meaning' }] },
    { key: 'triphthongs', label: 'Triphthongs', fields: [{ key: 'triph', label: 'Triph' }, { key: 'components', label: 'Parts' }, { key: 'approx', label: 'Approx', wide: true }, { key: 'example', label: 'Example' }, { key: 'meaning', label: 'Meaning' }] },
];

export default function VowelsEditor() {
    const navigate = useNavigate();
    const [data, setData] = useState(() => getVowels());
    const [tab, setTab] = useState('single');
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);
    const section = SECTIONS.find(s => s.key === tab);

    const update = (next) => { setData(d => ({ ...d, [tab]: next })); setHasChanges(true); setSaved(false); };
    const save = () => { saveOverride(VOWELS_CMS_KEY, data); setHasChanges(false); setSaved(true); setTimeout(() => setSaved(false), 1800); };
    const reset = () => { if (!confirm('Restore the original vowels?')) return; resetOverride(VOWELS_CMS_KEY); setData(getVowels()); setHasChanges(false); };

    return (
        <div className="admin-roadmap" style={{ maxWidth: 900 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                    <button className="ghost" onClick={() => navigate('/admin/mapper')} style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={16} /> Roadmap Mapper</button>
                    <h1 style={{ fontSize: 28, margin: 0 }}>Edit Vowels</h1>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>The single-vowel + diphthong lists feed every vowel practice (basics/special/gliding subsets derive from these).</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="secondary" onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><RotateCcw size={16} /> Reset</button>
                    <button className="primary" onClick={save} disabled={!hasChanges} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save</>}</button>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {SECTIONS.map(sec => (
                    <button key={sec.key} onClick={() => setTab(sec.key)} className={tab === sec.key ? 'primary' : 'secondary'} style={{ padding: '6px 14px', fontSize: 13 }}>{sec.label}</button>
                ))}
            </div>
            <div className="glass-panel" style={{ padding: 20 }}>
                <EntryTable entries={data[tab] || []} fields={section.fields} onChange={update} addLabel={`Add ${section.label.toLowerCase()} row`} />
            </div>
        </div>
    );
}
