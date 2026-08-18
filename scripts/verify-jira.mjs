#!/usr/bin/env node
// Preflight for the in-app bug report → Jira mirror.
//
//   node scripts/verify-jira.mjs            # check credentials, project, issue types
//   node scripts/verify-jira.mjs --create   # additionally file a real test issue
//
// Answers the two things you cannot know without asking Jira: the exact project
// key, and which issue type names that project actually accepts.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, rawValue] = match;
        if (process.env[key] !== undefined) continue;
        process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
    }
}

loadEnvFile(path.join(ROOT_DIR, '.env'));
loadEnvFile(path.join(ROOT_DIR, '.env.local'));

const BASE = (process.env.JIRA_BASE_URL || '').replace(/\/+$/, '');
const EMAIL = process.env.JIRA_EMAIL || '';
const TOKEN = process.env.JIRA_API_TOKEN || '';
const WANTED_KEY = process.env.JIRA_PROJECT_KEY || 'VNMYUSER';
const WANTED_TYPE = process.env.JIRA_ISSUE_TYPE || 'Bug';

const ok = value => `  ✓ ${value}`;
const bad = value => `  ✗ ${value}`;

const missing = Object.entries({ JIRA_BASE_URL: BASE, JIRA_EMAIL: EMAIL, JIRA_API_TOKEN: TOKEN })
    .filter(([, value]) => !value)
    .map(([name]) => name);

if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    console.error('Set them in .env — see docs/JIRA-FEEDBACK.md.');
    process.exit(1);
}

async function jira(pathname, init = {}) {
    const res = await fetch(`${BASE}${pathname}`, {
        ...init,
        headers: {
            Authorization: `Basic ${Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64')}`,
            Accept: 'application/json',
            ...(init.headers || {}),
        },
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON error body */ }
    if (!res.ok) throw new Error(`${res.status} ${pathname} — ${text.slice(0, 300)}`);
    return json;
}

let failures = 0;

console.log(`\nJira: ${BASE}\n`);

// 1. Credentials.
console.log('Authentication');
let me = null;
try {
    me = await jira('/rest/api/3/myself');
    console.log(ok(`signed in as ${me.displayName} <${me.emailAddress || EMAIL}>`));
} catch (err) {
    console.log(bad(`could not authenticate — ${err.message}`));
    console.log('    Check JIRA_EMAIL and that JIRA_API_TOKEN is a current API token.');
    process.exit(1);
}

// 2. Which projects exist, so the right key is never a guess.
console.log('\nProjects visible to this account');
let projects = [];
try {
    const search = await jira('/rest/api/3/project/search?maxResults=50');
    projects = search.values || [];
    for (const project of projects) {
        const marker = project.key === WANTED_KEY ? '← JIRA_PROJECT_KEY' : '';
        console.log(`    ${project.key.padEnd(12)} ${project.name} ${marker}`);
    }
    if (!projects.length) console.log('    (none)');
} catch (err) {
    console.log(bad(`could not list projects — ${err.message}`));
    failures += 1;
}

// 3. The configured key must be one of them.
console.log(`\nConfigured project (JIRA_PROJECT_KEY=${WANTED_KEY})`);
const match = projects.find(project => project.key === WANTED_KEY);
if (match) {
    console.log(ok(`"${match.name}" found`));
} else {
    console.log(bad(`no project with key "${WANTED_KEY}"`));
    const guess = projects.find(project => /vnmy/i.test(project.name) || /vnmy/i.test(project.key));
    if (guess) console.log(`    Did you mean JIRA_PROJECT_KEY=${guess.key}  ("${guess.name}")?`);
    failures += 1;
}

// 4. The issue type name has to exist in that project's scheme.
if (match) {
    console.log(`\nIssue type (JIRA_ISSUE_TYPE=${WANTED_TYPE})`);
    try {
        const meta = await jira(`/rest/api/3/issue/createmeta?projectKeys=${encodeURIComponent(WANTED_KEY)}&expand=projects.issuetypes`);
        const types = (meta.projects?.[0]?.issuetypes || []).filter(type => !type.subtask);
        const names = types.map(type => type.name);
        if (names.includes(WANTED_TYPE)) {
            console.log(ok(`"${WANTED_TYPE}" is valid`));
        } else {
            console.log(bad(`"${WANTED_TYPE}" is not available in this project`));
            failures += 1;
        }
        console.log(`    Available: ${names.join(', ') || '(none returned)'}`);
    } catch (err) {
        console.log(bad(`could not read issue types — ${err.message}`));
        failures += 1;
    }
}

// 5. Optional live round-trip, including an attachment.
if (process.argv.includes('--create') && match && !failures) {
    console.log('\nTest issue');
    try {
        const created = await jira('/rest/api/3/issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    project: { key: WANTED_KEY },
                    issuetype: { name: WANTED_TYPE },
                    summary: '[verify-jira] Connectivity test — safe to delete',
                    description: {
                        type: 'doc',
                        version: 1,
                        content: [{
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Created by scripts/verify-jira.mjs to confirm the in-app bug report mirror works. Safe to delete.' }],
                        }],
                    },
                    labels: ['vietnamy', 'in-app-report', 'verify'],
                },
            }),
        });
        console.log(ok(`created ${created.key} — ${BASE}/browse/${created.key}`));

        // Attachments use a separate endpoint and need the XSRF opt-out header;
        // exercise it here so a broken permission shows up now, not in production.
        const form = new FormData();
        form.append('file', new Blob([Buffer.from('verify-jira attachment test')], { type: 'text/plain' }), 'verify.txt');
        await jira(`/rest/api/3/issue/${created.key}/attachments`, {
            method: 'POST',
            headers: { 'X-Atlassian-Token': 'no-check' },
            body: form,
        });
        console.log(ok('attachment upload works (screenshots will attach)'));
    } catch (err) {
        console.log(bad(`test issue failed — ${err.message}`));
        failures += 1;
    }
}

if (failures) {
    console.log(`\n${failures} check(s) failed. See docs/JIRA-FEEDBACK.md.\n`);
    process.exit(1);
}

console.log('\nAll checks passed.');
if (!process.argv.includes('--create')) {
    console.log('Run with --create to file a real test issue end to end.\n');
} else {
    console.log('');
}
