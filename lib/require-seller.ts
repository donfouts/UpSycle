import type { SellerProfile } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getIdToken } from "@/lib/session";
import { verifyIdToken } from "@/lib/verify-token";

// Resolves the logged-in user's SellerProfile from the Cognito-backed
// session cookie. Small standalone helper — the parallel
// feature/seller-product-mgmt branch needs the same "must be an APPROVED
// seller" check and may grow its own copy; duplication here is fine and
// expected to be reconciled whichever branch merges second.
export type SellerSessionState =
  | { status: "unauthenticated" }
  | { status: "no-profile"; userId: string }
  | { status: "not-approved"; userId: string; sellerProfile: SellerProfile }
  | { status: "approved"; userId: string; sellerProfile: SellerProfile };

export async function getSellerSessionState(): Promise<SellerSessionState> {
  const idToken = await getIdToken();
  if (!idToken) {
    return { status: "unauthenticated" };
  }

  let cognitoSub: string;
  try {
    const claims = await verifyIdToken(idToken);
    cognitoSub = claims.sub;
  } catch {
    return { status: "unauthenticated" };
  }

  const user = await prisma.user.findUnique({
    where: { cognitoSub },
    include: { sellerProfile: true },
  });

  if (!user) {
    return { status: "unauthenticated" };
  }
  if (!user.sellerProfile) {
    return { status: "no-profile", userId: user.id };
  }
  if (user.sellerProfile.approvalStatus !== "APPROVED") {
    return { status: "not-approved", userId: user.id, sellerProfile: user.sellerProfile };
  }
  return { status: "approved", userId: user.id, sellerProfile: user.sellerProfile };
}

export interface ApprovedSeller {
  userId: string;
  sellerProfile: SellerProfile;
}

// Convenience wrapper for call sites (e.g. API routes) that only care about
// the success case and want a single "am I allowed?" check.
export async function getApprovedSeller(): Promise<ApprovedSeller | null> {
  const state = await getSellerSessionState();
  return state.status === "approved"
    ? { userId: state.userId, sellerProfile: state.sellerProfile }
    : null;
}
