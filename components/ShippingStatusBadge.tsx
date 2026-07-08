import { ShippingStatus } from "@prisma/client";

// Shared badge for order-history/detail pages (issue #12) and eventually the
// seller "mark as shipped" view (issue #13) — one place to keep the
// label/tone mapping for ShippingStatus in sync with the schema's enum.
const STATUS_META: Record<ShippingStatus, { label: string; className: string }> = {
  PENDING_SHIPMENT: {
    label: "Pending Shipment",
    className: "border-[var(--border)] text-[var(--muted2)]",
  },
  SHIPPED: {
    label: "Shipped",
    className: "border-[var(--rg-core)] text-[var(--rg-light)]",
  },
  DELIVERED: {
    label: "Delivered",
    className: "border-[var(--success)] text-[var(--success)]",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-[var(--danger)] text-[var(--danger)]",
  },
};

export default function ShippingStatusBadge({ status }: { status: ShippingStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-block shrink-0 border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
