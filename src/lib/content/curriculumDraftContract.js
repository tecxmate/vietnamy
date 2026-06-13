export const CURRICULUM_DRAFT_KIND = 'vnme_canonical_curriculum_draft';
export const CURRICULUM_DRAFT_API_VERSION = 1;
export const LEGACY_CANONICAL_EXPORT_KIND = 'vnme_canonical_curriculum';

const clone = (value) => JSON.parse(JSON.stringify(value));

export function createCurriculumDraftEnvelope(curriculum, options = {}) {
    if (!curriculum || typeof curriculum !== 'object' || Array.isArray(curriculum)) {
        throw new Error('Curriculum draft payload requires a curriculum object.');
    }

    return {
        kind: CURRICULUM_DRAFT_KIND,
        apiVersion: CURRICULUM_DRAFT_API_VERSION,
        draftId: options.draftId || 'local-admin-draft',
        state: options.state || 'draft',
        schemaVersion: options.schemaVersion || curriculum.meta?.version || '',
        revision: options.revision ?? null,
        baseRevision: options.baseRevision ?? null,
        updatedAt: options.updatedAt || new Date().toISOString(),
        author: options.author || null,
        counts: options.counts || null,
        curriculum: clone(curriculum),
    };
}

export function getCurriculumFromDraftPayload(payload) {
    if (!payload || typeof payload !== 'object') return payload;
    if (payload.kind === CURRICULUM_DRAFT_KIND && payload.curriculum) return payload.curriculum;
    if (payload.kind === LEGACY_CANONICAL_EXPORT_KIND && payload.curriculum) return payload.curriculum;
    if (payload.curriculum && (payload.apiVersion || payload.schemaVersion || payload.draftId)) {
        return payload.curriculum;
    }
    return payload;
}
