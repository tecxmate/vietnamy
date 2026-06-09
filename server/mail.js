import crypto from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

function loadEnvFile(path) {
    if (!existsSync(path)) return;
    const lines = readFileSync(path, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, rawValue] = match;
        if (process.env[key] !== undefined) continue;
        process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
    }
}

loadEnvFile(join(ROOT_DIR, '.env.local'));
loadEnvFile(join(ROOT_DIR, '.env'));

const EMAIL_LOG_PATH = join(__dirname, 'databases', 'email_logs.json');
const EMAIL_LOG_LIMIT = 5000;
const RESEND_API_URL = 'https://api.resend.com/emails';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Vietnamy <onboarding@resend.dev>';
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'ceo@tecxmate.com';
export const EMAIL_ENABLED = Boolean(RESEND_API_KEY);
export const PUBLIC_BASE_URL = (
    process.env.PUBLIC_BASE_URL ||
    process.env.VITE_PUBLIC_BASE_URL ||
    'https://vietnamy.app'
).replace(/\/+$/, '');

const rateBuckets = new Map();

export function normalizeEmail(value) {
    const email = String(value || '').trim().toLowerCase();
    if (!email || email.length > 254) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
    return email;
}

export function escapeHtml(value) {
    if (value == null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function safeUrl(value) {
    if (!value) return '#';
    const trimmed = String(value).trim();
    if (!/^(https?:|mailto:)/i.test(trimmed)) return '#';
    return escapeHtml(trimmed);
}

export function clampText(value, maxLength = 2000) {
    return String(value || '').trim().slice(0, maxLength);
}

export function checkMailRateLimit(key, { max = 5, windowMs = 60 * 60 * 1000 } = {}) {
    const now = Date.now();
    const bucketKey = String(key || 'unknown');
    const recent = (rateBuckets.get(bucketKey) || []).filter(ts => now - ts < windowMs);
    if (recent.length >= max) {
        rateBuckets.set(bucketKey, recent);
        return {
            ok: false,
            remaining: 0,
            resetAt: new Date(recent[0] + windowMs).toISOString(),
        };
    }
    recent.push(now);
    rateBuckets.set(bucketKey, recent);
    return {
        ok: true,
        remaining: Math.max(0, max - recent.length),
        resetAt: new Date(recent[0] + windowMs).toISOString(),
    };
}

function readEmailLogStore() {
    try {
        if (!existsSync(EMAIL_LOG_PATH)) return { logs: [] };
        const parsed = JSON.parse(readFileSync(EMAIL_LOG_PATH, 'utf8'));
        return { logs: Array.isArray(parsed.logs) ? parsed.logs : [] };
    } catch (err) {
        console.warn('Email log read failed:', err.message);
        return { logs: [] };
    }
}

function writeEmailLogStore(store) {
    mkdirSync(dirname(EMAIL_LOG_PATH), { recursive: true });
    const logs = Array.isArray(store.logs) ? store.logs.slice(-EMAIL_LOG_LIMIT) : [];
    writeFileSync(EMAIL_LOG_PATH, JSON.stringify({ logs }, null, 2));
}

async function logEmail(entry) {
    try {
        const store = readEmailLogStore();
        store.logs.push({
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            type: entry.type || 'generic',
            to: entry.to || '',
            subject: entry.subject || '',
            success: Boolean(entry.success),
            skipped: Boolean(entry.skipped),
            providerId: entry.providerId || null,
            errorMessage: entry.errorMessage || null,
        });
        writeEmailLogStore(store);
    } catch (err) {
        console.warn('Email log write failed:', err.message);
    }
}

export function getEmailStats() {
    const logs = readEmailLogStore().logs;
    const now = new Date();
    const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
    const byType = {};

    let sentToday = 0;
    let failedToday = 0;
    let sentMonth = 0;
    let failedMonth = 0;

    for (const log of logs) {
        const t = Date.parse(log.at);
        if (!Number.isFinite(t)) continue;
        const type = log.type || 'generic';
        if (!byType[type]) byType[type] = { sent: 0, failed: 0, skipped: 0 };
        if (log.skipped) byType[type].skipped += 1;
        else if (log.success) byType[type].sent += 1;
        else byType[type].failed += 1;

        if (t >= todayStart) {
            if (log.success && !log.skipped) sentToday += 1;
            if (!log.success && !log.skipped) failedToday += 1;
        }
        if (t >= monthStart) {
            if (log.success && !log.skipped) sentMonth += 1;
            if (!log.success && !log.skipped) failedMonth += 1;
        }
    }

    return {
        enabled: EMAIL_ENABLED,
        from: EMAIL_FROM,
        supportEmail: SUPPORT_EMAIL,
        today: { sent: sentToday, failed: failedToday },
        month: { sent: sentMonth, failed: failedMonth },
        totalLogged: logs.length,
        byType,
        recent: logs.slice(-25).reverse(),
    };
}

export async function sendMail({ type, to, subject, html, text, replyTo }) {
    const normalizedTo = normalizeEmail(to);
    if (!normalizedTo) {
        return { ok: false, error: 'valid recipient email required' };
    }

    if (!EMAIL_ENABLED) {
        console.log(`RESEND_API_KEY not set - skipping ${type || 'email'} email to ${normalizedTo}`);
        await logEmail({ type, to: normalizedTo, subject, success: false, skipped: true, errorMessage: 'RESEND_API_KEY not set' });
        return { ok: false, skipped: true, error: 'mail provider is not configured' };
    }

    try {
        const payload = {
            from: EMAIL_FROM,
            to: [normalizedTo],
            subject,
            html,
        };
        if (text) payload.text = text;
        const normalizedReplyTo = normalizeEmail(replyTo);
        if (normalizedReplyTo) payload.reply_to = normalizedReplyTo;

        const response = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = body?.message || body?.error || `Resend responded with ${response.status}`;
            await logEmail({ type, to: normalizedTo, subject, success: false, errorMessage: message });
            return { ok: false, error: message, status: response.status };
        }

        await logEmail({ type, to: normalizedTo, subject, success: true, providerId: body?.id || null });
        return { ok: true, id: body?.id || null };
    } catch (err) {
        await logEmail({ type, to: normalizedTo, subject, success: false, errorMessage: err.message });
        return { ok: false, error: err.message };
    }
}

export function baseEmail({ title, preview, body, cta }) {
    const safeTitle = escapeHtml(title);
    const safePreview = escapeHtml(preview || '');
    const ctaHtml = cta?.href && cta?.label
        ? `<p style="margin: 28px 0 0;"><a href="${safeUrl(cta.href)}" target="_blank" style="display:inline-block;background:#e76f61;color:#fff;text-decoration:none;border-radius:10px;padding:12px 18px;font-weight:700;">${escapeHtml(cta.label)}</a></p>`
        : '';

    return `
      <div style="display:none;max-height:0;overflow:hidden;color:transparent;">${safePreview}</div>
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:620px;margin:0 auto;padding:32px 20px;color:#1f1f24;">
        <p style="margin:0 0 16px;color:#e76f61;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:12px;">Vietnamy</p>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;">${safeTitle}</h1>
        <div style="font-size:15px;line-height:1.65;color:#4b4b52;">${body}</div>
        ${ctaHtml}
        <p style="font-size:12px;color:#8a8a92;margin-top:36px;">Vietnamy by TECXMATE<br><a href="${safeUrl(PUBLIC_BASE_URL)}" style="color:#e76f61;text-decoration:none;">${escapeHtml(PUBLIC_BASE_URL)}</a></p>
      </div>
    `;
}

export function supportNotificationEmail({ name, email, message, path, userAgent }) {
    const safeName = escapeHtml(name || 'Anonymous learner');
    const safeEmail = escapeHtml(email || 'Not provided');
    const safePath = escapeHtml(path || '/');
    const safeUserAgent = escapeHtml(userAgent || 'Unknown');
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

    return baseEmail({
        title: 'New Vietnamy support message',
        preview: `${name || email || 'Someone'} sent feedback from Vietnamy.`,
        body: `
          <div style="background:#fff7f4;border:1px solid #f4d2cb;border-radius:12px;padding:18px;margin:0 0 20px;">
            <p style="margin:0 0 8px;"><strong>Name:</strong> ${safeName}</p>
            <p style="margin:0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
            <p style="margin:0 0 8px;"><strong>Page:</strong> ${safePath}</p>
            <p style="margin:0;"><strong>User agent:</strong> ${safeUserAgent}</p>
          </div>
          <p style="white-space:normal;margin:0;">${safeMessage}</p>
        `,
    });
}

export function waitlistNotificationEmail({ name, email, nativeLang, goal }) {
    const safeName = escapeHtml(name || 'Learner');
    const safeEmail = escapeHtml(email);
    const safeNativeLang = escapeHtml(nativeLang || 'Not provided');
    const safeGoal = escapeHtml(goal || 'Not provided').replace(/\n/g, '<br>');

    return baseEmail({
        title: 'New Vietnamy waitlist signup',
        preview: `${email} joined the Vietnamy waitlist.`,
        body: `
          <div style="background:#fff7f4;border:1px solid #f4d2cb;border-radius:12px;padding:18px;">
            <p style="margin:0 0 8px;"><strong>Name:</strong> ${safeName}</p>
            <p style="margin:0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
            <p style="margin:0 0 8px;"><strong>Native language:</strong> ${safeNativeLang}</p>
            <p style="margin:0;"><strong>Goal:</strong> ${safeGoal}</p>
          </div>
        `,
    });
}

export function waitlistConfirmationEmail({ name }) {
    const safeName = escapeHtml(name || 'there');
    return baseEmail({
        title: 'You are on the Vietnamy list',
        preview: 'Thanks for joining Vietnamy.',
        body: `
          <p style="margin:0 0 14px;">Hi ${safeName},</p>
          <p style="margin:0 0 14px;">Thanks for joining Vietnamy. We will send useful updates only when there is something worth your attention.</p>
          <p style="margin:0;">In the meantime, you can keep learning Vietnamese in the app.</p>
        `,
        cta: { href: PUBLIC_BASE_URL, label: 'Open Vietnamy' },
    });
}

export function lessonReminderEmail({ name, lessonTitle, url }) {
    const safeName = escapeHtml(name || 'there');
    const safeLesson = escapeHtml(lessonTitle || 'your next lesson');
    return baseEmail({
        title: 'Your Vietnamese lesson is ready',
        preview: `Continue ${lessonTitle || 'your Vietnamy lesson'}.`,
        body: `
          <p style="margin:0 0 14px;">Hi ${safeName},</p>
          <p style="margin:0;">A short review is ready: <strong>${safeLesson}</strong>.</p>
        `,
        cta: { href: url || `${PUBLIC_BASE_URL}/study`, label: 'Continue Lesson' },
    });
}
