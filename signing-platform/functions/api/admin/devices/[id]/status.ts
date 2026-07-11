// PATCH /api/admin/devices/[id]/status — update device signing status
import { err, json } from '../../../../../lib/auth';
import type { Env } from '../../../../../_middleware';

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'signed'] as const;

export const onRequestPatch: PagesFunction<Env> = async ({ params, request, env }) => {
  const id = Number(params['id']);
  if (!id) return err('Invalid id');

  let body: { status?: string; notes?: string } = {};
  try { body = await request.json(); } catch { /* ignore */ }

  const { status, notes } = body;
  if (!status || !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return err(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const result = await env.DB.prepare(
    `UPDATE devices SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  ).bind(status, notes ?? null, id).run();

  if (!result.meta.changes) return err('Device not found', 404);

  const updated = await env.DB.prepare(
    `SELECT d.*, u.email AS owner_email FROM devices d JOIN users u ON u.id = d.user_id WHERE d.id = ?`,
  ).bind(id).first();

  return json(updated);
};
