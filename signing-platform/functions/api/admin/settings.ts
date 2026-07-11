// GET /api/admin/settings — read all settings
// PATCH /api/admin/settings — update one or more settings
import { err, json } from '../../../lib/auth';
import type { Env } from '../../../_middleware';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const rows = await env.DB.prepare('SELECT key, value FROM settings ORDER BY key').all<{ key: string; value: string }>();
  const result: Record<string, string> = {};
  for (const { key, value } of rows.results) result[key] = value;
  return json(result);
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  let body: Record<string, string> = {};
  try { body = await request.json(); } catch { return err('Invalid JSON'); }

  const allowed = [
    'site_name', 'registration_open', 'signing_enabled',
    'max_devices_per_user', 'stripe_price_id', 'support_email',
  ];

  const updates = Object.entries(body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return err('No valid settings provided');

  await Promise.all(
    updates.map(([k, v]) =>
      env.DB.prepare(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      ).bind(k, String(v)).run(),
    ),
  );

  return json({ updated: updates.map(([k]) => k) });
};
