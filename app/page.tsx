import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";

// Featured products below are fetched live from the DB, so this page can't
// be statically generated at build time (no DATABASE_URL available then).
export const dynamic = "force-dynamic";

const trustItems = [
  "No factory goods. Ever.",
  "Strict no-resellers policy",
  "Every piece one-of-a-kind",
  "100% independent artists",
  "Renewed for the Earth",
];

const categories = [
  {
    slug: "jewelry",
    title: "Jewelry",
    desc: "Necklaces, earrings, bracelets & more — reclaimed metals and stones shaped by hand.",
  },
  {
    slug: "clothing",
    title: "Clothing / Apparel",
    desc: "Women's and men's pieces remade from salvaged and repurposed textiles.",
  },
  {
    slug: "home-goods",
    title: "Home Goods",
    desc: "Blankets, pillows, and kitchen pieces built for everyday life.",
  },
  {
    slug: "furniture",
    title: "Furniture",
    desc: "Dressers, tables, chairs & more — given a second life by hand.",
  },
];

export default async function Home() {
  const featuredProducts = await prisma.product.findMany({
    where: { inventoryCount: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      photos: { orderBy: { position: "asc" }, take: 1 },
      sellerProfile: {
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
  });

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16 text-center"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(181,98,42,0.09) 0%, transparent 65%), var(--black)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(200,132,90,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(200,132,90,0.035) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
          aria-hidden="true"
        />

        <div className="relative z-[2] flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset in /public, no next/image config yet */}
          <img
            src="/landing.png"
            alt="UpSycle Market — Created By US, Treasured by You"
            className="mb-3 w-[clamp(240px,40vw,420px)] h-auto"
          />
          <p className="mb-12 text-[0.65rem] font-medium tracking-[0.22em] uppercase text-[var(--rg-core)] opacity-85">
            Handmade &nbsp;·&nbsp; Upcycled &nbsp;·&nbsp; Sustainable
          </p>

          <div className="mb-16 flex flex-wrap justify-center gap-3.5">
            <Link href="/browse" className="btn-primary">
              Explore the Market
            </Link>
            <Link href="/sell" className="btn-secondary">
              Sell Your Work
            </Link>
          </div>

          <div className="flex flex-col items-center gap-2 text-[0.6rem] tracking-[0.18em] uppercase text-[var(--muted)]">
            <div
              className="h-11 w-px"
              style={{
                background: "linear-gradient(to bottom, var(--rg-core), transparent)",
              }}
            />
            <span>Discover</span>
          </div>
        </div>
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <div className="flex flex-wrap items-center justify-center gap-11 border-y border-[var(--border)] bg-[var(--deep)] px-6 py-5 md:px-14">
        {trustItems.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2.5 text-[0.67rem] font-medium tracking-[0.13em] uppercase text-[var(--muted2)]"
          >
            <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--rg-core)]" />
            {item}
          </div>
        ))}
      </div>

      {/* ═══ FEATURED PRODUCTS ═══ */}
      {featuredProducts.length > 0 && (
        <section className="bg-[var(--charcoal)] px-6 py-24 md:px-14">
          <div className="sec-max">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="eyebrow">Hand-Selected Pieces</div>
                <h2 className="sec-title mb-0">
                  Featured <em>Right Now</em>
                </h2>
              </div>
              <Link
                href="/browse"
                className="flex items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[var(--rg-core)] no-underline transition-colors after:content-['→'] hover:text-[var(--rg-light)]"
              >
                View All Listings
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-px bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CATEGORY BROWSE ═══ */}
      <section id="how-it-works" className="bg-[var(--deep)] px-6 py-24 md:px-14">
        <div className="sec-max">
          <div className="eyebrow">Browse the Market</div>
          <h2 className="sec-title">
            Find work across every <em>craft &amp; category</em>
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-px bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/browse?cat=${cat.slug}`}
                className="block bg-[var(--charcoal)] p-8 no-underline transition-colors hover:bg-[var(--panel)]"
              >
                <h3 className="mb-3 font-serif text-2xl font-normal leading-tight text-[var(--cream)]">
                  {cat.title}
                </h3>
                <p className="text-[0.88rem] font-light leading-relaxed text-[var(--muted2)]">
                  {cat.desc}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-11 text-center">
            <Link href="/browse" className="btn-primary">
              Browse All One-of-a-Kind Pieces
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SELL CTA ═══ */}
      <section id="story" className="relative overflow-hidden bg-[var(--black)] px-6 py-24 md:px-14">
        <div className="sec-max text-center">
          <div className="eyebrow justify-center before:hidden">Support Independent Artists</div>
          <h2 className="sec-title">
            Built around the <em>maker, not the marketplace</em>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-[0.97rem] font-light leading-loose text-[var(--muted2)]">
            Every artist on UpSycle Market is hand-selected. No factory goods, no resellers —
            just extraordinary makers given the audience their craft has always deserved. Open a
            shop and share your story, materials, and process alongside every listing.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/sell" className="btn-primary">
              Sell My Products
            </Link>
            <Link href="/browse" className="btn-secondary">
              Browse the Market
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
