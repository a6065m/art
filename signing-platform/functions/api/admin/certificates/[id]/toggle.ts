// POST /api/admin/certificates/[id]/toggle — toggle certificate active state
import { err, json } from '../../../../../lib/auth';
import type { Env } from '../../../../../_middleware';

export const onRequestPost: PagesFunction<Env> = async ({ params, env }) => {
  const id = Number(params['id']);
  if (!id) return err('Invalid id');

  const cert = await env.DB.prepare('SELECT id, is_active FROM certificates WHERE id = ?')
    .bind(id).first<{ id: number; is_active: number }>();
  if (!cert) return err('Certificate not found', 404);

  const newState = cert.is_active ? 0 : 1;
  await env.DB.prepare('UPDATE certificates SET is_active = ? WHERE id = ?')
    .bind(newState, id).run();

  return json({ id, is_active: !!newState });
};
