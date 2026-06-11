/* =========================================================================
   Word-of-the-day — shared logic for the Tạp Chí magazine surfaces.

   Pure helpers (no JSX) so both the /design/tap-chi showcase and the in-app
   <WordOfDay/> hero render the same data the same way. Editorial framing is
   curated here; live ipa / definition / example come from /api/search.
   ========================================================================= */

// Combining tone marks (NFD): grave, acute, hook-above, tilde, dot-below.
export const TONE_MARKS = {
  '̀': 'huyền',
  '́': 'sắc',
  '̉': 'hỏi',
  '̃': 'ngã',
  '̣': 'nặng',
};

// Vietnamese name of the tone a word carries, derived from its diacritics.
export function detectToneName(word) {
  for (const ch of word.normalize('NFD')) {
    if (TONE_MARKS[ch]) return TONE_MARKS[ch];
  }
  return 'ngang';
}

// Split a word into render segments, flagging which characters carry a tone
// mark so the display layer can highlight them in gold.
export function splitTones(word) {
  return [...word].map((ch) => ({
    text: ch,
    tone: [...ch.normalize('NFD')].some((c) => TONE_MARKS[c]),
  }));
}

// Curated word-of-the-day pool. Database fields (ipa, definition, example)
// are overwritten with live API data when available; the framing here is the
// magazine's own voice.
export const WORDS = [
  {
    word: 'phở', initial: 'ph', rhyme: 'ơ', pos: 'Danh từ · noun', level: 'A1',
    gloss: 'noodle soup', glossEm: 'Món quốc dân',
    ipa: '/fəː˧˩˧/',
    def: 'A Vietnamese soup of rice noodles, herbs and beef or chicken in a clear, slow-simmered broth.',
    example: { vi: 'Sáng nào tôi cũng ăn một bát phở.', en: 'I eat a bowl of phở every morning.' },
    han: { gly: '頗', label: 'Hán-Việt liên hệ', note: 'Likely from the French pot-au-feu & Cantonese 河粉 — a true street-food creole.' },
  },
  {
    word: 'trà', initial: 'tr', rhyme: 'a', pos: 'Danh từ · noun', level: 'A1',
    gloss: 'tea', glossEm: 'Thức uống',
    ipa: '/ʈaː˨˩/',
    def: 'A drink made by infusing dried tea leaves in hot water.',
    example: { vi: 'Mời bà uống trà.', en: 'Please have some tea, grandma.' },
    han: { gly: '茶', label: 'Hán-Việt', note: 'From 茶 (trà) — one reading shared right across East Asia.' },
  },
  {
    word: 'nhà', initial: 'nh', rhyme: 'a', pos: 'Danh từ · noun', level: 'A1',
    gloss: 'house, home', glossEm: 'Tổ ấm',
    ipa: '/ɲaː˨˩/',
    def: 'A building or place where one lives; a home.',
    example: { vi: 'Tôi đang ở nhà.', en: 'I am at home.' },
    han: null,
  },
  {
    word: 'mẹ', initial: 'm', rhyme: 'e', pos: 'Danh từ · noun', level: 'A1',
    gloss: 'mother', glossEm: 'Người sinh thành',
    ipa: '/mɛ˧ˀ˨ʔ/',
    def: 'A female parent; one’s mother.',
    example: { vi: 'Mẹ tôi nấu ăn rất ngon.', en: 'My mother cooks very well.' },
    han: null,
  },
  {
    word: 'yêu', initial: 'y', rhyme: 'êu', pos: 'Động từ · verb', level: 'A1',
    gloss: 'to love', glossEm: 'Tình cảm',
    ipa: '/iəw˧/',
    def: 'To feel deep affection or romantic love for someone.',
    example: { vi: 'Tôi yêu Hà Nội.', en: 'I love Hà Nội.' },
    han: null,
  },
];

// Strip the leading "(n.)"/"[adj]" type tag the dictionary prepends, and take
// the first clause as a concise headline definition.
export function cleanDefinition(text) {
  if (!text) return null;
  const stripped = text.replace(/^\s*(\([^)]+\)|\[[^\]]+\]|\{[^}]+\})\s*/, '').trim();
  const firstClause = stripped.split(/[;\n]/)[0].trim();
  return firstClause || stripped || null;
}

// Pull live ipa / definition / example out of an /api/search response.
export function extractFromSearch(data) {
  const out = {};
  if (!data || !data.structured || !Array.isArray(data.data)) return out;
  for (const source of data.data) {
    if (!out.ipa && source.metrics?.ipa) out.ipa = `/${source.metrics.ipa}/`;
    const meaning = source.meanings?.find((m) => m.meaning_text);
    if (meaning) {
      if (!out.def) out.def = cleanDefinition(meaning.meaning_text);
      const ex = meaning.examples?.find((e) => e.vietnamese_text);
      if (ex && !out.example) out.example = { vi: ex.vietnamese_text, en: ex.english_text || '' };
    }
    if (out.ipa && out.def && out.example) break;
  }
  return out;
}

// Deterministic word-of-the-day pick + magazine issue framing for a given day.
export function getEdition(now = new Date()) {
  const epochDay = Math.floor(now.getTime() / 86400000);
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  const pick = WORDS[epochDay % WORDS.length];
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  return { pick, issueNum: dayOfYear, date: `${dd} · ${mm} · ${yy}` };
}

// Fetch live dictionary data for a word and merge it over the curated framing.
export async function fetchLiveWord(pick, signal) {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(pick.word)}&lang=en`, { signal });
    if (!res.ok) return pick;
    const data = await res.json();
    const live = extractFromSearch(data);
    return {
      ...pick,
      ipa: live.ipa || pick.ipa,
      def: live.def || pick.def,
      example: live.example || pick.example,
    };
  } catch {
    return pick;
  }
}
