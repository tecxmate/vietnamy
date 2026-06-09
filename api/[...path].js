import crypto from 'crypto';
import express from 'express';
import {
    getMessageScenario,
    listMessageScenarios,
    renderEngagementMessage,
} from '../server/engagementMessages.js';
import {
    buildTrackingUrls,
    createMessageInstanceId,
    getMessageEngagementStats,
    recordMessageEvent,
    selectMessageVariant,
} from '../server/engagementOptimizer.js';
import {
    checkMailRateLimit,
    clampText,
    EMAIL_ENABLED,
    EMAIL_FROM,
    getEmailStats,
    lessonReminderEmail,
    normalizeEmail,
    PUBLIC_BASE_URL,
    sendMail,
    supportNotificationEmail,
    SUPPORT_EMAIL,
    waitlistConfirmationEmail,
    waitlistNotificationEmail,
} from '../server/mail.js';
import {
    createFeedbackReport,
    createNotification,
    getFeedbackStats as getStoredFeedbackStats,
    getPushStats as getStoredPushStats,
    listNotifications,
    markNotificationsRead,
    recordPushEvent,
} from '../server/opsStore.js';

const app = express();

app.use(express.json({ limit: '1mb' }));

const MAIL_ADMIN_TOKEN = process.env.MAIL_ADMIN_TOKEN || '';
const MAIL_ADMIN_ALLOW_LOCAL = process.env.MAIL_ADMIN_ALLOW_LOCAL === 'true';
const LEGACY_PUSH_SCENARIOS = {
    daily_review: 'daily_review_due',
    streak_reminder: 'streak_rescue',
    new_lesson: 'new_lesson_available',
};

function isLocalRequest(req) {
    const ip = req.ip || req.socket?.remoteAddress || '';
    return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip);
}

function requireMailAdmin(req, res) {
    if (!MAIL_ADMIN_TOKEN && MAIL_ADMIN_ALLOW_LOCAL && isLocalRequest(req)) return true;
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.get('x-admin-token');
    if (MAIL_ADMIN_TOKEN && token === MAIL_ADMIN_TOKEN) return true;
    res.status(401).json({ error: 'admin token required' });
    return false;
}

function compactMetadata(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
        Object.entries(value)
            .slice(0, 30)
            .map(([key, val]) => [clampText(key, 80), clampText(typeof val === 'string' ? val : JSON.stringify(val), 500)])
    );
}

function compactClientLogs(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(-20).map(item => {
        if (!item || typeof item !== 'object') return null;
        return {
            at: clampText(item.at, 80),
            level: clampText(item.level, 20),
            message: clampText(item.message, 500),
            source: clampText(item.source, 120),
        };
    }).filter(Boolean);
}

function safeRedirectUrl(rawUrl) {
    const fallback = `${PUBLIC_BASE_URL}/`;
    if (!rawUrl) return fallback;
    try {
        const url = new URL(String(rawUrl), PUBLIC_BASE_URL);
        if (!['http:', 'https:'].includes(url.protocol)) return fallback;
        return url.toString();
    } catch {
        return fallback;
    }
}

app.get('/api/mail/config', async (_req, res) => {
    res.json({
        enabled: EMAIL_ENABLED,
        from: EMAIL_FROM,
        supportEmail: SUPPORT_EMAIL,
    });
});

app.get('/api/mail/stats', async (req, res) => {
    if (!requireMailAdmin(req, res)) return;
    res.json(await getEmailStats());
});

app.post('/api/mail/support', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const name = clampText(req.body?.name, 120);
    const message = clampText(req.body?.message, 4000);
    if (!email || !message) return res.status(400).json({ error: 'email and message are required' });
    const rate = checkMailRateLimit(`support:${email}`, { max: 3, windowMs: 60 * 60 * 1000 });
    if (!rate.ok) return res.status(429).json({ error: 'too many support messages', resetAt: rate.resetAt });
    const html = supportNotificationEmail({ name, email, message, pathname: clampText(req.body?.pathname, 240) });
    await sendMail({
        type: 'support_notification',
        to: SUPPORT_EMAIL,
        subject: `Vietnamy support: ${name || email}`,
        html,
        text: message,
        replyTo: email,
    });
    res.json({ ok: true });
});

app.post('/api/mail/waitlist', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const name = clampText(req.body?.name, 120);
    if (!email) return res.status(400).json({ error: 'valid email is required' });
    const rate = checkMailRateLimit(`waitlist:${email}`, { max: 2, windowMs: 24 * 60 * 60 * 1000 });
    if (!rate.ok) return res.status(429).json({ error: 'too many waitlist requests', resetAt: rate.resetAt });
    await sendMail({
        type: 'waitlist_confirmation',
        to: email,
        subject: 'You are on the Vietnamy list',
        html: waitlistConfirmationEmail({ name }),
    });
    await sendMail({
        type: 'waitlist_notification',
        to: SUPPORT_EMAIL,
        subject: `Vietnamy waitlist: ${email}`,
        html: waitlistNotificationEmail({ name, email }),
        replyTo: email,
    });
    res.json({ ok: true });
});

app.post('/api/mail/lesson-reminder', async (req, res) => {
    if (!requireMailAdmin(req, res)) return;
    const to = normalizeEmail(req.body?.to);
    if (!to) return res.status(400).json({ error: 'valid recipient email is required' });
    const result = await sendMail({
        type: 'lesson_reminder',
        to,
        subject: clampText(req.body?.subject, 160) || 'Vietnamy lesson reminder',
        html: lessonReminderEmail(req.body || {}),
    });
    res.status(result.ok ? 200 : 502).json(result);
});

app.post('/api/feedback', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const userId = clampText(req.body?.userId, 160) || email || 'anonymous';
    const report = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        status: 'open',
        kind: clampText(req.body?.kind || 'bug', 40),
        severity: clampText(req.body?.severity || 'med', 40),
        subject: clampText(req.body?.subject || 'Feedback', 240),
        body: clampText(req.body?.body || req.body?.message || '', 6000),
        name: clampText(req.body?.name, 120),
        email,
        userId,
        pathname: clampText(req.body?.pathname || '/', 240),
        viewport: clampText(req.body?.viewport, 80),
        screenshotUrl: clampText(req.body?.screenshotUrl, 1000),
        userAgent: clampText(req.get('user-agent'), 500),
        appVersion: clampText(req.body?.appVersion || process.env.VERCEL_GIT_COMMIT_SHA || 'prod', 120),
        clientLogs: compactClientLogs(req.body?.clientLogs),
        metadata: compactMetadata(req.body?.metadata),
    };
    if (!report.body && !report.subject) return res.status(400).json({ error: 'feedback body is required' });
    await createFeedbackReport(report);
    res.json({ ok: true, id: report.id });
});

app.get('/api/admin/feedback', async (req, res) => {
    if (!requireMailAdmin(req, res)) return;
    res.json(await getStoredFeedbackStats());
});

app.get('/api/messages/scenarios', (_req, res) => {
    res.json({ scenarios: listMessageScenarios() });
});

app.get('/api/messages/stats', async (req, res) => {
    if (!requireMailAdmin(req, res)) return;
    res.json(await getMessageEngagementStats({
        scenarioId: req.query.scenarioId || undefined,
        channel: req.query.channel || undefined,
    }));
});

app.post('/api/messages/render', async (req, res) => {
    if (!requireMailAdmin(req, res)) return;
    const scenarioId = clampText(req.body?.scenarioId, 120);
    const channel = clampText(req.body?.channel || 'email', 40);
    const context = req.body?.context && typeof req.body.context === 'object' ? req.body.context : {};
    const variant = await selectMessageVariant(scenarioId, channel, {
        userId: clampText(req.body?.userId, 160),
        forceVariantId: clampText(req.body?.variantId, 80),
    });
    if (!variant) return res.status(404).json({ error: 'scenario or channel not found' });
    const rendered = renderEngagementMessage(scenarioId, { channel, variantId: variant.id, context });
    if (!rendered) return res.status(404).json({ error: 'message could not be rendered' });
    await recordMessageEvent({
        scenarioId,
        channel,
        variantId: rendered.variantId,
        event: 'rendered',
        userId: clampText(req.body?.userId, 160),
    });
    res.json({ ok: true, message: rendered });
});

app.post('/api/messages/send-in-app', async (req, res) => {
    if (!requireMailAdmin(req, res)) return;
    const scenarioId = clampText(req.body?.scenarioId, 120);
    const recipientId = clampText(req.body?.userId || req.body?.recipientId, 160) || 'anonymous';
    const recipientEmail = normalizeEmail(req.body?.recipientEmail);
    const context = req.body?.context && typeof req.body.context === 'object' ? req.body.context : {};
    if (!getMessageScenario(scenarioId)) return res.status(404).json({ error: 'scenario not found' });
    const variant = await selectMessageVariant(scenarioId, 'inApp', {
        userId: recipientId,
        forceVariantId: clampText(req.body?.variantId, 80),
    });
    if (!variant) return res.status(404).json({ error: 'in-app variant not found' });
    const rendered = renderEngagementMessage(scenarioId, { channel: 'inApp', variantId: variant.id, context });
    const notificationId = await createNotification({
        recipientId,
        recipientEmail,
        type: scenarioId,
        title: rendered.title,
        message: rendered.body,
        url: rendered.url || '/',
        metadata: {
            scenarioId,
            variantId: variant.id,
            context: compactMetadata(context),
        },
    });
    await recordMessageEvent({
        messageInstanceId: notificationId,
        scenarioId,
        channel: 'inApp',
        variantId: rendered.variantId,
        event: 'sent',
        userId: recipientId,
    });
    res.json({ ok: true, notificationId, scenarioId, variantId: rendered.variantId });
});

app.post('/api/messages/events', async (req, res) => {
    const entry = await recordMessageEvent({
        messageInstanceId: clampText(req.body?.messageInstanceId, 120),
        scenarioId: clampText(req.body?.scenarioId, 120),
        variantId: clampText(req.body?.variantId, 80),
        channel: clampText(req.body?.channel, 40),
        event: clampText(req.body?.event, 40),
        userId: clampText(req.body?.userId, 160),
        metadata: compactMetadata(req.body?.metadata),
    });
    res.json({ ok: true, event: entry.event });
});

app.get('/api/notifications', async (req, res) => {
    const recipientId = clampText(req.query.userId || req.query.recipientId, 160) || 'anonymous';
    res.json(await listNotifications({
        recipientId,
        unreadOnly: req.query.unread === 'true',
        limit: Number(req.query.limit || 20),
    }));
});

app.put('/api/notifications', async (req, res) => {
    const recipientId = clampText(req.body?.userId || req.body?.recipientId, 160) || 'anonymous';
    const ids = Array.isArray(req.body?.notificationIds) ? req.body.notificationIds : [];
    await markNotificationsRead({
        recipientId,
        ids,
        markAllRead: Boolean(req.body?.markAllRead),
    });
    res.json({ ok: true });
});

app.post('/api/admin/notifications', async (req, res) => {
    if (!requireMailAdmin(req, res)) return;
    const recipientId = clampText(req.body?.userId || req.body?.recipientId, 160) || 'anonymous';
    const notificationId = await createNotification({
        recipientId,
        recipientEmail: normalizeEmail(req.body?.recipientEmail),
        type: clampText(req.body?.type || 'system', 80),
        title: clampText(req.body?.title, 180),
        message: clampText(req.body?.message, 1200),
        url: clampText(req.body?.url || '/', 500),
        metadata: compactMetadata(req.body?.metadata),
    });
    res.json({ ok: true, notificationId });
});

app.get('/api/messages/open', async (req, res) => {
    await recordMessageEvent({
        messageInstanceId: clampText(req.query.m, 120),
        scenarioId: clampText(req.query.s, 120),
        variantId: clampText(req.query.v, 80),
        channel: clampText(req.query.c || 'email', 40),
        event: 'opened',
    });
    res.set('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64'));
});

app.get('/api/messages/click', async (req, res) => {
    const url = safeRedirectUrl(req.query.url);
    await recordMessageEvent({
        messageInstanceId: clampText(req.query.m, 120),
        scenarioId: clampText(req.query.s, 120),
        variantId: clampText(req.query.v, 80),
        channel: clampText(req.query.c || 'email', 40),
        event: 'clicked',
        metadata: { url },
    });
    res.redirect(302, url);
});

app.post('/api/push/events', async (req, res) => {
    const {
        type,
        notificationId = '',
        templateId = '',
        scenarioId = '',
        variantId = '',
        subscriptionId = '',
        userId = 'anonymous',
        metadata = {},
    } = req.body || {};
    const normalizedScenarioId = scenarioId || LEGACY_PUSH_SCENARIOS[templateId] || templateId;
    await recordPushEvent({
        type: clampText(type, 40),
        notificationId: clampText(notificationId, 120),
        templateId: clampText(templateId, 120),
        scenarioId: clampText(normalizedScenarioId, 120),
        variantId: clampText(variantId, 80),
        subscriptionId: clampText(subscriptionId, 180),
        userId: clampText(userId, 160) || 'anonymous',
        metadata: compactMetadata(metadata),
        at: new Date().toISOString(),
    });
    res.json({ ok: true });
});

app.get('/api/push/stats', async (req, res) => {
    if (!requireMailAdmin(req, res)) return;
    res.json(await getStoredPushStats());
});

export default app;
