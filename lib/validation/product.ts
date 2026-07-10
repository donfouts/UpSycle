// Shared validation for seller product create/edit — imported by both the
// client-side form (for immediate feedback) and the API routes (as the
// authoritative check), same pattern as lib/validation/sellerSignup.ts.

export const MIN_PRODUCT_PHOTOS = 2;
export const MAX_PRODUCT_PHOTOS = 6;

export interface ProductInput {
  title: string;
  description: string;
  priceCents: number;
  shippingCostCents: number;
  offersLocalPickup?: boolean;
  dimensions?: string;
  weightGrams?: number;
  inventoryCount: number;
  categoryId: string;
  proofOfHandcraftedUrl: string;
  photoUrls: string[];
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

/**
 * Validates a (possibly partial/untrusted) product create payload. Returns a
 * list of human-readable error messages; empty means valid.
 */
export function validateProductInput(input: Partial<ProductInput>): string[] {
  const errors: string[] = [];

  if (!input.title || !input.title.trim()) {
    errors.push("Title is required.");
  }

  if (!input.description || !input.description.trim()) {
    errors.push("Description is required.");
  }

  if (!isNonNegativeInt(input.priceCents) || input.priceCents <= 0) {
    errors.push("Price must be a positive amount.");
  }

  if (!isNonNegativeInt(input.shippingCostCents)) {
    errors.push("Shipping cost must be a non-negative amount.");
  }

  if (input.offersLocalPickup !== undefined && typeof input.offersLocalPickup !== "boolean") {
    errors.push("Offers local pickup must be true or false.");
  }

  if (input.weightGrams !== undefined && input.weightGrams !== null && !isNonNegativeInt(input.weightGrams)) {
    errors.push("Weight must be a non-negative whole number of grams.");
  }

  if (!isNonNegativeInt(input.inventoryCount)) {
    errors.push("Inventory count must be a non-negative whole number.");
  }

  if (!input.categoryId || !input.categoryId.trim()) {
    errors.push("Category is required.");
  }

  if (!input.proofOfHandcraftedUrl || !input.proofOfHandcraftedUrl.trim()) {
    errors.push("A proof-of-handcrafted photo is required.");
  } else if (!isValidUrl(input.proofOfHandcraftedUrl)) {
    errors.push("The proof-of-handcrafted upload failed. Please re-upload.");
  }

  const photoUrls = (input.photoUrls ?? []).filter((u) => u.trim());
  if (photoUrls.length < MIN_PRODUCT_PHOTOS || photoUrls.length > MAX_PRODUCT_PHOTOS) {
    errors.push(`Between ${MIN_PRODUCT_PHOTOS} and ${MAX_PRODUCT_PHOTOS} product photos are required.`);
  } else if (photoUrls.some((u) => !isValidUrl(u))) {
    errors.push("One or more product photo uploads failed. Please re-upload.");
  }

  return errors;
}

/**
 * Validates an inventory-only PATCH payload: exactly one of an absolute
 * `inventoryCount` (set-to-value) or a relative `inventoryDelta`
 * (increment/decrement) must be present.
 */
export function validateInventoryAdjustment(input: {
  inventoryCount?: unknown;
  inventoryDelta?: unknown;
}): string[] {
  const errors: string[] = [];
  const hasCount = input.inventoryCount !== undefined;
  const hasDelta = input.inventoryDelta !== undefined;

  if (hasCount && hasDelta) {
    errors.push("Provide either inventoryCount or inventoryDelta, not both.");
    return errors;
  }

  if (hasCount && !isNonNegativeInt(input.inventoryCount)) {
    errors.push("Inventory count must be a non-negative whole number.");
  }

  if (hasDelta && (typeof input.inventoryDelta !== "number" || !Number.isInteger(input.inventoryDelta))) {
    errors.push("Inventory adjustment must be a whole number.");
  }

  return errors;
}
