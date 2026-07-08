import { prisma } from "@/lib/prisma";
import { getIdToken } from "@/lib/session";
import { verifyIdToken } from "@/lib/verify-token";

// Shared "who is logged in" resolver for anything past app/account/page.tsx's
// smoke test — cart/checkout need the actual Postgres User row (id, name,
// addresses), not just the Cognito claims. Centralized here so the
// cart/checkout pages and API routes all gate access the same way: verify
// the Cognito ID token cookie, then load the matching User by cognitoSub.
export async function getCurrentUser() {
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
