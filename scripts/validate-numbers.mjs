// Guard the Vietnamese number engine.
//
//   node scripts/validate-numbers.mjs
//
// Every case below is a rule that actually bites: the shape-shifting ones digit
// (mốt/tư/lăm), mười vs mươi, the lẻ filler, the "không trăm" a non-leading
// group must read, and the scale words. Wired into CI so counting can't silently
// lose a range again — it used to return '' for everything over 999.

import { numberToVietnamese, formatVND, MAX_NUMBER } from '../src/lib/vietnameseNumbers.js';

const CASES = [
    // Foundation
    [0, 'không'],
    [5, 'năm'],
    [10, 'mười'],
    // mười + shifting ones
    [11, 'mười một'],
    [14, 'mười bốn'],
    [15, 'mười lăm'],
    // mươi + shifting ones
    [20, 'hai mươi'],
    [21, 'hai mươi mốt'],
    [24, 'hai mươi tư'],
    [25, 'hai mươi lăm'],
    [99, 'chín mươi chín'],
    // hundreds, and the lẻ filler
    [100, 'một trăm'],
    [101, 'một trăm lẻ một'],
    [105, 'một trăm lẻ năm'],
    [110, 'một trăm mười'],
    [115, 'một trăm mười lăm'],
    [121, 'một trăm hai mươi mốt'],
    [999, 'chín trăm chín mươi chín'],
    // thousands — the range prices live in
    [1_000, 'một nghìn'],
    [1_005, 'một nghìn không trăm lẻ năm'],
    [1_500, 'một nghìn năm trăm'],
    [10_000, 'mười nghìn'],
    [21_000, 'hai mươi mốt nghìn'],
    [25_000, 'hai mươi lăm nghìn'],
    [50_000, 'năm mươi nghìn'],
    [100_000, 'một trăm nghìn'],
    [155_000, 'một trăm năm mươi lăm nghìn'],
    // millions and above
    [1_000_000, 'một triệu'],
    [1_200_000, 'một triệu hai trăm nghìn'],
    [1_234_567, 'một triệu hai trăm ba mươi tư nghìn năm trăm sáu mươi bảy'],
    [1_000_000_000, 'một tỷ'],
    // a zero middle group still reads its hundreds
    [1_000_005, 'một triệu không trăm lẻ năm'],
];

const SOUTH_CASES = [
    [50_000, 'năm mươi ngàn'],
    [105, 'một trăm linh năm'],
];

let failures = 0;
const check = (got, want, label) => {
    if (got === want) return;
    failures++;
    console.error(`  ✗ ${label}\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`);
};

for (const [n, want] of CASES) check(numberToVietnamese(n), want, String(n));
for (const [n, want] of SOUTH_CASES) check(numberToVietnamese(n, { dialect: 'south' }), want, `${n} (south)`);

// Range contract: everything in 0…MAX must be sayable, nothing outside it.
for (const n of [0, 7, 4_321, 987_654_321, MAX_NUMBER]) {
    if (!numberToVietnamese(n)) { failures++; console.error(`  ✗ ${n} should be sayable, got ''`); }
}
for (const n of [-1, 1.5, MAX_NUMBER + 1, NaN]) {
    if (numberToVietnamese(n) !== '') { failures++; console.error(`  ✗ ${n} should be unsayable, got '${numberToVietnamese(n)}'`); }
}

// No number may contain a doubled space or stray edge whitespace.
for (let n = 0; n <= 2000; n++) {
    const said = numberToVietnamese(n);
    if (/\s{2}|^\s|\s$/.test(said)) { failures++; console.error(`  ✗ ${n} has bad spacing: ${JSON.stringify(said)}`); break; }
}

check(formatVND(50_000), '50.000', 'formatVND(50000)');
check(formatVND(1_200_000), '1.200.000', 'formatVND(1200000)');

if (failures) {
    console.error(`\n✗ Vietnamese numbers: ${failures} failing case(s)`);
    process.exit(1);
}
console.log(`✓ Vietnamese numbers OK — ${CASES.length + SOUTH_CASES.length} spoken forms, range 0…${formatVND(MAX_NUMBER)}`);
