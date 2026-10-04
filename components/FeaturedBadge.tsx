import ProductCard, { type ProductCardData } from "@/components/ProductCard";

/**
 * Wraps a ProductCard with a "Featured" ribbon and a highlighted rose-gold
 * border, for lottery-winner cards (LotteryWinner rows) on the Featured
 * section of the Home/Category/Sub-Category page templates. Presentational
 * only — doesn't touch ProductCard itself.
 *
 * Per the buyer-facing rule in Prompts/product_layout.md (same rule as the
 * already-shipped Product.marketingPriority field): a winning placement
 * never renders its rank/slot number anywhere a buyer can see. This badge
 * is visual-only — a ribbon and a border, never a number.
 */
export default function FeaturedBadge({ product }: { product: ProductCardData }) {
  return (
    <div className="relative border-2 border-[var(--rg-core)]">
      <span
        className="pointer-events-none absolute top-0 right-0 z-10 px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.13em] text-[var(--black)]"
        style={{ background: "var(--rg-grad)" }}
      >
        Featured
      </span>
      <ProductCard product={product} />
    </div>
  );
}
