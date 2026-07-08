// Stripe webhook endpoint — this is where an Order actually gets created.
//
// We deliberately do NOT create the Order at Checkout Session creation time
// (see app/api/checkout/route.ts): there's no "pending payment" order state
// in the schema (Order has no payment-status field, only a shipping-status
// aggregate), so the only correct moment to write Order/OrderItem rows is
// once Stripe confirms the charge actually succeeded. Until a webhook fires,
// an abandoned/failed Checkout Session simply never becomes an Order.
//
// Signature verification requires the exact raw request body (not the
// JSON-parsed body) — Next.js route handlers give you that via
// `request.text()` as long as you don't call `.json()` first.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe";
import { decodeCartMetadataItems } from "@/lib/cart";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe-Signature header." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    // Not a payment-confirmation event we act on (e.g. session.expired,
    // payment_intent.* variants) — acknowledge and no-op.
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};
  const buyerId = metadata.buyerId;
  const shippingAddressId = metadata.shippingAddressId;
  const lines = decodeCartMetadataItems(metadata.items);
  const stripePaymentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? session.id;

  if (!buyerId || !shippingAddressId || lines.length === 0) {
    console.error("Stripe webhook: checkout.session.completed missing expected metadata", {
      sessionId: session.id,
    });
    return NextResponse.json({ error: "Missing order metadata." }, { status: 400 });
  }

  // Idempotency: Stripe may retry webhook delivery. If we already created an
  // Order for this payment, don't create a second one.
  const existing = await prisma.order.findFirst({ where: { stripePaymentId } });
  if (existing) {
    return NextResponse.json({ received: true, orderId: existing.id });
  }

  const totalAmountCents = lines.reduce(
    (sum, l) => sum + l.unitPriceCents * l.quantity + l.shippingCostCents,
    0,
  );

  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          buyerId,
          shippingAddressId,
          totalAmountCents,
          stripePaymentId,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              sellerProfileId: l.sellerProfileId,
              quantity: l.quantity,
              unitPriceCents: l.unitPriceCents,
              shippingCostCents: l.shippingCostCents,
            })),
          },
        },
        include: { items: true },
      });

      // Decrement inventory per item. The buyer has already been charged at
      // this point, so we still create the order even if stock ran out from
      // under us between Checkout Session creation and payment confirmation
      // (e.g. another buyer bought the last units first) — that's an
      // oversell edge case flagged for manual seller/support follow-up
      // rather than a silently dropped order.
      for (const line of lines) {
        const product = await tx.product.findUnique({ where: { id: line.productId } });
        if (!product) continue;
        const remaining = product.inventoryCount - line.quantity;
        if (remaining < 0) {
          console.error("OVERSOLD: inventory went negative — needs manual follow-up", {
            productId: line.productId,
            orderId: created.id,
            requested: line.quantity,
            available: product.inventoryCount,
          });
        }
        await tx.product.update({
          where: { id: line.productId },
          data: { inventoryCount: Math.max(0, remaining) },
        });
      }

      return created;
    });

    return NextResponse.json({ received: true, orderId: order.id });
  } catch (err) {
    console.error("Failed to create Order after Stripe payment confirmation:", err, {
      sessionId: session.id,
      stripePaymentId,
    });
    // Return 500 so Stripe retries the webhook — the payment already
    // succeeded, so we want another attempt at recording the Order rather
    // than silently losing it.
    return NextResponse.json({ error: "Failed to record order." }, { status: 500 });
  }
}
