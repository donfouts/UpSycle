import {
  AuthFlowType,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

// Amazon Cognito owns credentials, email verification, and the OTP-based
// password-reset flow (backed by SES — configured in the parallel
// CDK-infra branch). This module is the only place in the app that talks to
// Cognito; Postgres (see lib/prisma.ts) only ever stores the resulting
// `cognitoSub`, never a password.
//
// Env vars are read lazily (not at module load) so the app can still build
// without a real Cognito pool provisioned yet; the error only surfaces if an
// auth route is actually invoked at request time.

let client: CognitoIdentityProviderClient | undefined;

function getClient(): CognitoIdentityProviderClient {
  if (!client) {
    client = new CognitoIdentityProviderClient({
      region: process.env.COGNITO_REGION,
    });
  }
  return client;
}

function getClientId(): string {
  const clientId = process.env.COGNITO_USER_POOL_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "COGNITO_USER_POOL_CLIENT_ID is not configured. Set it in .env once the Cognito User Pool is provisioned.",
    );
  }
  return clientId;
}

export interface SignUpParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SignUpResult {
  userSub: string;
  userConfirmed: boolean;
}

export async function signUp({ email, password, firstName, lastName }: SignUpParams): Promise<SignUpResult> {
  const result = await getClient().send(
    new SignUpCommand({
      ClientId: getClientId(),
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "given_name", Value: firstName },
        { Name: "family_name", Value: lastName },
      ],
    }),
  );

  if (!result.UserSub) {
    throw new Error("Cognito SignUp did not return a user id (UserSub).");
  }

  return {
    userSub: result.UserSub,
    userConfirmed: result.UserConfirmed ?? false,
  };
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  await getClient().send(
    new ConfirmSignUpCommand({
      ClientId: getClientId(),
      Username: email,
      ConfirmationCode: code,
    }),
  );
}

export async function resendConfirmationCode(email: string): Promise<void> {
  await getClient().send(
    new ResendConfirmationCodeCommand({
      ClientId: getClientId(),
      Username: email,
    }),
  );
}

export interface SignInResult {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

// Uses the USER_PASSWORD_AUTH flow (must be enabled on the app client in the
// Cognito User Pool — that's the infra branch's responsibility). MFA / custom
// auth challenges are out of scope for MVP; if Cognito returns a challenge
// instead of tokens we surface it as an error rather than silently failing.
export async function signIn(email: string, password: string): Promise<SignInResult> {
  const result = await getClient().send(
    new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: getClientId(),
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    }),
  );

  const authResult = result.AuthenticationResult;
  if (!authResult?.IdToken || !authResult.AccessToken) {
    if (result.ChallengeName) {
      throw new Error(`UnsupportedChallenge:${result.ChallengeName}`);
    }
    throw new Error("Cognito did not return authentication tokens.");
  }

  return {
    idToken: authResult.IdToken,
    accessToken: authResult.AccessToken,
    refreshToken: authResult.RefreshToken,
    expiresIn: authResult.ExpiresIn ?? 3600,
  };
}

// Issue #7: account recovery. Triggers Cognito to email a one-time code via
// its SES integration — no OTP generation/storage happens in this app.
export async function forgotPassword(email: string): Promise<void> {
  await getClient().send(
    new ForgotPasswordCommand({
      ClientId: getClientId(),
      Username: email,
    }),
  );
}

export async function confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
  await getClient().send(
    new ConfirmForgotPasswordCommand({
      ClientId: getClientId(),
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    }),
  );
}

// Cognito throws typed exceptions (by `.name`) for known failure cases. We
// never surface raw SDK/AWS error text to the user — map to friendly copy
// and log the original server-side for debugging.
export function getCognitoErrorMessage(err: unknown): string {
  const name = err instanceof Error ? err.name : undefined;
  const message = err instanceof Error ? err.message : undefined;

  switch (name) {
    case "UsernameExistsException":
      return "An account with that email already exists. Try signing in instead.";
    case "InvalidPasswordException":
      return "That password doesn't meet the security requirements. Use at least 8 characters, including uppercase, lowercase, and a number.";
    case "InvalidParameterException":
      return "Please double-check the information you entered and try again.";
    case "CodeMismatchException":
      return "That code is incorrect. Please check your email and try again.";
    case "ExpiredCodeException":
      return "That code has expired. Request a new one and try again.";
    case "NotAuthorizedException":
      return "Incorrect email or password.";
    case "UserNotConfirmedException":
      return "Please confirm your email address before signing in.";
    case "UserNotFoundException":
      return "We couldn't find an account with that email.";
    case "LimitExceededException":
    case "TooManyRequestsException":
    case "TooManyFailedAttemptsException":
      return "Too many attempts. Please wait a few minutes and try again.";
    default:
      if (message?.startsWith("UnsupportedChallenge:")) {
        return "Additional verification is required for this account. Please contact support.";
      }
      if (message?.includes("is not configured")) {
        return "Sign-in is temporarily unavailable. Please try again later.";
      }
      return "Something went wrong. Please try again.";
  }
}
