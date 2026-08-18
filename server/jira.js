// Jira Cloud bridge for in-app bug reports.
//
// Every report submitted through the in-app "Report a problem" button is mirrored
// into a Jira project (the "vnmy-user" space) so triage happens where the rest of
// the work lives. The local feedback_reports row stays the source of truth — Jira
// is a mirror, so every function here fails soft and never blocks a submission.

// Read on every call rather than at module load. server.js populates process.env
// from .env in its module body, which runs *after* this import is evaluated, so
// snapshotting these into consts here would silently ignore .env config.
function config() {
    return {
        baseUrl: (process.env.JIRA_BASE_URL || '').replace(/\/+$/, ''),
        email: process.env.JIRA_EMAIL || '',
        apiToken: process.env.JIRA_API_TOKEN || '',
        projectKey: process.env.JIRA_PROJECT_KEY || 'VNMYUSER',
        issueType: process.env.JIRA_ISSUE_TYPE || 'Bug',
        timeoutMs: Number(process.env.JIRA_TIMEOUT_MS) || 8000,
    };
}

export function isJiraConfigured() {
    const { baseUrl, email, apiToken } = config();
    return Boolean(baseUrl && email && apiToken);
}

export function jiraProjectKey() {
    return config().projectKey;
}

async function jiraFetch(path, { method = 'GET', headers = {}, body } = {}) {
    const { baseUrl, email, apiToken, timeoutMs } = config();
    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
            Accept: 'application/json',
            ...headers,
        },
        body,
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Jira ${method} ${path} failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    return res.json().catch(() => ({}));
}

// --- Atlassian Document Format helpers -------------------------------------
// Jira's v3 API takes rich text as ADF rather than a string, so descriptions have
// to be assembled node by node.

const text = value => ({ type: 'text', text: String(value ?? '') });
const paragraph = value => ({ type: 'paragraph', content: value ? [text(value)] : [] });
const heading = value => ({ type: 'heading', attrs: { level: 3 }, content: [text(value)] });

function codeBlock(value) {
    return { type: 'codeBlock', attrs: {}, content: [text(value)] };
}

function bulletList(items) {
    return {
        type: 'bulletList',
        content: items.map(item => ({ type: 'listItem', content: [paragraph(item)] })),
    };
}

function linkParagraph(label, href) {
    return {
        type: 'paragraph',
        content: [{ type: 'text', text: label, marks: [{ type: 'link', attrs: { href } }] }],
    };
}

function formatClientLogs(logs) {
    if (!Array.isArray(logs) || !logs.length) return '';
    return logs
        .slice(-40)
        .map(log => `[${log.level || 'log'}] ${log.at || ''} ${String(log.message ?? '').slice(0, 400)}`)
        .join('\n')
        .slice(0, 8000);
}

// A short, filterable label for the screen the report came from:
// "/grammar-unit/u1?x=1" -> "page-grammar-unit", "/" -> "page-home".
function pathLabel(pathname) {
    const segment = String(pathname || '/').split('?')[0].split('/').filter(Boolean)[0];
    if (!segment) return 'page-home';
    return `page-${segment.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40)}`;
}

function summaryFor(report) {
    const firstLine = String(report.body || '')
        .split('\n')
        .map(line => line.trim())
        .find(Boolean) || 'In-app report';
    return `[${report.pathname || '/'}] ${firstLine}`.slice(0, 250);
}

function describe(report) {
    const meta = report.metadata || {};
    const openContext = meta.openContext || {};
    const content = [
        heading('Where it happened'),
        bulletList([
            `Path: ${report.pathname || '/'}`,
            `URL: ${meta.url || '(unknown)'}`,
            openContext.hash ? `Hash: ${openContext.hash}` : `Screen title: ${meta.title || '(unknown)'}`,
            `Viewport: ${report.viewport || '(unknown)'}`,
            `Opened via: ${openContext.trigger || 'button'}`,
        ]),
    ];

    if (openContext.activeElement?.tag) {
        const el = openContext.activeElement;
        content.push(paragraph(`Focused element: <${el.tag}>${el.label ? ` "${el.label}"` : ''}${el.id ? ` #${el.id}` : ''}`));
    }

    content.push(heading('What the user reported'));
    content.push({ type: 'blockquote', content: [paragraph(report.body || '')] });

    content.push(heading('Reporter'));
    content.push(bulletList([
        `Name: ${report.name || '(not signed in)'}`,
        `Email: ${report.email || '(none)'}`,
        `User id: ${report.userId || 'anonymous'}`,
        `Language: ${meta.language || '(unknown)'}`,
    ]));

    content.push(heading('Environment'));
    content.push(bulletList([
        `App version: ${report.appVersion || 'dev'}`,
        `User agent: ${report.userAgent || '(unknown)'}`,
        `Screen: ${meta.screen || '(unknown)'} @ ${meta.pixelRatio || 1}x`,
        `Timezone: ${meta.timezone || '(unknown)'}`,
        `Online: ${meta.online === false ? 'no' : 'yes'}`,
        `Reported at: ${report.at || ''}`,
        `Report id: ${report.id || ''}`,
    ]));

    if (report.screenshotUrl) {
        content.push(heading('Screenshot'));
        content.push(linkParagraph('Open screenshot', report.screenshotUrl));
    }

    const logs = formatClientLogs(report.clientLogs);
    if (logs) {
        content.push(heading('Recent console output'));
        content.push(codeBlock(logs));
    }

    return { type: 'doc', version: 1, content };
}

/**
 * Create the mirror issue. Returns `{ key, url }`, or null when Jira is not
 * configured or the call fails — callers treat this as best-effort.
 */
export async function createJiraIssue(report = {}) {
    if (!isJiraConfigured()) return null;
    const { baseUrl, projectKey, issueType } = config();

    const labels = [
        'vietnamy',
        'in-app-report',
        `kind-${report.kind || 'bug'}`,
        `severity-${report.severity || 'med'}`,
        pathLabel(report.pathname),
    ];

    const result = await jiraFetch('/rest/api/3/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fields: {
                project: { key: projectKey },
                issuetype: { name: issueType },
                summary: summaryFor(report),
                description: describe(report),
                labels,
            },
        }),
    });

    if (!result?.key) return null;
    return { key: result.key, url: `${baseUrl}/browse/${result.key}` };
}

/**
 * Attach the captured screenshot to an existing issue. Best-effort: a failure
 * here leaves the issue in place with the screenshot link in its description.
 */
export async function attachJiraFile(issueKey, { filename, contentType, body }) {
    if (!isJiraConfigured() || !issueKey || !body?.length) return null;

    const form = new FormData();
    form.append('file', new Blob([body], { type: contentType || 'application/octet-stream' }), filename || 'screenshot.jpg');

    const result = await jiraFetch(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/attachments`, {
        method: 'POST',
        // Jira rejects attachment uploads without this XSRF opt-out header.
        headers: { 'X-Atlassian-Token': 'no-check' },
        body: form,
    });
    return Array.isArray(result) ? result[0] || null : null;
}
