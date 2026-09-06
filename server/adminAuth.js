// Shared token gates for this server's privileged routes.
//
// This server already had exactly one privileged credential — MAIL_ADMIN_TOKEN,
// presented as `Authorization: Bearer <token>`, `x-mail-admin-token`,
// `x-admin-token`, or `?token=` — but the check was written out inline three
// times (server/server.js, api/[...path].js, and nowhere at all on the two
// upload routes, which had no auth). That is why this module exists: one
// implementation every entry point imports.
//
// Two rules it enforces that the inline versions did not:
//
//   1. Unset means DENY. If the token is empty, no request is privileged.
//   2. The comparison is constant time, so a caller cannot learn the token one
//      byte at a time from response timing.
//
// It also splits the credentials rather than sharing one:
//
//   MAIL_ADMIN_TOKEN     — the master credential. Gates /api/admin/*,
//                          /api/messages/* and /api/push/*: reading feedback,
//                          and sending email and push to the user base.
//   MASCOT_UPLOAD_TOKEN  — upload only. Gates /api/mascot-upload and nothing
//                          else, so the value handed to whoever uploads mascot
//                          art cannot be replayed against the routes above.
//
// requireUploadToken refuses to run if the two are configured to the same
// value, so "single purpose" is enforced here rather than assumed by callers.
//
// Every read of process.env is deliberately lazy. server.js loads .env.local /
// .env with its own loader *after* the import graph is evaluated, so a
// module-level `const TOKEN = process.env.MAIL_ADMIN_TOKEN` here would capture
// the value before that loader ran and silently see an empty token.
import crypto from 'crypto';

/**
 * Constant-time string comparison.
 *
 * crypto.timingSafeEqual throws on length mismatch — which would itself leak
 * the token length — so both sides are hashed to a fixed 32 bytes first and the
 * digests are compared.
 */
export function constantTimeEqual(a, b) {
    const left = crypto.createHash('sha256').update(String(a ?? ''), 'utf8').digest();
    const right = crypto.createHash('sha256').update(String(b ?? ''), 'utf8').digest();
    return crypto.timingSafeEqual(left, right);
}

/** The configured master admin token, or '' when the deployment has not set one. */
export function adminToken() {
    return process.env.MAIL_ADMIN_TOKEN || '';
}

/** The configured mascot-upload token, or '' when the deployment has not set one. */
export function uploadToken() {
    return process.env.MASCOT_UPLOAD_TOKEN || '';
}

/**
 * The token the caller presented, in the shapes this server accepts. The three
 * that server.js has always taken (Bearer, x-mail-admin-token, ?token=) plus
 * x-admin-token, which is what the Vercel api/[...path].js copy accepted — the
 * union, so consolidating on this function cannot reject a client that worked
 * against either entry point before.
 */
export function presentedAdminToken(req) {
    const bearer = String(req?.headers?.authorization || '').replace(/^Bearer\s+/i, '');
    if (bearer) return bearer;
    return String(
        req?.headers?.['x-mail-admin-token']
        || req?.headers?.['x-admin-token']
        || req?.query?.token
        || '',
    );
}

/** True only when a token is configured AND the caller presented that token. */
function hasValidToken(req, expected) {
    if (!expected) return false;
    const presented = presentedAdminToken(req);
    if (!presented) return false;
    return constantTimeEqual(presented, expected);
}

/** True only when MAIL_ADMIN_TOKEN is set AND the caller presented it. */
export function hasValidAdminToken(req) {
    return hasValidToken(req, adminToken());
}

/** True only when MASCOT_UPLOAD_TOKEN is set AND the caller presented it. */
export function hasValidUploadToken(req) {
    return hasValidToken(req, uploadToken());
}

/**
 * Express/Vercel guard for the master admin credential. Returns true when the
 * request may proceed; otherwise it has already written a 401 and the handler
 * must return.
 *
 * `allowLocalWhenUnconfigured` reproduces the pre-existing MAIL_ADMIN_ALLOW_LOCAL
 * developer escape hatch: it only applies while no token is configured, and the
 * caller decides what "local" means. server.js derives that from the TCP peer
 * address, never from a request header — see isLocalRequest there. No upload
 * route uses this option; uploads have no escape hatch at all.
 */
export function requireAdminToken(req, res, { allowLocalWhenUnconfigured = false, message = 'admin token required' } = {}) {
    if (hasValidAdminToken(req)) return true;
    if (!adminToken() && allowLocalWhenUnconfigured) return true;
    res.status(401).json({ error: message });
    return false;
}

/**
 * Express/Vercel guard for the mascot upload credential.
 *
 * There is no localhost escape hatch here on purpose: this route writes
 * caller-supplied bytes to a public bucket, and "is this request local" can
 * only ever be inferred. Unset MASCOT_UPLOAD_TOKEN denies everyone, including
 * on a developer machine — set the variable in .env.local instead.
 *
 * Reusing MAIL_ADMIN_TOKEN as the upload token is refused rather than
 * tolerated: the point of a second variable is that the upload credential can
 * be handed out without also handing out email and push.
 */
export function requireUploadToken(req, res, { message = 'mascot upload token required' } = {}) {
    const expected = uploadToken();
    const master = adminToken();
    if (expected && master && constantTimeEqual(expected, master)) {
        res.status(500).json({
            error: 'MASCOT_UPLOAD_TOKEN must not be the same value as MAIL_ADMIN_TOKEN.',
        });
        return false;
    }
    if (hasValidUploadToken(req)) return true;
    res.status(401).json({ error: message });
    return false;
}
