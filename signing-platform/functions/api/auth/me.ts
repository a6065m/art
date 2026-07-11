import { err, json } from '../../lib/auth';
import type { Env } from '../../_middleware';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = (context as unknown as { data: { user?: { sub: number } } }).data?.user;
  if (!user) return err('Unauthorized', 401);

  const row = await context.env.DB.prepare(
    `SELECT u.id, u.email, u.role, u.created_at,
            s.plan, s.status AS subscription_status, s.current_period_end
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id
     WHERE u.id = ?
     ORDER BY s.created_at DESC
     LIMIT 1`,
  ).bind(user.sub).first<{
    id: number; email: string; role: string; created_at: string;
    plan: string | null; subscription_status: string | null; current_period_end: string | null;
  }>();

  if (!row) return err('User not found', 404);

  return json({
    id: row.id,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
    subscription: row.plan
      ? { plan: row.plan, status: row.subscription_status, expires_at: row.current_period_end }
      : null,
  });
};
