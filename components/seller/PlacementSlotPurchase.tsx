"use client";

import { useState } from "react";
import type { PlacementPageType } from "@prisma/client";
import { formatPriceCents } from "@/lib/format";

interface PlacementSlotPurchaseProps {
  periodId: string;
  pageType: PlacementPageType;
  categoryId: string | null;
  label: string;
  priceCents: number;
  remaining: number;
  alreadyFeatured: boolean;
}

/**
 * One row in the seller's "Buy a Highlighted Slot" panel. POSTs to
 * /api/sellers/marketing/purchase, then redirects the browser straight to
 * the returned Stripe Checkout URL — same client-side redirect pattern as
 * CheckoutClient's "Pay with Stripe" button.
 */
export default function PlacementSlotPurchase({
  periodId,
  pageType,
  categoryId,
  label,
  priceCents,
  remaining,
  alreadyFeatured,
}: PlacementSlotPurchaseProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soldOut = remaining <= 0;

  async function handleBuy() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/sellers/marketing/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId, pageType, categoryId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Could not start checkout. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--charcoal)] px-4 py-3">
      <div>
        <div className="text-[0.9rem] text-[var(--cream)]">{label}</div>
        <div className="text-[0.72rem] font-light text-[var(--muted2)]">
          {formatPriceCents(priceCents)} ·{" "}
          {alreadyFeatured
            ? "You're already featured here this week"
            : soldOut
              ? "All slots sold"
              : `${remaining} of 20 slots left`}
        </div>
        {error && <div className="mt-1 text-[0.7rem] text-[#e58a8a]">{error}</div>}
      </div>
      <button
        type="button"
        onClick={handleBuy}
        disabled={pending || soldOut || alreadyFeatured}
        className="btn-primary shrink-0 !px-6 !py-2.5 text-[0.62rem] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Redirecting…" : "Buy this slot"}
      </button>
    </div>
  );
}
