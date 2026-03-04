// Vietnamese text comparison with diacritics tolerance

export function stripDiacritics(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd');
}

export function checkVietnameseInput(userInput, expected, expectedNoDiacritics) {
    const trimmedInput = userInput.trim().toLowerCase();
    const trimmedExpected = expected.trim().toLowerCase();

    if (trimmedInput === trimmedExpected) {
        return { exact: true, fuzzy: true };
    }

    const strippedExpected = expectedNoDiacritics
        ? expectedNoDiacritics.trim().toLowerCase()
        : stripDiacritics(trimmedExpected);
    const strippedInput = stripDiacritics(trimmedInput);

    if (strippedInput === strippedExpected) {
        return { exact: false, fuzzy: true };
    }

    return { exact: false, fuzzy: false };
}
