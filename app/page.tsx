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

const howItWorksCards = [
  {
    num: "01",
    type: "For Buyers",
    title: "Discover Work You'll Treasure",
    desc: "Browse curated, upcycled and handmade pieces — each with the artist's full story behind it. Every item is one-of-a-kind. When it's gone, it's gone.",
    feeAmount: "6%",
    feeLabel: "service fee at checkout · transparent & simple",
  },
  {
    num: "02",
    type: "For Artists",
    title: "Your Craft, Your Platform",
    desc: "List your work in a space built specifically for makers. No competing with factory goods. No getting lost in a catalog of millions.",
    feeAmount: "$19.99",
    feeLabel: "per month · flat subscription, no per-sale commissions",
  },
  {
    num: "03",
    type: "Payments",
    title: "Simple, Transparent Pricing",
    desc: "No hidden fees. Buyers pay 6% at checkout. Artists pay $19.99/month. Every dollar is clear so makers can focus on creating.",
    feeAmount: "Stripe",
    feeLabel: "secure processing · fast payouts",
  },
];

const artistValues = [
  "Zero tolerance for resellers — every listing must be handmade or upcycled by the seller personally",
  "Each artist receives a featured profile with their story, craft, and creative vision front and center",
  "Flat monthly subscription — makers keep more of every sale with no per-transaction commissions",
  "Our founder personally travels to discover makers — city by city, market by market, studio by studio",
];

const artistFeatures = [
  {
    label: "Curation",
    title: "Every Artist Is Chosen",
    desc: "No open enrollment. Makers are reviewed and approved — quality and authenticity always come first.",
  },
  {
    label: "Community",
    title: "No Resellers. Ever.",
    desc: "Every piece is created by the person selling it. Our strict policy keeps the marketplace pure.",
  },
  {
    label: "Storytelling",
    title: "Craft Deserves Context",
    desc: "Buyers don't just see the object — they learn the maker's story, materials, and creative process.",
  },
  {
    label: "Sustainability",
    title: "Renewed for the Earth",
    desc: "Every sale is a vote for circularity — materials given second lives, waste transformed into beauty.",
  },
];

const storyVignettes = [
  {
    loc: "New Mexico",
    craft: "Jewelry Maker",
    desc: "Reclaimed silver and stones pulled from the high desert earth — work so precise and alive with culture that wearing one feels like carrying a piece of the land itself.",
  },
  {
    loc: "Seattle, WA",
    craft: "Glass Blower",
    desc: "Salvaged glass transformed into vessels of breathtaking color and form — each one shaped by breath and fire into something that could never be replicated twice.",
  },
  {
    loc: "Connecticut",
    craft: "Potter",
    desc: "Forgotten clay traditions pulled forward by hand — functional pieces of such quiet beauty that you instinctively reach out to hold them.",
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
      <section className="bg-[var(--deep)] px-6 py-24 md:px-14">
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

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="bg-[var(--deep)] px-6 py-24 md:px-14">
        <div className="sec-max">
          <div className="eyebrow">How It Works</div>
          <h2 className="sec-title">
            A marketplace built for <br className="hidden md:block" />
            <em>work that matters most</em>
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-px bg-[var(--border)] md:grid-cols-3">
            {howItWorksCards.map((card) => (
              <div
                key={card.num}
                className="bg-[var(--charcoal)] p-10 transition-colors hover:bg-[var(--panel)]"
              >
                <div className="grad-text mb-6 font-serif text-5xl font-light opacity-45">
                  {card.num}
                </div>
                <div className="mb-2.5 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[var(--rg-core)]">
                  {card.type}
                </div>
                <h3 className="mb-3.5 font-serif text-2xl font-normal leading-tight text-[var(--cream)]">
                  {card.title}
                </h3>
                <p className="mb-7 text-[0.88rem] font-light leading-loose text-[var(--muted2)]">
                  {card.desc}
                </p>
                <div className="flex items-baseline gap-2 border-t border-[var(--border)] pt-5">
                  <span className="grad-text font-serif text-[1.9rem] font-semibold leading-none">
                    {card.feeAmount}
                  </span>
                  <span className="text-[0.7rem] text-[var(--muted)]">{card.feeLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SUPPORT INDEPENDENT ARTISTS ═══ */}
      <section id="artists" className="bg-[var(--black)] px-6 py-24 md:px-14">
        <div className="sec-max grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
          <div>
            <div className="eyebrow">Support Independent Artists</div>
            <h2 className="sec-title">
              Built around the <br className="hidden md:block" />
              <em>maker, not the marketplace</em>
            </h2>
            <p className="mb-10 text-[0.97rem] font-light leading-loose text-[var(--muted2)]">
              Every artist on UpSycle Market is hand-selected. We don&rsquo;t just open a door and
              let anyone in &mdash; we find extraordinary makers working in relative obscurity and
              give their craft the audience it has always deserved.
            </p>
            <ul className="flex flex-col gap-5 list-none">
              {artistValues.map((value) => (
                <li
                  key={value}
                  className="flex items-start gap-4 text-[0.88rem] font-light leading-relaxed text-[var(--muted2)]"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--rg-core)]">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                      <path
                        d="M1.5 4.5l2.5 2.5 4-4"
                        stroke="var(--rg-core)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {value}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-1 gap-px bg-[var(--border)] sm:grid-cols-2">
            {artistFeatures.map((f) => (
              <div key={f.label} className="bg-[var(--deep)] p-7 transition-colors hover:bg-[var(--panel)]">
                <div className="mb-2.5 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[var(--rg-core)]">
                  {f.label}
                </div>
                <h3 className="mb-2 font-serif text-lg font-normal leading-tight text-[var(--cream)]">
                  {f.title}
                </h3>
                <p className="text-[0.82rem] font-light leading-relaxed text-[var(--muted)]">{f.desc}</p>
              </div>
            ))}
            <div className="relative col-span-full overflow-hidden border-t border-[rgba(200,132,90,0.28)] bg-gradient-to-br from-[#160f08] to-[#1c1308] p-7">
              <div className="mb-2.5 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[var(--rg-core)]">
                Our Promise
              </div>
              <h3 className="mb-2 font-serif text-xl font-normal leading-tight text-[var(--rg-light)]">
                Forgotten Art, Reimagined by Hand
              </h3>
              <p className="text-[0.82rem] font-light leading-relaxed text-[rgba(245,237,224,0.6)]">
                UpSycle Market exists so that extraordinary work never goes unseen &mdash; built for
                the artists the big platforms forgot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ OUR STORY ═══ */}
      <section id="story" className="relative overflow-hidden bg-[var(--deep)] px-6 py-24 md:px-14">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 right-8 select-none font-serif text-[34rem] leading-none text-[rgba(200,132,90,0.04)]"
        >
          &ldquo;
        </span>
        <div className="sec-max relative z-[2] mx-auto max-w-[860px]">
          <div className="eyebrow" style={{ color: "var(--rg-light)" }}>
            Our Story
          </div>
          <h2 className="sec-title">
            Why I built <br className="hidden md:block" />
            <em>UpSycle Market</em>
          </h2>

          <p className="mb-7 text-[0.97rem] font-light leading-loose text-[var(--muted2)]">
            I looked at what was out there &mdash; Etsy, Poshmark, the big resale marketplaces.
            They&rsquo;ve opened an important door for independent sellers. But that door leads
            into a very crowded room. A handmade upcycled vase sitting next to a factory-printed
            phone case. A one-of-a-kind reclaimed wood table competing with drop-shipped furniture
            from overseas. The artists I met on those back roads and market stalls &mdash; their
            work got lost in the noise. Not because it wasn&rsquo;t remarkable. Because those
            platforms were never built for them.
          </p>

          <blockquote className="my-11 border-l-2 border-[var(--rg-core)] py-1 pl-8 font-serif text-[clamp(1.2rem,1.8vw,1.6rem)] italic font-light leading-snug text-[var(--cream)]">
            &ldquo;These artists are not hobbyists. They are masters. And almost no one outside
            their communities knows their names.&rdquo;
          </blockquote>

          <div className="my-12 grid grid-cols-1 gap-px bg-[var(--border)] sm:grid-cols-3">
            {storyVignettes.map((v) => (
              <div
                key={v.loc}
                className="relative border-l-2 border-[var(--rg-core)] bg-[var(--panel)] p-6"
                style={{ borderLeftColor: "rgba(200,132,90,0.5)" }}
              >
                <div className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[var(--rg-core)]">
                  {v.loc}
                </div>
                <div className="mb-2.5 font-serif text-[1.1rem] font-normal text-[var(--cream)]">
                  {v.craft}
                </div>
                <p className="text-[0.82rem] font-light leading-relaxed text-[var(--muted)]">{v.desc}</p>
              </div>
            ))}
          </div>

          <p className="mb-4 text-[0.97rem] font-light leading-loose text-[var(--muted2)]">
            I made a decision equal parts business and calling: I will keep traveling this country
            &mdash; city by city, market by market, studio by studio &mdash; to find artists
            creating extraordinary things in relative obscurity, and bring them home to a platform
            built specifically for them.
          </p>
          <p className="text-[0.97rem] font-light leading-loose text-[var(--muted2)]">
            I left my corporate career to build something I&rsquo;m genuinely passionate about
            &mdash; something truly meant to support artists. We will continue to build, one
            artist, one road, one reimagined treasure at a time.
          </p>

          <div className="mt-[52px] flex flex-wrap gap-4">
            <Link href="/browse" className="btn-primary">
              Browse the Market
            </Link>
            <Link href="/sell" className="btn-secondary">
              Open Your Shop
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
