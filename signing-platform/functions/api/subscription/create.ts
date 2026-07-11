// POST /api/subscription/create — create a Stripe Checkout session
import { err, json } from '../../lib/auth';
import type { Env } from '../../_middleware';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const user = (context as unknown as { data: { user?: { sub: number; email: string } } }).data?.user;
  if (!user) return err('Unauthorized', 401);

  const { env, request } = context;
  let body: { plan?: string; success_url?: string; cancel_url?: string } = {};
  try { body = await request.json(); } catch { /* ignore */ }

  const priceId = body.plan ??
    (await env.DB.prepare("SELECT value FROM settings WHERE key='stripe_price_id'")
      .first<{ value: string }>()).then(r => r?.value ?? '');

  if (!priceId) return err('Stripe price not configured', 500);

  // Get or create Stripe customer
  let customerId: string | null = null;
  const sub = await env.DB.prepare(
    'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? LIMIT 1',
  ).bind(user.sub).first<{ stripe_customer_id: string | null }>();
  customerId = sub?.stripe_customer_id ?? null;

  if (!customerId) {
    const resp = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ email: user.email }),
    });
    const customer = await resp.json() as { id?: string; error?: { message: string } };
    if (!customer.id) return err(customer.error?.message ?? 'Failed to create customer', 500);
    customerId = customer.id;
  }

  const origin = new URL(request.url).origin;
  const params = new URLSearchParams({
    'payment_method_types[]': 'card',
    mode: 'subscription',
    customer: customerId,
    'line_items[0][price]': priceId as string,
    'line_items[0][quantity]': '1',
    success_url: body.success_url ?? `${origin}/dashboard.html?subscribed=1`,
    cancel_url: body.cancel_url ?? `${origin}/dashboard.html`,
    'metadata[user_id]': String(user.sub),
  });

  const sessionResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const session = await sessionResp.json() as { url?: string; error?: { message: string } };
  if (!session.url) return err(session.error?.message ?? 'Failed to create session', 500);

  return json({ url: session.url });
};
