import crypto from 'crypto';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OPS_DB_PATH = process.env.APP_OPS_DB_PATH || join(__dirname, 'databases', 'app_ops.db');

let opsDb = null;

function nowIso() {
    return new Date().toISOString();
}

function jsonString(value) {
    if (value == null) return '{}';
    try {
        return JSON.stringify(value);
    } catch {
        return '{}';
    }
}

function parseJson(value, fallback = {}) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function boolInt(value) {
    return value ? 1 : 0;
}

export function getOpsDb() {
    if (opsDb) return opsDb;
    mkdirSync(dirname(OPS_DB_PATH), { recursive: true });
    const existed = existsSync(OPS_DB_PATH);
    opsDb = new Database(OPS_DB_PATH);
    opsDb.pragma('journal_mode = WAL');
    opsDb.pragma('foreign_keys = ON');
    initOpsSchema(opsDb);
    if (!existed) {
        console.log(`App ops DB ready at ${OPS_DB_PATH}`);
    }
    return opsDb;
}

function initOpsSchema(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS email_logs (
            id TEXT PRIMARY KEY,
            at TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'generic',
            recipient_email TEXT NOT NULL DEFAULT '',
            subject TEXT NOT NULL DEFAULT '',
            success INTEGER NOT NULL DEFAULT 0,
            skipped INTEGER NOT NULL DEFAULT 0,
            provider_id TEXT,
            error_message TEXT
        );

        CREATE INDEX IF NOT EXISTS email_logs_at_idx ON email_logs(at);
        CREATE INDEX IF NOT EXISTS email_logs_type_idx ON email_logs(type);

        CREATE TABLE IF NOT EXISTS message_events (
            id TEXT PRIMARY KEY,
            at TEXT NOT NULL,
            message_instance_id TEXT,
            scenario_id TEXT NOT NULL DEFAULT '',
            variant_id TEXT NOT NULL DEFAULT '',
            channel TEXT NOT NULL DEFAULT '',
            event TEXT NOT NULL DEFAULT 'rendered',
            user_id TEXT,
            metadata_json TEXT NOT NULL DEFAULT '{}'
        );

        CREATE INDEX IF NOT EXISTS message_events_lookup_idx
            ON message_events(scenario_id, channel, variant_id, event);
        CREATE INDEX IF NOT EXISTS message_events_at_idx ON message_events(at);

        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'anonymous',
            user_name TEXT NOT NULL DEFAULT '',
            platform TEXT NOT NULL DEFAULT 'web',
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            subscription_json TEXT NOT NULL,
            active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            sent INTEGER NOT NULL DEFAULT 0,
            clicked INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx
            ON push_subscriptions(user_id, active);

        CREATE TABLE IF NOT EXISTS push_events (
            id TEXT PRIMARY KEY,
            at TEXT NOT NULL,
            type TEXT NOT NULL,
            notification_id TEXT NOT NULL DEFAULT '',
            template_id TEXT NOT NULL DEFAULT '',
            scenario_id TEXT NOT NULL DEFAULT '',
            variant_id TEXT NOT NULL DEFAULT '',
            subscription_id TEXT NOT NULL DEFAULT '',
            user_id TEXT NOT NULL DEFAULT 'anonymous',
            metadata_json TEXT NOT NULL DEFAULT '{}'
        );

        CREATE INDEX IF NOT EXISTS push_events_template_idx
            ON push_events(template_id, scenario_id, type);

        CREATE TABLE IF NOT EXISTS feedback_reports (
            id TEXT PRIMARY KEY,
            at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            kind TEXT NOT NULL DEFAULT 'bug',
            severity TEXT NOT NULL DEFAULT 'med',
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            name TEXT NOT NULL DEFAULT '',
            email TEXT NOT NULL DEFAULT '',
            user_id TEXT NOT NULL DEFAULT 'anonymous',
            pathname TEXT NOT NULL DEFAULT '/',
            viewport TEXT NOT NULL DEFAULT '',
            screenshot_url TEXT NOT NULL DEFAULT '',
            user_agent TEXT NOT NULL DEFAULT '',
            app_version TEXT NOT NULL DEFAULT 'dev',
            client_logs_json TEXT NOT NULL DEFAULT '[]',
            metadata_json TEXT NOT NULL DEFAULT '{}'
        );

        CREATE INDEX IF NOT EXISTS feedback_reports_status_idx
            ON feedback_reports(status, severity, at);

        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            at TEXT NOT NULL,
            recipient_id TEXT NOT NULL DEFAULT 'anonymous',
            recipient_email TEXT NOT NULL DEFAULT '',
            type TEXT NOT NULL DEFAULT 'system',
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            url TEXT NOT NULL DEFAULT '/',
            read INTEGER NOT NULL DEFAULT 0,
            metadata_json TEXT NOT NULL DEFAULT '{}'
        );

        CREATE INDEX IF NOT EXISTS notifications_recipient_idx
            ON notifications(recipient_id, read, at);
    `);
}

export function recordEmailLog(entry = {}) {
    const db = getOpsDb();
    const id = entry.id || crypto.randomUUID();
    db.prepare(`
        INSERT OR REPLACE INTO email_logs
            (id, at, type, recipient_email, subject, success, skipped, provider_id, error_message)
        VALUES
            (@id, @at, @type, @recipientEmail, @subject, @success, @skipped, @providerId, @errorMessage)
    `).run({
        id,
        at: entry.at || nowIso(),
        type: entry.type || 'generic',
        recipientEmail: entry.to || entry.recipientEmail || '',
        subject: entry.subject || '',
        success: boolInt(entry.success),
        skipped: boolInt(entry.skipped),
        providerId: entry.providerId || null,
        errorMessage: entry.errorMessage || null,
    });
    return id;
}

export function getEmailLogStats() {
    const db = getOpsDb();
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const rows = db.prepare(`
        SELECT type, success, skipped, COUNT(*) AS count
        FROM email_logs
        GROUP BY type, success, skipped
    `).all();
    const byType = {};
    for (const row of rows) {
        byType[row.type] ||= { sent: 0, failed: 0, skipped: 0 };
        if (row.skipped) byType[row.type].skipped += row.count;
        else if (row.success) byType[row.type].sent += row.count;
        else byType[row.type].failed += row.count;
    }

    const countWhere = (where) => db.prepare(`SELECT COUNT(*) AS count FROM email_logs WHERE ${where}`).get().count;
    const recent = db.prepare(`
        SELECT id, at, type, recipient_email AS to, subject, success, skipped, provider_id AS providerId, error_message AS errorMessage
        FROM email_logs
        ORDER BY at DESC
        LIMIT 25
    `).all().map(row => ({
        ...row,
        success: Boolean(row.success),
        skipped: Boolean(row.skipped),
    }));

    return {
        today: {
            sent: countWhere(`at >= '${todayStart}' AND success = 1 AND skipped = 0`),
            failed: countWhere(`at >= '${todayStart}' AND success = 0 AND skipped = 0`),
        },
        month: {
            sent: countWhere(`at >= '${monthStart}' AND success = 1 AND skipped = 0`),
            failed: countWhere(`at >= '${monthStart}' AND success = 0 AND skipped = 0`),
        },
        totalLogged: countWhere('1 = 1'),
        byType,
        recent,
    };
}

export function recordMessageEvent(entry = {}) {
    const db = getOpsDb();
    const id = entry.id || crypto.randomUUID();
    db.prepare(`
        INSERT OR REPLACE INTO message_events
            (id, at, message_instance_id, scenario_id, variant_id, channel, event, user_id, metadata_json)
        VALUES
            (@id, @at, @messageInstanceId, @scenarioId, @variantId, @channel, @event, @userId, @metadataJson)
    `).run({
        id,
        at: entry.at || nowIso(),
        messageInstanceId: entry.messageInstanceId || null,
        scenarioId: entry.scenarioId || '',
        variantId: entry.variantId || '',
        channel: entry.channel || '',
        event: entry.event || 'rendered',
        userId: entry.userId || null,
        metadataJson: jsonString(entry.metadata),
    });
    return {
        id,
        at: entry.at || nowIso(),
        messageInstanceId: entry.messageInstanceId || null,
        scenarioId: entry.scenarioId || '',
        variantId: entry.variantId || '',
        channel: entry.channel || '',
        event: entry.event || 'rendered',
        userId: entry.userId || null,
        metadata: entry.metadata || {},
    };
}

export function listMessageEvents({ scenarioId, channel } = {}) {
    const db = getOpsDb();
    const clauses = [];
    const params = {};
    if (scenarioId) {
        clauses.push('scenario_id = @scenarioId');
        params.scenarioId = scenarioId;
    }
    if (channel) {
        clauses.push('channel = @channel');
        params.channel = channel;
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return db.prepare(`
        SELECT id, at, message_instance_id AS messageInstanceId, scenario_id AS scenarioId,
               variant_id AS variantId, channel, event, user_id AS userId, metadata_json AS metadataJson
        FROM message_events
        ${where}
        ORDER BY at ASC
    `).all(params).map(row => ({
        ...row,
        metadata: parseJson(row.metadataJson),
        metadataJson: undefined,
    }));
}

export function upsertPushSubscription({ id, userId, userName, platform, subscription } = {}) {
    const db = getOpsDb();
    const now = nowIso();
    const endpoint = subscription?.endpoint || '';
    const keys = subscription?.keys || {};
    const existing = db.prepare('SELECT created_at, sent, clicked FROM push_subscriptions WHERE id = ?').get(id);
    db.prepare(`
        INSERT INTO push_subscriptions
            (id, user_id, user_name, platform, endpoint, p256dh, auth, subscription_json, active, created_at, updated_at, sent, clicked)
        VALUES
            (@id, @userId, @userName, @platform, @endpoint, @p256dh, @auth, @subscriptionJson, 1, @createdAt, @updatedAt, @sent, @clicked)
        ON CONFLICT(id) DO UPDATE SET
            user_id = excluded.user_id,
            user_name = excluded.user_name,
            platform = excluded.platform,
            endpoint = excluded.endpoint,
            p256dh = excluded.p256dh,
            auth = excluded.auth,
            subscription_json = excluded.subscription_json,
            active = 1,
            updated_at = excluded.updated_at
    `).run({
        id,
        userId: userId || 'anonymous',
        userName: userName || '',
        platform: platform || 'web',
        endpoint,
        p256dh: keys.p256dh || '',
        auth: keys.auth || '',
        subscriptionJson: JSON.stringify(subscription || {}),
        createdAt: existing?.created_at || now,
        updatedAt: now,
        sent: existing?.sent || 0,
        clicked: existing?.clicked || 0,
    });
}

export function listPushSubscriptions({ userId, activeOnly = true } = {}) {
    const db = getOpsDb();
    const clauses = [];
    const params = {};
    if (activeOnly) clauses.push('active = 1');
    if (userId) {
        clauses.push('user_id = @userId');
        params.userId = userId;
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return db.prepare(`
        SELECT id, user_id AS userId, user_name AS userName, platform, subscription_json AS subscriptionJson,
               active, created_at AS createdAt, updated_at AS updatedAt, sent, clicked
        FROM push_subscriptions
        ${where}
        ORDER BY updated_at DESC
    `).all(params).map(row => ({
        ...row,
        active: Boolean(row.active),
        subscription: parseJson(row.subscriptionJson, {}),
        subscriptionJson: undefined,
    }));
}

export function updatePushSubscriptionStats(id, { sentDelta = 0, clickedDelta = 0, active } = {}) {
    const db = getOpsDb();
    const sets = ['updated_at = @updatedAt', 'sent = sent + @sentDelta', 'clicked = clicked + @clickedDelta'];
    const params = { id, updatedAt: nowIso(), sentDelta, clickedDelta };
    if (typeof active === 'boolean') {
        sets.push('active = @active');
        params.active = boolInt(active);
    }
    db.prepare(`UPDATE push_subscriptions SET ${sets.join(', ')} WHERE id = @id`).run(params);
}

export function recordPushEvent(entry = {}) {
    const db = getOpsDb();
    const id = entry.id || crypto.randomUUID();
    db.prepare(`
        INSERT OR REPLACE INTO push_events
            (id, at, type, notification_id, template_id, scenario_id, variant_id, subscription_id, user_id, metadata_json)
        VALUES
            (@id, @at, @type, @notificationId, @templateId, @scenarioId, @variantId, @subscriptionId, @userId, @metadataJson)
    `).run({
        id,
        at: entry.at || nowIso(),
        type: entry.type || '',
        notificationId: entry.notificationId || '',
        templateId: entry.templateId || '',
        scenarioId: entry.scenarioId || '',
        variantId: entry.variantId || '',
        subscriptionId: entry.subscriptionId || '',
        userId: entry.userId || 'anonymous',
        metadataJson: jsonString(entry.metadata),
    });
    return id;
}

export function getPushStats() {
    const db = getOpsDb();
    const activeSubscriptions = db.prepare('SELECT COUNT(*) AS count FROM push_subscriptions WHERE active = 1').get().count;
    const rows = db.prepare(`
        SELECT COALESCE(NULLIF(scenario_id, ''), NULLIF(template_id, ''), 'unknown') AS templateId,
               type,
               COUNT(*) AS count
        FROM push_events
        GROUP BY templateId, type
    `).all();
    const byTemplate = {};
    for (const row of rows) {
        byTemplate[row.templateId] ||= { templateId: row.templateId, sent: 0, clicked: 0, openedApp: 0 };
        if (row.type === 'sent') byTemplate[row.templateId].sent += row.count;
        if (row.type === 'clicked') byTemplate[row.templateId].clicked += row.count;
        if (row.type === 'opened_app') byTemplate[row.templateId].openedApp += row.count;
    }
    const templates = Object.values(byTemplate).map(item => ({
        ...item,
        clickRate: item.sent ? item.clicked / item.sent : 0,
        openRate: item.sent ? item.openedApp / item.sent : 0,
    })).sort((a, b) => b.openRate - a.openRate || b.clickRate - a.clickRate);
    return { subscriptions: activeSubscriptions, templates };
}

export function createFeedbackReport(report = {}) {
    const db = getOpsDb();
    const id = report.id || crypto.randomUUID();
    db.prepare(`
        INSERT OR REPLACE INTO feedback_reports
            (id, at, status, kind, severity, subject, body, name, email, user_id, pathname,
             viewport, screenshot_url, user_agent, app_version, client_logs_json, metadata_json)
        VALUES
            (@id, @at, @status, @kind, @severity, @subject, @body, @name, @email, @userId, @pathname,
             @viewport, @screenshotUrl, @userAgent, @appVersion, @clientLogsJson, @metadataJson)
    `).run({
        id,
        at: report.at || nowIso(),
        status: report.status || 'open',
        kind: report.kind || 'bug',
        severity: report.severity || 'med',
        subject: report.subject || '',
        body: report.body || '',
        name: report.name || '',
        email: report.email || '',
        userId: report.userId || 'anonymous',
        pathname: report.pathname || '/',
        viewport: report.viewport || '',
        screenshotUrl: report.screenshotUrl || '',
        userAgent: report.userAgent || '',
        appVersion: report.appVersion || 'dev',
        clientLogsJson: JSON.stringify(report.clientLogs || []),
        metadataJson: jsonString(report.metadata),
    });
    return id;
}

export function getFeedbackStats() {
    const db = getOpsDb();
    const reports = db.prepare(`
        SELECT id, at, status, kind, severity, subject, body, name, email, user_id AS userId,
               pathname, viewport, screenshot_url AS screenshotUrl, user_agent AS userAgent,
               app_version AS appVersion, client_logs_json AS clientLogsJson, metadata_json AS metadataJson
        FROM feedback_reports
        ORDER BY at DESC
        LIMIT 50
    `).all().map(row => ({
        ...row,
        clientLogs: parseJson(row.clientLogsJson, []),
        metadata: parseJson(row.metadataJson, {}),
        clientLogsJson: undefined,
        metadataJson: undefined,
    }));
    const grouped = (column) => Object.fromEntries(db.prepare(`
        SELECT ${column} AS key, COUNT(*) AS count
        FROM feedback_reports
        GROUP BY ${column}
    `).all().map(row => [row.key, row.count]));
    return {
        total: db.prepare('SELECT COUNT(*) AS count FROM feedback_reports').get().count,
        byKind: grouped('kind'),
        bySeverity: grouped('severity'),
        byStatus: grouped('status'),
        recent: reports,
    };
}

export function createNotification(notification = {}) {
    const db = getOpsDb();
    const id = notification.id || crypto.randomUUID();
    db.prepare(`
        INSERT OR REPLACE INTO notifications
            (id, at, recipient_id, recipient_email, type, title, message, url, read, metadata_json)
        VALUES
            (@id, @at, @recipientId, @recipientEmail, @type, @title, @message, @url, @read, @metadataJson)
    `).run({
        id,
        at: notification.at || nowIso(),
        recipientId: notification.recipientId || notification.userId || 'anonymous',
        recipientEmail: notification.recipientEmail || '',
        type: notification.type || 'system',
        title: notification.title || '',
        message: notification.message || '',
        url: notification.url || '/',
        read: boolInt(notification.read),
        metadataJson: jsonString(notification.metadata),
    });
    return id;
}

export function listNotifications({ recipientId = 'anonymous', unreadOnly = false, limit = 20 } = {}) {
    const db = getOpsDb();
    const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const conditions = ['recipient_id = @recipientId'];
    if (unreadOnly) conditions.push('read = 0');
    const notifications = db.prepare(`
        SELECT id, at, recipient_id AS recipientId, recipient_email AS recipientEmail, type,
               title, message, url, read, metadata_json AS metadataJson
        FROM notifications
        WHERE ${conditions.join(' AND ')}
        ORDER BY at DESC
        LIMIT @limit
    `).all({ recipientId, limit: cappedLimit }).map(row => ({
        ...row,
        read: Boolean(row.read),
        metadata: parseJson(row.metadataJson),
        metadataJson: undefined,
    }));
    const unreadCount = db.prepare(`
        SELECT COUNT(*) AS count
        FROM notifications
        WHERE recipient_id = @recipientId AND read = 0
    `).get({ recipientId }).count;
    return { notifications, unreadCount };
}

export function markNotificationsRead({ recipientId = 'anonymous', ids = [], markAllRead = false } = {}) {
    const db = getOpsDb();
    if (markAllRead) {
        db.prepare('UPDATE notifications SET read = 1 WHERE recipient_id = ?').run(recipientId);
        return;
    }
    const filtered = ids.filter(id => typeof id === 'string' && id);
    const stmt = db.prepare('UPDATE notifications SET read = 1 WHERE recipient_id = ? AND id = ?');
    const tx = db.transaction(() => {
        for (const id of filtered) stmt.run(recipientId, id);
    });
    tx();
}
