import crypto from 'crypto';
import {
    getMessageScenario,
    getScenarioVariants,
    listMessageScenarios,
} from './engagementMessages.js';
import {
    listMessageEvents,
    recordMessageEvent as recordStoredMessageEvent,
} from './opsStore.js';

const EXPLORATION_RATE = Number(process.env.MESSAGE_EXPLORATION_RATE || 0.2);

const VALID_EVENTS = new Set(['selected', 'sent', 'rendered', 'delivered', 'opened', 'clicked', 'dismissed', 'failed']);
const PREFERENCE_WEIGHTS = {
    clicked: 5,
    opened: 2,
    delivered: 0.3,
    sent: 0.1,
    dismissed: -4,
    failed: -1,
};
const DEFAULT_ADAPTIVE_GROUPS = new Set(['learning', 'lifecycle', 'product', 'community', 'research', 'marketing']);

export function createMessageInstanceId() {
    return crypto.randomUUID();
}

export async function recordMessageEvent({
    messageInstanceId,
    scenarioId,
    variantId,
    channel,
    event,
    userId,
    metadata,
} = {}) {
    const normalizedEvent = VALID_EVENTS.has(event) ? event : 'rendered';
    return recordStoredMessageEvent({
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        messageInstanceId: messageInstanceId || null,
        scenarioId: scenarioId || '',
        variantId: variantId || '',
        channel: channel || '',
        event: normalizedEvent,
        userId: userId || null,
        metadata: metadata && typeof metadata === 'object' ? metadata : {},
    });
}

export async function getMessageEngagementStats({ scenarioId, channel } = {}) {
    const events = await listMessageEvents({ scenarioId, channel });
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

function addScore(map, key, amount) {
    if (!key || !amount) return;
    map[key] = Number(((map[key] || 0) + amount).toFixed(4));
}

function decayForEvent(at) {
    const ageDays = Math.max(0, (Date.now() - Date.parse(at || 0)) / 86400000);
    if (!Number.isFinite(ageDays)) return 1;
    return Math.max(0.2, Math.exp(-ageDays / 45));
}

export async function getUserMessageAffinity({ userId, channel } = {}) {
    if (!userId) {
        return { scenarioScores: {}, groupScores: {}, intentScores: {}, variantScores: {}, rankedScenarios: [] };
    }

    const events = await listMessageEvents({ channel });
    const scenarioScores = {};
    const groupScores = {};
    const intentScores = {};
    const variantScores = {};
    const scenarioMap = new Map(listMessageScenarios().map(s => [s.id, s]));

    for (const event of events) {
        if (event.userId !== userId) continue;
        if (channel && event.channel !== channel) continue;
        const baseWeight = PREFERENCE_WEIGHTS[event.event] || 0;
        if (!baseWeight) continue;

        const scenario = scenarioMap.get(event.scenarioId) || getMessageScenario(event.scenarioId);
        const weight = baseWeight * decayForEvent(event.at);
        addScore(scenarioScores, event.scenarioId, weight);
        addScore(variantScores, `${event.scenarioId}:${event.channel}:${event.variantId}`, weight);
        if (scenario) {
            addScore(groupScores, scenario.group, weight * 0.55);
            addScore(intentScores, scenario.intent, weight * 0.45);
            addScore(intentScores, `${scenario.group}:${scenario.intent}`, weight * 0.25);
        }
    }

    const rankedScenarios = listMessageScenarios()
        .map(scenario => ({
            id: scenario.id,
            group: scenario.group,
            intent: scenario.intent,
            score: Number((
                (scenarioScores[scenario.id] || 0) +
                (groupScores[scenario.group] || 0) +
                (intentScores[scenario.intent] || 0) +
                (intentScores[`${scenario.group}:${scenario.intent}`] || 0)
            ).toFixed(4)),
        }))
        .sort((a, b) => b.score - a.score);

    return { scenarioScores, groupScores, intentScores, variantScores, rankedScenarios };
}

export async function selectAdaptiveScenario(channel, {
    userId,
    candidateScenarioIds,
    allowedGroups,
} = {}) {
    const candidates = listMessageScenarios()
        .filter(scenario => getScenarioVariants(scenario.id, channel).length > 0)
        .filter(scenario => !candidateScenarioIds?.length || candidateScenarioIds.includes(scenario.id))
        .filter(scenario => {
            const groups = allowedGroups?.length ? new Set(allowedGroups) : DEFAULT_ADAPTIVE_GROUPS;
            return groups.has(scenario.group);
        });
    if (!candidates.length) return null;

    const shouldExplore = candidates.length > 1 && Math.random() < EXPLORATION_RATE;
    if (shouldExplore || !userId) {
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    const affinity = await getUserMessageAffinity({ userId, channel });
    const scored = candidates
        .map(scenario => {
            const ranked = affinity.rankedScenarios.find(item => item.id === scenario.id);
            return { scenario, score: ranked?.score || 0 };
        })
        .sort((a, b) => b.score - a.score);
    return scored[0]?.score > 0 ? scored[0].scenario : candidates[0];
}

export async function selectMessageVariant(scenarioId, channel, { userId, forceVariantId } = {}) {
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
        const stats = (await getMessageEngagementStats({ scenarioId, channel })).byVariant;
        const affinity = await getUserMessageAffinity({ userId, channel });
        const ranked = stats
            .filter(item => variants.some(v => v.id === item.variantId))
            .map(item => ({
                ...item,
                score: item.score + ((affinity.variantScores[`${scenarioId}:${channel}:${item.variantId}`] || 0) * 0.03),
            }))
            .sort((a, b) => b.score - a.score);
        if (ranked[0]) {
            selected = variants.find(v => v.id === ranked[0].variantId) || selected;
        }
    }

    await recordMessageEvent({
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
