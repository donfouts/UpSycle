-- CreateEnum
CREATE TYPE "SellerTier" AS ENUM ('TIER_1', 'TIER_2', 'TIER_3');

-- AlterTable
-- Postgres backfills the DEFAULT into every existing row for a NOT NULL
-- column added this way, so no separate data migration is needed.
ALTER TABLE "seller_profiles" ADD COLUMN "tier" "SellerTier" NOT NULL DEFAULT 'TIER_1';
