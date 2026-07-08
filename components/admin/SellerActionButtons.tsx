"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SellerApprovalStatus } from "@prisma/client";

type SellerAction = "approve" | "suspend" | "reinstate";

const CONFIRM_COPY: Record<SellerAction, string> = {
  approve: "Approve this seller? They'll be able to list products immediately.",
  suspend: "Suspend this seller? Their listings will no longer be purchasable.",
  reinstate: "Reinstate this seller back to Approved status?",
};

// Client component so the Approve/Suspend/Reinstate buttons can call the
// admin API route and refresh the server-rendered list in place, without a
// full page reload. Mirrors the fetch + router.refresh() pattern already
// used by components/LogoutButton.tsx.
export default function SellerActionButtons({
  sellerId,
  status,
}: {
  sellerId: string;
  status: SellerApprovalStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<SellerAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: SellerAction) {
    if (!window.confirm(CONFIRM_COPY[action])) return;

    setPending(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "That action failed. Please try again.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That action failed. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {status === "PENDING" && (
          <button
            type="button"
            className="tbl-action"
            disabled={pending !== null}
            onClick={() => act("approve")}
          >
            {pending === "approve" ? "Approving…" : "Approve"}
          </button>
        )}
        {status !== "SUSPENDED" && (
          <button
            type="button"
            className="tbl-action del"
            disabled={pending !== null}
            onClick={() => act("suspend")}
          >
            {pending === "suspend" ? "Suspending…" : status === "PENDING" ? "Reject" : "Suspend"}
          </button>
        )}
        {status === "SUSPENDED" && (
          <button
            type="button"
            className="tbl-action"
            disabled={pending !== null}
            onClick={() => act("reinstate")}
          >
            {pending === "reinstate" ? "Reinstating…" : "Reinstate"}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-[0.72rem] text-[var(--danger)]">{error}</p>}
    </div>
  );
}
