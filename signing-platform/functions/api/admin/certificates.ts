// GET /api/admin/certificates — list all certificates
import { err, json } from '../../../lib/auth';
import type { Env } from '../../../_middleware';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const rows = await env.DB.prepare(
    `SELECT id, name, common_name, team_id, is_active, expires_at, created_at FROM certificates ORDER BY created_at DESC`,
  ).all();
  return json(rows.results);
};
