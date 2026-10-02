"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface PriorityControlProps {
  productId: string;
  priority: number;
  productCount: number;
}

/**
 * Up/down rank control for the product dashboard list. Swaps this product
 * with its neighbor one rank up/down — the server (reorderProductPriority)
 * does the actual shift/renumbering, this just sends the new target rank.
 * Refreshes the page afterward since a move changes every row's displayed
 * rank, not just this one.
 */
export default function PriorityControl({ productId, priority, productCount }: PriorityControlProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function move(targetPriority: number) {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingPriority: targetPriority }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.errors?.[0] ?? "Failed to update priority.");
        return;
      }
      router.refresh();
    } catch {
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
          onClick={() => move(priority - 1)}
          disabled={pending || priority <= 1}
          aria-label="Move priority up"
          className="flex h-7 w-7 items-center justify-center border border-[var(--border)] text-[var(--muted2)] transition-colors hover:border-[var(--rg-core)] hover:text-[var(--rg-light)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ▲
        </button>
        <span className="min-w-[2.5rem] text-center text-sm text-[var(--cream)]">
          {priority}/{productCount}
        </span>
        <button
          type="button"
          onClick={() => move(priority + 1)}
          disabled={pending || priority >= productCount}
          aria-label="Move priority down"
          className="flex h-7 w-7 items-center justify-center border border-[var(--border)] text-[var(--muted2)] transition-colors hover:border-[var(--rg-core)] hover:text-[var(--rg-light)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ▼
        </button>
      </div>
      {error && <span className="text-[0.65rem] text-[#e58a8a]">{error}</span>}
    </div>
  );
}
