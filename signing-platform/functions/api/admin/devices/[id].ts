// GET /api/admin/devices/[id] — get device detail
// DELETE /api/admin/devices/[id] — delete device
import { err, json } from '../../../../lib/auth';
import type { Env } from '../../../../_middleware';

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = Number(params['id']);
  if (!id) return err('Invalid id');

  const row = await env.DB.prepare(
    `SELECT d.*, u.email AS owner_email
     FROM devices d JOIN users u ON u.id = d.user_id
     WHERE d.id = ?`,
  ).bind(id).first();

  if (!row) return err('Device not found', 404);
  return json(row);
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const id = Number(params['id']);
  if (!id) return err('Invalid id');

  const result = await env.DB.prepare('DELETE FROM devices WHERE id = ?').bind(id).run();
  if (!result.meta.changes) return err('Device not found', 404);
  return json({ success: true });
};
