import type { SellerApprovalStatus } from "@prisma/client";

const LABELS: Record<SellerApprovalStatus, string> = {
  PENDING: "Pending Review",
  APPROVED: "Approved",
  SUSPENDED: "Suspended",
};

const CLASSES: Record<SellerApprovalStatus, string> = {
  PENDING: "status-pending",
  APPROVED: "status-approved",
  SUSPENDED: "status-suspended",
};

/** Human-readable label for SellerApprovalStatus, shared with admin tables so sort/filter text matches the badge. */
export function sellerStatusLabel(status: SellerApprovalStatus): string {
  return LABELS[status];
}

export default function StatusBadge({ status }: { status: SellerApprovalStatus }) {
  return <span className={`status-badge ${CLASSES[status]}`}>{LABELS[status]}</span>;
}
