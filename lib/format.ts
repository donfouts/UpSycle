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
