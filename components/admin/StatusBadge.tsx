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

export default function StatusBadge({ status }: { status: SellerApprovalStatus }) {
  return <span className={`status-badge ${CLASSES[status]}`}>{LABELS[status]}</span>;
}
