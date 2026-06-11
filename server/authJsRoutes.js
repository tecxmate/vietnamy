export async function maybeMountAuthJs(app) {
    if ((process.env.AUTH_PROVIDER || 'supabase').toLowerCase() !== 'authjs') return false;

    const { ExpressAuth } = await import('@auth/express');
    const providers = [];

    if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
        const Google = (await import('@auth/express/providers/google')).default;
        providers.push(Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }));
    }

    if (providers.length === 0) {
        throw new Error('AUTH_PROVIDER=authjs requires at least AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.');
    }

    app.set?.('trust proxy', true);
    app.use('/api/auth/*', ExpressAuth({
        providers,
        secret: process.env.AUTH_SECRET,
        trustHost: process.env.AUTH_TRUST_HOST !== 'false',
    }));

    return true;
}
