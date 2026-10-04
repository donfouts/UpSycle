"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { PlacementPageType } from "@prisma/client";

export interface PlacementSellerOption {
  id: string;
  label: string;
}

// Admin override: manually fill an empty paid slot (Prompts/backend system
// functionality.md: "Admins can select seller to fill empty slots if
// needed"). The API always fills the *lowest-numbered* open slot in this
// period/pageType/category section (see app/api/admin/placement/slots/route.ts),
// so this renders a single assign control per section rather than one form
// per empty slot number — picking "slot 7" vs "slot 9" from the empty-slots
// list wouldn't change which slot actually gets filled.
export default function PlacementSlotAssignForm({
  periodId,
  pageType,
  categoryId,
  nextOpenSlotNumber,
  sellers,
}: {
  periodId: string;
  pageType: PlacementPageType;
  categoryId: string | null;
  nextOpenSlotNumber: number;
  sellers: PlacementSellerOption[];
}) {
  const router = useRouter();
  const [sellerProfileId, setSellerProfileId] = useState(sellers[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function assign(event: FormEvent) {
    event.preventDefault();
    if (!sellerProfileId) return;

    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/placement/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId, pageType, categoryId, sellerProfileId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "That action failed. Please try again.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That action failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (sellers.length === 0) {
    return (
      <p className="text-[0.78rem] text-[var(--muted)]">
        No approved sellers are available to assign.
      </p>
    );
  }

  return (
    <form onSubmit={assign} className="flex flex-wrap items-center gap-2">
      <span className="text-[0.78rem] text-[var(--muted2)]">Fill slot {nextOpenSlotNumber} with</span>
      <select
        className="form-select max-w-[280px]"
        value={sellerProfileId}
        onChange={(e) => setSellerProfileId(e.target.value)}
        disabled={pending}
      >
        {sellers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <button type="submit" className="tbl-action" disabled={pending}>
        {pending ? "Assigning…" : "Assign"}
      </button>
      {error && <span className="text-[0.72rem] text-[var(--danger)]">{error}</span>}
    </form>
  );
}
