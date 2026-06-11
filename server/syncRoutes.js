import {
    isProgressStoreConfigured,
    loadProfile,
    loadProgress,
    loadSavedWords,
    replaceSavedWords,
    saveProgress,
    upsertProfile,
} from './progressStore.js';

function requireStore(res) {
    if (isProgressStoreConfigured()) return true;
    res.status(503).json({ error: 'Neon sync store is not configured.' });
    return false;
}

function collectSavedRows(body) {
    if (Array.isArray(body?.rows)) return body.rows;
    if (Array.isArray(body?.savedWords)) return body.savedWords;
    return [];
}

export function mountSyncRoutes(app, { requireAuthenticatedUserId }) {
    app.get('/api/sync/profile', async (req, res) => {
        if (!requireStore(res)) return;
        const userId = await requireAuthenticatedUserId(req, res);
        if (!userId) return;
        res.json({ provider: 'neon', profile: await loadProfile(userId) });
    });

    app.put('/api/sync/profile', async (req, res) => {
        if (!requireStore(res)) return;
        const userId = await requireAuthenticatedUserId(req, res);
        if (!userId) return;
        const profile = await upsertProfile(userId, req.body?.profile || req.body || {});
        res.json({ ok: true, provider: 'neon', profile });
    });

    app.get('/api/sync/progress', async (req, res) => {
        if (!requireStore(res)) return;
        const userId = await requireAuthenticatedUserId(req, res);
        if (!userId) return;
        const [progress, savedWords] = await Promise.all([
            loadProgress(userId),
            loadSavedWords(userId),
        ]);
        res.json({
            provider: 'neon',
            data: progress?.data || null,
            updatedAt: progress?.updated_at || null,
            savedWords,
        });
    });

    app.put('/api/sync/progress', async (req, res) => {
        if (!requireStore(res)) return;
        const userId = await requireAuthenticatedUserId(req, res);
        if (!userId) return;
        const progress = await saveProgress(userId, req.body?.data || {});
        if (Array.isArray(req.body?.savedWords) || Array.isArray(req.body?.rows)) {
            await replaceSavedWords(userId, collectSavedRows(req.body));
        }
        res.json({ ok: true, provider: 'neon', progress });
    });

    app.get('/api/sync/saved-words', async (req, res) => {
        if (!requireStore(res)) return;
        const userId = await requireAuthenticatedUserId(req, res);
        if (!userId) return;
        res.json({ provider: 'neon', rows: await loadSavedWords(userId) });
    });

    app.put('/api/sync/saved-words', async (req, res) => {
        if (!requireStore(res)) return;
        const userId = await requireAuthenticatedUserId(req, res);
        if (!userId) return;
        const result = await replaceSavedWords(userId, collectSavedRows(req.body));
        res.json({ ok: true, provider: 'neon', ...result });
    });
}
