import { hashPassword, signJWT, err, json } from '../../lib/auth';
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Invalid email');
  if (password.length < 8) return err('Password must be at least 8 characters');

  // Check if registration is open
  const setting = await env.DB.prepare(
    "SELECT value FROM settings WHERE key = 'registration_open'",
  ).first<{ value: string }>();
  if (setting?.value === 'false') return err('Registration is currently closed', 403);

  // Check duplicate email
  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?',
  ).bind(email.toLowerCase()).first();
  if (existing) return err('Email already registered', 409);

  const passwordHash = await hashPassword(password);
  const result = await env.DB.prepare(
    "INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'user') RETURNING id, email, role",
  ).bind(email.toLowerCase(), passwordHash).first<{ id: number; email: string; role: string }>();

  if (!result) return err('Failed to create account', 500);

  const token = await signJWT(
    { sub: result.id, email: result.email, role: result.role },
    env.JWT_SECRET,
  );

  return json({ token, user: { id: result.id, email: result.email, role: result.role } }, 201);
};
