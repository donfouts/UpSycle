// Single source of truth for the fixed top-level/sub category taxonomy
// described in the MVP build plan. Used to:
//   1. Render static navigation (CategoryNav in the Header) without a DB
//      round-trip on every page in the app (Header lives in the root layout).
//   2. Seed `categories` rows with matching slugs/names (prisma/seed.ts).
//
// Category slugs are globally unique in the schema (`Category.slug @unique`),
// so subcategory slugs are prefixed with their parent (e.g. "jewelry-other"
// and "furniture-other" instead of two rows both named "other").
export interface CategoryNode {
  name: string;
  slug: string;
  children?: CategoryNode[];
}

export const CATEGORY_TREE: CategoryNode[] = [
  {
    name: "Jewelry",
    slug: "jewelry",
    children: [
      { name: "Necklaces", slug: "jewelry-necklace" },
      { name: "Earrings", slug: "jewelry-earring" },
      { name: "Bracelets", slug: "jewelry-bracelet" },
      { name: "Other", slug: "jewelry-other" },
    ],
  },
  {
    name: "Home Goods",
    slug: "home-goods",
    children: [
      { name: "Wood Working", slug: "home-goods-woodworking" },
      { name: "Glass Blowing", slug: "home-goods-glassblowing" },
      { name: "Pottery", slug: "home-goods-pottery" },
      { name: "Other", slug: "home-goods-other" },
    ],
  },
  {
    name: "Furniture",
    slug: "furniture",
    children: [
      { name: "Dressers", slug: "furniture-dresser" },
      { name: "Tables", slug: "furniture-table" },
      { name: "Chairs", slug: "furniture-chair" },
      { name: "Other", slug: "furniture-other" },
    ],
  },
];
