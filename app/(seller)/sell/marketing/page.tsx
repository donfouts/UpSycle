// Seller-facing view of the weekly Home/Category/Sub-Category featured
// placement system (Prompts/product_layout.md): shows this seller's free
// lottery results for the current PENDING/ACTIVE periods, and — while a
// PENDING period's purchase window is open — lets them buy one of the 20
// paid "Highlighted" slots per page/category. See lib/placement.ts for the
// shared constants/helpers this reads.
import Link from "next/link";
import type { Metadata } from "next";
import type { PlacementPageType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSellerPageAuth, sellerAuthFailureMessage } from "@/lib/seller-auth";
import { PAID_SLOT_COUNT, getPendingPlacementPeriod, placementSlotPriceCents } from "@/lib/placement";
import { formatDate, formatPriceCents } from "@/lib/format";
import PlacementSlotPurchase from "@/components/seller/PlacementSlotPurchase";

export const metadata: Metadata = {
  title: "Marketing — UpSycle Market",
};

// Always fetched live from the DB — no build-time prerender.
export const dynamic = "force-dynamic";

type CategoryWithParent = {
  id: string;
  name: string;
  parentId: string | null;
  parent: { id: string; name: string } | null;
};

/** Human-readable "where" for a lottery win / slot purchase row. */
function placeName(pageType: PlacementPageType, category: CategoryWithParent | null): string {
  if (pageType === "HOME") return "the Home Page";
  if (pageType === "CATEGORY") return category ? `${category.name} → Category Page` : "a Category Page";
  // SUBCATEGORY
  return category ? `${category.parent?.name ?? "Category"} → ${category.name}` : "a Sub-Category Page";
}

export default async function SellerMarketingPage() {
  const auth = await requireSellerPageAuth("/sell/marketing");

  if (!auth.ok) {
    return (
      <div className="border border-[var(--border)] bg-[var(--charcoal)] p-10 text-center md:p-14">
        <div className="eyebrow justify-center before:hidden">Marketing</div>
        <h1 className="sec-title">
          Not quite <em>ready yet</em>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-[0.95rem] font-light leading-loose text-[var(--muted2)]">
          {sellerAuthFailureMessage(auth.failure)}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {auth.failure.kind === "no-seller-profile" && (
            <Link href="/sell/signup" className="btn-primary">
              Apply to Sell
            </Link>
          )}
          <Link href="/" className="btn-secondary">
            Back to UpSycle Market
          </Link>
        </div>
      </div>
    );
  }

  const sellerProfileId = auth.seller.sellerProfileId;

  const [periods, pendingPeriod] = await Promise.all([
    prisma.placementPeriod.findMany({
      where: { status: { in: ["PENDING", "ACTIVE"] } },
      orderBy: { startsAt: "desc" },
    }),
    getPendingPlacementPeriod(),
  ]);
  const periodIds = periods.map((p) => p.id);
  const periodById = new Map(periods.map((p) => [p.id, p]));

  const [winners, purchases] = await Promise.all([
    periodIds.length
      ? prisma.lotteryWinner.findMany({
          where: { sellerProfileId, periodId: { in: periodIds } },
          include: { category: { include: { parent: true } } },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    periodIds.length
      ? prisma.featuredSlotPurchase.findMany({
          where: { sellerProfileId, periodId: { in: periodIds } },
          include: { category: { include: { parent: true } } },
          orderBy: { purchasedAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  // Already-featured combos for the pending period, so the purchase panel
  // doesn't offer a "Buy" button the API would just reject anyway.
  const alreadyFeaturedKeys = new Set<string>();
  if (pendingPeriod) {
    for (const w of winners) {
      if (w.periodId === pendingPeriod.id) alreadyFeaturedKeys.add(`${w.pageType}:${w.categoryId ?? ""}`);
    }
    for (const p of purchases) {
      if (p.periodId === pendingPeriod.id) alreadyFeaturedKeys.add(`${p.pageType}:${p.categoryId ?? ""}`);
    }
  }

  // Build the category picker: only categories/sub-categories this seller
  // actually has >=1 Product in (directly for SUBCATEGORY; via a child leaf
  // category for CATEGORY, since products are always filed under a leaf —
  // see app/(seller)/sell/products/new/page.tsx).
  let homeRemaining = 0;
  let categoryRows: Array<{
    id: string;
    pageType: "CATEGORY" | "SUBCATEGORY";
    label: string;
    remaining: number;
    alreadyFeatured: boolean;
  }> = [];

  if (pendingPeriod) {
    const sellerProducts = await prisma.product.findMany({
      where: { sellerProfileId },
      select: { categoryId: true, category: { select: { parentId: true } } },
    });
    const leafCategoryIds = new Set(sellerProducts.map((p) => p.categoryId));
    const topLevelCategoryIds = new Set(
      sellerProducts.map((p) => p.category.parentId).filter((id): id is string => Boolean(id)),
    );

    const allCategories = await prisma.category.findMany({ include: { parent: true } });
    const eligibleTopLevel = allCategories.filter((c) => !c.parentId && topLevelCategoryIds.has(c.id));
    const eligibleLeaf = allCategories.filter((c) => c.parentId && leafCategoryIds.has(c.id));

    const [homeCount, ...categoryCounts] = await Promise.all([
      prisma.featuredSlotPurchase.count({
        where: { periodId: pendingPeriod.id, pageType: "HOME", categoryId: null },
      }),
      ...eligibleTopLevel.map((c) =>
        prisma.featuredSlotPurchase.count({
          where: { periodId: pendingPeriod.id, pageType: "CATEGORY", categoryId: c.id },
        }),
      ),
      ...eligibleLeaf.map((c) =>
        prisma.featuredSlotPurchase.count({
          where: { periodId: pendingPeriod.id, pageType: "SUBCATEGORY", categoryId: c.id },
        }),
      ),
    ]);

    homeRemaining = PAID_SLOT_COUNT - homeCount;

    categoryRows = [
      ...eligibleTopLevel.map((c, i) => ({
        id: c.id,
        pageType: "CATEGORY" as const,
        label: `${c.name} (Category Page)`,
        remaining: PAID_SLOT_COUNT - categoryCounts[i],
        alreadyFeatured: alreadyFeaturedKeys.has(`CATEGORY:${c.id}`),
      })),
      ...eligibleLeaf.map((c, i) => ({
        id: c.id,
        pageType: "SUBCATEGORY" as const,
        label: `${c.parent?.name ?? "Category"} → ${c.name}`,
        remaining: PAID_SLOT_COUNT - categoryCounts[eligibleTopLevel.length + i],
        alreadyFeatured: alreadyFeaturedKeys.has(`SUBCATEGORY:${c.id}`),
      })),
    ];
  }

  return (
    <div>
      <div className="mb-10">
        <div className="eyebrow before:hidden">My Shop</div>
        <h1 className="sec-title">
          Marketing &amp; <em>Featured Placement</em>
        </h1>
        <p className="mt-3 max-w-2xl text-[0.85rem] font-light text-[var(--muted2)]">
          Every week, UpSycle Market draws free Featured Artist winners for the Home Page and every
          category/sub-category page. You can also buy one of a limited number of paid Highlighted slots
          while the purchase window is open.
        </p>
      </div>

      <div className="border border-[var(--border)] bg-[var(--charcoal)] p-6 md:p-8">
        <h2 className="mb-4 font-serif text-[1.15rem] text-[var(--cream)]">Your Lottery Results</h2>
        {winners.length === 0 && purchases.length === 0 ? (
          <p className="text-[0.85rem] font-light text-[var(--muted2)]">
            No featured placements yet this week — check back after Saturday&rsquo;s drawing.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {winners.map((w) => {
              const period = periodById.get(w.periodId);
              return (
                <li
                  key={w.id}
                  className="border border-[var(--border)] bg-[var(--panel2)] px-4 py-3 text-[0.85rem] text-[var(--cream)]"
                >
                  You&rsquo;re a <strong className="grad-text">Featured Artist</strong> on{" "}
                  {placeName(w.pageType, w.category)} this week
                  {period?.status === "ACTIVE" ? " — live now!" : " (goes live Sunday)!"}
                </li>
              );
            })}
            {purchases.map((p) => {
              const period = periodById.get(p.periodId);
              return (
                <li
                  key={p.id}
                  className="border border-[var(--border)] bg-[var(--panel2)] px-4 py-3 text-[0.85rem] text-[var(--cream)]"
                >
                  You bought <strong className="grad-text">Highlighted slot #{p.slotNumber}</strong> on{" "}
                  {placeName(p.pageType, p.category)} this week ({formatPriceCents(p.priceCents)})
                  {period?.status === "ACTIVE" ? " — live now!" : " (goes live Sunday)!"}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-8 border border-[var(--border)] bg-[var(--charcoal)] p-6 md:p-8">
        <h2 className="mb-2 font-serif text-[1.15rem] text-[var(--cream)]">Buy a Highlighted Slot</h2>
        {!pendingPeriod ? (
          <p className="text-[0.85rem] font-light text-[var(--muted2)]">
            No purchase window open right now — check back after Saturday&rsquo;s drawing.
          </p>
        ) : (
          <>
            <p className="mb-5 text-[0.8rem] font-light text-[var(--muted2)]">
              Purchase window open for the week of {formatDate(pendingPeriod.startsAt)}. Any seller may buy a
              slot — first come, first served, up to {PAID_SLOT_COUNT} per page.
            </p>
            <div className="flex flex-col gap-px bg-[var(--border)]">
              <PlacementSlotPurchase
                periodId={pendingPeriod.id}
                pageType="HOME"
                categoryId={null}
                label="Home Page"
                priceCents={placementSlotPriceCents("HOME")}
                remaining={homeRemaining}
                alreadyFeatured={alreadyFeaturedKeys.has("HOME:")}
              />
              {categoryRows.map((row) => (
                <PlacementSlotPurchase
                  key={`${row.pageType}:${row.id}`}
                  periodId={pendingPeriod.id}
                  pageType={row.pageType}
                  categoryId={row.id}
                  label={row.label}
                  priceCents={placementSlotPriceCents(row.pageType)}
                  remaining={row.remaining}
                  alreadyFeatured={row.alreadyFeatured}
                />
              ))}
            </div>
            {categoryRows.length === 0 && (
              <p className="mt-4 text-[0.78rem] font-light text-[var(--muted2)]">
                Add a product to a category before you can buy a Highlighted slot for it.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
