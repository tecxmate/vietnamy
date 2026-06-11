import crypto from 'crypto';
import { isNeonConfigured, neonQuery } from './neonDb.js';

function nowIso() {
    return new Date().toISOString();
}

function json(value, fallback = {}) {
    return value == null ? fallback : value;
}

function buildEmailStatsFromRows(rows) {
    const now = new Date();
    const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
    const byType = {};
    let sentToday = 0;
    let failedToday = 0;
    let sentMonth = 0;
    let failedMonth = 0;
    for (const row of rows) {
        const type = row.type || 'generic';
        byType[type] ||= { sent: 0, failed: 0, skipped: 0 };
        if (row.skipped) byType[type].skipped += 1;
        else if (row.success) byType[type].sent += 1;
        else byType[type].failed += 1;
        const t = Date.parse(row.at);
        if (!Number.isFinite(t)) continue;
        if (t >= todayStart) {
            if (row.success && !row.skipped) sentToday += 1;
            if (!row.success && !row.skipped) failedToday += 1;
        }
        if (t >= monthStart) {
            if (row.success && !row.skipped) sentMonth += 1;
            if (!row.success && !row.skipped) failedMonth += 1;
        }
    }
    return {
        today: { sent: sentToday, failed: failedToday },
        month: { sent: sentMonth, failed: failedMonth },
        totalLogged: rows.length,
        byType,
        recent: rows.slice(0, 25),
    };
}

function buildPushStatsFromRows(rows, activeSubscriptions) {
    const byTemplate = {};
    for (const row of rows) {
        const key = row.scenario_id || row.template_id || 'unknown';
        byTemplate[key] ||= { templateId: key, sent: 0, clicked: 0, openedApp: 0 };
        if (row.type === 'sent') byTemplate[key].sent += 1;
        if (row.type === 'clicked') byTemplate[key].clicked += 1;
        if (row.type === 'opened_app') byTemplate[key].openedApp += 1;
    }
    const templates = Object.values(byTemplate).map(item => ({
        ...item,
        clickRate: item.sent ? item.clicked / item.sent : 0,
        openRate: item.sent ? item.openedApp / item.sent : 0,
    })).sort((a, b) => b.openRate - a.openRate || b.clickRate - a.clickRate);
    return { subscriptions: activeSubscriptions, templates };
}

export function useNeonOpsStore(provider) {
    return provider === 'neon' && isNeonConfigured();
}

export async function recordEmailLog(entry = {}) {
    const id = entry.id || crypto.randomUUID();
    await neonQuery(
        `insert into email_logs (id, at, type, recipient_email, subject, success, skipped, provider_id, error_message)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         on conflict (id) do update set
            at = excluded.at,
            type = excluded.type,
            recipient_email = excluded.recipient_email,
            subject = excluded.subject,
            success = excluded.success,
            skipped = excluded.skipped,
            provider_id = excluded.provider_id,
            error_message = excluded.error_message`,
        [
            id,
            entry.at || nowIso(),
            entry.type || 'generic',
            entry.to || entry.recipientEmail || '',
            entry.subject || '',
            Boolean(entry.success),
            Boolean(entry.skipped),
            entry.providerId || null,
            entry.errorMessage || null,
        ]
    );
    return id;
}

export async function getEmailLogStats() {
    const rows = await neonQuery(
        `select id, at, type, recipient_email, subject, success, skipped, provider_id, error_message
         from email_logs
         order by at desc
         limit 5000`
    );
    return buildEmailStatsFromRows(rows.map(row => ({
        id: row.id,
        at: row.at,
        type: row.type,
        to: row.recipient_email,
        subject: row.subject,
        success: Boolean(row.success),
        skipped: Boolean(row.skipped),
        providerId: row.provider_id,
        errorMessage: row.error_message,
    })));
}

export async function recordMessageEvent(entry = {}) {
    const id = entry.id || crypto.randomUUID();
    const payload = {
        id,
        at: entry.at || nowIso(),
        messageInstanceId: entry.messageInstanceId || null,
        scenarioId: entry.scenarioId || '',
        variantId: entry.variantId || '',
        channel: entry.channel || '',
        event: entry.event || 'rendered',
        userId: entry.userId || null,
        metadata: json(entry.metadata),
    };
    await neonQuery(
        `insert into message_events (id, at, message_instance_id, scenario_id, variant_id, channel, event, user_id, metadata)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
         on conflict (id) do update set
            at = excluded.at,
            message_instance_id = excluded.message_instance_id,
            scenario_id = excluded.scenario_id,
            variant_id = excluded.variant_id,
            channel = excluded.channel,
            event = excluded.event,
            user_id = excluded.user_id,
            metadata = excluded.metadata`,
        [
            id,
            payload.at,
            payload.messageInstanceId,
            payload.scenarioId,
            payload.variantId,
            payload.channel,
            payload.event,
            payload.userId,
            JSON.stringify(payload.metadata),
        ]
    );
    return payload;
}

export async function listMessageEvents({ scenarioId, channel } = {}) {
    const clauses = [];
    const params = [];
    if (scenarioId) {
        params.push(scenarioId);
        clauses.push(`scenario_id = $${params.length}`);
    }
    if (channel) {
        params.push(channel);
        clauses.push(`channel = $${params.length}`);
    }
    const rows = await neonQuery(
        `select id, at, message_instance_id, scenario_id, variant_id, channel, event, user_id, metadata
         from message_events
         ${clauses.length ? `where ${clauses.join(' and ')}` : ''}
         order by at asc
         limit 20000`,
        params
    );
    return rows.map(row => ({
        id: row.id,
        at: row.at,
        messageInstanceId: row.message_instance_id,
        scenarioId: row.scenario_id,
        variantId: row.variant_id,
        channel: row.channel,
        event: row.event,
        userId: row.user_id,
        metadata: row.metadata || {},
    }));
}

export async function upsertPushSubscription({ id, userId, userName, platform, subscription } = {}) {
    const now = nowIso();
    const keys = subscription?.keys || {};
    await neonQuery(
        `insert into push_subscriptions (
            id, user_id, user_name, platform, endpoint, p256dh, auth, subscription, active, created_at, updated_at, sent, clicked
         ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, true, $9, $9, 0, 0)
         on conflict (id) do update set
            user_id = excluded.user_id,
            user_name = excluded.user_name,
            platform = excluded.platform,
            endpoint = excluded.endpoint,
            p256dh = excluded.p256dh,
            auth = excluded.auth,
            subscription = excluded.subscription,
            active = true,
            updated_at = excluded.updated_at`,
        [
            id,
            userId || 'anonymous',
            userName || '',
            platform || 'web',
            subscription?.endpoint || '',
            keys.p256dh || '',
            keys.auth || '',
            JSON.stringify(subscription || {}),
            now,
        ]
    );
}

export async function listPushSubscriptions({ userId, activeOnly = true } = {}) {
    const clauses = [];
    const params = [];
    if (activeOnly) clauses.push('active = true');
    if (userId) {
        params.push(userId);
        clauses.push(`user_id = $${params.length}`);
    }
    const rows = await neonQuery(
        `select id, user_id, user_name, platform, subscription, active, created_at, updated_at, sent, clicked
         from push_subscriptions
         ${clauses.length ? `where ${clauses.join(' and ')}` : ''}
         order by updated_at desc`,
        params
    );
    return rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        platform: row.platform,
        active: Boolean(row.active),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        sent: row.sent || 0,
        clicked: row.clicked || 0,
        subscription: row.subscription || {},
    }));
}

export async function updatePushSubscriptionStats(id, { sentDelta = 0, clickedDelta = 0, active } = {}) {
    await neonQuery(
        `update push_subscriptions
         set updated_at = now(),
             sent = sent + $2,
             clicked = clicked + $3,
             active = coalesce($4, active)
         where id = $1`,
        [id, sentDelta, clickedDelta, typeof active === 'boolean' ? active : null]
    );
}

export async function recordPushEvent(entry = {}) {
    const id = entry.id || crypto.randomUUID();
    await neonQuery(
        `insert into push_events (
            id, at, type, notification_id, template_id, scenario_id, variant_id, subscription_id, user_id, metadata
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
         on conflict (id) do update set
            at = excluded.at,
            type = excluded.type,
            notification_id = excluded.notification_id,
            template_id = excluded.template_id,
            scenario_id = excluded.scenario_id,
            variant_id = excluded.variant_id,
            subscription_id = excluded.subscription_id,
            user_id = excluded.user_id,
            metadata = excluded.metadata`,
        [
            id,
            entry.at || nowIso(),
            entry.type || '',
            entry.notificationId || '',
            entry.templateId || '',
            entry.scenarioId || '',
            entry.variantId || '',
            entry.subscriptionId || '',
            entry.userId || 'anonymous',
            JSON.stringify(json(entry.metadata)),
        ]
    );
    return id;
}

export async function getPushStats() {
    const countRows = await neonQuery("select count(*)::int as count from push_subscriptions where active = true");
    const rows = await neonQuery('select template_id, scenario_id, type from push_events limit 20000');
    return buildPushStatsFromRows(rows, countRows[0]?.count || 0);
}

export async function createFeedbackReport(report = {}) {
    const id = report.id || crypto.randomUUID();
    await neonQuery(
        `insert into feedback_reports (
            id, at, status, kind, severity, subject, body, name, email, user_id, pathname,
            viewport, screenshot_url, user_agent, app_version, client_logs, metadata
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17::jsonb)
         on conflict (id) do update set
            at = excluded.at,
            status = excluded.status,
            kind = excluded.kind,
            severity = excluded.severity,
            subject = excluded.subject,
            body = excluded.body,
            name = excluded.name,
            email = excluded.email,
            user_id = excluded.user_id,
            pathname = excluded.pathname,
            viewport = excluded.viewport,
            screenshot_url = excluded.screenshot_url,
            user_agent = excluded.user_agent,
            app_version = excluded.app_version,
            client_logs = excluded.client_logs,
            metadata = excluded.metadata`,
        [
            id,
            report.at || nowIso(),
            report.status || 'open',
            report.kind || 'bug',
            report.severity || 'med',
            report.subject || '',
            report.body || '',
            report.name || '',
            report.email || '',
            report.userId || 'anonymous',
            report.pathname || '/',
            report.viewport || '',
            report.screenshotUrl || '',
            report.userAgent || '',
            report.appVersion || 'dev',
            JSON.stringify(report.clientLogs || []),
            JSON.stringify(json(report.metadata)),
        ]
    );
    return id;
}

export async function getFeedbackStats() {
    const rows = await neonQuery(
        `select id, at, status, kind, severity, subject, body, name, email, user_id, pathname,
                viewport, screenshot_url, user_agent, app_version, client_logs, metadata
         from feedback_reports
         order by at desc
         limit 5000`
    );
    const byKind = {};
    const bySeverity = {};
    const byStatus = {};
    for (const row of rows) {
        byKind[row.kind] = (byKind[row.kind] || 0) + 1;
        bySeverity[row.severity] = (bySeverity[row.severity] || 0) + 1;
        byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    }
    return {
        total: rows.length,
        byKind,
        bySeverity,
        byStatus,
        recent: rows.slice(0, 50).map(row => ({
            id: row.id,
            at: row.at,
            status: row.status,
            kind: row.kind,
            severity: row.severity,
            subject: row.subject,
            body: row.body,
            name: row.name,
            email: row.email,
            userId: row.user_id,
            pathname: row.pathname,
            viewport: row.viewport,
            screenshotUrl: row.screenshot_url,
            userAgent: row.user_agent,
            appVersion: row.app_version,
            clientLogs: row.client_logs || [],
            metadata: row.metadata || {},
        })),
    };
}

export async function createNotification(notification = {}) {
    const id = notification.id || crypto.randomUUID();
    await neonQuery(
        `insert into notifications (
            id, at, recipient_id, recipient_email, type, title, message, url, read, metadata
         ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
         on conflict (id) do update set
            at = excluded.at,
            recipient_id = excluded.recipient_id,
            recipient_email = excluded.recipient_email,
            type = excluded.type,
            title = excluded.title,
            message = excluded.message,
            url = excluded.url,
            read = excluded.read,
            metadata = excluded.metadata`,
        [
            id,
            notification.at || nowIso(),
            notification.recipientId || notification.userId || 'anonymous',
            notification.recipientEmail || '',
            notification.type || 'system',
            notification.title || '',
            notification.message || '',
            notification.url || '/',
            Boolean(notification.read),
            JSON.stringify(json(notification.metadata)),
        ]
    );
    return id;
}

export async function listNotifications({ recipientId = 'anonymous', unreadOnly = false, limit = 20 } = {}) {
    const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const rows = await neonQuery(
        `select id, at, recipient_id, recipient_email, type, title, message, url, read, metadata
         from notifications
         where recipient_id = $1 and ($2::boolean = false or read = false)
         order by at desc
         limit $3`,
        [recipientId, Boolean(unreadOnly), cappedLimit]
    );
    const countRows = await neonQuery(
        'select count(*)::int as count from notifications where recipient_id = $1 and read = false',
        [recipientId]
    );
    return {
        notifications: rows.map(row => ({
            id: row.id,
            at: row.at,
            recipientId: row.recipient_id,
            recipientEmail: row.recipient_email,
            type: row.type,
            title: row.title,
            message: row.message,
            url: row.url,
            read: Boolean(row.read),
            metadata: row.metadata || {},
        })),
        unreadCount: countRows[0]?.count || 0,
    };
}

export async function markNotificationsRead({ recipientId = 'anonymous', ids = [], markAllRead = false } = {}) {
    if (markAllRead) {
        await neonQuery('update notifications set read = true where recipient_id = $1', [recipientId]);
        return;
    }
    const filtered = ids.filter(id => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id));
    if (!filtered.length) return;
    await neonQuery(
        'update notifications set read = true where recipient_id = $1 and id = any($2::uuid[])',
        [recipientId, filtered]
    );
}
