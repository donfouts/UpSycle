import Link from "next/link";
import type { CategoryNode } from "@/lib/categories";

interface CategoryNavProps {
  categories: CategoryNode[];
  /** Currently selected category slug (top-level or sub), if any. */
  activeSlug?: string;
  /**
   * "dropdown" — a hover-revealed mega menu, meant for the site Header.
   * "sidebar" — an always-expanded list of categories, meant for the
   *   browse/listing page's filter rail.
   */
  variant?: "dropdown" | "sidebar";
}

/**
 * Category tree navigation. Pure presentational (server component, no
 * client JS) — the dropdown variant relies on CSS `group-hover` rather than
 * a click handler, and the sidebar variant just renders every level open.
 */
export default function CategoryNav({
  categories,
  activeSlug,
  variant = "dropdown",
}: CategoryNavProps) {
  if (variant === "sidebar") {
    return (
      <nav aria-label="Product categories" className="flex flex-col gap-6">
        <Link
          href="/browse"
          className={`text-[0.72rem] font-medium tracking-[0.1em] uppercase no-underline transition-colors ${
            !activeSlug ? "text-[var(--rg-light)]" : "text-[var(--muted2)] hover:text-[var(--rg-light)]"
          }`}
        >
          All Categories
        </Link>
        {categories.map((cat) => {
          const isActiveParent =
            activeSlug === cat.slug || cat.children?.some((c) => c.slug === activeSlug);
          return (
            <div key={cat.slug}>
              <Link
                href={`/browse?cat=${cat.slug}`}
                className={`block font-serif text-[1.05rem] no-underline transition-colors ${
                  isActiveParent ? "text-[var(--rg-light)]" : "text-[var(--cream)] hover:text-[var(--rg-light)]"
                }`}
              >
                {cat.name}
              </Link>
              {cat.children && cat.children.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1.5 border-l border-[var(--border)] pl-4 list-none">
                  {cat.children.map((child) => (
                    <li key={child.slug}>
                      <Link
                        href={`/browse?cat=${child.slug}`}
                        className={`text-[0.8rem] no-underline transition-colors ${
                          activeSlug === child.slug
                            ? "text-[var(--rg-light)]"
                            : "text-[var(--muted2)] hover:text-[var(--rg-light)]"
                        }`}
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  // Dropdown / mega-menu variant, used inside the Header.
  return (
    <div className="group relative">
      <Link
        href="/browse"
        className="flex items-center gap-1.5 text-[0.68rem] font-medium tracking-[0.13em] uppercase text-[var(--muted)] no-underline transition-colors hover:text-[var(--rg-light)]"
      >
        Browse
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden="true">
          <path d="M1 1L4 4.5L7 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </Link>
      <div
        className="invisible absolute left-1/2 top-full z-[210] w-[560px] -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
        style={{ paddingTop: "14px" }}
      >
        <div className="grid grid-cols-4 gap-px border border-[var(--border)] bg-[var(--border)]">
          {categories.map((cat) => (
            <div key={cat.slug} className="bg-[var(--charcoal)] p-5">
              <Link
                href={`/browse?cat=${cat.slug}`}
                className="mb-3 block font-serif text-[0.98rem] text-[var(--cream)] no-underline transition-colors hover:text-[var(--rg-light)]"
              >
                {cat.name}
              </Link>
              <ul className="flex flex-col gap-2 list-none">
                {cat.children?.map((child) => (
                  <li key={child.slug}>
                    <Link
                      href={`/browse?cat=${child.slug}`}
                      className="text-[0.72rem] text-[var(--muted2)] no-underline transition-colors hover:text-[var(--rg-light)]"
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
