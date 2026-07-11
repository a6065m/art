// POST /api/admin/profiles/[id]/toggle — toggle profile active state
import { err, json } from '../../../../../lib/auth';
import type { Env } from '../../../../../_middleware';

export const onRequestPost: PagesFunction<Env> = async ({ params, env }) => {
  const id = Number(params['id']);
  if (!id) return err('Invalid id');

  const profile = await env.DB.prepare('SELECT id, is_active FROM profiles WHERE id = ?')
    .bind(id).first<{ id: number; is_active: number }>();
  if (!profile) return err('Profile not found', 404);

  const newState = profile.is_active ? 0 : 1;
  await env.DB.prepare('UPDATE profiles SET is_active = ? WHERE id = ?')
    .bind(newState, id).run();

  return json({ id, is_active: !!newState });
};
