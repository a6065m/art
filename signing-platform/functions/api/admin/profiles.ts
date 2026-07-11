// GET /api/admin/profiles — list provisioning profiles
import { json } from '../../../lib/auth';
import type { Env } from '../../../_middleware';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const rows = await env.DB.prepare(
    `SELECT id, name, bundle_id, team_id, is_active, expires_at, created_at FROM profiles ORDER BY created_at DESC`,
  ).all();
  return json(rows.results);
};
