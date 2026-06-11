#!/usr/bin/env node
// Compare Supabase and Neon row counts/latest timestamps for migration tables.
//
// Usage:
//   node scripts/check-neon-parity.mjs
//   node scripts/check-neon-parity.mjs --tables=profiles,user_progress
//
// Required env:
//   SUPABASE_URL or VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   DATABASE_URL or NEON_DATABASE_URL

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { selectMigrationTables } from './backend-migration-tables.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function loadEnvFile(path) {
    if (!existsSync(path)) return;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, rawValue] = match;
        if (process.env[key] !== undefined) continue;
        process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
    }
}

loadEnvFile(join(ROOT, '.env.local'));
loadEnvFile(join(ROOT, '.env'));

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    return match ? [match[1], match[2] ?? 'true'] : [arg, 'true'];
}));

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';
const tables = selectMigrationTables(args.tables || '');

function requireEnv(name, value) {
    if (!value) {
        console.error(`Missing ${name}. Fill it in .env/.env.local or export it before running.`);
        process.exit(1);
    }
}

requireEnv('SUPABASE_URL', SUPABASE_URL);
requireEnv('SUPABASE_SERVICE_ROLE_KEY', SERVICE_ROLE);
requireEnv('DATABASE_URL or NEON_DATABASE_URL', DATABASE_URL);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
});

const { Pool, neonConfig } = await import('@neondatabase/serverless');
if (typeof WebSocket === 'undefined') {
    const ws = await import('ws');
    neonConfig.webSocketConstructor = ws.default || ws;
}
const pool = new Pool({ connectionString: DATABASE_URL });
pool.on('error', (err) => {
    console.error('Neon pool error (ignored to avoid crashing instance):', err);
});

function ident(value) {
    return `"${String(value).replace(/"/g, '""')}"`;
}

async function supabaseStats(table) {
    const { count, error } = await supabase
        .from(table.name)
        .select(table.primaryKey[0], { count: 'exact', head: true });
    if (error) throw new Error(`${table.name} Supabase count: ${error.message}`);
    const latestQuery = supabase
        .from(table.name)
        .select(table.latestColumn)
        .order(table.latestColumn, { ascending: false })
        .limit(1);
    const { data, error: latestError } = await latestQuery;
    if (latestError) throw new Error(`${table.name} Supabase latest: ${latestError.message}`);
    return { count: count || 0, latest: data?.[0]?.[table.latestColumn] || null };
}

async function neonStats(table) {
    const countSql = `select count(*)::int as count from public.${ident(table.name)}`;
    const latestSql = `select max(${ident(table.latestColumn)}) as latest from public.${ident(table.name)}`;
    const [countResult, latestResult] = await Promise.all([
        pool.query(countSql),
        pool.query(latestSql),
    ]);
    return {
        count: countResult.rows[0]?.count || 0,
        latest: latestResult.rows[0]?.latest || null,
    };
}

let mismatches = 0;
console.log('table,supabase_count,neon_count,count_match,supabase_latest,neon_latest');
try {
    for (const table of tables) {
        const [source, target] = await Promise.all([supabaseStats(table), neonStats(table)]);
        const countMatch = source.count === target.count;
        if (!countMatch) mismatches += 1;
        console.log([
            table.name,
            source.count,
            target.count,
            countMatch ? 'yes' : 'no',
            source.latest || '',
            target.latest ? new Date(target.latest).toISOString() : '',
        ].join(','));
    }
} finally {
    await pool.end().catch(() => {});
}

if (mismatches) {
    console.error(`${mismatches} table(s) differ between Supabase and Neon.`);
    process.exit(1);
}

console.error('Supabase and Neon row counts match.');
