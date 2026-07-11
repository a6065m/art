// POST /api/admin/users/[id]/toggle-role — toggle user between 'user' and 'admin'
import { err, json } from '../../../../../lib/auth';
import type { Env } from '../../../../../_middleware';

export const onRequestPost: PagesFunction<Env> = async ({ params, env }) => {
  const id = Number(params['id']);
  if (!id) return err('Invalid id');

  const user = await env.DB.prepare('SELECT id, role FROM users WHERE id = ?')
    .bind(id).first<{ id: number; role: string }>();
  if (!user) return err('User not found', 404);

  const newRole = user.role === 'admin' ? 'user' : 'admin';
  await env.DB.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(newRole, id).run();

  return json({ id, role: newRole });
};
