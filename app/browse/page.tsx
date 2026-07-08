import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_TREE } from "@/lib/categories";
import CategoryNav from "@/components/CategoryNav";
import ProductCard from "@/components/ProductCard";

// This page always queries the live DB for products/pagination, so it can't
// be statically generated at build time (no DATABASE_URL available then).
export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

interface BrowsePageProps {
  searchParams: Promise<{ cat?: string; page?: string }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { cat, page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  let categoryIds: string[] | undefined;
  let activeCategory: { id: string; name: string; slug: string } | null = null;

  if (cat) {
    const category = await prisma.category.findUnique({
      where: { slug: cat },
      include: { children: { select: { id: true } } },
    });

    if (category) {
      activeCategory = category;
      categoryIds =
        category.children.length > 0
          ? [category.id, ...category.children.map((c) => c.id)]
          : [category.id];
    } else {
      // Unknown slug — filter to a non-existent id so we render the empty
      // state rather than silently falling back to "all products".
      categoryIds = ["00000000-0000-0000-0000-000000000000"];
    }
  }

  const where = categoryIds ? { categoryId: { in: categoryIds } } : {};

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
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
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const pageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (cat) params.set("cat", cat);
    params.set("page", String(targetPage));
    return `/browse?${params.toString()}`;
  };

  return (
    <section className="px-6 py-28 md:px-14">
      <div className="sec-max">
        <div className="eyebrow">{activeCategory ? activeCategory.name : "Full Marketplace"}</div>
        <h2 className="sec-title">
          {activeCategory ? (
            <>
              Browsing <em>{activeCategory.name}</em>
            </>
          ) : (
            <>
              Every <em>one-of-a-kind piece</em>
            </>
          )}
        </h2>

        {/* Mobile category chips — sidebar nav below is desktop-only */}
        <div className="mb-2 flex gap-3 overflow-x-auto pb-2 lg:hidden">
          <Link
            href="/browse"
            className={`shrink-0 whitespace-nowrap border px-4 py-2 text-[0.65rem] uppercase tracking-[0.1em] no-underline ${
              !cat
                ? "border-[var(--rg-core)] text-[var(--rg-light)]"
                : "border-[var(--border)] text-[var(--muted2)]"
            }`}
          >
            All
          </Link>
          {CATEGORY_TREE.map((topCat) => (
            <Link
              key={topCat.slug}
              href={`/browse?cat=${topCat.slug}`}
              className={`shrink-0 whitespace-nowrap border px-4 py-2 text-[0.65rem] uppercase tracking-[0.1em] no-underline ${
                cat === topCat.slug
                  ? "border-[var(--rg-core)] text-[var(--rg-light)]"
                  : "border-[var(--border)] text-[var(--muted2)]"
              }`}
            >
              {topCat.name}
            </Link>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <CategoryNav categories={CATEGORY_TREE} activeSlug={cat} variant="sidebar" />
          </aside>

          <div>
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
        </div>
      </div>
    </section>
  );
}
