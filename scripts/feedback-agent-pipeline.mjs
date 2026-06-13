#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const STATUSES = new Set(['open', 'triaged', 'claimed', 'fixed_pending_approval', 'closed', 'not_reproducible', 'wont_fix']);

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

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      args._.push(arg);
      continue;
    }
    const [key, inlineValue] = arg.slice(2).split('=', 2);
    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function clamp(value, max = 120) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function reportLine(report) {
  return [
    `### ${report.severity?.toUpperCase() || 'MED'} · ${report.subject || 'Untitled'} · \`${report.id}\``,
    `- Status: \`${report.status || 'open'}\``,
    `- Page: \`${report.pathname || '/'}\``,
    `- At: ${report.at || 'unknown'}`,
    `- Body: ${clamp(report.body, 500) || '(empty)'}`,
    report.metadata?.openContext ? `- Context: trigger=\`${report.metadata.openContext.trigger || 'unknown'}\`, viewport=\`${report.metadata.openContext.viewport || report.viewport || ''}\`` : '',
    report.metadata?.agentEvents?.length ? `- Agent events: ${report.metadata.agentEvents.length}` : '',
  ].filter(Boolean).join('\n');
}

function formatMarkdown(reports, source) {
  const now = new Date().toISOString();
  return [
    '# Feedback Agent Queue',
    '',
    `Generated: ${now}`,
    `Source: ${source}`,
    '',
    'Human approval rule: agents may claim, investigate, patch, test, and prepare a PR, but fixes stay in `fixed_pending_approval` until Niko approves merge/deploy.',
    '',
    reports.length ? reports.map(reportLine).join('\n\n') : '_No matching feedback reports._',
    '',
  ].join('\n');
}

async function apiFetch(base, token, route, options = {}) {
  const url = `${base.replace(/\/$/, '')}${route}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `${response.status} ${response.statusText}`);
  return result;
}

async function getStore(args) {
  const apiBase = args.api || process.env.FEEDBACK_API_BASE || '';
  if (apiBase) {
    const token = args.token || process.env.MAIL_ADMIN_TOKEN || process.env.FEEDBACK_ADMIN_TOKEN || '';
    return {
      source: apiBase,
      async list(status, limit) {
        const query = new URLSearchParams({ status, limit: String(limit) });
        const result = await apiFetch(apiBase, token, `/api/admin/feedback?${query}`);
        return result.reports || result.recent || [];
      },
      async update(id, update) {
        const result = await apiFetch(apiBase, token, `/api/admin/feedback/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(update),
        });
        return result.report;
      },
    };
  }

  if (args.provider) process.env.OPS_STORE_PROVIDER = args.provider;
  if (args.db) process.env.APP_OPS_DB_PATH = path.resolve(args.db);
  loadEnvFile(path.join(ROOT_DIR, '.env.local'));
  loadEnvFile(path.join(ROOT_DIR, '.env'));
  const ops = await import('../server/opsStore.js');
  return {
    source: `${process.env.OPS_STORE_PROVIDER || 'sqlite'} ops store`,
    list: (status, limit) => ops.listFeedbackReports({ status, limit }),
    update: (id, update) => ops.updateFeedbackReportLifecycle(id, update),
  };
}

function requireId(args) {
  const id = args.id || args._[1];
  if (!id) throw new Error('feedback report id is required; pass --id <id>');
  return id;
}

async function main() {
  const command = process.argv[2] || 'list';
  const args = parseArgs(process.argv.slice(3));
  const store = await getStore(args);
  const actor = args.actor || process.env.FEEDBACK_AGENT_ACTOR || 'coding-agent';

  if (command === 'list') {
    const status = args.status || 'open';
    const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 500);
    const reports = await store.list(status, limit);
    const output = args.format === 'json'
      ? JSON.stringify({ source: store.source, reports }, null, 2)
      : formatMarkdown(reports, store.source);
    if (args.out) {
      const outPath = path.resolve(args.out);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, output);
      console.log(`Wrote ${reports.length} feedback reports to ${outPath}`);
    } else {
      console.log(output);
    }
    return;
  }

  if (command === 'claim') {
    const report = await store.update(requireId(args), {
      status: 'claimed',
      action: 'claimed',
      actor,
      note: args.note || 'Picked up by coding agent for investigation.',
      branch: args.branch || '',
    });
    console.log(JSON.stringify({ ok: true, report }, null, 2));
    return;
  }

  if (command === 'mark') {
    const status = args.status || args._[1];
    if (!STATUSES.has(status)) throw new Error(`invalid status: ${status}`);
    const report = await store.update(requireId(args), {
      status,
      action: args.action || status,
      actor,
      note: args.note || '',
      branch: args.branch || '',
      commit: args.commit || '',
      prUrl: args.prUrl || '',
      approvalRequired: args.approvalRequired !== 'false',
    });
    console.log(JSON.stringify({ ok: true, report }, null, 2));
    return;
  }

  if (command === 'pending-approval') {
    const report = await store.update(requireId(args), {
      status: 'fixed_pending_approval',
      action: 'fixed_pending_approval',
      actor,
      note: args.note || 'Fix prepared; waiting for Niko approval.',
      branch: args.branch || '',
      commit: args.commit || '',
      prUrl: args.prUrl || '',
      approvalRequired: true,
    });
    console.log(JSON.stringify({ ok: true, report }, null, 2));
    return;
  }

  throw new Error(`unknown command: ${command}`);
}

main().catch(error => {
  console.error(error?.message || error);
  process.exit(1);
});
