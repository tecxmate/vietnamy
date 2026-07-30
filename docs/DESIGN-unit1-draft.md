# Unit 1 — "Chào bạn!" (draft, reverse-engineered from Duolingo)

Duolingo Vietnamese opens with **"Introduce yourself · Order a drink"**
(duolingodata.com 48-unit path). We mirror that relatable, food/café-anchored
entry but land on the SVO pattern we piloted. A natural day-one arc:
**greet → say your name → ask → order → do things.**

Five lean modules — each a short teach on-ramp (objective · optional pattern ·
1 insight · ≤4 words) → practice — then the existing Unit 1 test.

| # | lesson_id | Module | New words | Pattern | Insight |
|---|---|---|---|---|---|
| 1 | lesson_u1_m1 | **Xin chào** — magic words | chào, cảm ơn, xin lỗi, tạm biệt | — | Add **"ạ"** to sound polite |
| 2 | lesson_u1_m2 | **Tôi tên là…** — your name | tôi, bạn, tên, là | Tôi tên là ___ | **là** = am/is/are, never changes |
| 3 | lesson_u1_m3 | **…là gì?** — ask | gì, không, dạ, vâng | … là **gì?** | Questions add a word at the **end** |
| 4 | lesson_u1_m4 | **Cho tôi…** — order ☕ | cho, cà phê, trà, nước | **Cho tôi** + item | One phrase orders anything |
| 5 | lesson_u1_m5 | **Tôi ăn cơm** — S+V+O | ăn, uống, đọc, cơm | S + V + O | SVO like English (pilot) |

Wiring: added as nodes at the front of `phase_1_first_words` (sequential unlock).
Dialect: northern-neutral. Conservative dose: 4 words/module, 1 insight each.
