// Shared cookie names for the Cognito-backed session. Kept in their own
// module (no imports) so both `lib/session.ts` (Node runtime, uses
// `next/headers`) and `middleware.ts` (Edge runtime, uses `NextRequest`) can
// reference the same names without pulling in APIs the other can't use.
export const ID_TOKEN_COOKIE = "upsycle_id_token";
export const ACCESS_TOKEN_COOKIE = "upsycle_access_token";
export const REFRESH_TOKEN_COOKIE = "upsycle_refresh_token";
