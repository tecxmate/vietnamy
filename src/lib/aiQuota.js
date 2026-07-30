// Daily free-message quota for the AI tutor. Regular users get AI_DAILY_LIMIT
// messages per day; Developer Preview (userProfile.isDeveloperMode) bypasses it.
// Client-side only — a soft limit that resets at local midnight.
const STORAGE_KEY = 'vnme_ai_daily';
export const AI_DAILY_LIMIT = 30;

// Local YYYY-MM-DD so the daily limit resets at the user's midnight, not UTC.
const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Read today's usage, resetting the counter when the date rolls over.
function readUsage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && parsed.date === today() && Number.isFinite(parsed.count)) {
            return parsed;
        }
    } catch { /* fall through to a fresh count */ }
    return { date: today(), count: 0 };
}

export function getRemaining() {
    return Math.max(0, AI_DAILY_LIMIT - readUsage().count);
}

export function hasReachedLimit() {
    return readUsage().count >= AI_DAILY_LIMIT;
}

// Count one used message (call only for non-developer users on a real send).
export function recordUsage() {
    const usage = readUsage();
    const next = { date: usage.date, count: usage.count + 1 };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore quota errors */ }
    return Math.max(0, AI_DAILY_LIMIT - next.count);
}
