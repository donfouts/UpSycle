// Small formatting helpers shared by listing/detail pages so price, weight,
// and stock-level copy stay consistent everywhere they're rendered.

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatPriceCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** Inverse of formatPriceCents's underlying conversion — dollars-as-typed-in-a-form to integer cents. */
export function dollarsToCents(dollars: string | number): number {
  const value = typeof dollars === "number" ? dollars : Number.parseFloat(dollars);
  if (!Number.isFinite(value)) return NaN;
  return Math.round(value * 100);
}

/** Integer cents to a plain "12.34" string, suitable for a controlled dollar input's value. */
export function centsToDollarsInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatWeightGrams(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg`;
  }
  return `${grams} g`;
}

export function stockLabel(inventoryCount: number): {
  label: string;
  tone: "out" | "low" | "in";
} {
  if (inventoryCount <= 0) {
    return { label: "Out of Stock", tone: "out" };
  }
  if (inventoryCount <= 5) {
    return {
      label: `Only ${inventoryCount} left`,
      tone: "low",
    };
  }
  return { label: "In Stock", tone: "in" };
}

export function sellerDisplayName(seller: {
  user: { firstName: string | null; lastName: string | null; email: string };
}): string {
  const name = [seller.user.firstName, seller.user.lastName].filter(Boolean).join(" ").trim();
  return name.length > 0 ? name : seller.user.email.split("@")[0];
}

type ShippingStatusValue = "PENDING_SHIPMENT" | "SHIPPED" | "DELIVERED" | "CANCELLED";
type FulfillmentMethodValue = "SHIP" | "PICKUP";

// A pickup line reuses the same ShippingStatus transitions as a shipped line
// (see app/api/seller/order-items/[id]/route.ts) — only the label differs,
// so relabeling here (not adding pickup-specific enum values) keeps a single
// workflow with no schema/transition-logic duplication. Shared by
// ShippingStatusBadge and the seller sales dashboard so the two never drift.
const PICKUP_LABEL_OVERRIDE: Partial<Record<ShippingStatusValue, string>> = {
  PENDING_SHIPMENT: "Ready for Pickup",
  SHIPPED: "Picked Up",
  DELIVERED: "Picked Up",
};

/** Human-readable label for OrderItem.shippingStatus, used by the seller
 * sales dashboard (issue #13) and ShippingStatusBadge. Pass the line's
 * fulfillmentMethod to relabel pickup lines (e.g. "Ready for Pickup" instead
 * of "Pending Shipment"); omit it for the default shipping labels. */
export function shippingStatusLabel(
  status: ShippingStatusValue,
  fulfillmentMethod?: FulfillmentMethodValue,
): string {
  if (fulfillmentMethod === "PICKUP" && PICKUP_LABEL_OVERRIDE[status]) {
    return PICKUP_LABEL_OVERRIDE[status]!;
  }
  switch (status) {
    case "PENDING_SHIPMENT":
      return "Pending Shipment";
    case "SHIPPED":
      return "Shipped";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
  }
}
