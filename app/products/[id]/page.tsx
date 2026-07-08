import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/AddToCartButton";
import {
  formatPriceCents,
  formatWeightGrams,
  sellerDisplayName,
  stockLabel,
} from "@/lib/format";

// Always fetched live from the DB — no build-time prerender.
export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      photos: { orderBy: { position: "asc" } },
      sellerProfile: {
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const stock = stockLabel(product.inventoryCount);
  const [mainPhoto, ...restPhotos] = product.photos;

  return (
    <section className="px-6 py-28 md:px-14">
      <div className="sec-max">
        <div className="mb-8 text-[0.68rem] uppercase tracking-[0.12em] text-[var(--muted)]">
          <Link href="/browse" className="no-underline transition-colors hover:text-[var(--rg-light)]">
            Browse
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <Link
            href={`/browse?cat=${product.category.slug}`}
            className="no-underline transition-colors hover:text-[var(--rg-light)]"
          >
            {product.category.name}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* ═══ PHOTOS ═══ */}
          <div>
            <div className="mb-2 aspect-square w-full overflow-hidden bg-[var(--deep)]">
              {mainPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element -- external/S3 photo URLs, no fixed domain configured yet
                <img
                  src={mainPhoto.url}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                  Photo Coming Soon
                </div>
              )}
            </div>
            {restPhotos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {restPhotos.map((photo) => (
                  <div key={photo.id} className="aspect-square overflow-hidden bg-[var(--deep)]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- external/S3 photo URLs, no fixed domain configured yet */}
                    <img src={photo.url} alt={product.title} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ DETAILS ═══ */}
          <div>
            <div className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-[var(--rg-core)]">
              {sellerDisplayName(product.sellerProfile)}
            </div>
            <h1 className="mb-4 font-serif text-[clamp(1.8rem,3vw,2.6rem)] font-normal leading-tight text-[var(--cream)]">
              {product.title}
            </h1>
            <div className="grad-text mb-6 font-serif text-[2rem] font-semibold">
              {formatPriceCents(product.priceCents)}
            </div>

            <span
              className={`mb-6 inline-block px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.13em] ${
                stock.tone === "out"
                  ? "bg-[var(--panel2)] text-[var(--muted2)]"
                  : stock.tone === "low"
                    ? "border border-[var(--rg-core)] text-[var(--rg-light)]"
                    : "text-[var(--success)]"
              }`}
            >
              {stock.label}
            </span>

            <p className="mb-8 whitespace-pre-line text-[0.92rem] font-light leading-relaxed text-[var(--muted2)]">
              {product.description}
            </p>

            <dl className="mb-8 grid grid-cols-2 gap-y-3 border-t border-[var(--border)] pt-6 text-[0.85rem]">
              <dt className="text-[var(--muted)]">Shipping</dt>
              <dd className="text-[var(--cream)]">{formatPriceCents(product.shippingCostCents)}</dd>
              {product.dimensions && (
                <>
                  <dt className="text-[var(--muted)]">Dimensions</dt>
                  <dd className="text-[var(--cream)]">{product.dimensions}</dd>
                </>
              )}
              {product.weightGrams != null && (
                <>
                  <dt className="text-[var(--muted)]">Weight</dt>
                  <dd className="text-[var(--cream)]">{formatWeightGrams(product.weightGrams)}</dd>
                </>
              )}
            </dl>

            <AddToCartButton productId={product.id} inventoryCount={product.inventoryCount} />
          </div>
        </div>
      </div>
    </section>
  );
}
