// GET /api/admin/users/[id] — get user detail
// DELETE /api/admin/users/[id] — delete user
import { err, json } from '../../../../lib/auth';
import type { Env } from '../../../../_middleware';

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = Number(params['id']);
  if (!id) return err('Invalid id');

  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.role, u.created_at,
            s.plan, s.status AS subscription_status, s.current_period_end,
            (SELECT COUNT(*) FROM devices WHERE user_id = u.id) AS device_count,
            (SELECT COUNT(*) FROM signing_requests WHERE user_id = u.id) AS request_count
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id
     WHERE u.id = ? ORDER BY s.created_at DESC LIMIT 1`,
  ).bind(id).first();

  if (!row) return err('User not found', 404);
  return json(row);
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const id = Number(params['id']);
  if (!id) return err('Invalid id');

  const result = await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  if (!result.meta.changes) return err('User not found', 404);
  return json({ success: true });
};
