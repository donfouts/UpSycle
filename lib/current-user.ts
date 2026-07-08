import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getIdToken } from "@/lib/session";
import { verifyIdToken } from "@/lib/verify-token";
import type { User } from "@prisma/client";

// Shared "who is logged in" resolvers for anything past app/account/page.tsx's
// smoke test. Two variants for two different call-site needs:
//  - getCurrentUser(): nullable, for pages/routes that want to branch on
//    logged-out state themselves (e.g. cart/checkout showing a prompt).
//  - requireCurrentUser(redirectTo): throws via redirect() to /login if any
//    step fails, for pages that have no sensible logged-out rendering at all
//    (e.g. order history).
// Both resolve the same way: Cognito ID token cookie -> verified `sub` claim
// -> matching `User.cognitoSub` row.

export async function getCurrentUser(): Promise<User | null> {
  const idToken = await getIdToken();
  if (!idToken) return null;

  let cognitoSub: string;
  try {
    const claims = await verifyIdToken(idToken);
    cognitoSub = claims.sub;
  } catch {
    return null;
  }

  return prisma.user.findUnique({ where: { cognitoSub } });
}

export async function requireCurrentUser(redirectTo: string): Promise<User> {
  const loginUrl = `/login?redirectTo=${encodeURIComponent(redirectTo)}`;

  const idToken = await getIdToken();
  if (!idToken) {
    redirect(loginUrl);
  }

  let sub: string;
  try {
    const claims = await verifyIdToken(idToken);
    if (typeof claims.sub !== "string") {
      throw new Error("ID token missing sub claim");
    }
    sub = claims.sub;
  } catch {
    redirect(loginUrl);
  }

  const user = await prisma.user.findUnique({ where: { cognitoSub: sub } });
  if (!user) {
    redirect(loginUrl);
  }

  return user;
}
