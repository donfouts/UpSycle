import { FulfillmentMethod, ShippingStatus } from "@prisma/client";
import { shippingStatusLabel } from "@/lib/format";

// Shared badge for order-history/detail pages (issue #12) and the seller
// "mark as shipped" view (issue #13) — one place to keep the tone mapping
// for ShippingStatus in sync with the schema's enum. Labels (including the
// pickup relabeling) come from lib/format.ts's shippingStatusLabel, shared
// with the seller sales dashboard so the two never drift.
const STATUS_TONE: Record<ShippingStatus, string> = {
  PENDING_SHIPMENT: "border-[var(--border)] text-[var(--muted2)]",
  SHIPPED: "border-[var(--rg-core)] text-[var(--rg-light)]",
  DELIVERED: "border-[var(--success)] text-[var(--success)]",
  CANCELLED: "border-[var(--danger)] text-[var(--danger)]",
};

export default function ShippingStatusBadge({
  status,
  fulfillmentMethod,
}: {
  status: ShippingStatus;
  fulfillmentMethod?: FulfillmentMethod;
}) {
  return (
    <span
      className={`inline-block shrink-0 border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] ${STATUS_TONE[status]}`}
    >
      {shippingStatusLabel(status, fulfillmentMethod)}
    </span>
  );
}
