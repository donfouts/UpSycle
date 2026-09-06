-- AlterTable
ALTER TABLE "seller_profiles" ADD COLUMN "slug" TEXT;
ALTER TABLE "seller_profiles" ADD COLUMN "story" TEXT;

-- Backfill: derive a readable slug for any existing rows from the seller's
-- name (falling back to their email's local part), disambiguated with a
-- short id suffix so the backfill can never collide.
UPDATE "seller_profiles" sp
SET "slug" = lower(
  regexp_replace(
    COALESCE(
      NULLIF(trim(concat_ws(' ', u."firstName", u."lastName")), ''),
      split_part(u."email", '@', 1)
    ),
    '[^a-zA-Z0-9]+', '-', 'g'
  )
) || '-' || substr(sp."id", 1, 6)
FROM "users" u
WHERE u."id" = sp."userId" AND sp."slug" IS NULL;

-- AlterTable
ALTER TABLE "seller_profiles" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "seller_profiles_slug_key" ON "seller_profiles"("slug");
