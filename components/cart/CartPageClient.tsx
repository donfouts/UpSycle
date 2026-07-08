"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatPriceCents } from "@/lib/format";

interface ResolvedLine {
  productId: string;
  quantity: number;
  title?: string;
  photoUrl?: string | null;
  sellerName?: string;
  priceCents?: number;
  shippingCostCents?: number;
  inventoryCount?: number;
  available?: boolean;
}

export default function CartPageClient() {
  const router = useRouter();
  const { items, hydrated, updateQuantity, removeFromCart } = useCart();
  const [lines, setLines] = useState<ResolvedLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Nothing to resolve for an empty (or not-yet-hydrated) cart — the
    // render below shows the empty state directly from `items`, so there's
    // no state to reset here.
    if (!hydrated || items.length === 0) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-with-loading-flag pattern; the async .then/.finally below do the real sync
    setLoading(true);
    fetch("/api/cart/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setLines(data.lines ?? []);
      })
      .catch(() => {
        if (!cancelled) setLines([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, items]);

  if (!hydrated) {
    return <p className="mt-10 text-[0.9rem] font-light text-[var(--muted2)]">Loading your cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="mt-10">
        <p className="mb-6 text-[0.9rem] font-light text-[var(--muted2)]">Your cart is empty.</p>
        <Link href="/browse" className="btn-primary">
          Browse the Marketplace
        </Link>
      </div>
    );
  }

  if (loading) {
    return <p className="mt-10 text-[0.9rem] font-light text-[var(--muted2)]">Loading your cart…</p>;
  }

  const validLines = lines.filter((l) => l.priceCents != null);
  const subtotalCents = validLines.reduce((sum, l) => sum + (l.priceCents ?? 0) * l.quantity, 0);
  const shippingCents = validLines.reduce((sum, l) => sum + (l.shippingCostCents ?? 0), 0);
  const totalCents = subtotalCents + shippingCents;
  const hasUnavailable = lines.some((l) => !l.priceCents || l.available === false);

  return (
    <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
      <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {lines.map((line) => (
          <div key={line.productId} className="flex flex-wrap items-center gap-4 py-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden bg-[var(--deep)]">
              {line.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- external/S3 photo URLs, no fixed domain configured yet
                <img src={line.photoUrl} alt={line.title ?? ""} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[0.5rem] uppercase tracking-[0.1em] text-[var(--muted)]">
                  No Photo
                </div>
              )}
            </div>

            <div className="min-w-[160px] flex-1">
              {line.title ? (
                <Link
                  href={`/products/${line.productId}`}
                  className="font-serif text-[1rem] leading-tight text-[var(--cream)] no-underline hover:text-[var(--rg-light)]"
                >
                  {line.title}
                </Link>
              ) : (
                <span className="text-[0.85rem] text-[var(--danger)]">This listing is no longer available.</span>
              )}
              {line.sellerName && (
                <div className="mt-1 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                  {line.sellerName}
                </div>
              )}
              {line.available === false && (
                <div className="mt-1 text-[0.72rem] text-[var(--danger)]">Out of stock</div>
              )}
              {line.available !== false &&
                line.inventoryCount != null &&
                line.inventoryCount < line.quantity && (
                  <div className="mt-1 text-[0.72rem] text-[var(--danger)]">
                    Only {line.inventoryCount} left — reduce quantity before checkout
                  </div>
                )}
            </div>

            <select
              className="form-select w-auto"
              value={line.quantity}
              onChange={(e) => updateQuantity(line.productId, Number.parseInt(e.target.value, 10))}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  Qty {n}
                </option>
              ))}
            </select>

            {line.priceCents != null && (
              <div className="w-24 text-right font-serif text-[1rem] text-[var(--cream)]">
                {formatPriceCents(line.priceCents * line.quantity)}
              </div>
            )}

            <button
              type="button"
              onClick={() => removeFromCart(line.productId)}
              className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-[var(--muted)] underline underline-offset-4 hover:text-[var(--danger)]"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <aside className="h-fit border border-[var(--border)] bg-[var(--charcoal)] p-6">
        <h2 className="mb-5 font-serif text-[1.2rem] text-[var(--cream)]">Order Summary</h2>
        <dl className="mb-6 space-y-2 text-[0.85rem]">
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Subtotal</dt>
            <dd className="text-[var(--cream)]">{formatPriceCents(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Shipping</dt>
            <dd className="text-[var(--cream)]">{formatPriceCents(shippingCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-[var(--border)] pt-2 font-semibold">
            <dt className="text-[var(--cream)]">Total</dt>
            <dd className="grad-text">{formatPriceCents(totalCents)}</dd>
          </div>
        </dl>

        {hasUnavailable && (
          <p className="form-error mb-4 !mb-4">
            Remove or adjust unavailable/out-of-stock items before checking out.
          </p>
        )}

        <button
          type="button"
          disabled={hasUnavailable || validLines.length === 0}
          onClick={() => router.push("/checkout")}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          Proceed to Checkout
        </button>
      </aside>
    </div>
  );
}
