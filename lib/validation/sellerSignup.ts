// Shared validation for seller signup — imported by both the client-side
// form (for immediate feedback) and the API route (as the authoritative
// check). Keeping one copy means the two can't drift out of sync.

import type { SellerTier } from "@prisma/client";

export const REQUIRED_SAMPLE_PHOTOS = 5;

export interface AddressInput {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export const MAX_STORY_LENGTH = 2000;

export interface SellerSignupInput {
  // Omitted when applying from an existing logged-in account — see
  // requireCredentials below.
  email?: string;
  password?: string;
  address: AddressInput;
  websiteUrl?: string;
  socialMediaUrls: string[];
  expectedMonthlySales: number;
  supplierList: string[];
  referralEmail?: string;
  samplePhotoUrls: string[];
  // Optional paragraph shown on the seller's public storefront page once
  // approved. Also editable later from the seller dashboard (see
  // app/api/sellers/profile/route.ts) — not required at application time.
  story?: string;
  // Seller-selected pricing tier. Pricing/benefits per tier and payment
  // processing are still undecided — this only captures the applicant's
  // choice for later use.
  tier?: SellerTier;
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
 *
 * requireCredentials is false when the applicant is already logged in
 * (attaching a seller profile to their existing account, no new Cognito
 * identity needed) — see app/api/sellers/signup/route.ts.
 */
export function validateSellerSignup(
  input: Partial<SellerSignupInput>,
  { requireCredentials = true }: { requireCredentials?: boolean } = {},
): string[] {
  const errors: string[] = [];

  if (requireCredentials) {
    if (!input.email || !isValidEmail(input.email)) {
      errors.push("A valid email address is required.");
    }

    if (!input.password || input.password.length < 8) {
      errors.push("Password must be at least 8 characters.");
    }
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

  if (input.story && input.story.length > MAX_STORY_LENGTH) {
    errors.push(`Your story must be ${MAX_STORY_LENGTH} characters or fewer.`);
  }

  if (!input.tier) {
    errors.push("Please select a seller tier.");
  } else if (!["TIER_1", "TIER_2", "TIER_3"].includes(input.tier)) {
    errors.push("Selected tier is not valid.");
  }

  return errors;
}
