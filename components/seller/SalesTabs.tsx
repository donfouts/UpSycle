"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FulfillmentMethod, ShippingStatus } from "@prisma/client";

import { formatPriceCents, shippingStatusLabel } from "@/lib/format";

export interface SaleItemView {
  id: string;
  productTitle: string;
  thumbnailUrl: string | null;
  quantity: number;
  unitPriceCents: number;
  shippingStatus: ShippingStatus;
  fulfillmentMethod: FulfillmentMethod;
  orderedAt: string; // ISO string — Dates aren't passed across the server/client boundary
}

const STATUS_TONE: Record<ShippingStatus, string> = {
  PENDING_SHIPMENT: "text-[var(--rg-light)]",
  SHIPPED: "text-[var(--success)]",
  DELIVERED: "text-[var(--success)]",
  CANCELLED: "text-[var(--muted2)]",
};

function formatOrderedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Client component so "Mark as Shipped" can PATCH the API and the seller
// sees the item move out of the Pending tab without a full page nav. Tab
// data itself is fetched server-side (app/(seller)/sell/sales/page.tsx) and
// handed down as props; after a successful PATCH we just router.refresh()
// so the server re-queries fresh grouped/ordered data rather than us
// hand-rolling client-side list mutation.
export default function SalesTabs({
  pendingItems,
  historyItems,
}: {
  pendingItems: SaleItemView[];
  historyItems: SaleItemView[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [inFlightIds, setInFlightIds] = useState<Set<string>>(new Set());
  const [errorFor, setErrorFor] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  async function markShipped(itemId: string) {
    setInFlightIds((prev) => new Set(prev).add(itemId));
    setErrorFor((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    try {
      const res = await fetch(`/api/seller/order-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingStatus: "SHIPPED" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to update.");
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setErrorFor((prev) => ({
        ...prev,
        [itemId]: err instanceof Error ? err.message : "Failed to update.",
      }));
      setInFlightIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  const items = tab === "pending" ? pendingItems : historyItems;
  const tabBtnClass = (active: boolean) =>
    `px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
      active
        ? "border-b-2 border-[var(--rg-core)] text-[var(--rg-light)]"
        : "border-b-2 border-transparent text-[var(--muted)] hover:text-[var(--cream)]"
    }`;

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-[var(--border)]">
        <button type="button" onClick={() => setTab("pending")} className={tabBtnClass(tab === "pending")}>
          Pending Shipment ({pendingItems.length})
        </button>
        <button type="button" onClick={() => setTab("history")} className={tabBtnClass(tab === "history")}>
          Order History ({historyItems.length})
        </button>
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-[0.85rem] font-light text-[var(--muted2)]">
          {tab === "pending" ? "No items waiting to ship." : "No shipped orders yet."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 border-b border-[var(--border2)] py-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden bg-[var(--deep)]">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external/S3 photo URLs, no fixed domain configured yet
                    <img
                      src={item.thumbnailUrl}
                      alt={item.productTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-center text-[0.5rem] uppercase tracking-[0.1em] text-[var(--muted)]">
                      No Photo
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.9rem] text-[var(--cream)]">{item.productTitle}</div>
                  <div className="text-[0.72rem] font-light text-[var(--muted2)]">
                    Qty {item.quantity} · Ordered {formatOrderedDate(item.orderedAt)}
                  </div>
                  {errorFor[item.id] && (
                    <div className="mt-1 text-[0.7rem] text-[var(--danger)]">{errorFor[item.id]}</div>
                  )}
                </div>

                <div className="w-24 shrink-0 text-right text-[0.9rem] text-[var(--cream)]">
                  {formatPriceCents(item.unitPriceCents * item.quantity)}
                </div>

                <div className="w-40 shrink-0 text-right">
                  {item.shippingStatus === "PENDING_SHIPMENT" ? (
                    <button
                      type="button"
                      onClick={() => markShipped(item.id)}
                      disabled={inFlightIds.has(item.id)}
                      className="btn-secondary px-4 py-2 text-[0.62rem] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {inFlightIds.has(item.id)
                        ? "Marking…"
                        : item.fulfillmentMethod === "PICKUP"
                          ? "Mark as Picked Up"
                          : "Mark as Shipped"}
                    </button>
                  ) : (
                    <span
                      className={`text-[0.65rem] font-semibold uppercase tracking-[0.1em] ${STATUS_TONE[item.shippingStatus]}`}
                    >
                      {shippingStatusLabel(item.shippingStatus, item.fulfillmentMethod)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
