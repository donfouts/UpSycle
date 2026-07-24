import Link from "next/link";
import type { CategoryNode } from "@/lib/categories";

interface FilterPanelProps {
  categories: CategoryNode[];
  activeSlug?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
}

const labelClass =
  "mb-2 block text-[0.65rem] font-medium tracking-[0.13em] uppercase text-[var(--muted)]";
const priceInputClass =
  "w-full border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 text-sm text-[var(--cream)] outline-none transition-colors placeholder:text-[rgba(245,237,224,0.3)] focus:border-[var(--rg-core)]";
const radioLabelClass =
  "flex cursor-pointer items-center gap-2 text-[0.8rem] text-[var(--cream)] transition-colors hover:text-[var(--rg-light)]";
const radioLabelSmallClass =
  "flex cursor-pointer items-center gap-2 text-[0.72rem] text-[var(--muted2)] transition-colors hover:text-[var(--rg-light)]";

/**
 * Unified browse-page filter panel: category, price range, and (via the
 * carried-forward `q` hidden field) search. Plain GET form — no client JS,
 * matching CategoryNav's server-component-only pattern.
 */
export default function FilterPanel({
  categories,
  activeSlug,
  q,
  minPrice,
  maxPrice,
}: FilterPanelProps) {
  return (
    <div className="flex flex-col gap-8">
      <form action="/browse" method="GET" className="flex flex-col gap-8">
        {q && <input type="hidden" name="q" value={q} />}

        <fieldset>
          <legend className={labelClass}>Category</legend>
          <nav aria-label="Product categories" className="flex flex-col gap-3">
            <label className={radioLabelClass}>
              <input type="radio" name="cat" value="" defaultChecked={!activeSlug} />
              All Categories
            </label>
            {categories.map((cat) => (
              <div key={cat.slug}>
                <label className={radioLabelClass}>
                  <input
                    type="radio"
                    name="cat"
                    value={cat.slug}
                    defaultChecked={activeSlug === cat.slug}
                  />
                  {cat.name}
                </label>
                {cat.children && cat.children.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2 border-l border-[var(--border)] pl-4">
                    {cat.children.map((child) => (
                      <label key={child.slug} className={radioLabelSmallClass}>
                        <input
                          type="radio"
                          name="cat"
                          value={child.slug}
                          defaultChecked={activeSlug === child.slug}
                        />
                        {child.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </fieldset>

        <fieldset>
          <legend className={labelClass}>Price</legend>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="sr-only" htmlFor="minPrice">
                Minimum price
              </label>
              <input
                id="minPrice"
                type="number"
                name="minPrice"
                min={0}
                step="0.01"
                placeholder="Min $"
                defaultValue={minPrice}
                className={priceInputClass}
              />
            </div>
            <span className="text-[var(--muted)]">–</span>
            <div className="flex-1">
              <label className="sr-only" htmlFor="maxPrice">
                Maximum price
              </label>
              <input
                id="maxPrice"
                type="number"
                name="maxPrice"
                min={0}
                step="0.01"
                placeholder="Max $"
                defaultValue={maxPrice}
                className={priceInputClass}
              />
            </div>
          </div>
        </fieldset>

        <button type="submit" className="btn-secondary">
          Apply Filters
        </button>
      </form>

      <Link
        href="/browse"
        className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[var(--muted)] no-underline transition-colors hover:text-[var(--rg-light)]"
      >
        Clear Filters
      </Link>
    </div>
  );
}
