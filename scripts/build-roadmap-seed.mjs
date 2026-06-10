#!/usr/bin/env node

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'lib', 'content', 'roadmapSeedData.js');

const server = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false },
});

try {
    const { getInitialData } = await server.ssrLoadModule('/src/lib/content/initialData.js');
    const seed = getInitialData({ full: false });
    const source = [
        '// Generated lightweight roadmap seed. Full lesson/content data hydrates from content/curriculum.json on demand.',
        '',
        `export const ROADMAP_SEED = ${JSON.stringify(seed)};`,
        '',
    ].join('\n');

    writeFileSync(OUT, source);
    console.log(`Built ${OUT}`);
} finally {
    await server.close();
}
