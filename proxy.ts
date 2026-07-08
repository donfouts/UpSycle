import { NextResponse, type NextRequest } from "next/server";

import { ID_TOKEN_COOKIE } from "@/lib/auth-constants";

// Coarse, Edge-safe session gate: just checks the ID token cookie is present
// and unexpired (decoding the JWT payload without verifying its signature —
// full verification against Cognito's JWKS happens in lib/verify-token.ts
// inside the actual Node-runtime page/route). Good enough to redirect
// logged-out users away from protected pages; not a security boundary on
// its own.
//
// Named `proxy.ts` per Next.js 16's rename of the `middleware.ts` file
// convention (https://nextjs.org/docs/messages/middleware-to-proxy).
const PROTECTED_PREFIXES = ["/account"];

function isExpiredOrInvalid(token: string): boolean {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return true;
    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized)) as { exp?: number };
    if (typeof payload.exp !== "number") return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ID_TOKEN_COOKIE)?.value;
  if (!token || isExpiredOrInvalid(token)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"],
};
