// GET /api/admin/users — list all users with subscription info
import { err, json } from '../../../lib/auth';
import type { Env } from '../../../_middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20)));
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('search') ?? '';

  const whereClause = search ? 'WHERE u.email LIKE ?' : '';
  const bindings: (string | number)[] = search
    ? [`%${search}%`, limit, offset]
    : [limit, offset];

  const rows = await env.DB.prepare(
    `SELECT u.id, u.email, u.role, u.created_at,
            s.plan, s.status AS subscription_status, s.current_period_end
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
  ).bind(...bindings).all();

  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) AS cnt FROM users u ${whereClause}`,
  ).bind(...(search ? [`%${search}%`] : [])).first<{ cnt: number }>();

  return json({ data: rows.results, pagination: { page, limit, total: totalRow?.cnt ?? 0 } });
};
