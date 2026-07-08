// Shared "must be an APPROVED seller" guard for the product-management
// surface (app/(seller)/sell/products/**, app/api/products/**).
//
// SellerProfile.approvalStatus starts PENDING at signup (see
// app/api/sellers/signup/route.ts) and is only flipped to APPROVED by an
// admin review step (out of scope here). Only APPROVED sellers may create,
// edit, or adjust inventory on products — PENDING/SUSPENDED sellers get a
// clear, specific message instead of a generic 403.
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { SellerApprovalStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getIdToken } from "@/lib/session";
import { verifyIdToken } from "@/lib/verify-token";

export interface AuthedSeller {
  userId: string;
  email: string;
  sellerProfileId: string;
}

export type SellerAuthFailure =
  | { kind: "unauthenticated" }
  | { kind: "no-seller-profile" }
  | { kind: "not-approved"; approvalStatus: SellerApprovalStatus };

export type SellerAuthResolution =
  | { ok: true; seller: AuthedSeller }
  | { ok: false; failure: SellerAuthFailure };

/**
 * Resolves the logged-in user (via the Cognito-backed session cookie, same
 * pattern as app/account/page.tsx) and their SellerProfile. Single source of
 * truth for "is this request allowed to manage products" — used by both
 * Server Components and API routes.
 */
export async function resolveSellerAuth(): Promise<SellerAuthResolution> {
  const idToken = await getIdToken();
  if (!idToken) {
    return { ok: false, failure: { kind: "unauthenticated" } };
  }

  let cognitoSub: string;
  let email: string | undefined;
  try {
    const claims = await verifyIdToken(idToken);
    cognitoSub = claims.sub;
    email = typeof claims.email === "string" ? claims.email : undefined;
  } catch {
    return { ok: false, failure: { kind: "unauthenticated" } };
  }

  const user = await prisma.user.findUnique({
    where: { cognitoSub },
    include: { sellerProfile: true },
  });

  if (!user) {
    return { ok: false, failure: { kind: "unauthenticated" } };
  }

  if (!user.sellerProfile) {
    return { ok: false, failure: { kind: "no-seller-profile" } };
  }

  if (user.sellerProfile.approvalStatus !== SellerApprovalStatus.APPROVED) {
    return {
      ok: false,
      failure: {
        kind: "not-approved",
        approvalStatus: user.sellerProfile.approvalStatus,
      },
    };
  }

  return {
    ok: true,
    seller: {
      userId: user.id,
      email: email ?? user.email,
      sellerProfileId: user.sellerProfile.id,
    },
  };
}

/** Human-readable copy for a given failure, for rendering inline on seller pages. */
export function sellerAuthFailureMessage(failure: SellerAuthFailure): string {
  switch (failure.kind) {
    case "unauthenticated":
      return "Please sign in to manage your products.";
    case "no-seller-profile":
      return "You need an approved seller account to manage products. Apply to sell on UpSycle Market to get started.";
    case "not-approved":
      return failure.approvalStatus === SellerApprovalStatus.PENDING
        ? "Your seller application is still under review. You'll be able to manage products once it's approved."
        : "Your seller account is currently suspended. Contact support if you believe this is a mistake.";
  }
}

/**
 * For Server Components under app/(seller)/sell/products/**: redirects
 * unauthenticated visitors to /login, but returns the resolution (rather than
 * redirecting) for "no profile" / "not approved" so the page can render an
 * inline explanation instead of a confusing bounce.
 */
export async function requireSellerPageAuth(currentPath: string): Promise<SellerAuthResolution> {
  const resolution = await resolveSellerAuth();
  if (!resolution.ok && resolution.failure.kind === "unauthenticated") {
    redirect(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
  }
  return resolution;
}

/** For API routes: maps a failure to the JSON error response it should return. */
export function sellerAuthErrorResponse(failure: SellerAuthFailure): NextResponse {
  const status = failure.kind === "unauthenticated" ? 401 : 403;
  return NextResponse.json({ error: sellerAuthFailureMessage(failure) }, { status });
}
