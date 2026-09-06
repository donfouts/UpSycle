// Readable storefront slugs (/sellers/[slug]) — see SellerProfile.slug in
// prisma/schema.prisma for why this exists instead of sharing the raw guid.
import { prisma } from "@/lib/prisma";

const MAX_SLUG_LENGTH = 60;
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_DIACRITICS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, "");
  return base || "shop";
}

/**
 * Slugifies `base` and appends "-2", "-3", etc. until the result doesn't
 * collide with an existing SellerProfile.slug. Called once, at seller
 * signup — slugs are immutable afterward (see schema comment).
 */
export async function generateUniqueSellerSlug(base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let suffix = 2;
  while (await prisma.sellerProfile.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${root}-${suffix}`;
    suffix++;
  }
  return candidate;
}
