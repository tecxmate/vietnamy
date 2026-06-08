# Roadmap Module Structure

A roadmap **unit** is built from four repeating **module kinds**. Every module of
the same kind has the **same node shape, the same colour, and the same edit
rules** everywhere — in the seed data, on the roadmap, and in the admin.

The single source of truth is **`src/lib/moduleKinds.js`** (`MODULE_KINDS`). The
seed (`initialData.js`), the roadmap renderer (`RoadmapTab.jsx`), and the admin
(`RoadmapMapper.jsx`) all derive structure + colour from it. Don't hard-code
module colours or shapes anywhere else.

## The four module kinds

| Kind | Colour | `node_type` | `module_type` | Content target | Pick target | Edit content |
|------|--------|-------------|---------------|----------------|-------------|--------------|
| **Pronunciation** | 🔵 blue `#1CB0F6` | `skill` | `blue` | `practice_route` | pick a `/practice` drill | drills → Drill editor; tones → Tone-word editor; alphabet/vowels → in code |
| **Vocabulary** | 🟠 orange `#FFB703` | `lesson` | `orange` | `lesson_id` | — | Lesson editor (`/admin/lesson`) |
| **Grammar** | 🟣 purple `#A78BFA` | `skill` | `purple` | `skill_content.grammar_unit_id` | pick a grammar unit | **Grammar Unit editor** (`/admin/grammar-unit`) |
| **Test** | 🔴 red `#EF4444` | `test` | `test` | `test_scope: 'unit'` | — | auto (derived) |

"Pick target" = which content the module opens (inline dropdown in the mapper).
"Edit content" = the **Edit** button opens the right editor for that content — resolved by `getContentEditor(node)` in `moduleKinds.js` (one systematic entry point). Grammar unit edits persist to `vnme_cms_grammar_unit_<id>` and merge into `getUnit()` so the lesson reflects them.

Scenes (`green`) and per-lesson mini-quizzes (`test_scope: 'module'`) are **not**
module kinds — they're auxiliary nodes and render separately.

## A unit's default shape

Default order, repeating per unit (rearrangeable in the admin):

```
Pronunciation → Vocabulary (one or more lessons, each with an auto mini-quiz) → Grammar → Test
```

Order is purely `node_index` (numeric sort). To insert without renumbering,
seed data uses fractional indices: pronunciation `node_index: -1` (sorts first),
grammar `node_index: <unitTestIndex − 0.5>` (sorts just before the test). The
admin's reorder normalises these to integers.

## Node shapes (seed examples)

```js
// Pronunciation — opens an existing practice drill
{ node_type:'skill', module_type:'blue', practice_route:'/practice/tones/level1', label:'Pronunciation: Tones' }

// Vocabulary — the conversation/sentence lesson (content in the Lesson editor)
{ node_type:'lesson', module_type:'orange', lesson_id:'lesson_001a', label:'Say Hello' }

// Grammar — a grammar unit from grammar_modules.json
{ node_type:'skill', module_type:'purple', skill_content:{ type:'grammar_unit', grammar_unit_id:'A1_M06_U01' }, label:'Grammar: I/You Pronouns' }

// Test — the unit test (auto)
{ node_type:'test', module_type:'test', test_scope:'unit', label:'Unit 1 Test' }
```

## Editing & arranging (admin → Roadmap Mapper, `/admin/mapper`)

- **Add** a module: the four colour-coded buttons (`+ Pronunciation / Vocabulary
  / Grammar / Test`). Each opens the right picker — a practice-drill dropdown,
  a lesson id, a grammar-unit dropdown, or none (test).
- **Edit** a module inline (pencil): rename the label **and** change its content
  target — pronunciation → practice-drill dropdown; grammar → grammar-unit
  dropdown; vocabulary → "Edit" opens the Lesson editor.
- **Arrange**: move ↑/↓ (carries the lesson's mini-quiz with it; `node_index`
  is reindexed automatically).
- **Delete**: removes the module (and its mini-quiz).

Edits persist to localStorage (`vnme_mock_db_*`); seed data is the default,
reseeded on `CURRICULUM_VERSION` bumps while progress is preserved.
