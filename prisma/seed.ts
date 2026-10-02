// Demo seed data for local development. Run with `npm run prisma:seed`
// (requires a local Postgres reachable via DATABASE_URL, see .env.example).
//
// Categories are (re)created idempotently via upsert on their unique slug.
// Products are NOT upserted (Product has no natural unique key to upsert on)
// — instead this script clears existing demo products/photos before
// re-inserting, so it's safe to run repeatedly against a scratch dev DB
// without accumulating duplicates. Do not point this at a shared/prod DB.
import {
  PrismaClient,
  Role,
  SellerApprovalStatus,
  SellerSubscriptionStatus,
  SellerTier,
  ShippingStatus,
  TierChangeReason,
} from "@prisma/client";
import { CATEGORY_TREE } from "../lib/categories";

const prisma = new PrismaClient();

// Mirrors prisma/migrations/20260930120000_add_tier_subscription_system's
// hand-written data backfill (that migration seeds these same values via raw
// SQL for the existing prod DB) — kept in sync so a fresh `migrate reset &&
// db seed` on a new dev DB reaches the same state without going through that
// migration's INSERT statements. Tier 2/3 are placeholder-zero benefits with
// isPricingFinalized: false because Prompts/Tier_system.md never defines
// them — see the TierPlan model comment in schema.prisma.
const TIER_PLANS = [
  {
    tier: SellerTier.TIER_1,
    name: "Tier 1",
    monthlyPriceCents: 3999,
    quarterlySalesTargetCents: 200_000,
    lotteryEntriesPerPeriod: 1,
    socialPostsPerPeriod: 1,
    canHighlightProducts: true,
    searchRankWeight: 10,
    isPricingFinalized: true,
  },
  {
    tier: SellerTier.TIER_2,
    name: "Tier 2",
    monthlyPriceCents: 2999,
    quarterlySalesTargetCents: 50_000,
    lotteryEntriesPerPeriod: 0,
    socialPostsPerPeriod: 0,
    canHighlightProducts: false,
    searchRankWeight: 0,
    isPricingFinalized: false,
  },
  {
    tier: SellerTier.TIER_3,
    name: "Tier 3",
    monthlyPriceCents: 1999,
    quarterlySalesTargetCents: 0,
    lotteryEntriesPerPeriod: 0,
    socialPostsPerPeriod: 0,
    canHighlightProducts: false,
    searchRankWeight: 0,
    isPricingFinalized: false,
  },
];

async function seedTierPlans() {
  console.log("Seeding tier plans...");
  const plans = [];
  for (const p of TIER_PLANS) {
    const plan = await prisma.tierPlan.upsert({
      where: { tier: p.tier },
      update: p,
      create: p,
    });
    plans.push(plan);
  }
  return plans;
}

// Backfills a COMPED SellerSubscription + one SEED_BACKFILL SellerTierChange
// row per seller, matching every existing seller's already-set `tier` —
// accurate for demo data, since nothing has ever gone through real Stripe
// billing. Also mirrors each seller's TierPlan.searchRankWeight onto the
// SellerProfile.searchRankWeight cache column.
async function seedSellerSubscriptions(
  sellerProfiles: { id: string; tier: SellerTier }[],
  tierPlans: { id: string; tier: SellerTier; searchRankWeight: number }[],
) {
  console.log("Seeding seller subscriptions...");
  const planByTier = new Map(tierPlans.map((p) => [p.tier, p]));

  for (const seller of sellerProfiles) {
    const plan = planByTier.get(seller.tier);
    if (!plan) continue;

    await prisma.sellerSubscription.upsert({
      where: { sellerProfileId: seller.id },
      update: { tierPlanId: plan.id, status: SellerSubscriptionStatus.COMPED },
      create: {
        sellerProfileId: seller.id,
        tierPlanId: plan.id,
        status: SellerSubscriptionStatus.COMPED,
      },
    });

    const hasHistory = await prisma.sellerTierChange.findFirst({
      where: { sellerProfileId: seller.id, reason: TierChangeReason.SEED_BACKFILL },
    });
    if (!hasHistory) {
      await prisma.sellerTierChange.create({
        data: {
          sellerProfileId: seller.id,
          fromTier: null,
          toTier: seller.tier,
          reason: TierChangeReason.SEED_BACKFILL,
        },
      });
    }

    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: { searchRankWeight: plan.searchRankWeight },
    });
  }
}

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
  slug: string;
  story: string;
  tier: SellerTier;
}

const SELLERS: SeedSeller[] = [
  {
    cognitoSub: "seed-cognito-desert-silver",
    email: "hello@desertsilverco.example.com",
    firstName: "Maria",
    lastName: "Reyes",
    slug: "desert-silver-co",
    story:
      "Desert Silver Co. reclaims sterling scrap and estate-sale findings from across the Southwest, reworking each piece into one-of-a-kind jewelry by hand in a small Tucson studio.",
    tier: SellerTier.TIER_1,
  },
  {
    cognitoSub: "seed-cognito-seattle-glass",
    email: "studio@seattleglassworks.example.com",
    firstName: "Devon",
    lastName: "Cho",
    slug: "seattle-glass-works",
    story:
      "Seattle Glass Works melts down bottle and window glass destined for the landfill into blown-glass vessels and home decor, all shaped in a converted garage studio in Ballard.",
    tier: SellerTier.TIER_2,
  },
  {
    cognitoSub: "seed-cognito-high-desert-wood",
    email: "shop@highdesertwood.example.com",
    firstName: "Ellis",
    lastName: "Tran",
    slug: "high-desert-wood",
    story:
      "High Desert Wood builds furniture and small goods from salvaged barnwood and storm-fallen timber sourced within a hundred miles of the Reno workshop.",
    tier: SellerTier.TIER_3,
  },

  // --- Additional demo sellers below: 2 per subcategory across all 12 leaf
  // categories, added to give a minimum realistic browsing/display data set
  // for upcoming UI/UX changes (see prisma/seed-test-data notes). Not real
  // accounts, no functional login, purely for populating listing displays.

  // Jewelry > Necklaces
  {
    cognitoSub: "seed-cognito-jwl-necklace-1",
    email: "hello@rivermarksilverco.example.com",
    firstName: "Elena",
    lastName: "Whitfield",
    slug: "rivermark-silver-co",
    story:
      "Rivermark Silver Co. melts down tarnished flatware and thrift-store silver plate, hand-forging it into necklaces in a riverside studio outside Portland, Oregon.",
    tier: SellerTier.TIER_1,
  },
  {
    cognitoSub: "seed-cognito-jwl-necklace-2",
    email: "shop@capeandtideglass.example.com",
    firstName: "Margaret",
    lastName: "Doyle",
    slug: "cape-and-tide",
    story:
      "Cape & Tide Sea Glass combs the beaches of Cape Cod, Massachusetts for storm-tumbled glass, wire-wrapping each shard into one-of-a-kind pendant necklaces.",
    tier: SellerTier.TIER_2,
  },
  // Jewelry > Earrings
  {
    cognitoSub: "seed-cognito-jwl-earring-1",
    email: "info@brasswingstudio.example.com",
    firstName: "Jordan",
    lastName: "Pace",
    slug: "brasswing-studio",
    story:
      "Brasswing Studio rescues brass hardware and broken horn instruments from Nashville estate sales, cutting and hammering the scrap into lightweight statement earrings.",
    tier: SellerTier.TIER_1,
  },
  {
    cognitoSub: "seed-cognito-jwl-earring-2",
    email: "hello@adobeandbead.example.com",
    firstName: "Carmen",
    lastName: "Ortiz",
    slug: "adobe-and-bead",
    story:
      "Adobe & Bead restrings vintage trade beads and estate jewelry findings sourced around Santa Fe, New Mexico into bold, one-of-a-kind earrings.",
    tier: SellerTier.TIER_3,
  },
  // Jewelry > Bracelets
  {
    cognitoSub: "seed-cognito-jwl-bracelet-1",
    email: "shop@lonestarleatherworks.example.com",
    firstName: "Travis",
    lastName: "Boone",
    slug: "lonestar-leatherworks",
    story:
      "Lonestar Leatherworks cuts down worn boots and belts collected from Austin, Texas thrift shops, hand-stitching the reclaimed hide into rugged wrap bracelets.",
    tier: SellerTier.TIER_2,
  },
  {
    cognitoSub: "seed-cognito-jwl-bracelet-2",
    email: "hello@blueridgecopperco.example.com",
    firstName: "Nathan",
    lastName: "Combs",
    slug: "blue-ridge-copper-co",
    story:
      "Blue Ridge Copper Co. salvages copper roofing scraps and old plumbing pipe from Asheville, North Carolina renovation sites, hammering it into warm, hand-finished cuffs.",
    tier: SellerTier.TIER_3,
  },
  // Jewelry > Other
  {
    cognitoSub: "seed-cognito-jwl-other-1",
    email: "hello@deckyarddesigns.example.com",
    firstName: "Miles",
    lastName: "Ferro",
    slug: "deckyard-designs",
    story:
      "Deckyard Designs cuts up broken skateboard decks collected from Denver, Colorado skate shops, layering the colorful maple plies into rings, pins, and hair combs.",
    tier: SellerTier.TIER_1,
  },
  {
    cognitoSub: "seed-cognito-jwl-other-2",
    email: "shop@gearworkandtime.example.com",
    firstName: "Priya",
    lastName: "Nandakumar",
    slug: "gearwork-and-time",
    story:
      "Gearwork & Time disassembles broken pocket watches and clocks found at Providence, Rhode Island estate sales, reassembling the tiny gears into steampunk-inspired rings and brooches.",
    tier: SellerTier.TIER_2,
  },

  // Home Goods > Wood Working
  {
    cognitoSub: "seed-cognito-hmg-woodworking-1",
    email: "shop@blueridgebarnwood.example.com",
    firstName: "Caleb",
    lastName: "Whitfield",
    slug: "blue-ridge-barnwood-co",
    story:
      "Blue Ridge Barnwood Co. rescues century-old barnwood from collapsing tobacco barns across western North Carolina, milling each board by hand into furniture that still carries the weathered grain and nail holes of its first life.",
    tier: SellerTier.TIER_1,
  },
  {
    cognitoSub: "seed-cognito-hmg-woodworking-2",
    email: "hello@motorcitypallet.example.com",
    firstName: "Renata",
    lastName: "Ochoa",
    slug: "motor-city-pallet-works",
    story:
      "Motor City Pallet Works breaks down shipping pallets pulled from shuttered Detroit warehouses, turning the scrap oak and pine into sturdy home furnishings that keep a piece of the city's industrial past in every joint.",
    tier: SellerTier.TIER_2,
  },
  // Home Goods > Glass Blowing
  {
    cognitoSub: "seed-cognito-hmg-glassblowing-1",
    email: "studio@bayoubottleglass.example.com",
    firstName: "Marcus",
    lastName: "Delacroix",
    slug: "bayou-bottle-glassworks",
    story:
      "Bayou Bottle Glassworks collects empty wine and beer bottles from French Quarter restaurants each week, melting them down in a small courtyard furnace to blow one-of-a-kind drinkware and vases for the New Orleans market.",
    tier: SellerTier.TIER_3,
  },
  {
    cognitoSub: "seed-cognito-hmg-glassblowing-2",
    email: "info@sonoransalvageglass.example.com",
    firstName: "Priya",
    lastName: "Vantassel",
    slug: "sonoran-salvage-glass",
    story:
      "Sonoran Salvage Glass rescues shattered stained-glass window panels from demolished Tucson churches and homes, re-melting the shards into sun-catchers and lamps that scatter jewel-toned light across the desert.",
    tier: SellerTier.TIER_1,
  },
  // Home Goods > Pottery
  {
    cognitoSub: "seed-cognito-hmg-pottery-1",
    email: "studio@taosreclaimedclay.example.com",
    firstName: "Elena",
    lastName: "Ruybal",
    slug: "taos-reclaimed-clay-studio",
    story:
      "Taos Reclaimed Clay Studio reprocesses scrap clay trimmings and broken greenware from local pottery cooperatives into fresh stoneware, glazed with recycled wood-ash and mineral runoff collected from nearby kilns.",
    tier: SellerTier.TIER_2,
  },
  {
    cognitoSub: "seed-cognito-hmg-pottery-2",
    email: "hello@rosecityrecast.example.com",
    firstName: "Nathaniel",
    lastName: "Kwan",
    slug: "rose-city-recast-pottery",
    story:
      "Rose City Recast Pottery grinds down broken porcelain and stoneware seconds from Portland ceramics studios into a reclaimed clay body, throwing new mugs and planters that carry flecks of their shattered predecessors.",
    tier: SellerTier.TIER_3,
  },
  // Home Goods > Other
  {
    cognitoSub: "seed-cognito-hmg-other-1",
    email: "shop@nashvillesalvagetextiles.example.com",
    firstName: "Odessa",
    lastName: "Marsh",
    slug: "nashville-salvage-textiles",
    story:
      "Nashville Salvage Textiles cuts down decommissioned tour-bus upholstery and thrifted leather jackets into home goods, giving worn fabric from the road a second life on Music City living room floors.",
    tier: SellerTier.TIER_1,
  },
  {
    cognitoSub: "seed-cognito-hmg-other-2",
    email: "info@twincitiesscraphome.example.com",
    firstName: "Soren",
    lastName: "Ahlquist",
    slug: "twin-cities-scrap-metal-home",
    story:
      "Twin Cities Scrap Metal Home welds discarded bicycle frames and scrap steel from Minneapolis machine shops into candle holders, hooks, and small furniture, keeping metal bound for the scrapyard in circulation instead.",
    tier: SellerTier.TIER_2,
  },

  // Furniture > Dressers
  {
    cognitoSub: "seed-cognito-fur-dresser-1",
    email: "shop@blueridgereclaim.example.com",
    firstName: "Marlene",
    lastName: "Kessler",
    slug: "blue-ridge-reclaim",
    story:
      "Blue Ridge Reclaim builds dressers and case pieces from century-old barnwood pulled from collapsing tobacco barns across the North Carolina mountains. Every board is kiln-dried and hand-fitted in a small Asheville workshop before it becomes furniture again.",
    tier: SellerTier.TIER_1,
  },
  {
    cognitoSub: "seed-cognito-fur-dresser-2",
    email: "hello@palletandpine.example.com",
    firstName: "Devon",
    lastName: "Achebe",
    slug: "pallet-and-pine-co",
    story:
      "Pallet & Pine Co. diverts shipping pallets from Tulsa-area warehouses and turns them into chevron-front dressers and drawer units, each plank hand-planed to strip the stamped grading marks down to clean grain.",
    tier: SellerTier.TIER_2,
  },
  // Furniture > Tables
  {
    cognitoSub: "seed-cognito-fur-table-1",
    email: "orders@ironcreekfab.example.com",
    firstName: "Sal",
    lastName: "Marchetti",
    slug: "iron-creek-fabrication",
    story:
      "Iron Creek Fabrication pairs salvaged steel pipe and cart hardware from a shuttered Pittsburgh steel mill with reclaimed oak decking, welding and finishing every table base in-house.",
    tier: SellerTier.TIER_3,
  },
  {
    cognitoSub: "seed-cognito-fur-table-2",
    email: "studio@midcenturyrevival.example.com",
    firstName: "Priya",
    lastName: "Bhatt",
    slug: "midcentury-revival-studio",
    story:
      "Midcentury Revival Studio hunts estate sales around Palm Springs for tired walnut and teak tables, then strips, re-glues, and hand-oils each piece back to its original mid-century lines.",
    tier: SellerTier.TIER_1,
  },
  // Furniture > Chairs
  {
    cognitoSub: "seed-cognito-fur-chair-1",
    email: "shop@timberandtwine.example.com",
    firstName: "Wyatt",
    lastName: "Colston",
    slug: "timber-and-twine-workshop",
    story:
      "Timber & Twine Workshop reclaims pine pews from decommissioned Nashville-area churches, hand-sanding a century of varnish away to build dining and accent chairs with real history in the grain.",
    tier: SellerTier.TIER_2,
  },
  {
    cognitoSub: "seed-cognito-fur-chair-2",
    email: "sales@salvagesteelseating.example.com",
    firstName: "Renata",
    lastName: "Okafor",
    slug: "salvage-steel-seating",
    story:
      "Salvage Steel Seating welds rebar and cart-wheel hardware pulled from closed Detroit auto plants into chair frames, topped with reclaimed maple factory flooring for the seats.",
    tier: SellerTier.TIER_3,
  },
  // Furniture > Other
  {
    cognitoSub: "seed-cognito-fur-other-1",
    email: "hello@driftwoodandco.example.com",
    firstName: "Fiona",
    lastName: "MacAllister",
    slug: "driftwood-and-co",
    story:
      "Driftwood & Co. hand-collects storm-washed driftwood along the Maine coastline near Portland and builds it into benches, shelving, and small accent pieces sealed for everyday indoor use.",
    tier: SellerTier.TIER_1,
  },
  {
    cognitoSub: "seed-cognito-fur-other-2",
    email: "shop@rustbeltreclaimed.example.com",
    firstName: "Trent",
    lastName: "Boyko",
    slug: "rust-belt-reclaimed",
    story:
      "Rust Belt Reclaimed repurposes steel lockers and gymnasium flooring salvaged from shuttered Cleveland factories and schools into storage cabinets and shelving units built to outlast the buildings they came from.",
    tier: SellerTier.TIER_2,
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
      // Keep slug/story/tier in sync with SELLERS on rerun — earlier seed
      // runs used `update: {}`, which left a stale slug in place (from a
      // pre-slug-feature backfill) instead of the value this script defines.
      update: { slug: s.slug, story: s.story, tier: s.tier, approvalStatus: SellerApprovalStatus.APPROVED },
      create: {
        userId: user.id,
        slug: s.slug,
        story: s.story,
        tier: s.tier,
        approvalStatus: SellerApprovalStatus.APPROVED,
        socialMediaUrls: [],
        supplierList: [],
      },
    });

    sellerProfiles.push(sellerProfile);
  }
  return sellerProfiles;
}

// Issue #9 (admin seller approval & user management) needs a PENDING
// application to review locally — none of the SELLERS above qualify, since
// they're all seeded APPROVED so seedProducts() has somewhere to attach
// listings. This applicant is otherwise unused (no products) and carries
// full vetting detail (website/socials/expected sales/suppliers/5 sample
// photos) so the admin review screen has real data to render.
async function seedPendingSellerApplication() {
  console.log("Seeding a pending seller application...");
  const user = await prisma.user.upsert({
    where: { cognitoSub: "seed-cognito-pending-fiber-arts" },
    update: {},
    create: {
      cognitoSub: "seed-cognito-pending-fiber-arts",
      email: "hello@fiberartscollective.example.com",
      firstName: "Priya",
      lastName: "Nair",
      roles: { create: [{ role: Role.SELLER }] },
    },
  });

  await prisma.sellerProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      slug: "fiber-arts-collective",
      websiteUrl: "https://fiberartscollective.example.com",
      socialMediaUrls: [
        "https://instagram.com/fiberartscollective",
        "https://pinterest.com/fiberartscollective",
      ],
      expectedMonthlySales: 40,
      supplierList: ["Local wool mill co-op", "Estate sale textile lots"],
      approvalStatus: SellerApprovalStatus.PENDING,
      samplePhotos: {
        create: Array.from({ length: 5 }, (_, i) => ({
          url: `https://picsum.photos/seed/upsycle-pending-fiber-${i}/700/700`,
        })),
      },
    },
  });
}

// Issue #9 (admin seller approval & user management) requires an ADMIN
// account to reach /admin at all — there is deliberately no self-serve way
// to become an admin (that would be a security hole), so this seed row
// stands in for the out-of-band grant an operator would perform directly
// against the database in a real environment (e.g. a one-off
// `INSERT INTO user_roles ...` or a psql session against RDS).
async function seedAdmin() {
  console.log("Seeding demo admin user...");
  const user = await prisma.user.upsert({
    where: { cognitoSub: "seed-cognito-admin" },
    update: {},
    create: {
      cognitoSub: "seed-cognito-admin",
      email: "admin@upsycle.example.com",
      firstName: "Admin",
      lastName: "Ops",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_role: { userId: user.id, role: Role.ADMIN } },
    update: {},
    create: { userId: user.id, role: Role.ADMIN },
  });
}

interface SeedProduct {
  sellerSlug: string;
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
    sellerSlug: "desert-silver-co",
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
    sellerSlug: "desert-silver-co",
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
    sellerSlug: "seattle-glass-works",
    categorySlug: "home-goods-glassblowing",
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
    sellerSlug: "seattle-glass-works",
    categorySlug: "home-goods-glassblowing",
    title: "Reclaimed Amber Tumbler Set",
    description: "A set of four hand-blown tumblers made from reclaimed amber glass cullet.",
    priceCents: 12000,
    shippingCostCents: 1200,
    dimensions: "3.5x3.5x4 in",
    weightGrams: 1400,
    inventoryCount: 0,
  },
  {
    sellerSlug: "high-desert-wood",
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
    sellerSlug: "high-desert-wood",
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
    sellerSlug: "seattle-glass-works",
    categorySlug: "home-goods-other",
    title: "Patchwork Wool Throw",
    description:
      "Pieced together from reclaimed wool suiting fabric scraps into a one-of-a-kind throw.",
    priceCents: 16500,
    shippingCostCents: 1100,
    dimensions: "50x60 in",
    weightGrams: 1600,
    inventoryCount: 5,
  },

  // --- Products for the additional demo sellers above (2 each). ---

  // Jewelry
  {
    sellerSlug: "rivermark-silver-co",
    categorySlug: "jewelry-necklace",
    title: "Flatware Spoon Pendant Necklace",
    description:
      "A reclaimed sterling silver spoon bowl is hand-hammered flat and domed into a pendant, hung on a fine cable chain.",
    priceCents: 6500,
    shippingCostCents: 600,
    dimensions: "1.5x1x0.2 in",
    weightGrams: 22,
    inventoryCount: 6,
  },
  {
    sellerSlug: "rivermark-silver-co",
    categorySlug: "jewelry-necklace",
    title: "Melted Coin Silver Chain Necklace",
    description: "Old silver coins are melted down and hand-cast into a chunky, hand-linked chain necklace.",
    priceCents: 9200,
    shippingCostCents: 700,
    dimensions: "18x0.3x0.1 in",
    weightGrams: 40,
    inventoryCount: 0,
  },
  {
    sellerSlug: "cape-and-tide",
    categorySlug: "jewelry-necklace",
    title: "Storm Glass Pendant Necklace",
    description:
      "A single frosted shard of genuine Cape Cod sea glass, beachcombed after a nor'easter, is wire-wrapped in reclaimed copper.",
    priceCents: 3800,
    shippingCostCents: 450,
    dimensions: "1x0.8x0.3 in",
    weightGrams: 15,
    inventoryCount: 8,
  },
  {
    sellerSlug: "cape-and-tide",
    categorySlug: "jewelry-necklace",
    title: "Triple Shard Sea Glass Necklace",
    description: "Three tumbled sea glass fragments in varying shades of blue-green hang from a reclaimed brass chain.",
    priceCents: 5200,
    shippingCostCents: 500,
    dimensions: "16x1x0.2 in",
    weightGrams: 28,
    inventoryCount: 3,
  },
  {
    sellerSlug: "brasswing-studio",
    categorySlug: "jewelry-earring",
    title: "Trumpet Valve Hoop Earrings",
    description:
      "Salvaged brass valves from a broken-down trumpet are cut, sanded, and reshaped into lightweight hoop earrings.",
    priceCents: 3200,
    shippingCostCents: 400,
    dimensions: "1.2x1.2x0.1 in",
    weightGrams: 8,
    inventoryCount: 10,
  },
  {
    sellerSlug: "brasswing-studio",
    categorySlug: "jewelry-earring",
    title: "Piano Wire Dangle Earrings",
    description:
      "Coiled piano wire salvaged from an upright piano pairs with hammered brass scrap for these hand-finished dangle earrings.",
    priceCents: 2800,
    shippingCostCents: 400,
    dimensions: null,
    weightGrams: 6,
    inventoryCount: 5,
  },
  {
    sellerSlug: "adobe-and-bead",
    categorySlug: "jewelry-earring",
    title: "Vintage Trade Bead Drop Earrings",
    description: "Estate-sale trade beads collected around Santa Fe are restrung on sterling ear wires for a bold drop earring.",
    priceCents: 3400,
    shippingCostCents: 450,
    dimensions: "2x0.5x0.5 in",
    weightGrams: 10,
    inventoryCount: 2,
  },
  {
    sellerSlug: "adobe-and-bead",
    categorySlug: "jewelry-earring",
    title: "Turquoise Chip Cluster Earrings",
    description: "Turquoise chips salvaged from broken vintage jewelry are clustered into a stud earring set by hand.",
    priceCents: 4600,
    shippingCostCents: 450,
    dimensions: null,
    weightGrams: 12,
    inventoryCount: 0,
  },
  {
    sellerSlug: "lonestar-leatherworks",
    categorySlug: "jewelry-bracelet",
    title: "Boot Leather Wrap Bracelet",
    description:
      "Worn cowboy boot leather, sourced from Austin thrift shops, is cut into cord and hand-stitched into a triple-wrap bracelet with a brass snap.",
    priceCents: 3600,
    shippingCostCents: 550,
    dimensions: "8x1x0.2 in",
    weightGrams: 30,
    inventoryCount: 7,
  },
  {
    sellerSlug: "lonestar-leatherworks",
    categorySlug: "jewelry-bracelet",
    title: "Belt Buckle Cuff Bracelet",
    description: "A vintage leather belt is reclaimed and riveted into a sturdy cuff bracelet, hand-stitched edge to edge.",
    priceCents: 4200,
    shippingCostCents: 550,
    dimensions: "7x2x0.2 in",
    weightGrams: 45,
    inventoryCount: 4,
  },
  {
    sellerSlug: "blue-ridge-copper-co",
    categorySlug: "jewelry-bracelet",
    title: "Roofing Copper Cuff Bracelet",
    description: "A sheet of salvaged copper roofing flashing is hand-hammered and burnished into a warm, wearable cuff bracelet.",
    priceCents: 4800,
    shippingCostCents: 500,
    dimensions: "6.5x1.5x0.1 in",
    weightGrams: 38,
    inventoryCount: 5,
  },
  {
    sellerSlug: "blue-ridge-copper-co",
    categorySlug: "jewelry-bracelet",
    title: "Plumbing Pipe Link Bracelet",
    description: "Reclaimed copper plumbing pipe is cut into segments, flattened, and joined into a hand-finished link bracelet.",
    priceCents: 3900,
    shippingCostCents: 500,
    dimensions: "7.5x0.5x0.3 in",
    weightGrams: 32,
    inventoryCount: 1,
  },
  {
    sellerSlug: "deckyard-designs",
    categorySlug: "jewelry-other",
    title: "Skate Deck Maple Ring",
    description:
      "Broken skateboard decks are cut down and their colorful maple plies are laminated and carved into a lightweight statement ring.",
    priceCents: 2400,
    shippingCostCents: 400,
    dimensions: "0.8x0.8x0.5 in",
    weightGrams: 5,
    inventoryCount: 12,
  },
  {
    sellerSlug: "deckyard-designs",
    categorySlug: "jewelry-other",
    title: "Grip Tape Hair Comb",
    description: "Scraps of worn skateboard grip tape are bonded to a reclaimed maple hair comb for a raw, textured finish.",
    priceCents: 1800,
    shippingCostCents: 400,
    dimensions: "4x1x0.3 in",
    weightGrams: 14,
    inventoryCount: 6,
  },
  {
    sellerSlug: "gearwork-and-time",
    categorySlug: "jewelry-other",
    title: "Pocket Watch Gear Brooch",
    description: "Gears salvaged from a disassembled antique pocket watch are layered and soldered into a steampunk-inspired brooch.",
    priceCents: 5400,
    shippingCostCents: 500,
    dimensions: "2x2x0.4 in",
    weightGrams: 20,
    inventoryCount: 3,
  },
  {
    sellerSlug: "gearwork-and-time",
    categorySlug: "jewelry-other",
    title: "Clock Hand Cufflinks",
    description: "Ornate brass clock hands rescued from a broken mantel clock are set into a pair of one-of-a-kind cufflinks.",
    priceCents: 4800,
    shippingCostCents: 500,
    dimensions: "0.7x0.7x0.3 in",
    weightGrams: 9,
    inventoryCount: 0,
  },

  // Home Goods
  {
    sellerSlug: "blue-ridge-barnwood-co",
    categorySlug: "home-goods-woodworking",
    title: "Reclaimed Barnwood Coffee Table",
    description:
      "Built from wide-plank barnwood salvaged from a 1920s tobacco barn near Asheville, hand-planed and finished with tung oil to highlight decades of weathering.",
    priceCents: 38000,
    shippingCostCents: 6500,
    dimensions: "48x24x18 in",
    weightGrams: 18000,
    inventoryCount: 2,
  },
  {
    sellerSlug: "blue-ridge-barnwood-co",
    categorySlug: "home-goods-woodworking",
    title: "Barnwood Floating Shelf Set",
    description:
      "A pair of shelves cut from the same reclaimed barn joists, sanded smooth but left with original saw marks and iron stains for character.",
    priceCents: 8900,
    shippingCostCents: 1200,
    dimensions: "24x8x2 in",
    weightGrams: 2200,
    inventoryCount: 6,
  },
  {
    sellerSlug: "motor-city-pallet-works",
    categorySlug: "home-goods-woodworking",
    title: "Pallet Wood Wall Organizer",
    description:
      "Built from deconstructed shipping pallets sourced from a closed Detroit auto-parts warehouse, each slot cut and sanded to hold mail, keys, and tools.",
    priceCents: 5400,
    shippingCostCents: 900,
    dimensions: "20x14x5 in",
    weightGrams: 2600,
    inventoryCount: 0,
  },
  {
    sellerSlug: "motor-city-pallet-works",
    categorySlug: "home-goods-woodworking",
    title: "Industrial Pallet Bench",
    description:
      "A low bench assembled from stacked pallet planks and finished with matte polyurethane, showing the original stencil lettering from its warehouse days.",
    priceCents: 21000,
    shippingCostCents: 4500,
    dimensions: "40x16x18 in",
    weightGrams: 14000,
    inventoryCount: 3,
  },
  {
    sellerSlug: "bayou-bottle-glassworks",
    categorySlug: "home-goods-glassblowing",
    title: "Recycled Wine Bottle Tumbler Set",
    description: "Blown from crushed wine bottles collected off Bourbon Street, each tumbler keeps a faint green tint unique to its original glass.",
    priceCents: 4800,
    shippingCostCents: 1400,
    dimensions: "3x3x4 in",
    weightGrams: 1100,
    inventoryCount: 8,
  },
  {
    sellerSlug: "bayou-bottle-glassworks",
    categorySlug: "home-goods-glassblowing",
    title: "Amber Bottle-Glass Vase",
    description: "Hand-blown from reclaimed amber beer bottles, slow-cooled to keep tiny air bubbles trapped from its original glass life.",
    priceCents: 6200,
    shippingCostCents: 1600,
    dimensions: "5x5x10 in",
    weightGrams: 1300,
    inventoryCount: 0,
  },
  {
    sellerSlug: "sonoran-salvage-glass",
    categorySlug: "home-goods-glassblowing",
    title: "Stained Glass Shard Sun Catcher",
    description:
      "Fused from salvaged stained-glass fragments pulled from a demolished 1930s Tucson chapel, each piece framed in reclaimed lead came.",
    priceCents: 5600,
    shippingCostCents: 1100,
    dimensions: "8x8x1 in",
    weightGrams: 700,
    inventoryCount: 5,
  },
  {
    sellerSlug: "sonoran-salvage-glass",
    categorySlug: "home-goods-glassblowing",
    title: "Desert Mosaic Table Lamp",
    description:
      "A hand-blown glass shade embedded with reclaimed stained-glass shards, casting warm colored light reminiscent of the original church windows.",
    priceCents: 15500,
    shippingCostCents: 2800,
    dimensions: "10x10x16 in",
    weightGrams: 3200,
    inventoryCount: 2,
  },
  {
    sellerSlug: "taos-reclaimed-clay-studio",
    categorySlug: "home-goods-pottery",
    title: "Reclaimed Stoneware Dinner Bowl",
    description:
      "Thrown from reprocessed clay trimmings salvaged from a Taos pottery co-op, finished in a wood-ash glaze made from spent kiln ash.",
    priceCents: 3200,
    shippingCostCents: 800,
    dimensions: "7x7x3 in",
    weightGrams: 600,
    inventoryCount: 10,
  },
  {
    sellerSlug: "taos-reclaimed-clay-studio",
    categorySlug: "home-goods-pottery",
    title: "Ash-Glazed Serving Platter",
    description: "Hand-built from recycled greenware scraps and coated in a recycled wood-ash glaze, giving each platter a mottled, earthy finish.",
    priceCents: 5800,
    shippingCostCents: 1300,
    dimensions: "14x10x2 in",
    weightGrams: 1400,
    inventoryCount: 1,
  },
  {
    sellerSlug: "rose-city-recast-pottery",
    categorySlug: "home-goods-pottery",
    title: "Fleck-Glazed Reclaimed Mug",
    description: "Thrown from a clay body reclaimed from broken porcelain seconds, with visible flecks of the original glaze scattered through the surface.",
    priceCents: 2600,
    shippingCostCents: 700,
    dimensions: "4x4x5 in",
    weightGrams: 400,
    inventoryCount: 12,
  },
  {
    sellerSlug: "rose-city-recast-pottery",
    categorySlug: "home-goods-pottery",
    title: "Recycled Porcelain Planter",
    description: "Built from ground porcelain shard clay salvaged from a Portland studio's reject bin, glazed in a soft matte white.",
    priceCents: 4200,
    shippingCostCents: 1000,
    dimensions: "6x6x7 in",
    weightGrams: 900,
    inventoryCount: 0,
  },
  {
    sellerSlug: "nashville-salvage-textiles",
    categorySlug: "home-goods-other",
    title: "Reclaimed Leather Throw Pillow",
    description: "Sewn from decommissioned tour-bus leather upholstery, each pillow keeps the original stitching and patina from its life on the road.",
    priceCents: 4400,
    shippingCostCents: 900,
    dimensions: "18x18x6 in",
    weightGrams: 800,
    inventoryCount: 7,
  },
  {
    sellerSlug: "nashville-salvage-textiles",
    categorySlug: "home-goods-other",
    title: "Patchwork Denim Floor Rug",
    description: "Woven from salvaged denim jackets and jeans collected from Nashville thrift stores, backed with a non-slip reclaimed rubber mat.",
    priceCents: 7200,
    shippingCostCents: 1500,
    dimensions: "36x24x1 in",
    weightGrams: 2100,
    inventoryCount: 3,
  },
  {
    sellerSlug: "twin-cities-scrap-metal-home",
    categorySlug: "home-goods-other",
    title: "Bicycle Chain Candle Holder Set",
    description: "Welded from decommissioned bicycle chains and gears collected from a Minneapolis bike co-op, holding three tapered candles.",
    priceCents: 3800,
    shippingCostCents: 850,
    dimensions: "10x4x6 in",
    weightGrams: 1100,
    inventoryCount: 5,
  },
  {
    sellerSlug: "twin-cities-scrap-metal-home",
    categorySlug: "home-goods-other",
    title: "Scrap Steel Wall Hook Rail",
    description: "Cut and welded from offcut steel scrap sourced from a local machine shop, finished with a clear coat to preserve the raw industrial look.",
    priceCents: 4600,
    shippingCostCents: 1000,
    dimensions: "24x4x3 in",
    weightGrams: 1500,
    inventoryCount: 0,
  },

  // Furniture
  {
    sellerSlug: "blue-ridge-reclaim",
    categorySlug: "furniture-dresser",
    title: "Reclaimed Barnwood Six-Drawer Dresser",
    description: "Built from century-old tobacco barn siding sourced within a hundred miles of Asheville, with hand-cut dovetail drawer joinery.",
    priceCents: 68000,
    shippingCostCents: 18000,
    dimensions: "52x20x34 in",
    weightGrams: 42000,
    inventoryCount: 1,
  },
  {
    sellerSlug: "blue-ridge-reclaim",
    categorySlug: "furniture-dresser",
    title: "Compact Barnwood Dresser",
    description: "A smaller four-drawer dresser milled from weathered gray barnwood, finished with a hand-rubbed beeswax coat.",
    priceCents: 42000,
    shippingCostCents: 14000,
    dimensions: "30x16x30 in",
    weightGrams: 27000,
    inventoryCount: 2,
  },
  {
    sellerSlug: "pallet-and-pine-co",
    categorySlug: "furniture-dresser",
    title: "Upcycled Pallet Wood Dresser",
    description: "Hand-planed shipping pallet boards reassembled into a five-drawer dresser, with visible nail-hole character left intact.",
    priceCents: 32000,
    shippingCostCents: 12000,
    dimensions: "36x18x32 in",
    weightGrams: 30000,
    inventoryCount: 3,
  },
  {
    sellerSlug: "pallet-and-pine-co",
    categorySlug: "furniture-dresser",
    title: "Rustic Pallet Chevron Dresser",
    description: "Pallet slats arranged in a chevron pattern across the drawer fronts, sanded smooth and sealed with matte polyurethane.",
    priceCents: 38500,
    shippingCostCents: 13000,
    dimensions: "40x18x33 in",
    weightGrams: 33000,
    inventoryCount: 0,
  },
  {
    sellerSlug: "iron-creek-fabrication",
    categorySlug: "furniture-table",
    title: "Steel Pipe & Reclaimed Oak Dining Table",
    description: "A dining table built on a base of salvaged steel pipe fittings from a decommissioned Pittsburgh mill, topped with reclaimed oak planks.",
    priceCents: 92000,
    shippingCostCents: 20000,
    dimensions: "72x36x30 in",
    weightGrams: 54000,
    inventoryCount: 1,
  },
  {
    sellerSlug: "iron-creek-fabrication",
    categorySlug: "furniture-table",
    title: "Industrial Cart Coffee Table",
    description: "Built from a retired factory cart chassis with new casters and a reclaimed oak plank top, ready to roll.",
    priceCents: 45000,
    shippingCostCents: 15000,
    dimensions: "40x22x18 in",
    weightGrams: 32000,
    inventoryCount: 2,
  },
  {
    sellerSlug: "midcentury-revival-studio",
    categorySlug: "furniture-table",
    title: "Restored Walnut Mid-Century Dining Table",
    description: "A 1960s walnut dining table stripped of decades of finish, re-glued at every joint, and refinished with hand-rubbed oil.",
    priceCents: 78000,
    shippingCostCents: 19000,
    dimensions: "66x36x29 in",
    weightGrams: 41000,
    inventoryCount: 1,
  },
  {
    sellerSlug: "midcentury-revival-studio",
    categorySlug: "furniture-table",
    title: "Refinished Teak Side Table Pair",
    description: "A pair of vintage teak side tables rescued from a Palm Springs estate sale, sanded back to bare grain and re-oiled.",
    priceCents: 36000,
    shippingCostCents: 9000,
    dimensions: "24x24x22 in",
    weightGrams: 15000,
    inventoryCount: 0,
  },
  {
    sellerSlug: "timber-and-twine-workshop",
    categorySlug: "furniture-chair",
    title: "Church Pew Wood Dining Chair Set of Two",
    description: "Two dining chairs built from reclaimed pine pews out of a decommissioned Nashville-area chapel, hand-sanded smooth.",
    priceCents: 42000,
    shippingCostCents: 11000,
    dimensions: "18x20x36 in",
    weightGrams: 12000,
    inventoryCount: 3,
  },
  {
    sellerSlug: "timber-and-twine-workshop",
    categorySlug: "furniture-chair",
    title: "Reclaimed Pew Wood Accent Chair",
    description: "A single accent chair frame built from salvaged pew pine with a hand-tied jute seat.",
    priceCents: 24000,
    shippingCostCents: 8000,
    dimensions: "20x22x34 in",
    weightGrams: 9000,
    inventoryCount: 2,
  },
  {
    sellerSlug: "salvage-steel-seating",
    categorySlug: "furniture-chair",
    title: "Welded Steel Frame Reclaimed Wood Bar Stool",
    description: "A bar stool welded from scrap rebar and topped with reclaimed maple factory flooring pulled from a shuttered Detroit auto plant.",
    priceCents: 21000,
    shippingCostCents: 9000,
    dimensions: "16x16x30 in",
    weightGrams: 8000,
    inventoryCount: 4,
  },
  {
    sellerSlug: "salvage-steel-seating",
    categorySlug: "furniture-chair",
    title: "Factory Cart Wheel Accent Chair",
    description: "An accent chair built around a salvaged factory cart wheel base with a reclaimed maple plank seat.",
    priceCents: 32000,
    shippingCostCents: 10000,
    dimensions: "24x24x33 in",
    weightGrams: 14000,
    inventoryCount: 1,
  },
  {
    sellerSlug: "driftwood-and-co",
    categorySlug: "furniture-other",
    title: "Driftwood Entryway Bench",
    description: "Hand-collected driftwood from the coast near Portland, Maine, joined into a sturdy entryway bench and sealed for indoor use.",
    priceCents: 28000,
    shippingCostCents: 9500,
    dimensions: "48x14x18 in",
    weightGrams: 16000,
    inventoryCount: 2,
  },
  {
    sellerSlug: "driftwood-and-co",
    categorySlug: "furniture-other",
    title: "Driftwood Wall Shelf Set",
    description: "A set of three floating shelves cut from sun-bleached Maine driftwood, mounted on hidden brackets.",
    priceCents: 15000,
    shippingCostCents: 8000,
    dimensions: "30x8x6 in",
    weightGrams: 5000,
    inventoryCount: 3,
  },
  {
    sellerSlug: "rust-belt-reclaimed",
    categorySlug: "furniture-other",
    title: "Reclaimed Factory Locker Storage Cabinet",
    description: "A storage cabinet built from salvaged steel factory lockers with a new reclaimed maple shelving top, sourced from a closed Cleveland plant.",
    priceCents: 52000,
    shippingCostCents: 14000,
    dimensions: "36x18x60 in",
    weightGrams: 45000,
    inventoryCount: 1,
  },
  {
    sellerSlug: "rust-belt-reclaimed",
    categorySlug: "furniture-other",
    title: "Reclaimed Gym Floor Wood Shelving Unit",
    description: "A tall shelving unit built from reclaimed maple gymnasium flooring salvaged from a demolished Cleveland school.",
    priceCents: 34000,
    shippingCostCents: 11000,
    dimensions: "40x14x60 in",
    weightGrams: 38000,
    inventoryCount: 0,
  },
];

async function seedProducts(sellerProfiles: Awaited<ReturnType<typeof seedSellers>>) {
  console.log("Clearing existing demo products...");
  await prisma.productPhoto.deleteMany({});
  // Deleting Order cascades to its OrderItems (see schema's onDelete: Cascade
  // on OrderItem.order) — must happen before Product is cleared below since
  // OrderItem -> Product is onDelete: Restrict.
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});

  console.log("Seeding products...");
  const sellerBySlug = new Map(sellerProfiles.map((s) => [s.slug, s]));
  const createdProducts = [];
  for (const [i, p] of PRODUCTS.entries()) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: p.categorySlug } });
    const seller = sellerBySlug.get(p.sellerSlug);
    if (!seller) throw new Error(`Unknown sellerSlug in PRODUCTS: ${p.sellerSlug}`);

    const product = await prisma.product.create({
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
    createdProducts.push(product);
  }
  return createdProducts;
}

// Demo buyer used to populate order history (issue #12) so app/account/orders
// is demoable without needing the parallel cart/checkout branch merged first.
const BUYER = {
  cognitoSub: "seed-cognito-buyer-jordan",
  email: "jordan.buyer@example.com",
  firstName: "Jordan",
  lastName: "Ellis",
};

async function seedBuyerOrders(products: Awaited<ReturnType<typeof seedProducts>>) {
  console.log("Seeding demo buyer + order history...");

  const buyer = await prisma.user.upsert({
    where: { cognitoSub: BUYER.cognitoSub },
    update: {},
    create: {
      cognitoSub: BUYER.cognitoSub,
      email: BUYER.email,
      firstName: BUYER.firstName,
      lastName: BUYER.lastName,
      roles: { create: [{ role: Role.BUYER }] },
    },
  });

  // Address/Order have no natural unique key to upsert on — clear and
  // recreate this buyer's demo orders/addresses each run, same approach as
  // seedProducts above (Order.items cascades on delete, so this also clears
  // the buyer's OrderItems).
  await prisma.order.deleteMany({ where: { buyerId: buyer.id } });
  await prisma.address.deleteMany({ where: { userId: buyer.id } });

  const address = await prisma.address.create({
    data: {
      userId: buyer.id,
      line1: "482 Canyon Ridge Ave",
      city: "Tucson",
      state: "AZ",
      postalCode: "85701",
      country: "US",
      isDefault: true,
    },
  });

  const [pendant, hoops, vessel, , table, , wrap] = products;

  async function createOrder(
    items: typeof products,
    daysAgo: number,
    itemStatuses: ShippingStatus[],
  ) {
    const totalAmountCents = items.reduce(
      (sum, p) => sum + p.priceCents + p.shippingCostCents,
      0,
    );
    const overallStatus = itemStatuses.every((s) => s === ShippingStatus.DELIVERED)
      ? ShippingStatus.DELIVERED
      : itemStatuses.some((s) => s === ShippingStatus.SHIPPED || s === ShippingStatus.DELIVERED)
        ? ShippingStatus.SHIPPED
        : ShippingStatus.PENDING_SHIPMENT;

    await prisma.order.create({
      data: {
        buyerId: buyer.id,
        shippingAddressId: address.id,
        shippingStatus: overallStatus,
        totalAmountCents,
        stripePaymentId: `seed_pi_${Math.random().toString(36).slice(2, 10)}`,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        items: {
          create: items.map((p, idx) => ({
            productId: p.id,
            sellerProfileId: p.sellerProfileId,
            quantity: 1,
            unitPriceCents: p.priceCents,
            shippingCostCents: p.shippingCostCents,
            shippingStatus: itemStatuses[idx],
          })),
        },
      },
    });
  }

  // Order 1 (3 weeks ago, single seller, fully delivered).
  await createOrder([pendant, hoops], 21, [ShippingStatus.DELIVERED, ShippingStatus.DELIVERED]);
  // Order 2 (~9 days ago, single item, shipped but not yet delivered).
  await createOrder([vessel], 9, [ShippingStatus.SHIPPED]);
  // Order 3 (2 days ago, spans two different sellers, shipping independently).
  await createOrder([table, wrap], 2, [ShippingStatus.PENDING_SHIPMENT, ShippingStatus.SHIPPED]);
  // Order 4 (~40 days ago, so it reliably lands in the *previous* calendar
  // month regardless of when seeding runs) — exercises the seller sales
  // dashboard's "sold this month" filter actually excluding older orders,
  // while still showing up in buyer order history and its pending item still
  // appearing in the seller's pending-shipment tab (not month-filtered).
  await createOrder([table, wrap], 40, [ShippingStatus.DELIVERED, ShippingStatus.PENDING_SHIPMENT]);
}

async function main() {
  await seedCategories();
  const tierPlans = await seedTierPlans();
  const sellerProfiles = await seedSellers();
  await seedSellerSubscriptions(sellerProfiles, tierPlans);
  const products = await seedProducts(sellerProfiles);
  await seedBuyerOrders(products);
  await seedPendingSellerApplication();
  await seedAdmin();
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
