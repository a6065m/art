// POST /api/subscription/webhook — Stripe webhook handler
import { err, json } from '../../lib/auth';
import type { Env } from '../../_middleware';

async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const parts = Object.fromEntries(signature.split(',').map(p => p.split('=')));
  const timestamp = parts['t'];
  const expectedSig = parts['v1'];
  if (!timestamp || !expectedSig) return false;

  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const computed = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison
  if (computed.length !== expectedSig.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return diff === 0;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const sig = request.headers.get('stripe-signature') ?? '';
  const rawBody = await request.text();

  const valid = await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return err('Invalid signature', 400);

  const event = JSON.parse(rawBody) as {
    type: string;
    data: { object: Record<string, unknown> };
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as {
        customer: string;
        subscription: string;
        metadata: { user_id?: string };
      };
      const userId = Number(session.metadata?.user_id);
      if (!userId) break;

      await env.DB.prepare(
        `INSERT INTO subscriptions (user_id, plan, status, stripe_customer_id, stripe_subscription_id)
         VALUES (?, 'basic', 'active', ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           status = 'active',
           stripe_customer_id = excluded.stripe_customer_id,
           stripe_subscription_id = excluded.stripe_subscription_id,
           updated_at = CURRENT_TIMESTAMP`,
      ).bind(userId, session.customer, session.subscription).run();
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as {
        id: string;
        status: string;
        current_period_start: number;
        current_period_end: number;
      };
      const status = sub.status === 'active' ? 'active'
        : sub.status === 'past_due' ? 'past_due'
        : 'inactive';
      await env.DB.prepare(
        `UPDATE subscriptions SET
           status = ?,
           current_period_start = datetime(?, 'unixepoch'),
           current_period_end = datetime(?, 'unixepoch'),
           updated_at = CURRENT_TIMESTAMP
         WHERE stripe_subscription_id = ?`,
      ).bind(status, sub.current_period_start, sub.current_period_end, sub.id).run();
      break;
    }

    case 'invoice.payment_failed': {
      const inv = event.data.object as { subscription: string };
      await env.DB.prepare(
        `UPDATE subscriptions SET status = 'past_due', updated_at = CURRENT_TIMESTAMP
         WHERE stripe_subscription_id = ?`,
      ).bind(inv.subscription).run();
      break;
    }
  }

  return json({ received: true });
};
