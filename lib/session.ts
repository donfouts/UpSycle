import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE, ID_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth-constants";
import type { SignInResult } from "@/lib/cognito";

// MVP session handling: store the Cognito tokens directly in httpOnly
// cookies rather than issuing our own signed session. The ID token is
// already a signed JWT from Cognito (verified in lib/verify-token.ts) so
// there's no need for a separate app-level signing secret. Simple, and
// sufficient for Phase 1 — revisit if we need server-side session
// revocation before the refresh token naturally expires.
const isProd = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function setSessionCookies(tokens: SignInResult): Promise<void> {
  const store = await cookies();

  store.set(ID_TOKEN_COOKIE, tokens.idToken, {
    ...baseCookieOptions,
    maxAge: tokens.expiresIn,
  });
  store.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: tokens.expiresIn,
  });
  if (tokens.refreshToken) {
    store.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...baseCookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
    });
  }
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ID_TOKEN_COOKIE);
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

export async function getIdToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ID_TOKEN_COOKIE)?.value;
}
