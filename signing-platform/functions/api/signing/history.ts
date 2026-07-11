// GET /api/signing/history — signing request history for the current user
import { err, json } from '../../lib/auth';
import type { Env } from '../../_middleware';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = (context as unknown as { data: { user?: { sub: number } } }).data?.user;
  if (!user) return err('Unauthorized', 401);

  const url = new URL(context.request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 20)));
  const offset = (page - 1) * limit;

  const rows = await context.env.DB.prepare(
    `SELECT sr.id, sr.status, sr.notes, sr.created_at,
            d.udid, d.name AS device_name,
            c.name AS certificate_name,
            p.name AS profile_name
     FROM signing_requests sr
     LEFT JOIN devices d ON d.id = sr.device_id
     LEFT JOIN certificates c ON c.id = sr.certificate_id
     LEFT JOIN profiles p ON p.id = sr.profile_id
     WHERE sr.user_id = ?
     ORDER BY sr.created_at DESC
     LIMIT ? OFFSET ?`,
  ).bind(user.sub, limit, offset).all();

  const total = await context.env.DB.prepare(
    'SELECT COUNT(*) AS cnt FROM signing_requests WHERE user_id = ?',
  ).bind(user.sub).first<{ cnt: number }>();

  return json({
    data: rows.results,
    pagination: { page, limit, total: total?.cnt ?? 0 },
  });
};
