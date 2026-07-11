// GET /api/admin/subscriptions — list all subscriptions
import { err, json } from '../../../lib/auth';
import type { Env } from '../../../_middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20)));
  const offset = (page - 1) * limit;
  const status = url.searchParams.get('status') ?? '';

  const whereClause = status ? 'WHERE s.status = ?' : '';
  const bindings: (string | number)[] = status ? [status, limit, offset] : [limit, offset];

  const rows = await env.DB.prepare(
    `SELECT s.id, s.plan, s.status, s.stripe_customer_id, s.stripe_subscription_id,
            s.current_period_start, s.current_period_end, s.created_at,
            u.email AS user_email, u.id AS user_id
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     ${whereClause}
     ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
  ).bind(...bindings).all();

  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) AS cnt FROM subscriptions s ${whereClause}`,
  ).bind(...(status ? [status] : [])).first<{ cnt: number }>();

  return json({ data: rows.results, pagination: { page, limit, total: totalRow?.cnt ?? 0 } });
};
