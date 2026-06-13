import {
    createCurriculumDraftEnvelope,
    getCurriculumFromDraftPayload,
} from './curriculumDraftContract';

const DEFAULT_BASE_URL = (import.meta.env.VITE_CURRICULUM_API_BASE_URL || '').replace(/\/+$/, '');
const DEFAULT_API_PREFIX = import.meta.env.VITE_CURRICULUM_API_PREFIX || '/api';
const API_ENABLED = import.meta.env.VITE_CURRICULUM_API_ENABLED === 'true';

const trimSlashes = (value) => String(value || '').replace(/^\/+|\/+$/g, '');

function buildUrl(path, { baseUrl = DEFAULT_BASE_URL, apiPrefix = DEFAULT_API_PREFIX } = {}) {
    const prefix = trimSlashes(apiPrefix);
    const suffix = trimSlashes(path);
    const route = `/${[prefix, suffix].filter(Boolean).join('/')}`;
    return baseUrl ? `${baseUrl}${route}` : route;
}

export function isCurriculumDraftApiConfigured(options = {}) {
    return Boolean(options.baseUrl || DEFAULT_BASE_URL || API_ENABLED);
}

async function curriculumDraftRequest(path, {
    method = 'GET',
    body,
    baseUrl,
    apiPrefix,
    token,
    headers = {},
    signal,
} = {}) {
    const response = await fetch(buildUrl(path, { baseUrl, apiPrefix }), {
        method,
        signal,
        headers: {
            Accept: 'application/json',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Curriculum draft API failed (${response.status}): ${detail.slice(0, 240)}`);
    }

    if (response.status === 204) return null;
    return response.json();
}

export async function fetchCurriculumDraft(options = {}) {
    const payload = await curriculumDraftRequest('/admin/curriculum-draft', options);
    return {
        ...payload,
        curriculum: getCurriculumFromDraftPayload(payload),
    };
}

export async function saveCurriculumDraft(curriculum, options = {}) {
    const payload = createCurriculumDraftEnvelope(curriculum, {
        draftId: options.draftId,
        state: 'draft',
        revision: options.revision,
        baseRevision: options.baseRevision,
        author: options.author,
        counts: options.counts,
    });
    return curriculumDraftRequest('/admin/curriculum-draft', {
        ...options,
        method: 'PUT',
        body: payload,
    });
}

export async function publishCurriculumDraft(curriculum, options = {}) {
    const payload = createCurriculumDraftEnvelope(curriculum, {
        draftId: options.draftId,
        state: 'published',
        revision: options.revision,
        baseRevision: options.baseRevision,
        author: options.author,
        counts: options.counts,
    });
    return curriculumDraftRequest('/admin/curriculum-publish', {
        ...options,
        method: 'POST',
        body: payload,
    });
}
