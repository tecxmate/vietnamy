import { isNeonConfigured, neonQuery } from './neonDb.js';

export function isProgressStoreConfigured() {
    return isNeonConfigured();
}

function cleanText(value, max = 1000) {
    return typeof value === 'string' ? value.slice(0, max) : '';
}

function cleanJsonObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value;
}

export async function upsertProfile(userId, profile = {}) {
    const id = cleanText(userId, 200);
    if (!id) throw new Error('userId is required');
    const rows = await neonQuery(
        `insert into profiles (
            id, email, full_name, avatar_url, ui_language, dialect, onboarding_completed, updated_at
        ) values ($1, $2, $3, $4, $5, $6, $7, now())
        on conflict (id) do update set
            email = coalesce(nullif(excluded.email, ''), profiles.email),
            full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
            avatar_url = coalesce(nullif(excluded.avatar_url, ''), profiles.avatar_url),
            ui_language = excluded.ui_language,
            dialect = excluded.dialect,
            onboarding_completed = excluded.onboarding_completed,
            updated_at = now()
        returning *`,
        [
            id,
            cleanText(profile.email, 320),
            cleanText(profile.full_name || profile.fullName, 240),
            cleanText(profile.avatar_url || profile.avatarUrl, 1000),
            cleanText(profile.ui_language || profile.uiLanguage || 'en', 40) || 'en',
            cleanText(profile.dialect || 'north', 40) || 'north',
            Boolean(profile.onboarding_completed ?? profile.onboardingCompleted),
        ]
    );
    return rows[0] || null;
}

export async function loadProfile(userId) {
    const rows = await neonQuery('select * from profiles where id = $1 limit 1', [cleanText(userId, 200)]);
    return rows[0] || null;
}

async function ensureProfileStub(userId) {
    const id = cleanText(userId, 200);
    if (!id) throw new Error('userId is required');
    await neonQuery(
        `insert into profiles (id, updated_at)
         values ($1, now())
         on conflict (id) do nothing`,
        [id]
    );
    return id;
}

export async function saveProgress(userId, data = {}) {
    const id = await ensureProfileStub(userId);
    const rows = await neonQuery(
        `insert into user_progress (user_id, data, updated_at)
         values ($1, $2::jsonb, now())
         on conflict (user_id) do update set data = excluded.data, updated_at = now()
         returning user_id, data, updated_at`,
        [id, JSON.stringify(cleanJsonObject(data))]
    );
    return rows[0] || null;
}

export async function loadProgress(userId) {
    const rows = await neonQuery(
        'select user_id, data, updated_at from user_progress where user_id = $1 limit 1',
        [cleanText(userId, 200)]
    );
    return rows[0] || null;
}

function normalizeSavedWordRows(userId, rows) {
    if (!Array.isArray(rows)) return [];
    const seen = new Set();
    return rows
        .map(row => ({
            user_id: cleanText(userId, 200),
            word_id: cleanText(row?.word_id || row?.wordId, 240).trim(),
            source: cleanText(row?.source || 'lesson', 40).trim() || 'lesson',
            metadata: cleanJsonObject(row?.metadata),
        }))
        .filter(row => {
            const key = `${row.source}:${row.word_id}`;
            if (!row.user_id || !row.word_id || seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 5000);
}

export async function replaceSavedWords(userId, rows) {
    const id = await ensureProfileStub(userId);
    const normalized = normalizeSavedWordRows(id, rows);
    await neonQuery('delete from saved_words where user_id = $1 and source in ($2, $3)', [id, 'lesson', 'dictionary']);
    for (const row of normalized) {
        await neonQuery(
            `insert into saved_words (user_id, word_id, source, metadata, updated_at)
             values ($1, $2, $3, $4::jsonb, now())
             on conflict (user_id, word_id, source) do update set
                metadata = excluded.metadata,
                updated_at = now()`,
            [row.user_id, row.word_id, row.source, JSON.stringify(row.metadata)]
        );
    }
    return { count: normalized.length };
}

export async function loadSavedWords(userId) {
    return neonQuery(
        `select word_id, source, metadata, updated_at
         from saved_words
         where user_id = $1
         order by updated_at desc`,
        [cleanText(userId, 200)]
    );
}
