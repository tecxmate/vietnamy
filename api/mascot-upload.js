// Vercel Function: receive a mascot art file and store it in Vercel Blob.
// The client POSTs the raw file bytes with ?filename=&type=, content-type
// application/octet-stream (so no body parser swallows .json Lottie). Returns
// { url } — a public Blob URL the editor saves in the asset registry.
import { put } from '@vercel/blob';

const CONTENT_TYPES = {
    svg: 'image/svg+xml',
    gif: 'image/gif',
    lottie: 'application/json',
    json: 'application/json',
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        res.status(500).json({ error: 'Blob storage is not configured (missing BLOB_READ_WRITE_TOKEN).' });
        return;
    }
    try {
        const type = String(req.query.type || 'svg');
        const filename = String(req.query.filename || 'asset').replace(/[^\w.-]/g, '_');

        // Get the raw bytes whether Vercel pre-buffered them or left a stream.
        let buffer = req.body;
        if (!Buffer.isBuffer(buffer)) {
            if (typeof buffer === 'string') {
                buffer = Buffer.from(buffer);
            } else {
                const chunks = [];
                for await (const chunk of req) chunks.push(chunk);
                buffer = Buffer.concat(chunks);
            }
        }
        if (!buffer || buffer.length === 0) {
            res.status(400).json({ error: 'Empty upload.' });
            return;
        }

        const blob = await put(`mascot/${Date.now()}-${filename}`, buffer, {
            access: 'public',
            contentType: CONTENT_TYPES[type] || 'application/octet-stream',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        res.status(200).json({ url: blob.url });
    } catch (err) {
        res.status(500).json({ error: err?.message || 'Upload failed.' });
    }
}
