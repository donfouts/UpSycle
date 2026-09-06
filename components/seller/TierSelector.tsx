"use client";

import { useState } from "react";
import type { SellerTier } from "@prisma/client";

const labelClass =
  "mb-2 block text-[0.65rem] font-medium tracking-[0.13em] uppercase text-[var(--muted)]";

const TIER_OPTIONS: { value: SellerTier; label: string }[] = [
  { value: "TIER_1", label: "Tier 1" },
  { value: "TIER_2", label: "Tier 2" },
  { value: "TIER_3", label: "Tier 3" },
];

function tierLabel(tier: SellerTier): string {
  return TIER_OPTIONS.find((option) => option.value === tier)?.label ?? tier;
}

export default function TierSelector({ initialTier }: { initialTier: SellerTier }) {
  const [tier, setTier] = useState<SellerTier>(initialTier);
  const [saved, setSaved] = useState<SellerTier>(initialTier);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setPending(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/sellers/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.errors?.[0] ?? "Failed to save your tier.");
        return;
      }
      setSaved(data.tier ?? tier);
      setSuccess(true);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <label className={labelClass}>Seller Tier</label>
      <p className="mb-2 text-[0.78rem] font-light text-[var(--muted2)]">
        Current Tier: <span className="text-[var(--cream)]">{tierLabel(saved)}</span>
      </p>

      <div className="mt-4 space-y-3">
        {TIER_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 border border-[var(--border)] bg-[var(--panel2)] px-4 py-3 text-sm text-[var(--cream)] transition-colors has-[:checked]:border-[var(--rg-core)]"
          >
            <input
              type="radio"
              name="seller-tier"
              value={option.value}
              checked={tier === option.value}
              onChange={() => {
                setTier(option.value);
                setSuccess(false);
              }}
            />
            {option.label}
          </label>
        ))}
      </div>

      <p className="mt-4 text-[0.75rem] font-light italic text-[var(--muted2)]">
        Pricing, benefits, and billing for each tier are still being finalized. Changing your
        tier here has no billing effect yet.
      </p>

      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleSave}
          disabled={pending || tier === saved}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {success && <span className="text-[0.75rem] text-[var(--success)]">Saved.</span>}
        {error && <span className="text-[0.75rem] text-[#e58a8a]">{error}</span>}
      </div>
    </div>
  );
}
