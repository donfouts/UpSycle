import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getIdToken } from "@/lib/session";
import { verifyIdToken } from "@/lib/verify-token";

// Server-side identity resolution shared by every protected page/route that
// needs to know *who* is signed in (not just *that* someone is signed in —
// see proxy.ts for the cheap Edge-side presence check). Verifies the Cognito
// ID token, then looks up the matching Postgres User row (and its roles) by
// `cognitoSub`.
export interface CurrentUser {
  id: string;
  cognitoSub: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: Role[];
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const idToken = await getIdToken();
  if (!idToken) return null;

  let cognitoSub: string;
  try {
    const claims = await verifyIdToken(idToken);
    cognitoSub = claims.sub;
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { cognitoSub },
    include: { roles: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    cognitoSub: user.cognitoSub,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles.map((r) => r.role),
  };
}

// There is deliberately no self-serve way to become an ADMIN (that would be
// a security hole) — admin role assignment happens out-of-band, directly in
// the database (see prisma/seed.ts for the local-dev demo admin, seeded the
// same way a real admin would be granted the role in production: an
// operator inserting a UserRole row, not an app code path).
export async function isAdmin(userId: string): Promise<boolean> {
  const adminRole = await prisma.userRole.findUnique({
    where: { userId_role: { userId, role: Role.ADMIN } },
  });
  return adminRole !== null;
}

// Guard for admin **pages** (Server Components). Redirects logged-out users
// to /login, and bounces authenticated non-admins back to the homepage
// without revealing that /admin exists. Use at the top of every admin
// page/layout.
export async function requireAdmin(redirectTo = "/admin"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }
  if (!user.roles.includes(Role.ADMIN)) {
    redirect("/");
  }
  return user;
}

// Guard for admin **API routes**, where next/navigation's redirect() isn't
// the right tool. Returns the authenticated admin user, or a NextResponse
// the caller should return immediately.
export async function requireAdminApiUser(): Promise<CurrentUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (!user.roles.includes(Role.ADMIN)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  return user;
}
