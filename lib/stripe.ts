import Stripe from "stripe";

// Lazy singleton, mirroring lib/cognito.ts's pattern: read the env var only
// when a route actually needs it, so the app still builds/boots without a
// real Stripe account provisioned yet. Stripe Connect is NOT provisioned for
// this MVP pass — see app/api/checkout/route.ts for the payout-approach
// tradeoff this was built against.
let client: Stripe | undefined;

export function getStripeClient(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured. Set it in .env once a Stripe account is provisioned.",
      );
    }
    client = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  }
  return client;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not configured. Set it in .env once the Stripe webhook endpoint is registered.",
    );
  }
  return secret;
}
