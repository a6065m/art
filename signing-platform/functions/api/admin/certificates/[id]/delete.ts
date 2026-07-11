// DELETE /api/admin/certificates/[id]/delete — remove certificate from DB and R2
import { err, json } from '../../../../../lib/auth';
import type { Env } from '../../../../../_middleware';

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const id = Number(params['id']);
  if (!id) return err('Invalid id');

  const cert = await env.DB.prepare('SELECT id, p12_key FROM certificates WHERE id = ?')
    .bind(id).first<{ id: number; p12_key: string | null }>();
  if (!cert) return err('Certificate not found', 404);

  // Remove from R2
  if (cert.p12_key) {
    await env.ASSETS_BUCKET.delete(cert.p12_key);
  }

  await env.DB.prepare('DELETE FROM certificates WHERE id = ?').bind(id).run();
  return json({ success: true });
};
