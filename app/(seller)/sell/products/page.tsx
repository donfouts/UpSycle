import Link from "next/link";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireSellerPageAuth, sellerAuthFailureMessage } from "@/lib/seller-auth";
import { formatPriceCents, stockLabel } from "@/lib/format";
import InventoryAdjuster from "@/components/seller/InventoryAdjuster";

export const metadata: Metadata = {
  title: "My Products — UpSycle Market",
};

// Always fetched live from the DB — no build-time prerender.
export const dynamic = "force-dynamic";

const labelText = "mb-1 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-[var(--muted)]";

export default async function SellerProductsPage() {
  const auth = await requireSellerPageAuth("/sell/products");

  if (!auth.ok) {
    return (
      <div className="border border-[var(--border)] bg-[var(--charcoal)] p-10 text-center md:p-14">
        <div className="eyebrow justify-center before:hidden">Seller Products</div>
        <h1 className="sec-title">
          Not quite <em>ready yet</em>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-[0.95rem] font-light leading-loose text-[var(--muted2)]">
          {sellerAuthFailureMessage(auth.failure)}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {auth.failure.kind === "no-seller-profile" && (
            <Link href="/sell/signup" className="btn-primary">
              Apply to Sell
            </Link>
          )}
          <Link href="/" className="btn-secondary">
            Back to UpSycle Market
          </Link>
        </div>
      </div>
    );
  }

  const products = await prisma.product.findMany({
    where: { sellerProfileId: auth.seller.sellerProfileId },
    orderBy: { createdAt: "desc" },
    include: { photos: { orderBy: { position: "asc" }, take: 1 } },
  });

  return (
    <div>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow before:hidden">My Shop</div>
          <h1 className="sec-title">
            Your <em>products</em>
          </h1>
        </div>
        <Link href="/sell/products/new" className="btn-primary">
          + Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--charcoal)] p-10 text-center">
          <p className="mb-6 text-[0.9rem] font-light text-[var(--muted2)]">
            You don&apos;t have any listings yet. Add your first product to start selling.
          </p>
          <Link href="/sell/products/new" className="btn-primary">
            + Add Product
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-[var(--border)]">
          {products.map((product) => {
            const photo = product.photos[0];
            const stock = stockLabel(product.inventoryCount);
            return (
              <div
                key={product.id}
                className="flex flex-wrap items-center gap-4 bg-[var(--charcoal)] p-4 md:p-5"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-[var(--deep)]">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external/S3 photo URLs, no fixed domain configured yet
                    <img src={photo.url} alt={product.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[0.5rem] uppercase tracking-[0.1em] text-[var(--muted)]">
                      No Photo
                    </span>
                  )}
                </div>

                <div className="min-w-[10rem] flex-1">
                  <div className="font-serif text-[1.05rem] text-[var(--cream)]">{product.title}</div>
                  <div className="grad-text font-serif text-[0.95rem] font-semibold">
                    {formatPriceCents(product.priceCents)}
                  </div>
                  <span
                    className={`mt-1 inline-block text-[0.6rem] font-semibold uppercase tracking-[0.1em] ${
                      stock.tone === "out"
                        ? "text-[var(--muted2)]"
                        : stock.tone === "low"
                          ? "text-[var(--rg-light)]"
                          : "text-[var(--success)]"
                    }`}
                  >
                    {stock.label}
                  </span>
                </div>

                <div className="shrink-0">
                  <div className={labelText}>Inventory</div>
                  <InventoryAdjuster productId={product.id} initialCount={product.inventoryCount} />
                </div>

                <Link
                  href={`/sell/products/${product.id}/edit`}
                  className="btn-secondary shrink-0 !px-6 !py-2.5 text-[0.62rem]"
                >
                  Edit
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
