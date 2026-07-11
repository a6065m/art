// GET /api/admin/stats — dashboard statistics
import { json } from '../../../lib/auth';
import type { Env } from '../../../_middleware';

export const onRequestGet: PagesFunction<Env> = async ({ env, data }) => {
  if (!(data as { user?: { role: string } }).user) return err('Unauthorized', 401);

  const [users, activeSubs, pendingDevices, signedDevices, certs, profiles, requests] =
    await Promise.all([
      env.DB.prepare('SELECT COUNT(*) AS cnt FROM users').first<{ cnt: number }>(),
      env.DB.prepare("SELECT COUNT(*) AS cnt FROM subscriptions WHERE status = 'active'").first<{ cnt: number }>(),
      env.DB.prepare("SELECT COUNT(*) AS cnt FROM devices WHERE status = 'pending'").first<{ cnt: number }>(),
      env.DB.prepare("SELECT COUNT(*) AS cnt FROM devices WHERE status = 'signed'").first<{ cnt: number }>(),
      env.DB.prepare('SELECT COUNT(*) AS cnt FROM certificates WHERE is_active = 1').first<{ cnt: number }>(),
      env.DB.prepare('SELECT COUNT(*) AS cnt FROM profiles WHERE is_active = 1').first<{ cnt: number }>(),
      env.DB.prepare('SELECT COUNT(*) AS cnt FROM signing_requests').first<{ cnt: number }>(),
    ]);

  return json({
    total_users: users?.cnt ?? 0,
    active_subscriptions: activeSubs?.cnt ?? 0,
    pending_devices: pendingDevices?.cnt ?? 0,
    signed_devices: signedDevices?.cnt ?? 0,
    active_certificates: certs?.cnt ?? 0,
    active_profiles: profiles?.cnt ?? 0,
    total_signing_requests: requests?.cnt ?? 0,
  });
};
