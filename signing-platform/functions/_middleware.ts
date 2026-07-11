import { verifyJWT } from './lib/auth';

export interface Env {
  DB: D1Database;
  ASSETS_BUCKET: R2Bucket;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}

declare module 'cloudflare:workers' {
  interface ExecutionContext {
    data: { user?: import('./lib/auth').JWTPayload };
  }
}

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/public/',
  '/api/subscription/webhook',
];

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Allow public paths without auth
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
    return next();
  }

  // Serve static files without auth
  if (!path.startsWith('/api/')) {
    return next();
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await verifyJWT(authHeader.slice(7), context.env.JWT_SECRET);
    // Attach user to context data
    (context as unknown as { data: { user: typeof payload } }).data = { user: payload };

    // Guard admin routes
    if (path.startsWith('/api/admin/') && payload.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return next();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
