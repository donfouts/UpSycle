// Starts a Stripe Checkout Session for a seller buying one of the 20 paid
// "Highlighted" placement slots for a given PlacementPeriod/page/category
// (Prompts/product_layout.md). Mirrors app/api/checkout/route.ts's
// create-session-now / write-the-row-in-the-webhook split: we never write a
// FeaturedSlotPurchase here, only after Stripe confirms the charge
// (app/api/webhooks/stripe/route.ts). Purchasing is open to any seller tier
// — only the free lottery entrant pools are tier-restricted, which doesn't
// apply here.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import type { PlacementPageType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { resolveSellerAuth, sellerAuthErrorResponse } from "@/lib/seller-auth";
import { PAID_SLOT_COUNT, placementSlotPriceCents } from "@/lib/placement";
import { getStripeClient } from "@/lib/stripe";
import { formatDate } from "@/lib/format";

interface PurchaseBody {
  periodId?: string;
  pageType?: string;
  categoryId?: string | null;
}

const VALID_PAGE_TYPES: PlacementPageType[] = ["HOME", "CATEGORY", "SUBCATEGORY"];

function pageTypeName(pageType: PlacementPageType): string {
  switch (pageType) {
    case "HOME":
      return "Home Page";
    case "CATEGORY":
      return "Category Page";
    case "SUBCATEGORY":
      return "Sub-Category Page";
  }
}

export async function POST(request: NextRequest) {
  const auth = await resolveSellerAuth();
  if (!auth.ok) {
    return sellerAuthErrorResponse(auth.failure);
  }
  const { sellerProfileId, email } = auth.seller;

  let body: PurchaseBody;
  try {
    body = (await request.json()) as PurchaseBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { periodId } = body;
  const pageType = body.pageType as PlacementPageType | undefined;
  const categoryId = body.categoryId ?? null;

  if (!periodId || !pageType || !VALID_PAGE_TYPES.includes(pageType)) {
    return NextResponse.json({ error: "Missing or invalid periodId/pageType." }, { status: 400 });
  }
  if ((pageType === "CATEGORY" || pageType === "SUBCATEGORY") && !categoryId) {
    return NextResponse.json({ error: "categoryId is required for that page type." }, { status: 400 });
  }
  if (pageType === "HOME" && categoryId) {
    return NextResponse.json({ error: "HOME slots don't take a categoryId." }, { status: 400 });
  }

  const period = await prisma.placementPeriod.findUnique({ where: { id: periodId } });
  if (!period) {
    return NextResponse.json({ error: "That placement period could not be found." }, { status: 404 });
  }
  if (period.status !== "PENDING") {
    return NextResponse.json(
      { error: "The purchase window for that period has closed." },
      { status: 409 },
    );
  }

  // The seller must actually have something to show on that page: >=1
  // Product directly in the category (SUBCATEGORY) or in the category/one
  // of its children (CATEGORY) — products are always filed under a leaf
  // category (see app/(seller)/sell/products/new/page.tsx), so a top-level
  // CATEGORY purchase is validated via the child relation.
  if (pageType === "SUBCATEGORY") {
    const count = await prisma.product.count({ where: { sellerProfileId, categoryId: categoryId! } });
    if (count === 0) {
      return NextResponse.json(
        { error: "You don't have any products listed in that sub-category." },
        { status: 403 },
      );
    }
  } else if (pageType === "CATEGORY") {
    const count = await prisma.product.count({
      where: { sellerProfileId, category: { OR: [{ id: categoryId! }, { parentId: categoryId! }] } },
    });
    if (count === 0) {
      return NextResponse.json(
        { error: "You don't have any products listed in that category." },
        { status: 403 },
      );
    }
  }

  // Already featured here this week (free win or prior purchase) — one
  // placement per (period, pageType, categoryId) per seller.
  const [existingWin, existingPurchase] = await Promise.all([
    prisma.lotteryWinner.findFirst({
      where: { periodId, pageType, categoryId, sellerProfileId },
    }),
    prisma.featuredSlotPurchase.findFirst({
      where: { periodId, pageType, categoryId, sellerProfileId },
    }),
  ]);
  if (existingWin || existingPurchase) {
    return NextResponse.json(
      { error: "You're already featured here this week." },
      { status: 409 },
    );
  }

  // Lowest unclaimed slot number 1..PAID_SLOT_COUNT. This is only a
  // best-effort pick to show the seller a slot number / confirm availability
  // before sending them to Stripe — see app/api/webhooks/stripe/route.ts for
  // why the final slot number is re-resolved at payment-confirmation time
  // rather than trusted from here (two sellers could race for the same
  // number between session creation and webhook delivery).
  const takenSlots = await prisma.featuredSlotPurchase.findMany({
    where: { periodId, pageType, categoryId },
    select: { slotNumber: true },
  });
  const takenSet = new Set(takenSlots.map((s) => s.slotNumber));
  let slotNumber: number | null = null;
  for (let n = 1; n <= PAID_SLOT_COUNT; n++) {
    if (!takenSet.has(n)) {
      slotNumber = n;
      break;
    }
  }
  if (slotNumber === null) {
    return NextResponse.json({ error: "All slots are sold for this period." }, { status: 409 });
  }

  const stripe = getStripeClient();
  const priceCents = placementSlotPriceCents(pageType);
  const metadata = {
    kind: "placement_slot",
    periodId,
    pageType,
    categoryId: categoryId ?? "",
    slotNumber: String(slotNumber),
    sellerProfileId,
  };

  const origin = request.headers.get("origin") ?? request.nextUrl.origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: priceCents,
            product_data: {
              name: `${pageTypeName(pageType)} Featured Slot — Week of ${formatDate(period.startsAt)}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata,
      payment_intent_data: { metadata },
      success_url: `${origin}/sell/marketing`,
      cancel_url: `${origin}/sell/marketing`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout Session URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Failed to create Stripe Checkout Session for placement slot:", err);
    return NextResponse.json(
      { error: "Payments are temporarily unavailable. Please try again shortly." },
      { status: 502 },
    );
  }
}
