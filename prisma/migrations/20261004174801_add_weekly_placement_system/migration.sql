-- CreateEnum
CREATE TYPE "PlacementPageType" AS ENUM ('HOME', 'CATEGORY', 'SUBCATEGORY');

-- CreateEnum
CREATE TYPE "PlacementPeriodStatus" AS ENUM ('PENDING', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "placement_periods" (
    "id" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "PlacementPeriodStatus" NOT NULL DEFAULT 'PENDING',
    "drawnAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lottery_winners" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "pageType" "PlacementPageType" NOT NULL,
    "categoryId" TEXT,
    "sellerProfileId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "featuredProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lottery_winners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "featured_slot_purchases" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "pageType" "PlacementPageType" NOT NULL,
    "categoryId" TEXT,
    "slotNumber" INTEGER NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "isRandomFill" BOOLEAN NOT NULL DEFAULT false,
    "featuredProductId" TEXT,
    "stripePaymentId" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "featured_slot_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lottery_winners_periodId_pageType_categoryId_idx" ON "lottery_winners"("periodId", "pageType", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "lottery_winners_periodId_pageType_categoryId_sellerProfileI_key" ON "lottery_winners"("periodId", "pageType", "categoryId", "sellerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "lottery_winners_periodId_pageType_categoryId_rank_key" ON "lottery_winners"("periodId", "pageType", "categoryId", "rank");

-- CreateIndex
CREATE INDEX "featured_slot_purchases_periodId_pageType_categoryId_idx" ON "featured_slot_purchases"("periodId", "pageType", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "featured_slot_purchases_periodId_pageType_categoryId_slotNu_key" ON "featured_slot_purchases"("periodId", "pageType", "categoryId", "slotNumber");

-- AddForeignKey
ALTER TABLE "lottery_winners" ADD CONSTRAINT "lottery_winners_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "placement_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_winners" ADD CONSTRAINT "lottery_winners_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_winners" ADD CONSTRAINT "lottery_winners_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_slot_purchases" ADD CONSTRAINT "featured_slot_purchases_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "placement_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_slot_purchases" ADD CONSTRAINT "featured_slot_purchases_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "featured_slot_purchases" ADD CONSTRAINT "featured_slot_purchases_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
