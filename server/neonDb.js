let pool = null;

function getDatabaseUrl() {
    return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';
}

export function isNeonConfigured() {
    return Boolean(getDatabaseUrl());
}

async function getPool() {
    if (pool) return pool;
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
        throw new Error('DATABASE_URL or NEON_DATABASE_URL is required for Neon-backed storage.');
    }

    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    if (typeof WebSocket === 'undefined') {
        const ws = await import('ws');
        neonConfig.webSocketConstructor = ws.default || ws;
    }

    pool = new Pool({ connectionString: databaseUrl });
    pool.on('error', (err) => {
        console.error('Neon pool error (ignored to avoid crashing instance):', err);
    });
    return pool;
}

export async function neonQuery(text, params = []) {
    const neonPool = await getPool();
    const result = await neonPool.query(text, params);
    return result.rows || [];
}
