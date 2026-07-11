import { verifyPassword, signJWT, err, json } from '../../lib/auth';
import type { Env } from '../../_middleware';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON');
  }

  const { email, password } = body;
  if (!email || !password) return err('email and password are required');

  const user = await env.DB.prepare(
    'SELECT id, email, role, password_hash FROM users WHERE email = ?',
  ).bind(email.toLowerCase()).first<{ id: number; email: string; role: string; password_hash: string }>();

  if (!user) return err('Invalid credentials', 401);

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return err('Invalid credentials', 401);

  const token = await signJWT(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
  );

  return json({ token, user: { id: user.id, email: user.email, role: user.role } });
};
