// Small formatting helpers shared by listing/detail pages so price, weight,
// and stock-level copy stay consistent everywhere they're rendered.

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatPriceCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
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

// Human-readable label for OrderItem.shippingStatus, used by the seller
// sales dashboard (issue #13).
export function shippingStatusLabel(status: "PENDING_SHIPMENT" | "SHIPPED" | "DELIVERED" | "CANCELLED"): string {
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
