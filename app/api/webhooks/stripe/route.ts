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
import type { PlacementPageType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe";
import { decodeCartMetadataItems } from "@/lib/cart";
import { PAID_SLOT_COUNT, placementSlotPriceCents } from "@/lib/placement";

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
  const stripePaymentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? session.id;

  // Placement-slot purchases (app/api/sellers/marketing/purchase/route.ts)
  // use a completely different metadata shape (no `items`/`buyerId`) — branch
  // out before the cart-order logic below, which assumes `metadata.items`
  // exists and would misfire ("missing order metadata") on this shape.
  if (metadata.kind === "placement_slot") {
    return handlePlacementSlotPurchase(metadata, stripePaymentId, session.id);
  }

  const buyerId = metadata.buyerId;
  const shippingAddressId = metadata.shippingAddressId;
  const lines = decodeCartMetadataItems(metadata.items);

  // An address is only required if at least one line actually ships — an
  // all-pickup order legitimately has no shippingAddressId. Re-derived from
  // the decoded lines rather than trusting a separate metadata flag.
  const needsAddress = lines.some((l) => l.fulfillmentMethod === "SHIP");

  if (!buyerId || lines.length === 0 || (needsAddress && !shippingAddressId)) {
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
          shippingAddressId: shippingAddressId ?? null,
          totalAmountCents,
          stripePaymentId,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              sellerProfileId: l.sellerProfileId,
              quantity: l.quantity,
              unitPriceCents: l.unitPriceCents,
              shippingCostCents: l.shippingCostCents,
              fulfillmentMethod: l.fulfillmentMethod,
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

/**
 * checkout.session.completed for a placement-slot purchase
 * (app/api/sellers/marketing/purchase/route.ts). Creates the
 * FeaturedSlotPurchase row only now that Stripe has confirmed payment —
 * same "don't trust an uncompleted session" principle as the cart-order
 * path above.
 */
async function handlePlacementSlotPurchase(
  metadata: Record<string, string>,
  stripePaymentId: string,
  sessionId: string,
): Promise<NextResponse> {
  const periodId = metadata.periodId;
  const pageType = metadata.pageType as PlacementPageType | undefined;
  const categoryId = metadata.categoryId ? metadata.categoryId : null;
  const sellerProfileId = metadata.sellerProfileId;

  if (!periodId || !pageType || !sellerProfileId) {
    console.error("Stripe webhook: placement_slot checkout.session.completed missing expected metadata", {
      sessionId,
    });
    return NextResponse.json({ error: "Missing placement slot metadata." }, { status: 400 });
  }

  // Idempotency: Stripe may retry webhook delivery. If we already created a
  // FeaturedSlotPurchase for this payment, don't create a second one.
  const existing = await prisma.featuredSlotPurchase.findFirst({ where: { stripePaymentId } });
  if (existing) {
    return NextResponse.json({ received: true, slotPurchaseId: existing.id });
  }

  try {
    const slotPurchase = await prisma.$transaction(async (tx) => {
      // Re-validate slot availability inside the transaction rather than
      // trusting the slotNumber the purchase route picked earlier: two
      // sellers can race for the same number between session creation and
      // webhook confirmation. The buyer has already been charged at this
      // point, so instead of failing an already-paid purchase if their
      // originally-picked slot got taken first, we just insert at the next
      // available slotNumber for this (periodId, pageType, categoryId).
      const taken = await tx.featuredSlotPurchase.findMany({
        where: { periodId, pageType, categoryId },
        select: { slotNumber: true },
      });
      const takenSet = new Set(taken.map((s) => s.slotNumber));
      let slotNumber: number | null = null;
      for (let n = 1; n <= PAID_SLOT_COUNT; n++) {
        if (!takenSet.has(n)) {
          slotNumber = n;
          break;
        }
      }
      if (slotNumber === null) {
        // All 20 slots filled by the time payment confirmed — extremely
        // unlikely (would mean 20 successful purchases raced this one) but
        // flagged for manual follow-up/refund rather than silently dropped.
        console.error("PLACEMENT SLOT OVERSOLD: no slotNumber available at webhook time — needs refund/manual follow-up", {
          periodId,
          pageType,
          categoryId,
          sellerProfileId,
          stripePaymentId,
        });
        throw new Error("No placement slot available.");
      }

      return tx.featuredSlotPurchase.create({
        data: {
          periodId,
          pageType,
          categoryId,
          slotNumber,
          sellerProfileId,
          priceCents: placementSlotPriceCents(pageType),
          isRandomFill: false,
          stripePaymentId,
        },
      });
    });

    return NextResponse.json({ received: true, slotPurchaseId: slotPurchase.id });
  } catch (err) {
    console.error("Failed to create FeaturedSlotPurchase after Stripe payment confirmation:", err, {
      sessionId,
      stripePaymentId,
    });
    // Return 500 so Stripe retries the webhook — the payment already
    // succeeded, so we want another attempt at recording the slot rather
    // than silently losing it.
    return NextResponse.json({ error: "Failed to record placement slot purchase." }, { status: 500 });
  }
}
