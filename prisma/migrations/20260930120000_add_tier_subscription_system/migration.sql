-- CreateEnum
CREATE TYPE "SellerSubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'COMPED');

-- CreateEnum
CREATE TYPE "TierChangeReason" AS ENUM ('SELLER_CHECKOUT', 'STRIPE_SYNC', 'ADMIN_OVERRIDE', 'SEED_BACKFILL');

-- AlterTable
-- Postgres backfills the DEFAULT into every existing row for a NOT NULL
-- column added this way (see 20260906220000_add_seller_tier for the same
-- pattern) — the real per-tier value is set below once tier_plans exists.
ALTER TABLE "seller_profiles" ADD COLUMN "searchRankWeight" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "tier_plans" (
    "id" TEXT NOT NULL,
    "tier" "SellerTier" NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyPriceCents" INTEGER NOT NULL DEFAULT 0,
    "quarterlySalesTargetCents" INTEGER,
    "lotteryEntriesPerPeriod" INTEGER NOT NULL DEFAULT 0,
    "socialPostsPerPeriod" INTEGER NOT NULL DEFAULT 0,
    "benefitPeriodDays" INTEGER NOT NULL DEFAULT 30,
    "canHighlightProducts" BOOLEAN NOT NULL DEFAULT false,
    "searchRankWeight" INTEGER NOT NULL DEFAULT 0,
    "isPricingFinalized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tier_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_subscriptions" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "tierPlanId" TEXT NOT NULL,
    "status" "SellerSubscriptionStatus" NOT NULL DEFAULT 'COMPED',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_tier_changes" (
    "id" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "fromTier" "SellerTier",
    "toTier" "SellerTier" NOT NULL,
    "reason" "TierChangeReason" NOT NULL,
    "changedByUserId" TEXT,
    "stripeEventId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_tier_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tier_plans_tier_key" ON "tier_plans"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "seller_subscriptions_sellerProfileId_key" ON "seller_subscriptions"("sellerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "seller_subscriptions_stripeSubscriptionId_key" ON "seller_subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "seller_tier_changes_stripeEventId_key" ON "seller_tier_changes"("stripeEventId");

-- AddForeignKey
ALTER TABLE "seller_subscriptions" ADD CONSTRAINT "seller_subscriptions_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_subscriptions" ADD CONSTRAINT "seller_subscriptions_tierPlanId_fkey" FOREIGN KEY ("tierPlanId") REFERENCES "tier_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_tier_changes" ADD CONSTRAINT "seller_tier_changes_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_tier_changes" ADD CONSTRAINT "seller_tier_changes_toTier_fkey" FOREIGN KEY ("toTier") REFERENCES "tier_plans"("tier") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed the 3 tier plans. Tier 1 values are the real numbers from
-- Prompts/Tier_system.md ($39.99/mo, $2000+ quarterly target, 1 lottery
-- entry, 1 social post, product highlighting, a real search-rank boost).
-- Tier 2/3 ship with placeholder-zero benefits and isPricingFinalized =
-- false because the spec never defines them — see the TierPlan model
-- comment in schema.prisma. Ids are fixed literals (not gen_random_uuid(),
-- which needs pgcrypto) generated once locally.
INSERT INTO "tier_plans"
  ("id", "tier", "name", "monthlyPriceCents", "quarterlySalesTargetCents", "lotteryEntriesPerPeriod", "socialPostsPerPeriod", "benefitPeriodDays", "canHighlightProducts", "searchRankWeight", "isPricingFinalized", "createdAt", "updatedAt")
VALUES
  ('6974837f-e46d-4260-8b1a-c85bac7b70eb', 'TIER_1', 'Tier 1', 3999, 200000, 1, 1, 30, true, 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c5eb287d-8ce6-4833-af3d-bb2dbd35c2ba', 'TIER_2', 'Tier 2', 2999, 50000, 0, 0, 30, false, 0, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('d20fb31d-cbd2-44a7-96f7-e20e9932ab50', 'TIER_3', 'Tier 3', 1999, 0, 0, 0, 30, false, 0, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Backfill: every existing SellerProfile gets a COMPED SellerSubscription
-- pointing at the TierPlan matching its already-set tier. COMPED is the
-- accurate status for this — every demo seller's current tier was granted
-- for free, nothing has ever gone through Stripe. Ids use an
-- extension-free random-id trick (md5 of random()+clock_timestamp(), no
-- pgcrypto dependency) since this is a hand-written data migration, not a
-- Prisma Client insert.
INSERT INTO "seller_subscriptions"
  ("id", "sellerProfileId", "tierPlanId", "status", "cancelAtPeriodEnd", "createdAt", "updatedAt")
SELECT
  md5(random()::text || clock_timestamp()::text || sp."id"),
  sp."id",
  tp."id",
  'COMPED',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "seller_profiles" sp
JOIN "tier_plans" tp ON tp."tier" = sp."tier";

-- Backfill: one SEED_BACKFILL audit row per existing seller, marking their
-- pre-billing tier as the starting point of the change-history trail.
INSERT INTO "seller_tier_changes"
  ("id", "sellerProfileId", "fromTier", "toTier", "reason", "createdAt")
SELECT
  md5(random()::text || clock_timestamp()::text || sp."id" || 'change'),
  sp."id",
  NULL,
  sp."tier",
  'SEED_BACKFILL',
  CURRENT_TIMESTAMP
FROM "seller_profiles" sp;

-- Backfill: mirror each seller's TierPlan.searchRankWeight onto the new
-- SellerProfile.searchRankWeight cache (a no-op for TIER_2/TIER_3 sellers
-- today, since their searchRankWeight is 0; TIER_1 sellers get the real
-- seeded value).
UPDATE "seller_profiles" sp
SET "searchRankWeight" = tp."searchRankWeight"
FROM "tier_plans" tp
WHERE tp."tier" = sp."tier";
