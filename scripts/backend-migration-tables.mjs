export const BACKEND_MIGRATION_TABLES = [
    {
        name: 'profiles',
        columns: ['id', 'email', 'full_name', 'avatar_url', 'ui_language', 'dialect', 'onboarding_completed', 'created_at', 'updated_at'],
        primaryKey: ['id'],
        orderBy: 'id',
        latestColumn: 'updated_at',
        jsonb: [],
    },
    {
        name: 'user_progress',
        columns: ['user_id', 'data', 'created_at', 'updated_at'],
        primaryKey: ['user_id'],
        orderBy: 'user_id',
        latestColumn: 'updated_at',
        jsonb: ['data'],
    },
    {
        name: 'saved_words',
        columns: ['user_id', 'word_id', 'source', 'metadata', 'created_at', 'updated_at'],
        primaryKey: ['user_id', 'word_id', 'source'],
        orderBy: 'user_id',
        latestColumn: 'updated_at',
        jsonb: ['metadata'],
    },
    {
        name: 'email_logs',
        columns: ['id', 'at', 'type', 'recipient_email', 'subject', 'success', 'skipped', 'provider_id', 'error_message'],
        primaryKey: ['id'],
        orderBy: 'at',
        latestColumn: 'at',
        jsonb: [],
    },
    {
        name: 'message_events',
        columns: ['id', 'at', 'message_instance_id', 'scenario_id', 'variant_id', 'channel', 'event', 'user_id', 'metadata'],
        primaryKey: ['id'],
        orderBy: 'at',
        latestColumn: 'at',
        jsonb: ['metadata'],
    },
    {
        name: 'push_subscriptions',
        columns: ['id', 'user_id', 'user_name', 'platform', 'endpoint', 'p256dh', 'auth', 'subscription', 'active', 'created_at', 'updated_at', 'sent', 'clicked'],
        primaryKey: ['id'],
        orderBy: 'updated_at',
        latestColumn: 'updated_at',
        jsonb: ['subscription'],
    },
    {
        name: 'push_events',
        columns: ['id', 'at', 'type', 'notification_id', 'template_id', 'scenario_id', 'variant_id', 'subscription_id', 'user_id', 'metadata'],
        primaryKey: ['id'],
        orderBy: 'at',
        latestColumn: 'at',
        jsonb: ['metadata'],
    },
    {
        name: 'feedback_reports',
        columns: ['id', 'at', 'status', 'kind', 'severity', 'subject', 'body', 'name', 'email', 'user_id', 'pathname', 'viewport', 'screenshot_url', 'user_agent', 'app_version', 'client_logs', 'metadata'],
        primaryKey: ['id'],
        orderBy: 'at',
        latestColumn: 'at',
        jsonb: ['client_logs', 'metadata'],
    },
    {
        name: 'notifications',
        columns: ['id', 'at', 'recipient_id', 'recipient_email', 'type', 'title', 'message', 'url', 'read', 'metadata'],
        primaryKey: ['id'],
        orderBy: 'at',
        latestColumn: 'at',
        jsonb: ['metadata'],
    },
];

export function selectMigrationTables(rawNames = '') {
    if (!rawNames) return BACKEND_MIGRATION_TABLES;
    const wanted = new Set(String(rawNames).split(',').map(name => name.trim()).filter(Boolean));
    return BACKEND_MIGRATION_TABLES.filter(table => wanted.has(table.name));
}
