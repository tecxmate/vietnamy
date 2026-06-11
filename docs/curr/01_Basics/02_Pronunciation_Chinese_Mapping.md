# Pronunciation — Chinese (Bopomofo / Pinyin) Mapping

> **STATUS: SHIPPED.** Wired into the app via per-language `sound`/`approx`/`description` fields
> (`alphabet.js`, `vowels.js`, `tones.json`) read by `pickLocalized`. **Single vowels + tones
> are owner-validated.** Diphthongs/triphthongs + **consonants are first-pass** — correct them in
> the admin (Alphabet/Vowels/Tone editors gain Pinyin/Bopomofo columns) or here. Companion to
> `01_Alphabet.md`. Implements wiki decision `2026-06-11-chinese-pronunciation-curriculum`.
>
> Legend: ✅ clean · ⚠️ approximation · ❌ no Mandarin equivalent (teach "closest + how to adjust").

## Consonants (alphabet initials) — first-pass, review
| VN | en (current) | zh-s · Pinyin | zh-t · Bopomofo | |
|----|--------------|---------------|------------------|---|
| b | beh | 像 b（玻、爸） | 像 ㄅ（玻） | ✅ |
| c / k | seh / kah | 像 g（哥），不送气 | 像 ㄍ（哥），不送氣 | ✅ unaspirated |
| đ | deh | 像 d（大） | 像 ㄉ（大） | ✅ |
| d | zeh/yeh | 北部像英文 z（zoo） | 北部像英文 z（zoo） | ❌ (北 /z/) |
| g | — | 浊的 g，喉咙振动 | 濁的 ㄍ，喉嚨振動 | ❌ /ɣ/ |
| h·l·m·n | — | h(哈)·l(拉)·m(妈)·n(拿) | ㄏ·ㄌ·ㄇ·ㄋ | ✅ |
| p | peh | 像 b（不送气），多在词尾 | 像 ㄅ（不送氣） | ✅ |
| r | — | 北部像 r(日) 或英文 z | 北部像 ㄖ(日) 或英文 z | ⚠️ |
| s·x | — | 北部像 s(撒)；南部 sh | 北部 ㄙ(撒)；南部 ㄕ | ⚠️ N/S |
| t | teh | 像 d（大），不送气 | 像 ㄉ（大），不送氣 | ✅ unaspirated |
| v | veh | 像英文 v（van） | 像英文 v（van） | ❌ no /v/ |

## Why
The app anchors each Vietnamese sound to an **English** word ("ah as in *father*") — meaningless to a
Chinese speaker. For Chinese learners each sound is re-anchored to a system they already own:
**Bopomofo 注音** for Traditional/Taiwan (zh-t), **Pinyin** for Simplified/Mainland (zh-s).

## Single vowels
| VN | IPA | en (current) | zh-s · Pinyin | zh-t · Bopomofo | |
|----|-----|--------------|---------------|------------------|---|
| a | aː | ah / father | a（啊），拉长 | ㄚ（啊），拉長 | ✅ |
| ă | a | short ah / cut | a，但短促 | ㄚ，但短促 | ✅ |
| â | ə | u / but | 像轻声 e（"的"里那个），短而含糊 | 輕短的 ㄜ，含糊帶過 | ❌ schwa |
| e | ɛ | e / get | ê（"欸/耶"的 e） | ㄝ（欸） | ✅ |
| ê | e | ay / say | 介于 ê 和 ei 之间，不滑动 | ㄝ 但更緊更高（≈ㄟ 去尾音） | ⚠️ |
| i / y | i | ee / see | yi（衣、一） | ㄧ（衣） | ✅ |
| o | ɔ | o / hot | o（哦），嘴张大 | ㄛ（哦），嘴張大 | ✅ |
| ô | o | o / go | o 收圆（"播"的 o），别滑成 ou | ㄛ 收圓（≈ㄡ 去尾音） | ⚠️ |
| ơ | əː | u / fur (long) | â 的长音——拉长的含糊 e | 拉長的 ㄜ | ❌ long schwa |
| u | u | oo / boot | wu（乌、五） | ㄨ（烏） | ✅ |
| ư | ɯ | flat-lip ee | 像 si/zi/ri（思、资、日）里的"嗡"母音，嘴唇放平不噘 | ㄙ/ㄗ/ㄖ 後面那個母音，嘴唇放平 | ❌ (思/資 = best anchor) |

## Tones (6 VN vs 4 Mandarin)
| VN | mark | IPA (北) | Mandarin anchor | |
|----|------|----------|------------------|---|
| ngang | a | ˧ mid level | ≈ 一声 ˉ，但音高居中（别太高） | ✅ |
| sắc | á | ˧˥ high rise | ≈ 二声 ˊ（上扬） | ✅ |
| hỏi | ả | ˧˩˧ dip | ≈ 三声 ˇ（先降后升） | ✅ |
| huyền | à | ˨˩ low fall | ≈ 四声 ˋ 但整体压低、缓降、不重 | ⚠️ |
| ngã | ã | ˧ˀ˥ rise+break | 上扬，但中间喉咙"卡"一下（喉塞） | ❌ glottal |
| nặng | ạ | ˨ˀ low+stop | 压低、短促，结尾喉咙紧收／卡住 | ❌ glottal |

## Diphthongs / triphthongs (mostly compositional)
**Clean — anchor directly:** ai≈ㄞ/ài(愛) · ay=short ㄞ · ao≈ㄠ/ào(奧) · au=short ㄠ · âu≈ㄡ/ōu(歐) ·
ây≈ㄟ/ei · oi=ㄛ→ㄧ · ôi=ㄛ(收圓)→ㄧ · ui=ㄨ→ㄧ(≈威) · uy≈ㄨㄟ(威) · iu=ㄧ→ㄨ · eo=ㄝ→ㄠ ·
êu=ㄝ→ㄨ · iêu/yêu=ㄧㄝㄨ · oai=ㄛㄞ · oay=short oai · uôi=ㄨㄛㄧ(≈buoy) · uây≈ㄨㄟ(sway).
**❌ inherit ư/ơ's gap (build from the singles):** ơi(ㄜ→ㄧ) · ưu(思的母音→ㄨ) · ươi · ươu · centering ưa/ươ.
**Centering → schwa:** ia/iê = ㄧ→含糊ㄜ · ua/uô = ㄨ→含糊ㄜ · ưa/ươ = ư→含糊ㄜ ❌.

## The five real gaps (no Mandarin equivalent)
**ư, â, ơ** (and anything built on them) and the two glottal tones **ngã / nặng** — these need explicit
"closest sound + how to adjust" teaching, not a 1:1 mapping. Everything else anchors cleanly.

## How this feeds the app (once validated)
Per-language `sound` field, read by current UI language (`pickSound(field, lang)`, string-or-object tolerant → incremental migration):
- `src/data/alphabet.js` `sound` → `{en,'zh-s','zh-t'}` → render `AlphabetLesson.jsx:76`
- `src/data/vowels.js` `sound`/`approx` → render `VowelsPractice.jsx:328/357/406`
- `content/tones.json` `description` → render `ToneLesson.jsx:216`
- editors gain en / Bopomofo / Pinyin columns (`AlphabetEditor`, `VowelsEditor`, `ToneWordEditor`)
- consolidate the tone-description double-source (`tones.json` `.description` vs i18n `sounds_tone_*_desc`).

## Next
1. Red-pen this table (native TW + CN).  2. Add the per-language `sound` field + readers/editors.  3. Author per unit, validate, ship.
