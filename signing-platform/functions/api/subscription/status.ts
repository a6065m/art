// GET /api/subscription/status — return current user's subscription
import { err, json } from '../../lib/auth';
import type { Env } from '../../_middleware';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = (context as unknown as { data: { user?: { sub: number } } }).data?.user;
  if (!user) return err('Unauthorized', 401);

  const row = await context.env.DB.prepare(
    `SELECT plan, status, current_period_start, current_period_end, created_at
     FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
  ).bind(user.sub).first<{
    plan: string; status: string;
    current_period_start: string | null; current_period_end: string | null; created_at: string;
  }>();

  if (!row) return json({ active: false, plan: null });

  return json({
    active: row.status === 'active',
    plan: row.plan,
    status: row.status,
    current_period_start: row.current_period_start,
    current_period_end: row.current_period_end,
  });
};
