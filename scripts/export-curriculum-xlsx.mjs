// Export the canonical curriculum (content/curriculum.json) to a teacher-
// friendly Excel workbook — one sheet per content type, frozen+bold headers,
// autofilter, sensible widths. The `id` columns are kept first so an edited
// file can be round-tripped back into the build later (W-72).
//
//   node scripts/export-curriculum-xlsx.mjs [output.xlsx]

import ExcelJS from 'exceljs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const db = JSON.parse(readFileSync(join(ROOT, 'content/curriculum.json'), 'utf8'));
const outPath = process.argv[2] || join(ROOT, 'docs', 'Vietnamy_Curriculum.xlsx');

const wb = new ExcelJS.Workbook();
wb.creator = 'Vietnamy';

function sheet(name, columns, rows, note) {
    const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: note ? 2 : 1 }] });
    let headerRowIdx = 1;
    if (note) {
        ws.mergeCells(1, 1, 1, columns.length);
        const cell = ws.getCell('A1');
        cell.value = note;
        cell.font = { italic: true, color: { argb: 'FF666666' } };
        headerRowIdx = 2;
    }
    ws.columns = columns.map(c => ({ key: c.key, width: c.width || 18 }));
    const header = ws.getRow(headerRowIdx);
    columns.forEach((c, i) => { header.getCell(i + 1).value = c.header; });
    header.font = { bold: true };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
    rows.forEach(r => ws.addRow(r));
    ws.autoFilter = { from: { row: headerRowIdx, column: 1 }, to: { row: headerRowIdx, column: columns.length } };
}

const arr = (v) => Array.isArray(v) ? v.join(', ') : (v || '');

// ── Units ──
sheet('Units',
    [{ header: 'id', key: 'id', width: 26 }, { header: 'order', key: 'orderIndex', width: 8 }, { header: 'title', key: 'title', width: 44 }],
    db.units || []);

// ── Lessons (editable metadata; word/sentence membership lives in those sheets) ──
sheet('Lessons',
    [
        { header: 'id', key: 'id', width: 16 }, { header: 'unitId', key: 'unitId', width: 22 },
        { header: 'cefrLevel', key: 'cefrLevel', width: 10 }, { header: 'order', key: 'orderIndex', width: 8 },
        { header: 'title', key: 'title', width: 32 }, { header: 'topic', key: 'topic', width: 18 },
        { header: 'difficulty', key: 'difficulty', width: 10 },
    ],
    db.lessons || []);

// ── Vocab (the main editing surface) — empty `zh` column for teachers to fill ──
sheet('Vocab',
    [
        { header: 'id', key: 'id', width: 14 }, { header: 'lessonId', key: 'lessonId', width: 14 },
        { header: 'vi', key: 'vi', width: 22 }, { header: 'en', key: 'en', width: 30 },
        { header: 'zh (add)', key: 'zh', width: 18 }, { header: 'pos', key: 'pos', width: 10 },
        { header: 'emoji', key: 'emoji', width: 8 }, { header: 'note', key: 'note', width: 30 },
        { header: 'difficulty', key: 'difficulty', width: 10 }, { header: 'freqRank', key: 'frequencyRank', width: 10 },
    ],
    (db.words || []).map(w => ({ ...w, zh: w.zh || '' })),
    'Edit vi / en / note freely. Add Chinese in the "zh (add)" column. Do NOT change the id column.');

// ── Sentences ──
sheet('Sentences',
    [
        { header: 'id', key: 'id', width: 14 }, { header: 'lessonId', key: 'lessonId', width: 14 },
        { header: 'vi', key: 'vi', width: 40 }, { header: 'en', key: 'en', width: 40 },
        { header: 'zh (add)', key: 'zh', width: 24 }, { header: 'tokens', key: 'tokenCount', width: 8 },
        { header: 'grammarTags', key: 'grammarTagIds', width: 24 },
    ],
    (db.sentences || []).map(s => ({ ...s, zh: s.zh || '', grammarTagIds: arr(s.grammarTagIds) })),
    'Edit vi / en freely. Add Chinese in "zh (add)". Do NOT change the id column.');

// ── Conversations (flattened: one row per line) ──
const convRows = [];
(db.conversations || []).forEach(c => {
    (c.lines || []).forEach((ln, i) => convRows.push({
        convId: c.id, lessonId: c.lessonId, title: c.title, line: i + 1,
        speaker: ln.speaker || '', vi: ln.vi || '', en: ln.en || '', zh: ln.zh || '',
    }));
});
sheet('Conversations',
    [
        { header: 'convId', key: 'convId', width: 14 }, { header: 'lessonId', key: 'lessonId', width: 14 },
        { header: 'title', key: 'title', width: 28 }, { header: 'line', key: 'line', width: 6 },
        { header: 'speaker', key: 'speaker', width: 9 }, { header: 'vi', key: 'vi', width: 36 },
        { header: 'en', key: 'en', width: 36 }, { header: 'zh (add)', key: 'zh', width: 24 },
    ],
    convRows);

// ── Grammar tags ──
sheet('GrammarTags',
    [
        { header: 'id', key: 'id', width: 18 }, { header: 'name', key: 'name', width: 26 },
        { header: 'category', key: 'category', width: 16 }, { header: 'description', key: 'description', width: 50 },
    ],
    db.grammarTags || []);

await wb.xlsx.writeFile(outPath);
console.log(`Wrote ${outPath}`);
console.log(`  Units ${(db.units || []).length} · Lessons ${(db.lessons || []).length} · Vocab ${(db.words || []).length} · Sentences ${(db.sentences || []).length} · Conversation lines ${convRows.length} · GrammarTags ${(db.grammarTags || []).length}`);
