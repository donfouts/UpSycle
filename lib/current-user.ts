import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getIdToken } from "@/lib/session";
import { verifyIdToken } from "@/lib/verify-token";
import type { User } from "@prisma/client";

// Shared helper for pages that need the logged-in buyer's actual `User` row
// (not just the display email shown on app/account/page.tsx). Resolves the
// Cognito ID token cookie -> verified `sub` claim -> `User.cognitoSub`, and
// redirects to /login (preserving the page as `redirectTo`) if any step
// fails, mirroring the gate in app/account/page.tsx.
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
