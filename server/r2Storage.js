import crypto from 'crypto';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ENDPOINT = (process.env.R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '')).replace(/\/+$/, '');
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '');

export function isR2Configured() {
    return Boolean(R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

export function encodeObjectKey(key) {
    return String(key).split('/').map(part => encodeURIComponent(part)).join('/');
}

export function r2PublicUrl(key) {
    if (!R2_PUBLIC_BASE_URL) return '';
    return `${R2_PUBLIC_BASE_URL}/${encodeObjectKey(key)}`;
}

function hmacSha256(key, value, encoding) {
    return crypto.createHmac('sha256', key).update(value).digest(encoding);
}

function sha256(value) {
    return crypto.createHash('sha256').update(value || '').digest('hex');
}

function signedHeaders(method, url, headers = {}, body = null) {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = sha256(body);
    const allHeaders = {
        ...headers,
        host: url.host,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
    };
    const canonicalHeaderEntries = Object.entries(allHeaders)
        .map(([key, value]) => [key.toLowerCase(), String(value).trim().replace(/\s+/g, ' ')])
        .sort(([a], [b]) => a.localeCompare(b));
    const canonicalHeaders = canonicalHeaderEntries.map(([key, value]) => `${key}:${value}\n`).join('');
    const headerKeys = canonicalHeaderEntries.map(([key]) => key).join(';');
    const canonicalQuery = [...url.searchParams.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    const canonicalRequest = [
        method,
        url.pathname,
        canonicalQuery,
        canonicalHeaders,
        headerKeys,
        payloadHash,
    ].join('\n');
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        sha256(canonicalRequest),
    ].join('\n');
    const dateKey = hmacSha256(`AWS4${R2_SECRET_ACCESS_KEY}`, dateStamp);
    const regionKey = hmacSha256(dateKey, 'auto');
    const serviceKey = hmacSha256(regionKey, 's3');
    const signingKey = hmacSha256(serviceKey, 'aws4_request');
    const signature = hmacSha256(signingKey, stringToSign, 'hex');

    return {
        ...headers,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        Authorization: `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${headerKeys}, Signature=${signature}`,
    };
}

export async function putR2Object({ bucket, key, body, contentType = 'application/octet-stream', cacheControl = 'public, max-age=31536000, immutable' }) {
    if (!isR2Configured()) {
        throw new Error('R2 storage is not configured.');
    }
    const url = new URL(`${R2_ENDPOINT}/${bucket}/${encodeObjectKey(key)}`);
    const res = await fetch(url, {
        method: 'PUT',
        headers: signedHeaders('PUT', url, {
            'Content-Type': contentType,
            'Cache-Control': cacheControl,
        }, body),
        body,
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`R2 upload failed (${res.status}): ${detail.slice(0, 200)}`);
    }
    return {
        key,
        url: r2PublicUrl(key),
        provider: 'r2',
    };
}
