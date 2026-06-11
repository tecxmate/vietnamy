import crypto from 'crypto';
import { isR2Configured, putR2Object } from '../server/r2Storage.js';

const CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function extForType(type) {
    if (type === 'image/png') return 'png';
    if (type === 'image/webp') return 'webp';
    return 'jpg';
}

async function readBody(req) {
    let buffer = req.body;
    if (Buffer.isBuffer(buffer)) return buffer;
    if (typeof buffer === 'string') return Buffer.from(buffer);
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    if (!isR2Configured()) {
        res.status(503).json({ error: 'R2 storage is not configured.' });
        return;
    }

    try {
        const contentType = String(req.headers['content-type'] || 'image/jpeg').split(';')[0].toLowerCase();
        if (!CONTENT_TYPES.has(contentType)) {
            res.status(415).json({ error: 'Unsupported screenshot type.' });
            return;
        }
        const buffer = await readBody(req);
        if (!buffer?.length) {
            res.status(400).json({ error: 'Empty screenshot.' });
            return;
        }
        if (buffer.length > 5 * 1024 * 1024) {
            res.status(413).json({ error: 'Screenshot is too large.' });
            return;
        }

        const day = new Date().toISOString().slice(0, 10);
        const key = `feedback/${day}/${Date.now()}-${crypto.randomUUID()}.${extForType(contentType)}`;
        const upload = await putR2Object({
            bucket: process.env.R2_FEEDBACK_BUCKET || process.env.R2_APP_BUCKET || process.env.R2_MASCOT_BUCKET || process.env.R2_BUCKET || 'app-assets',
            key,
            body: buffer,
            contentType,
            cacheControl: 'private, max-age=604800',
        });

        res.status(200).json({ url: upload.url, provider: upload.provider, key });
    } catch (error) {
        res.status(500).json({ error: error?.message || 'Screenshot upload failed.' });
    }
}
