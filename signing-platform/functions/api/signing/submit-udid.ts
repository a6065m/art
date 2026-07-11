// POST /api/signing/submit-udid — submit a UDID for signing
import { err, json } from '../../lib/auth';
import type { Env } from '../../_middleware';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const user = (context as unknown as { data: { user?: { sub: number } } }).data?.user;
  if (!user) return err('Unauthorized', 401);

  const { env, request } = context;

  // Check active subscription
  const sub = await env.DB.prepare(
    "SELECT status FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1",
  ).bind(user.sub).first();
  if (!sub) return err('Active subscription required', 403);

  // Check signing is enabled
  const setting = await env.DB.prepare(
    "SELECT value FROM settings WHERE key = 'signing_enabled'",
  ).first<{ value: string }>();
  if (setting?.value === 'false') return err('Signing is currently disabled', 503);

  let body: { udid?: string; name?: string; model?: string } = {};
  try { body = await request.json(); } catch { /* ignore */ }

  const { udid, name, model } = body;
  if (!udid) return err('udid is required');
  if (!/^[0-9a-fA-F-]{25,45}$/.test(udid)) return err('Invalid UDID format');

  // Check max devices
  const maxDevicesSetting = await env.DB.prepare(
    "SELECT value FROM settings WHERE key = 'max_devices_per_user'",
  ).first<{ value: string }>();
  const maxDevices = Number(maxDevicesSetting?.value ?? 3);

  const deviceCount = await env.DB.prepare(
    'SELECT COUNT(*) AS cnt FROM devices WHERE user_id = ?',
  ).bind(user.sub).first<{ cnt: number }>();
  if ((deviceCount?.cnt ?? 0) >= maxDevices) {
    return err(`Device limit reached (max ${maxDevices})`, 403);
  }

  // Check duplicate UDID
  const existing = await env.DB.prepare(
    'SELECT id FROM devices WHERE udid = ?',
  ).bind(udid.toUpperCase()).first();
  if (existing) return err('This UDID is already registered', 409);

  const result = await env.DB.prepare(
    `INSERT INTO devices (user_id, udid, name, model, status)
     VALUES (?, ?, ?, ?, 'pending')
     RETURNING id, udid, name, model, status, created_at`,
  ).bind(user.sub, udid.toUpperCase(), name ?? null, model ?? null)
    .first<{ id: number; udid: string; name: string | null; model: string | null; status: string; created_at: string }>();

  if (!result) return err('Failed to register device', 500);

  return json(result, 201);
};
