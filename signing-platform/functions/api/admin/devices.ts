// GET /api/admin/devices — list all devices with owner info
import { err, json } from '../../../lib/auth';
import type { Env } from '../../../_middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20)));
  const offset = (page - 1) * limit;
  const status = url.searchParams.get('status') ?? '';

  const whereClause = status ? 'WHERE d.status = ?' : '';
  const bindings: (string | number)[] = status ? [status, limit, offset] : [limit, offset];

  const rows = await env.DB.prepare(
    `SELECT d.id, d.udid, d.name, d.model, d.status, d.notes, d.created_at,
            u.email AS owner_email, u.id AS owner_id
     FROM devices d
     JOIN users u ON u.id = d.user_id
     ${whereClause}
     ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
  ).bind(...bindings).all();

  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) AS cnt FROM devices d ${whereClause}`,
  ).bind(...(status ? [status] : [])).first<{ cnt: number }>();

  return json({ data: rows.results, pagination: { page, limit, total: totalRow?.cnt ?? 0 } });
};
