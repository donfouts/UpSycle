import { CognitoJwtVerifier } from "aws-jwt-verify";

// Full signature + claims verification against the Cognito User Pool's JWKS
// (cached internally by aws-jwt-verify). Used in Node-runtime server
// components/route handlers for anything that actually reads session
// identity (e.g. app/account/page.tsx) — the Edge middleware only does a
// cheap presence/expiry check (see middleware.ts) and defers real
// verification to here.
type Verifier = ReturnType<typeof CognitoJwtVerifier.create>;

let verifier: Verifier | undefined;

function getVerifier(): Verifier {
  if (!verifier) {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_USER_POOL_CLIENT_ID;
    if (!userPoolId || !clientId) {
      throw new Error(
        "Cognito is not configured (missing COGNITO_USER_POOL_ID / COGNITO_USER_POOL_CLIENT_ID).",
      );
    }
    verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: "id",
      clientId,
    });
  }
  return verifier;
}

export async function verifyIdToken(idToken: string) {
  return getVerifier().verify(idToken);
}
