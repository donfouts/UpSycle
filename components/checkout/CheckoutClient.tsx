"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatPriceCents } from "@/lib/format";

interface AddressOption {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface ResolvedLine {
  productId: string;
  quantity: number;
  title?: string;
  sellerName?: string;
  priceCents?: number;
  shippingCostCents?: number;
  inventoryCount?: number;
  available?: boolean;
}

export default function CheckoutClient({ addresses }: { addresses: AddressOption[] }) {
  const { items, hydrated } = useCart();
  const [lines, setLines] = useState<ResolvedLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [addressId, setAddressId] = useState<string | undefined>(addresses[0]?.id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Nothing to resolve for an empty (or not-yet-hydrated) cart — the
    // render below shows the empty state directly from `items`.
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
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, items]);

  const validLines = lines.filter((l) => l.priceCents != null && l.available !== false);
  const subtotalCents = validLines.reduce((sum, l) => sum + (l.priceCents ?? 0) * l.quantity, 0);
  const shippingCents = validLines.reduce((sum, l) => sum + (l.shippingCostCents ?? 0), 0);
  const totalCents = subtotalCents + shippingCents;
  const distinctSellers = new Set(validLines.map((l) => l.sellerName).filter(Boolean));

  const canSubmit = hydrated && !loading && validLines.length === lines.length && lines.length > 0 && !!addressId;

  async function handlePay() {
    if (!addressId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, shippingAddressId: addressId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start checkout. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return <p className="mt-10 text-[0.9rem] font-light text-[var(--muted2)]">Loading your order…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="mt-10">
        <p className="mb-6 text-[0.9rem] font-light text-[var(--muted2)]">
          Your cart is empty — nothing to check out.
        </p>
        <Link href="/browse" className="btn-primary">
          Browse the Marketplace
        </Link>
      </div>
    );
  }

  if (loading) {
    return <p className="mt-10 text-[0.9rem] font-light text-[var(--muted2)]">Loading your order…</p>;
  }

  return (
    <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
      <div>
        <h2 className="mb-4 font-serif text-[1.2rem] text-[var(--cream)]">Shipping Address</h2>
        {addresses.length === 0 ? (
          <p className="form-error">
            We couldn&rsquo;t find a saved shipping address on your account. Please contact support.
          </p>
        ) : (
          <div className="mb-10 space-y-3">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`flex cursor-pointer items-start gap-3 border p-4 text-[0.85rem] ${
                  addressId === address.id
                    ? "border-[var(--rg-core)] bg-[var(--panel)]"
                    : "border-[var(--border)]"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  className="mt-1"
                  checked={addressId === address.id}
                  onChange={() => setAddressId(address.id)}
                />
                <span className="text-[var(--muted2)]">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                  <br />
                  {address.country}
                  {address.isDefault && (
                    <span className="ml-2 text-[0.6rem] uppercase tracking-[0.12em] text-[var(--rg-core)]">
                      Default
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}

        <h2 className="mb-4 font-serif text-[1.2rem] text-[var(--cream)]">Items</h2>
        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {lines.map((line) => (
            <div key={line.productId} className="flex items-center justify-between gap-4 py-4 text-[0.85rem]">
              <div>
                <div className="text-[var(--cream)]">
                  {line.title ?? "Unavailable listing"} × {line.quantity}
                </div>
                {line.sellerName && (
                  <div className="text-[0.62rem] uppercase tracking-[0.12em] text-[var(--muted)]">
                    Sold by {line.sellerName}
                  </div>
                )}
                {line.available === false && (
                  <div className="mt-1 text-[0.72rem] text-[var(--danger)]">
                    No longer available — go back to your cart to remove it.
                  </div>
                )}
              </div>
              {line.priceCents != null && (
                <div className="shrink-0 text-[var(--cream)]">
                  {formatPriceCents(line.priceCents * line.quantity + (line.shippingCostCents ?? 0))}
                </div>
              )}
            </div>
          ))}
        </div>

        {distinctSellers.size > 1 && (
          <p className="form-hint mt-4">
            This order includes items from {distinctSellers.size} different sellers. It will be paid for as a
            single charge to UpSycle Market; each seller ships their own items independently, and you can track
            each item&rsquo;s shipping status separately once the order is placed.
          </p>
        )}
      </div>

      <aside className="h-fit border border-[var(--border)] bg-[var(--charcoal)] p-6">
        <h2 className="mb-5 font-serif text-[1.2rem] text-[var(--cream)]">Order Total</h2>
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

        {error && <div className="form-error">{error}</div>}

        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={handlePay}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Redirecting to Payment…" : "Pay with Stripe"}
        </button>
        <p className="form-hint mt-4">
          You&rsquo;ll be redirected to Stripe&rsquo;s secure checkout to complete payment.
        </p>
      </aside>
    </div>
  );
}
