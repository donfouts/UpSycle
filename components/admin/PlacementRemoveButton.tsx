"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Admin override action shared by lottery-winner rows and paid-slot rows
// (Prompts/backend system functionality.md: "Admins can remove chosen
// winners if needed"). Mirrors SellerActionButtons's fetch + router.refresh()
// pattern rather than a server action, for consistency with the rest of the
// admin UI.
export default function PlacementRemoveButton({
  kind,
  id,
  confirmMessage,
}: {
  kind: "winner" | "slot";
  id: string;
  confirmMessage: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm(confirmMessage)) return;

    setPending(true);
    setError(null);
    try {
      const path = kind === "winner" ? "winners" : "slots";
      const res = await fetch(`/api/admin/placement/${path}/${id}`, { method: "DELETE" });
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

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" className="tbl-action del" disabled={pending} onClick={remove}>
        {pending ? "Removing…" : "Remove"}
      </button>
      {error && <span className="text-[0.72rem] text-[var(--danger)]">{error}</span>}
    </span>
  );
}
