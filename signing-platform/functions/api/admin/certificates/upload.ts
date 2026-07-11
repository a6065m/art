// POST /api/admin/certificates/upload — upload a .p12 certificate to R2
import { err, json } from '../../../../lib/auth';
import type { Env } from '../../../../_middleware';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const formData = await request.formData().catch(() => null);
  if (!formData) return err('Expected multipart/form-data');

  const file = formData.get('file') as File | null;
  const name = formData.get('name') as string | null;
  const password = formData.get('password') as string | null;
  const teamId = formData.get('team_id') as string | null;
  const commonName = formData.get('common_name') as string | null;
  const expiresAt = formData.get('expires_at') as string | null;

  if (!file || !name) return err('file and name are required');
  if (file.size > 10 * 1024 * 1024) return err('File too large (max 10 MB)');

  const objectKey = `certificates/${crypto.randomUUID()}.p12`;
  await env.ASSETS_BUCKET.put(objectKey, file.stream(), {
    httpMetadata: { contentType: 'application/x-pkcs12' },
  });

  const result = await env.DB.prepare(
    `INSERT INTO certificates (name, p12_key, password, team_id, common_name, is_active, expires_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)
     RETURNING id, name, common_name, team_id, is_active, expires_at, created_at`,
  ).bind(name, objectKey, password ?? null, teamId ?? null, commonName ?? null, expiresAt ?? null)
    .first();

  if (!result) return err('Failed to save certificate', 500);
  return json(result, 201);
};
