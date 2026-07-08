"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";

/** Cart icon + item count for Header.tsx. A small client island — Header
 * itself stays a server component. Renders a plain cart glyph rather than an
 * icon-font dependency (none is installed) to keep this in sync with the
 * rest of the site's hand-rolled SVG/text approach. */
export default function CartBadge() {
  const { count, hydrated } = useCart();

  return (
    <Link
      href="/cart"
      aria-label="View cart"
      className="relative flex items-center text-[0.68rem] font-medium tracking-[0.13em] uppercase text-[var(--muted)] no-underline transition-colors hover:text-[var(--rg-light)]"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9.5" cy="20.5" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="17.5" cy="20.5" r="1.4" fill="currentColor" stroke="none" />
      </svg>
      {hydrated && count > 0 && (
        <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--rg-core)] px-1 text-[0.55rem] font-semibold text-[var(--black)]">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
