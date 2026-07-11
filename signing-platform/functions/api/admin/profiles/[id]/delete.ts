// DELETE /api/admin/profiles/[id]/delete — remove profile from DB and R2
import { err, json } from '../../../../../lib/auth';
import type { Env } from '../../../../../_middleware';

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const id = Number(params['id']);
  if (!id) return err('Invalid id');

  const profile = await env.DB.prepare('SELECT id, profile_key FROM profiles WHERE id = ?')
    .bind(id).first<{ id: number; profile_key: string | null }>();
  if (!profile) return err('Profile not found', 404);

  if (profile.profile_key) {
    await env.ASSETS_BUCKET.delete(profile.profile_key);
  }

  await env.DB.prepare('DELETE FROM profiles WHERE id = ?').bind(id).run();
  return json({ success: true });
};
