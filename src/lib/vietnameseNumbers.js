// Vietnamese numerals — the full spoken form, 0 through 999,999,999,999.
//
// This was inline in NumbersPractice.jsx and stopped dead at 999: every larger
// number returned an empty string. That made the counting module unable to
// teach the numbers learners meet first and most often in Vietnam, where every
// price is in thousands — a bowl of phở is 50.000₫, a coffee 25.000₫, rent
// millions. Pulled out here so it can be tested (scripts/validate-numbers.mjs)
// and reused by any module that needs to say a number out loud.
//
// The rules, in the order they bite:
//   · Digits are grouped in threes and each group is named: tỷ · triệu · nghìn.
//   · A group after the leading one reads its hundreds even when zero —
//     "không trăm" — so 1.005 is một nghìn không trăm lẻ năm.
//   · Inside a group, a zero tens with a non-zero ones takes lẻ (North) or
//     linh (South): 105 → một trăm lẻ năm.
//   · Tens of 1 is mười; 2 and up are X mươi.
//   · After a mươi, the ones digit changes shape: 1 → mốt, 4 → tư, 5 → lăm.
//     After mười only 5 shifts (mười lăm), and 1/4 stay put (mười một, mười bốn).

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

// Scale words, largest first. Vietnamese groups by 3 like English.
const SCALES = [
    { value: 1_000_000_000, north: 'tỷ', south: 'tỷ' },
    { value: 1_000_000, north: 'triệu', south: 'triệu' },
    { value: 1_000, north: 'nghìn', south: 'ngàn' },
];

export const MAX_NUMBER = 999_999_999_999;

/**
 * Say a group of 1–999.
 * @param {number} n           the group value
 * @param {boolean} forceHundreds  true for any group that isn't the leading one,
 *   so 1.005 reads "một nghìn KHÔNG TRĂM lẻ năm" rather than "một nghìn lẻ năm"
 * @param {'north'|'south'} dialect  picks lẻ vs linh
 */
function sayGroup(n, forceHundreds, dialect) {
    const hundreds = Math.floor(n / 100);
    const tens = Math.floor((n % 100) / 10);
    const ones = n % 10;
    const parts = [];

    if (hundreds > 0) {
        parts.push(DIGITS[hundreds], 'trăm');
    } else if (forceHundreds) {
        parts.push('không', 'trăm');
    }

    if (tens > 1) {
        parts.push(DIGITS[tens], 'mươi');
        // The shape-shifting ones digit after "mươi".
        if (ones === 1) parts.push('mốt');
        else if (ones === 4) parts.push('tư');
        else if (ones === 5) parts.push('lăm');
        else if (ones > 0) parts.push(DIGITS[ones]);
    } else if (tens === 1) {
        parts.push('mười');
        // After "mười" only 5 shifts: mười lăm, but mười một / mười bốn.
        if (ones === 5) parts.push('lăm');
        else if (ones > 0) parts.push(DIGITS[ones]);
    } else if (ones > 0) {
        // Zero tens with a non-zero ones needs the lẻ/linh filler — but only
        // when something precedes it in this group or a larger group did.
        if (hundreds > 0 || forceHundreds) parts.push(dialect === 'south' ? 'linh' : 'lẻ');
        parts.push(DIGITS[ones]);
    }

    return parts.join(' ');
}

/**
 * The spoken Vietnamese for a whole number.
 * Returns '' for anything outside 0…MAX_NUMBER or non-integral, so callers can
 * treat empty as "can't say this".
 *
 * @param {number} n
 * @param {{ dialect?: 'north'|'south' }} [options]
 */
export function numberToVietnamese(n, { dialect = 'north' } = {}) {
    if (!Number.isInteger(n) || n < 0 || n > MAX_NUMBER) return '';
    if (n === 0) return 'không';

    const words = [];
    let remaining = n;
    let seenGroup = false;

    for (const scale of SCALES) {
        const count = Math.floor(remaining / scale.value);
        remaining %= scale.value;
        if (count === 0) continue;
        words.push(sayGroup(count, seenGroup, dialect), dialect === 'south' ? scale.south : scale.north);
        seenGroup = true;
    }

    if (remaining > 0) {
        words.push(sayGroup(remaining, seenGroup, dialect));
    }

    return words.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Break a number into the teaching parts the builder stage highlights, e.g.
 * 25 → [2 ×10 → "hai mươi", 5 → "lăm" (special)]. Only the 0–99 range carries
 * the compound rules worth drilling, so larger numbers return one whole part.
 */
export function decomposeNumber(n) {
    if (n <= 10) {
        return [{ digit: String(n), word: numberToVietnamese(n), isSpecial: false }];
    }

    if (n >= 11 && n <= 19) {
        const ones = n % 10;
        const parts = [{ digit: '10', word: 'mười', isSpecial: false }];
        if (ones > 0) {
            let word = DIGITS[ones];
            let rule = null;
            let isSpecial = false;
            if (ones === 5) { word = 'lăm'; rule = 'năm → lăm after tens'; isSpecial = true; }
            parts.push({ digit: String(ones), word, isSpecial, rule });
        }
        return parts;
    }

    if (n >= 20 && n <= 99) {
        const tens = Math.floor(n / 10);
        const ones = n % 10;
        const parts = [
            { digit: String(tens), word: DIGITS[tens], isSpecial: false },
            { digit: '×10', word: 'mươi', isSpecial: true, rule: 'mười → mươi in compounds' },
        ];
        if (ones > 0) {
            let word = DIGITS[ones];
            let rule = null;
            let isSpecial = false;
            if (ones === 1) { word = 'mốt'; rule = 'một → mốt after tens'; isSpecial = true; }
            else if (ones === 4) { word = 'tư'; rule = 'bốn → tư after tens'; isSpecial = true; }
            else if (ones === 5) { word = 'lăm'; rule = 'năm → lăm after tens'; isSpecial = true; }
            parts.push({ digit: String(ones), word, isSpecial, rule });
        }
        return parts;
    }

    return [{ digit: String(n), word: numberToVietnamese(n), isSpecial: false }];
}

/** Group a number with dots, the way prices are written in Vietnam: 50.000 */
export function formatVND(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Say a price. Vietnamese drops the thousand word colloquially ("năm mươi
 * nghìn" → "năm chục nghìn" / just "năm mươi"), but the full form is what a
 * learner needs to recognise on a menu, so that's what we teach.
 */
export function priceToVietnamese(dong, options) {
    const said = numberToVietnamese(dong, options);
    return said ? `${said} đồng` : '';
}

/** Prices a learner actually meets, by tier — used to build practice rounds. */
export const PRICE_TIERS = {
    street: [10_000, 15_000, 20_000, 25_000, 30_000, 35_000, 40_000, 45_000, 50_000],
    everyday: [60_000, 75_000, 80_000, 100_000, 120_000, 150_000, 180_000, 200_000],
    big: [250_000, 300_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 5_000_000],
};
