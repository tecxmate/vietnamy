import crypto from 'crypto';
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OPS_DB_PATH = process.env.APP_OPS_DB_PATH || join(__dirname, 'databases', 'app_ops.db');
const OPS_STORE_PROVIDER = (process.env.OPS_STORE_PROVIDER || 'sqlite').toLowerCase();
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

let opsDb = null;
let supabaseOps = null;

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

function useSupabaseOps() {
    return OPS_STORE_PROVIDER === 'supabase' && Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseOps() {
    if (!useSupabaseOps()) return null;
    if (!supabaseOps) {
        supabaseOps = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
        console.log('App ops store using Supabase');
    }
    return supabaseOps;
}

function logSupabaseError(action, error) {
    if (error) console.warn(`Supabase ops ${action} failed:`, error.message || error);
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

export async function recordEmailLog(entry = {}) {
    const supabase = getSupabaseOps();
    if (supabase) {
        const id = entry.id || crypto.randomUUID();
        const { error } = await supabase.from('email_logs').upsert({
            id,
            at: entry.at || nowIso(),
            type: entry.type || 'generic',
            recipient_email: entry.to || entry.recipientEmail || '',
            subject: entry.subject || '',
            success: Boolean(entry.success),
            skipped: Boolean(entry.skipped),
            provider_id: entry.providerId || null,
            error_message: entry.errorMessage || null,
        }, { onConflict: 'id' });
        logSupabaseError('recordEmailLog', error);
        return id;
    }

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

export async function getEmailLogStats() {
    const supabase = getSupabaseOps();
    if (supabase) {
        const { data: rows = [], error } = await supabase
            .from('email_logs')
            .select('id, at, type, recipient_email, subject, success, skipped, provider_id, error_message')
            .order('at', { ascending: false })
            .limit(5000);
        logSupabaseError('getEmailLogStats', error);
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
        SELECT id, at, type, recipient_email AS recipientEmail, subject, success, skipped, provider_id AS providerId, error_message AS errorMessage
        FROM email_logs
        ORDER BY at DESC
        LIMIT 25
    `).all().map(row => ({
        id: row.id,
        at: row.at,
        type: row.type,
        to: row.recipientEmail,
        subject: row.subject,
        success: Boolean(row.success),
        skipped: Boolean(row.skipped),
        providerId: row.providerId,
        errorMessage: row.errorMessage,
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

export async function recordMessageEvent(entry = {}) {
    const supabase = getSupabaseOps();
    if (supabase) {
        const id = entry.id || crypto.randomUUID();
        const payload = {
            id,
            at: entry.at || nowIso(),
            message_instance_id: entry.messageInstanceId || null,
            scenario_id: entry.scenarioId || '',
            variant_id: entry.variantId || '',
            channel: entry.channel || '',
            event: entry.event || 'rendered',
            user_id: entry.userId || null,
            metadata: entry.metadata || {},
        };
        const { error } = await supabase.from('message_events').upsert(payload, { onConflict: 'id' });
        logSupabaseError('recordMessageEvent', error);
        return {
            id,
            at: payload.at,
            messageInstanceId: payload.message_instance_id,
            scenarioId: payload.scenario_id,
            variantId: payload.variant_id,
            channel: payload.channel,
            event: payload.event,
            userId: payload.user_id,
            metadata: payload.metadata,
        };
    }

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

export async function listMessageEvents({ scenarioId, channel } = {}) {
    const supabase = getSupabaseOps();
    if (supabase) {
        let query = supabase
            .from('message_events')
            .select('id, at, message_instance_id, scenario_id, variant_id, channel, event, user_id, metadata')
            .order('at', { ascending: true })
            .limit(20000);
        if (scenarioId) query = query.eq('scenario_id', scenarioId);
        if (channel) query = query.eq('channel', channel);
        const { data = [], error } = await query;
        logSupabaseError('listMessageEvents', error);
        return data.map(row => ({
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

export async function upsertPushSubscription({ id, userId, userName, platform, subscription } = {}) {
    const supabase = getSupabaseOps();
    if (supabase) {
        const now = nowIso();
        const keys = subscription?.keys || {};
        const { data: existing } = await supabase
            .from('push_subscriptions')
            .select('created_at, sent, clicked')
            .eq('id', id)
            .maybeSingle();
        const { error } = await supabase.from('push_subscriptions').upsert({
            id,
            user_id: userId || 'anonymous',
            user_name: userName || '',
            platform: platform || 'web',
            endpoint: subscription?.endpoint || '',
            p256dh: keys.p256dh || '',
            auth: keys.auth || '',
            subscription: subscription || {},
            active: true,
            created_at: existing?.created_at || now,
            updated_at: now,
            sent: existing?.sent || 0,
            clicked: existing?.clicked || 0,
        }, { onConflict: 'id' });
        logSupabaseError('upsertPushSubscription', error);
        return;
    }

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

export async function listPushSubscriptions({ userId, activeOnly = true } = {}) {
    const supabase = getSupabaseOps();
    if (supabase) {
        let query = supabase
            .from('push_subscriptions')
            .select('id, user_id, user_name, platform, subscription, active, created_at, updated_at, sent, clicked')
            .order('updated_at', { ascending: false });
        if (activeOnly) query = query.eq('active', true);
        if (userId) query = query.eq('user_id', userId);
        const { data = [], error } = await query;
        logSupabaseError('listPushSubscriptions', error);
        return data.map(row => ({
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

export async function updatePushSubscriptionStats(id, { sentDelta = 0, clickedDelta = 0, active } = {}) {
    const supabase = getSupabaseOps();
    if (supabase) {
        const { data: existing, error: readError } = await supabase
            .from('push_subscriptions')
            .select('sent, clicked, active')
            .eq('id', id)
            .maybeSingle();
        logSupabaseError('updatePushSubscriptionStats/read', readError);
        if (!existing) return;
        const payload = {
            updated_at: nowIso(),
            sent: (existing.sent || 0) + sentDelta,
            clicked: (existing.clicked || 0) + clickedDelta,
        };
        if (typeof active === 'boolean') payload.active = active;
        const { error } = await supabase
            .from('push_subscriptions')
            .update(payload)
            .eq('id', id);
        logSupabaseError('updatePushSubscriptionStats', error);
        return;
    }

    const db = getOpsDb();
    const sets = ['updated_at = @updatedAt', 'sent = sent + @sentDelta', 'clicked = clicked + @clickedDelta'];
    const params = { id, updatedAt: nowIso(), sentDelta, clickedDelta };
    if (typeof active === 'boolean') {
        sets.push('active = @active');
        params.active = boolInt(active);
    }
    db.prepare(`UPDATE push_subscriptions SET ${sets.join(', ')} WHERE id = @id`).run(params);
}

export async function recordPushEvent(entry = {}) {
    const supabase = getSupabaseOps();
    if (supabase) {
        const id = entry.id || crypto.randomUUID();
        const { error } = await supabase.from('push_events').upsert({
            id,
            at: entry.at || nowIso(),
            type: entry.type || '',
            notification_id: entry.notificationId || '',
            template_id: entry.templateId || '',
            scenario_id: entry.scenarioId || '',
            variant_id: entry.variantId || '',
            subscription_id: entry.subscriptionId || '',
            user_id: entry.userId || 'anonymous',
            metadata: entry.metadata || {},
        }, { onConflict: 'id' });
        logSupabaseError('recordPushEvent', error);
        return id;
    }

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

export async function getPushStats() {
    const supabase = getSupabaseOps();
    if (supabase) {
        const { count: activeSubscriptions, error: countError } = await supabase
            .from('push_subscriptions')
            .select('id', { count: 'exact', head: true })
            .eq('active', true);
        logSupabaseError('getPushStats/count', countError);
        const { data: rows = [], error } = await supabase
            .from('push_events')
            .select('template_id, scenario_id, type')
            .limit(20000);
        logSupabaseError('getPushStats/events', error);
        return buildPushStatsFromRows(rows, activeSubscriptions || 0);
    }

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

export async function createFeedbackReport(report = {}) {
    const supabase = getSupabaseOps();
    if (supabase) {
        const id = report.id || crypto.randomUUID();
        const { error } = await supabase.from('feedback_reports').upsert({
            id,
            at: report.at || nowIso(),
            status: report.status || 'open',
            kind: report.kind || 'bug',
            severity: report.severity || 'med',
            subject: report.subject || '',
            body: report.body || '',
            name: report.name || '',
            email: report.email || '',
            user_id: report.userId || 'anonymous',
            pathname: report.pathname || '/',
            viewport: report.viewport || '',
            screenshot_url: report.screenshotUrl || '',
            user_agent: report.userAgent || '',
            app_version: report.appVersion || 'dev',
            client_logs: report.clientLogs || [],
            metadata: report.metadata || {},
        }, { onConflict: 'id' });
        logSupabaseError('createFeedbackReport', error);
        return id;
    }

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

export async function getFeedbackStats() {
    const supabase = getSupabaseOps();
    if (supabase) {
        const { data: rows = [], error } = await supabase
            .from('feedback_reports')
            .select('id, at, status, kind, severity, subject, body, name, email, user_id, pathname, viewport, screenshot_url, user_agent, app_version, client_logs, metadata')
            .order('at', { ascending: false })
            .limit(5000);
        logSupabaseError('getFeedbackStats', error);
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

export async function createNotification(notification = {}) {
    const supabase = getSupabaseOps();
    if (supabase) {
        const id = notification.id || crypto.randomUUID();
        const { error } = await supabase.from('notifications').upsert({
            id,
            at: notification.at || nowIso(),
            recipient_id: notification.recipientId || notification.userId || 'anonymous',
            recipient_email: notification.recipientEmail || '',
            type: notification.type || 'system',
            title: notification.title || '',
            message: notification.message || '',
            url: notification.url || '/',
            read: Boolean(notification.read),
            metadata: notification.metadata || {},
        }, { onConflict: 'id' });
        logSupabaseError('createNotification', error);
        return id;
    }

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

export async function listNotifications({ recipientId = 'anonymous', unreadOnly = false, limit = 20 } = {}) {
    const supabase = getSupabaseOps();
    if (supabase) {
        const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
        let query = supabase
            .from('notifications')
            .select('id, at, recipient_id, recipient_email, type, title, message, url, read, metadata')
            .eq('recipient_id', recipientId)
            .order('at', { ascending: false })
            .limit(cappedLimit);
        if (unreadOnly) query = query.eq('read', false);
        const { data = [], error } = await query;
        logSupabaseError('listNotifications', error);
        const { count, error: countError } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', recipientId)
            .eq('read', false);
        logSupabaseError('listNotifications/count', countError);
        return {
            notifications: data.map(row => ({
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
            unreadCount: count || 0,
        };
    }

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

export async function markNotificationsRead({ recipientId = 'anonymous', ids = [], markAllRead = false } = {}) {
    const supabase = getSupabaseOps();
    if (supabase) {
        if (markAllRead) {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('recipient_id', recipientId);
            logSupabaseError('markNotificationsRead/all', error);
            return;
        }
        const filtered = ids.filter(id => typeof id === 'string' && id);
        if (!filtered.length) return;
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('recipient_id', recipientId)
            .in('id', filtered);
        logSupabaseError('markNotificationsRead', error);
        return;
    }

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
