// Starts a Stripe Checkout Session for the buyer's cart.
//
// ─── Stripe Connect / payout approach (documented tradeoff) ───────────────
// The issue scope is "Cart and checkout via Stripe Connect," but a cart can
// span multiple sellers, and Stripe Connect's clean per-seller payment
// splitting (destination charges / `transfer_data`) only works for a
// *single* connected account per charge. Splitting one multi-seller cart
// across N destination charges would mean N separate Checkout
// Sessions/PaymentIntents for what the buyer experiences as one order and
// one card charge — a materially bigger scope than an MVP checkout pass,
// and connected accounts aren't onboarded yet anyway (no seller has a
// Stripe Connect account id — that field doesn't even exist on
// SellerProfile yet).
//
// For this pass we do the simpler thing and say so explicitly: ONE Stripe
// Checkout Session per order, charged entirely to the platform's own Stripe
// account (no `transfer_data`/`application_fee_amount`, no connected
// accounts involved). Seller payout is NOT automated here — it's a
// documented follow-up (Stripe Connect Express accounts + either scheduled
// transfers or the "separate charges and transfers" pattern once sellers
// have onboarded). This keeps a single buyer-facing Order/charge while
// deferring the harder multi-account money-movement problem instead of
// silently half-implementing it.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { getStripeClient } from "@/lib/stripe";
import {
  encodeCartMetadataItems,
  MAX_QUANTITY_PER_LINE,
  type CheckoutCartItem,
  type ValidatedCartLine,
} from "@/lib/cart";

interface CheckoutBody {
  items?: CheckoutCartItem[];
  shippingAddressId?: string;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to check out." }, { status: 401 });
  }

  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const shippingAddressId = body.shippingAddressId;

  if (items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Never trust client-submitted prices/quantities: re-fetch every Product
  // live and recompute everything server-side.
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  const validatedLines: ValidatedCartLine[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    const quantity = Math.floor(item.quantity);

    if (!product) {
      return NextResponse.json(
        { error: "One of the items in your cart is no longer available. Please review your cart." },
        { status: 409 },
      );
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_QUANTITY_PER_LINE) {
      return NextResponse.json({ error: `Invalid quantity for "${product.title}".` }, { status: 400 });
    }
    if (product.inventoryCount < quantity) {
      return NextResponse.json(
        {
          error:
            product.inventoryCount > 0
              ? `Only ${product.inventoryCount} left of "${product.title}" — please reduce the quantity.`
              : `"${product.title}" is out of stock.`,
        },
        { status: 409 },
      );
    }

    const requestedFulfillment = item.fulfillmentMethod === "PICKUP" ? "PICKUP" : "SHIP";
    if (requestedFulfillment === "PICKUP" && !product.offersLocalPickup) {
      return NextResponse.json(
        { error: `Local pickup is not available for "${product.title}".` },
        { status: 400 },
      );
    }

    validatedLines.push({
      productId: product.id,
      quantity,
      unitPriceCents: product.priceCents,
      shippingCostCents: requestedFulfillment === "PICKUP" ? 0 : product.shippingCostCents,
      sellerProfileId: product.sellerProfileId,
      title: product.title,
      fulfillmentMethod: requestedFulfillment,
    });
  }

  // An address is only required if at least one line actually ships — an
  // all-pickup cart never needs one.
  const needsAddress = validatedLines.some((l) => l.fulfillmentMethod === "SHIP");
  let address: { id: string } | null = null;
  if (needsAddress) {
    if (!shippingAddressId) {
      return NextResponse.json({ error: "Please select a shipping address." }, { status: 400 });
    }
    // The address must belong to this buyer — never trust a client-supplied
    // address id blindly.
    address = await prisma.address.findFirst({
      where: { id: shippingAddressId, userId: user.id },
    });
    if (!address) {
      return NextResponse.json({ error: "That shipping address could not be found." }, { status: 400 });
    }
  }

  const stripe = getStripeClient();

  const lineItems: Array<{
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string };
    };
    quantity: number;
  }> = [];

  for (const line of validatedLines) {
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: line.unitPriceCents,
        product_data: { name: line.title },
      },
      quantity: line.quantity,
    });
    // Flat shipping cost per listing (not multiplied by quantity) — a
    // per-order shipping-consolidation model is out of scope for this MVP
    // pass; each listing's shippingCostCents is charged once per line. This
    // guard also doubles as the pickup/ship branch: a PICKUP line always has
    // shippingCostCents === 0 (set above), so it naturally gets no shipping
    // line item.
    if (line.shippingCostCents > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: line.shippingCostCents,
          product_data: { name: `Shipping — ${line.title}` },
        },
        quantity: 1,
      });
    }
  }

  const metadata = {
    buyerId: user.id,
    ...(address ? { shippingAddressId: address.id } : {}),
    items: encodeCartMetadataItems(validatedLines),
  };

  const origin = request.headers.get("origin") ?? request.nextUrl.origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: lineItems,
      metadata,
      payment_intent_data: { metadata },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout Session URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Failed to create Stripe Checkout Session:", err);
    return NextResponse.json(
      { error: "Payments are temporarily unavailable. Please try again shortly." },
      { status: 502 },
    );
  }
}
