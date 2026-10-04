// Weekly Home/Category/Sub-Category featured placement jobs (business rules
// reconciled with the user — see the task spec that introduced this file,
// NOT Prompts/product_layout.md, which has conflicting numbers). Two entry
// points, each meant to run from a single weekly-scheduled Lambda invocation
// (see infra/lib/stacks/placement-stack.ts + infra/lambda/placement/handler.ts):
//
//   - runLotteryDraw()      — Saturday: draws a new PENDING PlacementPeriod's
//                             lottery winners for Home/every Category/every
//                             Sub-Category. This is also when the seller
//                             purchase window for paid slots opens, but actual
//                             purchases are a separate API route (not here).
//   - runPlacementFinalize() — Sunday 00:00: locks in purchased paid slots,
//                             random-fills unsold ones, runs the
//                             cross-placement "which product gets shown"
//                             cascade, and flips PENDING -> ACTIVE (archiving
//                             whichever period was previously ACTIVE).
//
// All DB access goes through the shared `@/lib/prisma` client / `@/lib/placement`
// constants/helpers so the Lambda, the seller purchase flow, the admin
// override UI, and the page templates can't drift from each other.
import {
  PlacementPageType,
  SellerApprovalStatus,
  SellerTier,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  LOTTERY_WINNER_COUNT,
  PAID_SLOT_COUNT,
  getPendingPlacementPeriod,
} from "@/lib/placement";

type Tx = Prisma.TransactionClient;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** The next UTC midnight that falls on a Sunday, strictly after `from`. */
function nextSundayMidnightUtc(from: Date): Date {
  const midnightToday = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  );
  let daysToAdd = (7 - midnightToday.getUTCDay()) % 7; // getUTCDay(): Sunday = 0
  if (daysToAdd === 0) daysToAdd = 7; // `from` is already Sunday 00:00 — want *next* week's Sunday
  midnightToday.setUTCDate(midnightToday.getUTCDate() + daysToAdd);
  return midnightToday;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

// ---------------------------------------------------------------------------
// Random selection
// ---------------------------------------------------------------------------

/** Fisher-Yates partial shuffle — returns up to `count` distinct elements from `pool`, in random order. */
function pickRandom<T>(pool: readonly T[], count: number): T[] {
  const arr = [...pool];
  const n = Math.min(Math.max(count, 0), arr.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

// ---------------------------------------------------------------------------
// Eligibility pools
// ---------------------------------------------------------------------------

/** HOME eligibility: any APPROVED seller with >=1 Product, any tier. Also used (unfiltered by category) as HOME's paid-slot random-fill pool. */
async function eligibleHomeSellers(tx: Tx): Promise<string[]> {
  const rows = await tx.sellerProfile.findMany({
    where: { approvalStatus: SellerApprovalStatus.APPROVED, products: { some: {} } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/**
 * APPROVED sellers with >=1 Product whose categoryId is in `categoryIds`.
 * `tier` applies the lottery's tier restriction (TIER_1 for CATEGORY, TIER_2
 * for SUBCATEGORY); omit it for paid-slot random-fill pools, which per the
 * business rules have no tier restriction.
 */
async function eligibleSellersByCategoryIds(
  tx: Tx,
  categoryIds: string[],
  tier?: SellerTier
): Promise<string[]> {
  const rows = await tx.sellerProfile.findMany({
    where: {
      approvalStatus: SellerApprovalStatus.APPROVED,
      ...(tier ? { tier } : {}),
      products: { some: { categoryId: { in: categoryIds } } },
    },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

type CategoryWithChildren = Prisma.CategoryGetPayload<{ include: { children: true } }>;

async function getTopLevelCategoriesWithChildren(tx: Tx): Promise<CategoryWithChildren[]> {
  return tx.category.findMany({
    where: { parentId: null },
    include: { children: true },
  });
}

// ---------------------------------------------------------------------------
// Saturday: lottery draw
// ---------------------------------------------------------------------------

export async function runLotteryDraw(): Promise<void> {
  const now = new Date();
  const startsAt = nextSundayMidnightUtc(now);
  const endsAt = addDays(startsAt, 7);

  await prisma.$transaction(async (tx) => {
    const topLevelCategories = await getTopLevelCategoriesWithChildren(tx);

    const period = await tx.placementPeriod.create({
      data: { startsAt, endsAt, status: "PENDING", drawnAt: now },
    });

    const winnerRows: Prisma.LotteryWinnerCreateManyInput[] = [];

    // HOME: any APPROVED seller with >=1 product, any tier.
    const homePool = await eligibleHomeSellers(tx);
    pickRandom(homePool, LOTTERY_WINNER_COUNT).forEach((sellerProfileId, idx) => {
      winnerRows.push({
        periodId: period.id,
        pageType: PlacementPageType.HOME,
        categoryId: null,
        sellerProfileId,
        rank: idx + 1,
      });
    });

    for (const top of topLevelCategories) {
      const childIds = top.children.map((c) => c.id);

      // CATEGORY: APPROVED, TIER_1, >=1 product in this top-level category OR a child.
      const categoryPool = await eligibleSellersByCategoryIds(
        tx,
        [top.id, ...childIds],
        SellerTier.TIER_1
      );

      // Nice-to-have: try to guarantee >=1 winner per distinct child
      // sub-category (deduped across sellers) before random-filling the rest.
      const guaranteed: string[] = [];
      const usedSellerIds = new Set<string>();
      for (const child of top.children) {
        const childCandidates = await eligibleSellersByCategoryIds(tx, [child.id], SellerTier.TIER_1);
        const candidates = childCandidates.filter(
          (id) => !usedSellerIds.has(id) && categoryPool.includes(id)
        );
        if (candidates.length > 0) {
          const [chosen] = pickRandom(candidates, 1);
          guaranteed.push(chosen);
          usedSellerIds.add(chosen);
        }
      }
      const fillPool = categoryPool.filter((id) => !usedSellerIds.has(id));
      const fillCount = Math.max(0, LOTTERY_WINNER_COUNT - guaranteed.length);
      const categoryWinners = [...guaranteed, ...pickRandom(fillPool, fillCount)];
      categoryWinners.forEach((sellerProfileId, idx) => {
        winnerRows.push({
          periodId: period.id,
          pageType: PlacementPageType.CATEGORY,
          categoryId: top.id,
          sellerProfileId,
          rank: idx + 1,
        });
      });

      // SUBCATEGORY: APPROVED, TIER_2, >=1 product exactly in this leaf category.
      for (const child of top.children) {
        const subPool = await eligibleSellersByCategoryIds(tx, [child.id], SellerTier.TIER_2);
        pickRandom(subPool, LOTTERY_WINNER_COUNT).forEach((sellerProfileId, idx) => {
          winnerRows.push({
            periodId: period.id,
            pageType: PlacementPageType.SUBCATEGORY,
            categoryId: child.id,
            sellerProfileId,
            rank: idx + 1,
          });
        });
      }
    }

    if (winnerRows.length > 0) {
      await tx.lotteryWinner.createMany({ data: winnerRows });
    }
  });
}

// ---------------------------------------------------------------------------
// Sunday 00:00: finalize
// ---------------------------------------------------------------------------

interface PlacementTarget {
  pageType: PlacementPageType;
  categoryId: string | null;
  /** Category ids a seller's Product.categoryId must fall into for this target's paid-slot random-fill pool; null for HOME (any product). */
  poolCategoryIds: string[] | null;
}

function buildTargets(topLevelCategories: CategoryWithChildren[]): PlacementTarget[] {
  const targets: PlacementTarget[] = [{ pageType: PlacementPageType.HOME, categoryId: null, poolCategoryIds: null }];
  for (const top of topLevelCategories) {
    const childIds = top.children.map((c) => c.id);
    targets.push({
      pageType: PlacementPageType.CATEGORY,
      categoryId: top.id,
      poolCategoryIds: [top.id, ...childIds],
    });
    for (const child of top.children) {
      targets.push({
        pageType: PlacementPageType.SUBCATEGORY,
        categoryId: child.id,
        poolCategoryIds: [child.id],
      });
    }
  }
  return targets;
}

/** Random-fills any paid slot (1..PAID_SLOT_COUNT) not already purchased for `target`, no tier restriction. */
async function randomFillUnsoldSlots(tx: Tx, periodId: string, target: PlacementTarget): Promise<void> {
  const existingSlots = await tx.featuredSlotPurchase.findMany({
    where: { periodId, pageType: target.pageType, categoryId: target.categoryId },
    select: { slotNumber: true, sellerProfileId: true },
  });
  const takenSlotNumbers = new Set(existingSlots.map((s) => s.slotNumber));
  const missingSlotNumbers: number[] = [];
  for (let n = 1; n <= PAID_SLOT_COUNT; n++) {
    if (!takenSlotNumbers.has(n)) missingSlotNumbers.push(n);
  }
  if (missingSlotNumbers.length === 0) return;

  // Avoid randomly handing this same page/category section a seller who
  // already holds a lottery-winner or purchased-slot row in it.
  const existingWinners = await tx.lotteryWinner.findMany({
    where: { periodId, pageType: target.pageType, categoryId: target.categoryId },
    select: { sellerProfileId: true },
  });
  const excluded = new Set<string>([
    ...existingSlots.map((s) => s.sellerProfileId),
    ...existingWinners.map((w) => w.sellerProfileId),
  ]);

  const pool = target.poolCategoryIds
    ? await eligibleSellersByCategoryIds(tx, target.poolCategoryIds)
    : await eligibleHomeSellers(tx);
  const candidates = pool.filter((id) => !excluded.has(id));
  const fillSellers = pickRandom(candidates, missingSlotNumbers.length);

  const fillRows: Prisma.FeaturedSlotPurchaseCreateManyInput[] = fillSellers.map((sellerProfileId, idx) => ({
    periodId,
    pageType: target.pageType,
    categoryId: target.categoryId,
    slotNumber: missingSlotNumbers[idx],
    sellerProfileId,
    priceCents: 0,
    isRandomFill: true,
  }));
  if (fillRows.length > 0) {
    await tx.featuredSlotPurchase.createMany({ data: fillRows });
  }
}

interface CascadeRow {
  kind: "winner" | "slot";
  id: string;
  pageType: PlacementPageType;
  sellerProfileId: string;
}

function cascadePriority(row: CascadeRow): number {
  if (row.kind === "slot") return 3; // random-filled paid slots last
  if (row.pageType === PlacementPageType.HOME) return 0;
  if (row.pageType === PlacementPageType.SUBCATEGORY) return 1;
  return 2; // CATEGORY
}

/**
 * Cross-placement cascade: a seller holding more than one placement this
 * period (across LotteryWinner rows + isRandomFill FeaturedSlotPurchase rows
 * only — purchased slots are never touched) gets their top-priority row's
 * featuredProductId left null (resolves to their #1 marketingPriority
 * product elsewhere), and each subsequent row pinned to their next product
 * by marketingPriority rank. Priority: HOME lottery > SUBCATEGORY lottery >
 * CATEGORY lottery > random-filled paid slots, stable within a tier.
 */
async function runCascade(tx: Tx, periodId: string): Promise<void> {
  const winners = await tx.lotteryWinner.findMany({
    where: { periodId },
    orderBy: [{ pageType: "asc" }, { categoryId: "asc" }, { rank: "asc" }],
    select: { id: true, pageType: true, sellerProfileId: true },
  });
  const randomFillSlots = await tx.featuredSlotPurchase.findMany({
    where: { periodId, isRandomFill: true },
    orderBy: [{ pageType: "asc" }, { categoryId: "asc" }, { slotNumber: "asc" }],
    select: { id: true, pageType: true, sellerProfileId: true },
  });

  const rows: CascadeRow[] = [
    ...winners.map((w) => ({ kind: "winner" as const, id: w.id, pageType: w.pageType, sellerProfileId: w.sellerProfileId })),
    ...randomFillSlots.map((s) => ({ kind: "slot" as const, id: s.id, pageType: s.pageType, sellerProfileId: s.sellerProfileId })),
  ];

  const bySeller = new Map<string, CascadeRow[]>();
  for (const row of rows) {
    const list = bySeller.get(row.sellerProfileId);
    if (list) list.push(row);
    else bySeller.set(row.sellerProfileId, [row]);
  }

  for (const [sellerProfileId, sellerRows] of bySeller) {
    if (sellerRows.length <= 1) continue; // single placement — nothing to disambiguate

    // Stable sort (Array#sort is stable in Node) preserves the fetch order
    // (pageType/categoryId/rank-or-slotNumber) within a priority tier.
    const sorted = [...sellerRows].sort((a, b) => cascadePriority(a) - cascadePriority(b));

    const products = await tx.product.findMany({
      where: { sellerProfileId },
      orderBy: { marketingPriority: "asc" },
      select: { id: true },
    });

    // position 0 (top priority) is left alone — featuredProductId is already
    // null from creation, which resolves to the seller's #1 product.
    for (let position = 1; position < sorted.length; position++) {
      const row = sorted[position];
      const featuredProductId = products[position]?.id ?? null;
      if (row.kind === "winner") {
        await tx.lotteryWinner.update({ where: { id: row.id }, data: { featuredProductId } });
      } else {
        await tx.featuredSlotPurchase.update({ where: { id: row.id }, data: { featuredProductId } });
      }
    }
  }
}

export async function runPlacementFinalize(): Promise<void> {
  const pendingPeriod = await getPendingPlacementPeriod();
  if (!pendingPeriod) return; // nothing drawn this week — nothing to finalize

  await prisma.$transaction(async (tx) => {
    const topLevelCategories = await getTopLevelCategoriesWithChildren(tx);
    const targets = buildTargets(topLevelCategories);

    // 1. Lock in already-purchased slots (no action needed — they're simply
    //    left untouched) and random-fill every unsold paid slot.
    for (const target of targets) {
      await randomFillUnsoldSlots(tx, pendingPeriod.id, target);
    }

    // 2. Cross-placement cascade (which product each multi-placement seller shows where).
    await runCascade(tx, pendingPeriod.id);

    // 3. Flip PENDING -> ACTIVE, archiving whichever period was previously ACTIVE.
    const previousActive = await tx.placementPeriod.findFirst({ where: { status: "ACTIVE" } });
    if (previousActive) {
      await tx.placementPeriod.update({ where: { id: previousActive.id }, data: { status: "ARCHIVED" } });
    }
    await tx.placementPeriod.update({ where: { id: pendingPeriod.id }, data: { status: "ACTIVE" } });
  });
}
