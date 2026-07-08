// Minimal Cognito helper for seller signup.
//
// NOTE: `feature/buyer-auth` is building a fuller lib/cognito.ts in parallel
// (see mvp-build-plan.md). Since that branch isn't merged yet, this is a
// small, self-contained duplicate with the same shape (signUp / confirmSignUp
// via @aws-sdk/client-cognito-identity-provider) so this branch doesn't
// depend on unmerged work. Expected to be de-duplicated at merge time.
//
// The actual Cognito user pool does not exist yet — this is built against
// env var placeholders (see .env.example) and has not been live-tested.
import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  SignUpCommand,
  type SignUpCommandInput,
} from "@aws-sdk/client-cognito-identity-provider";

const REGION = process.env.COGNITO_REGION;
const CLIENT_ID = process.env.COGNITO_USER_POOL_CLIENT_ID;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

function getClient(): CognitoIdentityProviderClient {
  return new CognitoIdentityProviderClient({ region: REGION });
}

export interface SignUpResult {
  userSub: string;
  userConfirmed: boolean;
}

/**
 * Creates a new (unconfirmed) Cognito user. Postgres row creation should
 * happen after this succeeds, since `User.cognitoSub` requires a real sub.
 */
export async function signUp(email: string, password: string): Promise<SignUpResult> {
  if (!CLIENT_ID) {
    throw new Error("COGNITO_USER_POOL_CLIENT_ID is not configured");
  }

  const input: SignUpCommandInput = {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }],
  };

  const client = getClient();
  const result = await client.send(new SignUpCommand(input));

  if (!result.UserSub) {
    throw new Error("Cognito sign-up did not return a user sub");
  }

  return { userSub: result.UserSub, userConfirmed: result.UserConfirmed ?? false };
}

/** Confirms a pending Cognito user with the code sent to their email. */
export async function confirmSignUp(email: string, confirmationCode: string): Promise<void> {
  if (!CLIENT_ID) {
    throw new Error("COGNITO_USER_POOL_CLIENT_ID is not configured");
  }

  const client = getClient();
  await client.send(
    new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
    }),
  );
}

/**
 * Compensating action for the seller-signup saga: if the Postgres
 * transaction that follows Cognito signUp fails, the app is left with a
 * Cognito user that has no matching database row. Deleting it here lets the
 * applicant retry signup with the same email instead of hitting
 * "user already exists". Best-effort only — failures are logged, not
 * thrown, so the original DB error is still what the caller sees/returns.
 */
export async function deleteUnconfirmedUser(email: string): Promise<void> {
  if (!USER_POOL_ID) {
    console.error(
      "Cannot roll back Cognito user: COGNITO_USER_POOL_ID is not configured",
    );
    return;
  }

  try {
    const client = getClient();
    await client.send(
      new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: email }),
    );
  } catch (err) {
    console.error("Failed to roll back Cognito user after a DB error:", err);
  }
}
