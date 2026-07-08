// Shared validation for seller signup — imported by both the client-side
// form (for immediate feedback) and the API route (as the authoritative
// check). Keeping one copy means the two can't drift out of sync.

export const REQUIRED_SAMPLE_PHOTOS = 5;

export interface AddressInput {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface SellerSignupInput {
  email: string;
  password: string;
  address: AddressInput;
  websiteUrl?: string;
  socialMediaUrls: string[];
  expectedMonthlySales: number;
  supplierList: string[];
  referralEmail?: string;
  samplePhotoUrls: string[];
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates a (possibly partial/untrusted) seller signup payload.
 * Returns a list of human-readable error messages; empty means valid.
 */
export function validateSellerSignup(input: Partial<SellerSignupInput>): string[] {
  const errors: string[] = [];

  if (!input.email || !isValidEmail(input.email)) {
    errors.push("A valid email address is required.");
  }

  if (!input.password || input.password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }

  const address = input.address;
  if (!address) {
    errors.push("A local address is required.");
  } else {
    if (!address.line1?.trim()) errors.push("Address line 1 is required.");
    if (!address.city?.trim()) errors.push("City is required.");
    if (!address.state?.trim()) errors.push("State is required.");
    if (!address.postalCode?.trim()) errors.push("Postal code is required.");
    if (!address.country?.trim()) errors.push("Country is required.");
  }

  if (input.websiteUrl && input.websiteUrl.trim() && !isValidUrl(input.websiteUrl)) {
    errors.push("Website URL is not a valid URL (include https://).");
  }

  const socialMediaUrls = (input.socialMediaUrls ?? []).filter((url) => url.trim());
  if (socialMediaUrls.some((url) => !isValidUrl(url))) {
    errors.push("One or more social media links are not valid URLs (include https://).");
  }

  if (
    input.expectedMonthlySales === undefined ||
    input.expectedMonthlySales === null ||
    !Number.isFinite(input.expectedMonthlySales) ||
    !Number.isInteger(input.expectedMonthlySales) ||
    input.expectedMonthlySales <= 0
  ) {
    errors.push("Expected monthly sales must be a positive whole number.");
  }

  const supplierList = (input.supplierList ?? []).filter((s) => s.trim());
  if (supplierList.length === 0) {
    errors.push("At least one supplier is required.");
  }

  if (
    input.referralEmail &&
    input.referralEmail.trim() &&
    !isValidEmail(input.referralEmail)
  ) {
    errors.push("Referral email is not a valid email address.");
  }

  const samplePhotoUrls = (input.samplePhotoUrls ?? []).filter((u) => u.trim());
  if (samplePhotoUrls.length !== REQUIRED_SAMPLE_PHOTOS) {
    errors.push(`Exactly ${REQUIRED_SAMPLE_PHOTOS} sample product photos are required.`);
  } else if (samplePhotoUrls.some((u) => !isValidUrl(u))) {
    errors.push("One or more sample photo uploads failed. Please re-upload.");
  }

  return errors;
}
