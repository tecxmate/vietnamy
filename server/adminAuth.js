// Shared admin-token gate.
//
// This server already had exactly one privileged credential — MAIL_ADMIN_TOKEN,
// presented as `Authorization: Bearer <token>`, `x-mail-admin-token`, or
// `?token=` — but the check lived inline in server.js as `requireMailAdmin`, so
// the Vercel functions in api/ had no way to reuse it and the two upload routes
// had no auth at all. That is the whole reason this module exists: one
// implementation both entry points can import.
//
// Two rules it enforces that the inline version did not:
//
//   1. Unset means DENY. If MAIL_ADMIN_TOKEN is empty, no request is admin.
//      (The localhost escape hatch stays, but the caller has to ask for it and
//      it only applies while no token is configured — see requireAdminToken.)
//   2. The comparison is constant time, so a caller cannot learn the token one
//      byte at a time from response timing.
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

/** The configured admin token, or '' when the deployment has not set one. */
export function adminToken() {
    return process.env.MAIL_ADMIN_TOKEN || '';
}

/**
 * The token the caller presented, in the three shapes this server has always
 * accepted. Kept identical to the previous inline logic so existing admin
 * clients (docs/mkt/ENGAGEMENT_MESSAGING.md, scripts/feedback-agent-pipeline.mjs)
 * keep working unchanged.
 */
export function presentedAdminToken(req) {
    const bearer = String(req?.headers?.authorization || '').replace(/^Bearer\s+/i, '');
    if (bearer) return bearer;
    return String(req?.headers?.['x-mail-admin-token'] || req?.query?.token || '');
}

/** True only when a token is configured AND the caller presented that token. */
export function hasValidAdminToken(req) {
    const expected = adminToken();
    if (!expected) return false;
    const presented = presentedAdminToken(req);
    if (!presented) return false;
    return constantTimeEqual(presented, expected);
}

/**
 * Express/Vercel guard. Returns true when the request may proceed; otherwise it
 * has already written a 401 and the handler must return.
 *
 * `allowLocalWhenUnconfigured` reproduces the pre-existing MAIL_ADMIN_ALLOW_LOCAL
 * developer escape hatch: it only applies while no token is configured, and the
 * caller decides what "local" means (server.js checks the request IP). With
 * both MAIL_ADMIN_TOKEN and MAIL_ADMIN_ALLOW_LOCAL unset, the answer is no.
 */
export function requireAdminToken(req, res, { allowLocalWhenUnconfigured = false, message = 'admin token required' } = {}) {
    if (hasValidAdminToken(req)) return true;
    if (!adminToken() && allowLocalWhenUnconfigured) return true;
    res.status(401).json({ error: message });
    return false;
}
