import crypto from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getScenarioVariants } from './engagementMessages.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENGAGEMENT_EVENT_PATH = join(__dirname, 'databases', 'message_events.json');
const EVENT_LIMIT = 20000;
const EXPLORATION_RATE = Number(process.env.MESSAGE_EXPLORATION_RATE || 0.2);

const VALID_EVENTS = new Set(['selected', 'sent', 'rendered', 'delivered', 'opened', 'clicked', 'dismissed', 'failed']);

function readEventStore() {
    try {
        if (!existsSync(ENGAGEMENT_EVENT_PATH)) return { events: [] };
        const parsed = JSON.parse(readFileSync(ENGAGEMENT_EVENT_PATH, 'utf8'));
        return { events: Array.isArray(parsed.events) ? parsed.events : [] };
    } catch (err) {
        console.warn('Message event read failed:', err.message);
        return { events: [] };
    }
}

function writeEventStore(store) {
    mkdirSync(dirname(ENGAGEMENT_EVENT_PATH), { recursive: true });
    const events = Array.isArray(store.events) ? store.events.slice(-EVENT_LIMIT) : [];
    writeFileSync(ENGAGEMENT_EVENT_PATH, JSON.stringify({ events }, null, 2));
}

export function createMessageInstanceId() {
    return crypto.randomUUID();
}

export function recordMessageEvent({
    messageInstanceId,
    scenarioId,
    variantId,
    channel,
    event,
    userId,
    metadata,
} = {}) {
    const normalizedEvent = VALID_EVENTS.has(event) ? event : 'rendered';
    const store = readEventStore();
    const entry = {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        messageInstanceId: messageInstanceId || null,
        scenarioId: scenarioId || '',
        variantId: variantId || '',
        channel: channel || '',
        event: normalizedEvent,
        userId: userId || null,
        metadata: metadata && typeof metadata === 'object' ? metadata : {},
    };
    store.events.push(entry);
    writeEventStore(store);
    return entry;
}

export function getMessageEngagementStats({ scenarioId, channel } = {}) {
    const events = readEventStore().events;
    const byVariant = {};
    const totals = {
        selected: 0,
        sent: 0,
        rendered: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        dismissed: 0,
        failed: 0,
    };

    for (const event of events) {
        if (scenarioId && event.scenarioId !== scenarioId) continue;
        if (channel && event.channel !== channel) continue;
        const key = `${event.scenarioId}:${event.channel}:${event.variantId}`;
        if (!byVariant[key]) {
            byVariant[key] = {
                scenarioId: event.scenarioId,
                channel: event.channel,
                variantId: event.variantId,
                selected: 0,
                sent: 0,
                rendered: 0,
                delivered: 0,
                opened: 0,
                clicked: 0,
                dismissed: 0,
                failed: 0,
                score: 0,
            };
        }
        if (totals[event.event] != null) totals[event.event] += 1;
        if (byVariant[key][event.event] != null) byVariant[key][event.event] += 1;
    }

    for (const item of Object.values(byVariant)) {
        const exposure = Math.max(1, item.sent + item.rendered + item.delivered);
        const clickRate = (item.clicked + 1) / (exposure + 4);
        const openRate = (item.opened + 1) / (exposure + 4);
        const dismissPenalty = (item.dismissed + item.failed) / (exposure + 4);
        item.score = Number((clickRate * 0.7 + openRate * 0.25 - dismissPenalty * 0.2).toFixed(4));
    }

    return {
        totalEvents: events.length,
        totals,
        byVariant: Object.values(byVariant).sort((a, b) => b.score - a.score),
    };
}

export function selectMessageVariant(scenarioId, channel, { userId, forceVariantId } = {}) {
    const variants = getScenarioVariants(scenarioId, channel);
    if (!variants.length) return null;

    if (forceVariantId) {
        const forced = variants.find(v => v.id === forceVariantId);
        if (forced) return forced;
    }

    let selected = variants[0];
    const shouldExplore = variants.length > 1 && Math.random() < EXPLORATION_RATE;
    if (shouldExplore) {
        selected = variants[Math.floor(Math.random() * variants.length)];
    } else if (variants.length > 1) {
        const stats = getMessageEngagementStats({ scenarioId, channel }).byVariant;
        const ranked = stats
            .filter(item => variants.some(v => v.id === item.variantId))
            .sort((a, b) => b.score - a.score);
        if (ranked[0]) {
            selected = variants.find(v => v.id === ranked[0].variantId) || selected;
        }
    }

    recordMessageEvent({
        scenarioId,
        channel,
        variantId: selected.id,
        event: 'selected',
        userId,
        metadata: { strategy: shouldExplore ? 'explore' : 'exploit' },
    });

    return selected;
}

export function buildTrackingUrls({ req, messageInstanceId, scenarioId, variantId, channel, targetUrl }) {
    if (!req || !messageInstanceId) return {};
    const origin = `${req.protocol}://${req.get('host')}`;
    const params = new URLSearchParams({
        m: messageInstanceId,
        s: scenarioId,
        v: variantId,
        c: channel,
    });
    const clickParams = new URLSearchParams(params);
    clickParams.set('url', targetUrl || '/');
    return {
        openPixelUrl: `${origin}/api/messages/open?${params.toString()}`,
        clickUrl: `${origin}/api/messages/click?${clickParams.toString()}`,
    };
}
