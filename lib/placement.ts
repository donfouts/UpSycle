// Shared constants/helpers for the weekly Home/Category/Sub-Category featured
// placement system (Prompts/product_layout.md). Single source of truth so the
// Lambda draw job, the seller purchase flow, the admin override UI, and the
// three page templates can't drift from each other on slot counts/pricing.
import type { PlacementPageType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Prompts/product_layout.md: 10 lottery winners for every page type (Home,
// each top-level Category, each leaf Sub-Category).
export const LOTTERY_WINNER_COUNT = 10;

// Prompts/Page_layout.md: up to 20 paid "Highlighted Artists" slots per
// page/category per period — purchased ones first, unsold ones random-filled
// at Sunday finalize (product_layout.md).
export const PAID_SLOT_COUNT = 20;

// Prompts/product_layout.md's p# pricing (the single paid tier chosen for V1
// — Promotional_Mechanics.md's separate higher-priced "Banner Slot" tier is
// deliberately deferred to the backlog, not built here).
export const PAID_SLOT_PRICE_CENTS: Record<PlacementPageType, number> = {
  HOME: 999,
  SUBCATEGORY: 799,
  CATEGORY: 599,
};

export function placementSlotPriceCents(pageType: PlacementPageType): number {
  return PAID_SLOT_PRICE_CENTS[pageType];
}

/** The single period currently live on the site, if the draw/finalize jobs have ever run. */
export async function getActivePlacementPeriod() {
  return prisma.placementPeriod.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { startsAt: "desc" },
  });
}

/** The newest PENDING period (drawn, purchase window open, not live yet) — used by the seller purchase flow. */
export async function getPendingPlacementPeriod() {
  return prisma.placementPeriod.findFirst({
    where: { status: "PENDING" },
    orderBy: { drawnAt: "desc" },
  });
}

const featuredProductInclude = {
  photos: { orderBy: { position: "asc" as const }, take: 1 },
  sellerProfile: {
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  },
};

/**
 * Resolves the actual Product to render for a winning seller. `featuredProductId`
 * (set by the Sunday finalize cascade only when a seller holds more than one
 * placement in the same period — product_layout.md's Home > Sub-Category >
 * Category > random-fill-paid ranking) wins when present; otherwise falls
 * back to the seller's #1 `marketingPriority` product, which is the normal
 * case for every single-placement winner and every self-purchased paid slot.
 */
export async function resolveFeaturedProduct(sellerProfileId: string, featuredProductId: string | null) {
  if (featuredProductId) {
    const pinned = await prisma.product.findUnique({
      where: { id: featuredProductId },
      include: featuredProductInclude,
    });
    if (pinned) return pinned;
  }
  return prisma.product.findFirst({
    where: { sellerProfileId },
    orderBy: { marketingPriority: "asc" },
    include: featuredProductInclude,
  });
}
