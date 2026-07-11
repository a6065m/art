// POST /api/admin/profiles/upload — upload a .mobileprovision profile to R2
import { err, json } from '../../../../lib/auth';
import type { Env } from '../../../../_middleware';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const formData = await request.formData().catch(() => null);
  if (!formData) return err('Expected multipart/form-data');

  const file = formData.get('file') as File | null;
  const name = formData.get('name') as string | null;
  const bundleId = formData.get('bundle_id') as string | null;
  const teamId = formData.get('team_id') as string | null;
  const expiresAt = formData.get('expires_at') as string | null;

  if (!file || !name) return err('file and name are required');
  if (file.size > 5 * 1024 * 1024) return err('File too large (max 5 MB)');

  const objectKey = `profiles/${crypto.randomUUID()}.mobileprovision`;
  await env.ASSETS_BUCKET.put(objectKey, file.stream(), {
    httpMetadata: { contentType: 'application/x-apple-aspen-config' },
  });

  const result = await env.DB.prepare(
    `INSERT INTO profiles (name, profile_key, bundle_id, team_id, is_active, expires_at)
     VALUES (?, ?, ?, ?, 1, ?)
     RETURNING id, name, bundle_id, team_id, is_active, expires_at, created_at`,
  ).bind(name, objectKey, bundleId ?? null, teamId ?? null, expiresAt ?? null).first();

  if (!result) return err('Failed to save profile', 500);
  return json(result, 201);
};
