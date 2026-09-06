// ---------------------------------------------------------------------------
// Member identity from the NestJS access token.
//
// This Express server is a second backend sitting beside the NestJS API (see
// docs/ROLE-OF-THIS-REPO.md). It has no database link to NestJS and no user
// table of its own, so the ONLY thing it can learn about a caller is what the
// caller's access token already carries — signed by NestJS, verified here with
// the shared secret.
//
// Matching NestJS exactly (verified against Vietnamy_Backend, not assumed):
//   - src/modules/auth/auth.service.ts  generateTokens():
//         payload = { sub: user.id, email: user.email }
//         signAsync(payload, { secret: jwt.secret, expiresIn: jwt.expiresIn })
//   - src/config/jwt.config.ts:  secret = process.env.JWT_SECRET
//   - No `algorithm` and no `signOptions` are set anywhere, so @nestjs/jwt v11
//     falls through to the jsonwebtoken default for a string secret: HS256.
//
// So: HS256, symmetric, user id in `sub`.
//
// We pin `algorithms: ['HS256']` on verify. Leaving it unpinned is the classic
// algorithm-confusion hole — an attacker sends alg:none, or alg:HS256 signed
// with a public key we treat as a secret, and forges any `sub` they like.
// ---------------------------------------------------------------------------
import jwt from 'jsonwebtoken';

// The secret is read on first use, not at import time. server.js calls
// loadEnvFile() in its own body, and ESM evaluates every imported module
// BEFORE that body runs — so a top-level `process.env.JWT_SECRET` here would
// reliably read undefined when the value comes from .env.local. (mail.js
// solves the same hazard by re-running loadEnvFile itself; reading late is
// cheaper than a third copy of that loader.)
let cachedSecret = null;

/** Shared with NestJS: the same value as JWT_SECRET in the NestJS environment. */
export function memberJwtSecret() {
    if (cachedSecret === null) {
        cachedSecret = process.env.JWT_SECRET || '';
        if (!cachedSecret) {
            console.warn(
                'JWT_SECRET is not set — member tokens cannot be verified. Every ' +
                'tutor request will be treated as anonymous and metered by IP.',
            );
        }
    }
    return cachedSecret;
}

/** True when this server is able to verify member tokens at all. */
export function memberAuthConfigured() {
    return memberJwtSecret().length > 0;
}

/**
 * Pull the raw bearer token out of a request, or '' when there isn't one.
 *
 * The app's main ApiClient sends both `Authorization` and `Member-Authorization`
 * with the same value, so accept either. `Member-Authorization` wins when both
 * are present: on the NestJS side that is specifically the member token, while
 * `Authorization` is the header a proxy or an admin tool is most likely to
 * overwrite with something else.
 */
function bearerFrom(req) {
    const raw = String(
        req.headers['member-authorization'] || req.headers.authorization || '',
    ).trim();
    if (!raw) return '';
    const m = /^Bearer\s+(.+)$/i.exec(raw);
    return m ? m[1].trim() : '';
}

/**
 * Identify the caller from their access token.
 *
 * Returns one of:
 *   { status: 'anonymous', userId: null }            — no token was sent
 *   { status: 'authenticated', userId, email }       — token verified
 *   { status: 'invalid', userId: null, reason }      — a token was sent but did
 *                                                      not verify (expired,
 *                                                      wrong secret, tampered,
 *                                                      or no secret configured)
 *
 * Callers decide what 'invalid' means for them. Deliberately, this function
 * never throws and never returns a userId it did not verify: a token we could
 * not check is worth exactly as much as no token at all, never more.
 */
export function identifyMember(req) {
    const token = bearerFrom(req);
    if (!token) return { status: 'anonymous', userId: null };

    const secret = memberJwtSecret();
    if (!secret) return { status: 'invalid', userId: null, reason: 'no_secret' };

    try {
        const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
        const userId = typeof payload?.sub === 'string' ? payload.sub.trim() : '';
        if (!userId) return { status: 'invalid', userId: null, reason: 'no_subject' };
        return {
            status: 'authenticated',
            userId,
            email: typeof payload.email === 'string' ? payload.email : '',
        };
    } catch (err) {
        // TokenExpiredError | JsonWebTokenError | NotBeforeError
        return { status: 'invalid', userId: null, reason: err.name || 'invalid_token' };
    }
}
