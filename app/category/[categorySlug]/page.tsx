import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActivePlacementPeriod, resolveFeaturedProduct } from "@/lib/placement";
import ProductCard from "@/components/ProductCard";
import FeaturedBadge from "@/components/FeaturedBadge";

// Featured/Highlighted/Standard sections are all fetched live from the DB,
// so this page can't be statically generated at build time (no DATABASE_URL
// available then).
export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type ResolvedProduct = NonNullable<Awaited<ReturnType<typeof resolveFeaturedProduct>>>;

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { categorySlug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    include: { children: { select: { id: true, name: true, slug: true } } },
  });

  // Missing slug, or a leaf category's slug — leaf pages live at
  // /category/[categorySlug]/[subcategorySlug] instead.
  if (!category || category.parentId !== null) {
    notFound();
  }

  const activePeriod = await getActivePlacementPeriod();

  const shownProductIds = new Set<string>();
  let featuredProducts: ResolvedProduct[] = [];
  let highlightedProducts: ResolvedProduct[] = [];

  if (activePeriod) {
    const winners = await prisma.lotteryWinner.findMany({
      where: { periodId: activePeriod.id, pageType: "CATEGORY", categoryId: category.id },
      orderBy: { rank: "asc" },
    });
    const resolvedWinners = await Promise.all(
      winners.map((w) => resolveFeaturedProduct(w.sellerProfileId, w.featuredProductId)),
    );
    featuredProducts = resolvedWinners.filter((p): p is ResolvedProduct => p !== null);
    featuredProducts.forEach((p) => shownProductIds.add(p.id));

    const slots = await prisma.featuredSlotPurchase.findMany({
      where: { periodId: activePeriod.id, pageType: "CATEGORY", categoryId: category.id },
      orderBy: { slotNumber: "asc" },
    });
    const resolvedSlots = await Promise.all(
      slots.map((s) => resolveFeaturedProduct(s.sellerProfileId, s.featuredProductId)),
    );
    highlightedProducts = resolvedSlots.filter((p): p is ResolvedProduct => p !== null);
    highlightedProducts.forEach((p) => shownProductIds.add(p.id));
  }

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];
  const standardWhere = {
    categoryId: { in: categoryIds },
    ...(shownProductIds.size > 0 ? { id: { notIn: Array.from(shownProductIds) } } : {}),
  };

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where: standardWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        photos: { orderBy: { position: "asc" }, take: 1 },
        sellerProfile: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    }),
    prisma.product.count({ where: standardWhere }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageHref = (targetPage: number) => `/category/${categorySlug}?page=${targetPage}`;

  return (
    <section className="px-6 py-28 md:px-14">
      <div className="sec-max">
        <div className="eyebrow">Shop by Craft</div>
        <h2 className="sec-title">
          Browsing <em>{category.name}</em>
        </h2>

        {category.children.length > 0 && (
          <div className="mb-14 flex flex-wrap gap-3">
            {category.children.map((child) => (
              <Link
                key={child.slug}
                href={`/category/${categorySlug}/${child.slug}`}
                className="border border-[var(--border)] px-4 py-2 text-[0.65rem] uppercase tracking-[0.1em] text-[var(--muted2)] no-underline transition-colors hover:border-[var(--rg-core)] hover:text-[var(--rg-light)]"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        {featuredProducts.length > 0 && (
          <div className="mb-16">
            <div className="eyebrow">Hand-Selected Pieces</div>
            <h3 className="sec-title mb-8 text-[clamp(1.5rem,2.2vw,2.1rem)]">
              Featured <em>in {category.name}</em>
            </h3>
            <div className="grid grid-cols-1 gap-px bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <FeaturedBadge key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {highlightedProducts.length > 0 && (
          <div className="mb-16">
            <div className="eyebrow">Promoted This Week</div>
            <h3 className="sec-title mb-8 text-[clamp(1.5rem,2.2vw,2.1rem)]">
              Highlighted <em>Artists</em>
            </h3>
            <div className="grid grid-cols-1 gap-px bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
              {highlightedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        <div className="eyebrow">The Full Collection</div>
        <h3 className="sec-title mb-8 text-[clamp(1.5rem,2.2vw,2.1rem)]">
          Every <em>piece in {category.name}</em>
        </h3>

        {products.length === 0 ? (
          <p className="text-[0.9rem] font-light text-[var(--muted2)]">
            No listings here yet — check back soon, or browse another category.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-px bg-[var(--border)] sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                {page > 1 ? (
                  <Link href={pageHref(page - 1)} className="btn-secondary">
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-[0.7rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link href={pageHref(page + 1)} className="btn-secondary">
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
