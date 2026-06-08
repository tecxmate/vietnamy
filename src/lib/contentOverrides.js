// Generic localStorage override for bundled content data that the admin can
// edit (alphabet, vowels, …). A getter returns the override if present, else
// the bundled default — so editors and lessons share one source of truth.
export function loadOverride(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

export function saveOverride(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

export function resetOverride(key) {
    localStorage.removeItem(key);
}
