import { Plus, Trash2 } from 'lucide-react';

// Editable table for a list of flat objects. `fields` is
// [{ key, label, placeholder?, wide? }]. Calls onChange(nextEntries) on edit.
export default function EntryTable({ entries, fields, onChange, addLabel = 'Add row' }) {
    const setCell = (i, key, value) => onChange(entries.map((e, idx) => idx === i ? { ...e, [key]: value } : e));
    const del = (i) => onChange(entries.filter((_, idx) => idx !== i));
    const add = () => onChange([...entries, Object.fromEntries(fields.map(f => [f.key, '']))]);
    const input = { width: '100%', padding: '6px 8px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' };
    return (
        <div>
            <div style={{ display: 'flex', gap: 6, padding: '0 28px 6px 0', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                {fields.map(f => <div key={f.key} style={{ flex: f.wide ? 2 : 1 }}>{f.label}</div>)}
            </div>
            {entries.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    {fields.map(f => (
                        <input key={f.key} style={{ ...input, flex: f.wide ? 2 : 1 }} placeholder={f.placeholder || f.label} value={e[f.key] ?? ''} onChange={(ev) => setCell(i, f.key, ev.target.value)} />
                    ))}
                    <button onClick={() => del(i)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4, display: 'flex' }}><Trash2 size={15} /></button>
                </div>
            ))}
            <button className="ghost" onClick={add} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, marginTop: 4 }}><Plus size={14} /> {addLabel}</button>
        </div>
    );
}
