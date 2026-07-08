// Demo seed data for local development. Run with `npm run prisma:seed`
// (requires a local Postgres reachable via DATABASE_URL, see .env.example).
//
// Categories are (re)created idempotently via upsert on their unique slug.
// Products are NOT upserted (Product has no natural unique key to upsert on)
// — instead this script clears existing demo products/photos before
// re-inserting, so it's safe to run repeatedly against a scratch dev DB
// without accumulating duplicates. Do not point this at a shared/prod DB.
import { PrismaClient, Role, SellerApprovalStatus } from "@prisma/client";
import { CATEGORY_TREE } from "../lib/categories";

const prisma = new PrismaClient();

async function seedCategories() {
  console.log("Seeding categories...");
  for (const top of CATEGORY_TREE) {
    const parent = await prisma.category.upsert({
      where: { slug: top.slug },
      update: { name: top.name },
      create: { name: top.name, slug: top.slug },
    });

    for (const child of top.children ?? []) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: parent.id },
        create: { name: child.name, slug: child.slug, parentId: parent.id },
      });
    }
  }
}

interface SeedSeller {
  cognitoSub: string;
  email: string;
  firstName: string;
  lastName: string;
}

const SELLERS: SeedSeller[] = [
  {
    cognitoSub: "seed-cognito-desert-silver",
    email: "hello@desertsilverco.example.com",
    firstName: "Maria",
    lastName: "Reyes",
  },
  {
    cognitoSub: "seed-cognito-seattle-glass",
    email: "studio@seattleglassworks.example.com",
    firstName: "Devon",
    lastName: "Cho",
  },
  {
    cognitoSub: "seed-cognito-high-desert-wood",
    email: "shop@highdesertwood.example.com",
    firstName: "Ellis",
    lastName: "Tran",
  },
];

async function seedSellers() {
  console.log("Seeding sellers...");
  const sellerProfiles = [];
  for (const s of SELLERS) {
    const user = await prisma.user.upsert({
      where: { cognitoSub: s.cognitoSub },
      update: {},
      create: {
        cognitoSub: s.cognitoSub,
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        roles: { create: [{ role: Role.SELLER }] },
      },
    });

    const sellerProfile = await prisma.sellerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        approvalStatus: SellerApprovalStatus.APPROVED,
        socialMediaUrls: [],
        supplierList: [],
      },
    });

    sellerProfiles.push(sellerProfile);
  }
  return sellerProfiles;
}

interface SeedProduct {
  sellerIndex: number;
  categorySlug: string;
  title: string;
  description: string;
  priceCents: number;
  shippingCostCents: number;
  dimensions: string | null;
  weightGrams: number;
  inventoryCount: number;
}

const PRODUCTS: SeedProduct[] = [
  {
    sellerIndex: 0,
    categorySlug: "jewelry-necklace",
    title: "Desert Bloom Pendant",
    description:
      "Reclaimed sterling silver hand-forged into a pendant set with high desert turquoise. Every piece is one-of-a-kind — no two stones are alike.",
    priceCents: 28500,
    shippingCostCents: 800,
    dimensions: "2x1.5x0.3 in",
    weightGrams: 35,
    inventoryCount: 4,
  },
  {
    sellerIndex: 0,
    categorySlug: "jewelry-earring",
    title: "Sundown Hoop Earrings",
    description: "Salvaged copper wire wrapped and oxidized to a warm sundown patina.",
    priceCents: 9800,
    shippingCostCents: 500,
    dimensions: "1.5x1.5x0.2 in",
    weightGrams: 18,
    inventoryCount: 12,
  },
  {
    sellerIndex: 1,
    categorySlug: "home-goods-kitchen",
    title: "Salvaged Glass Vessel",
    description:
      "Blown from salvaged glass cullet in the studio's furnace — each vessel captures a different swirl of reclaimed color.",
    priceCents: 42000,
    shippingCostCents: 1800,
    dimensions: "6x6x9 in",
    weightGrams: 900,
    inventoryCount: 3,
  },
  {
    sellerIndex: 1,
    categorySlug: "home-goods-kitchen",
    title: "Reclaimed Amber Tumbler Set",
    description: "A set of four hand-blown tumblers made from reclaimed amber glass cullet.",
    priceCents: 12000,
    shippingCostCents: 1200,
    dimensions: "3.5x3.5x4 in",
    weightGrams: 1400,
    inventoryCount: 0,
  },
  {
    sellerIndex: 2,
    categorySlug: "furniture-table",
    title: "Reclaimed Wood Coffee Table",
    description:
      "Built from reclaimed barn oak with a hand-rubbed oil finish — every board carries its own weathered history.",
    priceCents: 68000,
    shippingCostCents: 12000,
    dimensions: "42x22x18 in",
    weightGrams: 22000,
    inventoryCount: 2,
  },
  {
    sellerIndex: 2,
    categorySlug: "furniture-dresser",
    title: "Restored Oak Dresser",
    description: "A mid-century dresser stripped, repaired, and refinished by hand.",
    priceCents: 54000,
    shippingCostCents: 15000,
    dimensions: "48x18x32 in",
    weightGrams: 38000,
    inventoryCount: 1,
  },
  {
    sellerIndex: 0,
    categorySlug: "clothing-womens",
    title: "Indigo Resist Wrap",
    description: "Hand-dyed indigo resist wrap sewn from repurposed cotton canvas.",
    priceCents: 19500,
    shippingCostCents: 900,
    dimensions: null,
    weightGrams: 320,
    inventoryCount: 7,
  },
  {
    sellerIndex: 1,
    categorySlug: "home-goods-blanket",
    title: "Patchwork Wool Throw",
    description:
      "Pieced together from reclaimed wool suiting fabric scraps into a one-of-a-kind throw.",
    priceCents: 16500,
    shippingCostCents: 1100,
    dimensions: "50x60 in",
    weightGrams: 1600,
    inventoryCount: 5,
  },
];

async function seedProducts(sellerProfiles: Awaited<ReturnType<typeof seedSellers>>) {
  console.log("Clearing existing demo products...");
  await prisma.productPhoto.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.product.deleteMany({});

  console.log("Seeding products...");
  for (const [i, p] of PRODUCTS.entries()) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: p.categorySlug } });
    const seller = sellerProfiles[p.sellerIndex];

    await prisma.product.create({
      data: {
        sellerProfileId: seller.id,
        categoryId: category.id,
        title: p.title,
        description: p.description,
        priceCents: p.priceCents,
        shippingCostCents: p.shippingCostCents,
        dimensions: p.dimensions,
        weightGrams: p.weightGrams,
        inventoryCount: p.inventoryCount,
        // Placeholder — real sellers upload a proof-of-handcrafted photo to S3 at signup.
        proofOfHandcraftedUrl: `https://picsum.photos/seed/upsycle-proof-${i}/800/600`,
        photos: {
          create: [
            { url: `https://picsum.photos/seed/upsycle-${i}-a/900/900`, position: 0 },
            { url: `https://picsum.photos/seed/upsycle-${i}-b/900/900`, position: 1 },
          ],
        },
      },
    });
  }
}

async function main() {
  await seedCategories();
  const sellerProfiles = await seedSellers();
  await seedProducts(sellerProfiles);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
