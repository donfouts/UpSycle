-- AlterTable
ALTER TABLE "products" ADD COLUMN "marketingPriority" INTEGER;

-- Backfill: dense 1..N rank per seller, ordered by existing createdAt (oldest
-- listing becomes priority 1) — a reasonable default ordering for sellers who
-- have never set a priority, and a valid starting permutation for
-- reorderProductPriority to build on afterward.
UPDATE "products" p
SET "marketingPriority" = ranked."rn"
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "sellerProfileId" ORDER BY "createdAt" ASC) AS "rn"
  FROM "products"
) ranked
WHERE p."id" = ranked."id";

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "marketingPriority" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "products_sellerProfileId_marketingPriority_key" ON "products"("sellerProfileId", "marketingPriority");
