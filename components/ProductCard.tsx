import Link from "next/link";
import { formatPriceCents, sellerDisplayName } from "@/lib/format";

export interface ProductCardData {
  id: string;
  title: string;
  priceCents: number;
  inventoryCount: number;
  photos: { url: string }[];
  sellerProfile: {
    user: { firstName: string | null; lastName: string | null; email: string };
  };
}

/** Product grid card — photo (or placeholder), title, price, seller. */
export default function ProductCard({ product }: { product: ProductCardData }) {
  const photo = product.photos[0];
  const outOfStock = product.inventoryCount <= 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block bg-[var(--charcoal)] no-underline transition-colors hover:bg-[var(--panel)]"
    >
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-[var(--deep)]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- external/S3 photo URLs, no fixed domain to configure yet
          <img
            src={photo.url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-[0.6rem] uppercase tracking-[0.12em] text-[var(--muted)]">
            Photo Coming Soon
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-3 left-3 bg-[var(--panel2)] px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.13em] text-[var(--muted2)]">
            Out of Stock
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="mb-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          {sellerDisplayName(product.sellerProfile)}
        </div>
        <div className="mb-1.5 font-serif text-[1.05rem] leading-tight text-[var(--cream)]">
          {product.title}
        </div>
        <div className="grad-text font-serif text-[1.1rem] font-semibold">
          {formatPriceCents(product.priceCents)}
        </div>
      </div>
    </Link>
  );
}
