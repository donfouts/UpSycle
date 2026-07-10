import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import { sellerDisplayName } from "@/lib/format";

// Always fetched live from the DB — no build-time prerender.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

interface SellerPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function SellerStorefrontPage({ params, searchParams }: SellerPageProps) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { id },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  if (!sellerProfile || sellerProfile.approvalStatus !== "APPROVED") {
    notFound();
  }

  const where = { sellerProfileId: id };

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
  const pageHref = (targetPage: number) => `/sellers/${id}?page=${targetPage}`;
  const name = sellerDisplayName(sellerProfile);

  return (
    <section className="px-6 py-28 md:px-14">
      <div className="sec-max">
        <div className="eyebrow">Seller</div>
        <h2 className="sec-title">
          Shop <em>{name}</em>
        </h2>
        <p className="mt-2 text-[0.85rem] font-light text-[var(--muted2)]">
          {totalCount} {totalCount === 1 ? "listing" : "listings"}
        </p>

        <div className="mt-10">
          {products.length === 0 ? (
            <p className="text-[0.9rem] font-light text-[var(--muted2)]">
              This seller doesn&apos;t have any active listings right now.
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
    </section>
  );
}
