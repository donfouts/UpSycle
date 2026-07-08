"use client";

import { useState } from "react";

interface InventoryAdjusterProps {
  productId: string;
  initialCount: number;
}

/**
 * Quick +/- inventory control for the product dashboard list — issues a
 * relative PATCH (`inventoryDelta`) rather than reading-then-writing an
 * absolute count, so two open tabs adjusting the same product don't clobber
 * each other. The edit page's inventory field is the set-to-value counterpart
 * of this control.
 */
export default function InventoryAdjuster({ productId, initialCount }: InventoryAdjusterProps) {
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function adjust(delta: number) {
    if (pending) return;
    if (count + delta < 0) return;

    setPending(true);
    setError(null);
    const previous = count;
    setCount(count + delta); // optimistic

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryDelta: delta }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCount(previous);
        setError(data?.errors?.[0] ?? "Failed to update inventory.");
      } else {
        setCount(data.product.inventoryCount as number);
      }
    } catch {
      setCount(previous);
      setError("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => adjust(-1)}
          disabled={pending || count <= 0}
          aria-label="Decrease inventory"
          className="flex h-7 w-7 items-center justify-center border border-[var(--border)] text-[var(--muted2)] transition-colors hover:border-[var(--rg-core)] hover:text-[var(--rg-light)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="min-w-[2.5rem] text-center text-sm text-[var(--cream)]">{count}</span>
        <button
          type="button"
          onClick={() => adjust(1)}
          disabled={pending}
          aria-label="Increase inventory"
          className="flex h-7 w-7 items-center justify-center border border-[var(--border)] text-[var(--muted2)] transition-colors hover:border-[var(--rg-core)] hover:text-[var(--rg-light)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
      {error && <span className="text-[0.65rem] text-[#e58a8a]">{error}</span>}
    </div>
  );
}
