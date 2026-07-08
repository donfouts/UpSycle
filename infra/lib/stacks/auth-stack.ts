import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

/**
 * AuthStack
 *
 * Cognito User Pool (Essentials tier — 10,000 MAU free, per infra plan) that
 * owns credentials/session security for the app. Postgres (see DataStack /
 * prisma/schema.prisma) stores only `cognitoSub` — no passwords.
 *
 * Role model: Requirement.MD calls for a user to hold multiple roles
 * (buyer/seller/admin) simultaneously. Cognito Groups are used for this
 * (a user can be added to multiple groups: `buyer`, `seller`, `admin`) rather
 * than a single custom attribute, since a scalar attribute can't represent
 * "holds more than one role" cleanly. Groups also give free IAM-less
 * role-based authorization via the ID token's `cognito:groups` claim.
 *
 * A custom `sellerApprovalStatus` attribute is also exposed for quick reads
 * (pending/approved/suspended) without a DB round-trip, mirroring
 * SellerProfile.approvalStatus in prisma/schema.prisma. The seller-vetting
 * workflow's source of truth remains Postgres; this attribute is a
 * convenience mirror only.
 */
export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, "UpSycleUserPool", {
      userPoolName: "upsycle-user-pool",
      featurePlan: cognito.FeaturePlan.ESSENTIALS,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        givenName: { required: false, mutable: true },
        familyName: { required: false, mutable: true },
      },
      customAttributes: {
        // Mirrors SellerProfile.approvalStatus (prisma/schema.prisma) for fast
        // client-side reads; Postgres via SellerProfile remains the source of truth.
        sellerApprovalStatus: new cognito.StringAttribute({ minLen: 1, maxLen: 20, mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      // OTP-based account recovery (per infra plan's SES-driven "OTP recovery")
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      email: cognito.UserPoolEmail.withCognito(), // swapped to SES (EmailStack identity) once that identity is verified & sending limits raised
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // One group per role. A user can belong to any combination of these,
    // giving the multi-role support Requirement.MD calls for.
    new cognito.CfnUserPoolGroup(this, "BuyerGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "buyer",
      description: "Buyers — default role for any signed-up user",
      precedence: 30,
    });
    new cognito.CfnUserPoolGroup(this, "SellerGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "seller",
      description: "Sellers — granted after seller vetting is approved (see SellerProfile.approvalStatus)",
      precedence: 20,
    });
    new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "admin",
      description: "Platform admins",
      precedence: 10,
    });

    this.userPoolClient = this.userPool.addClient("NextJsAppClient", {
      userPoolClientName: "upsycle-nextjs-app",
      generateSecret: false, // public client — Next.js app uses Authorization Code + PKCE
      authFlows: {
        userSrp: true,
        userPassword: false,
        custom: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          "http://localhost:3000/api/auth/callback/cognito",
          "https://UpSycleMarket.com/api/auth/callback/cognito",
        ],
        logoutUrls: ["http://localhost:3000", "https://UpSycleMarket.com"],
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // Hosted UI domain — convenient default; can be swapped for a custom
    // domain under UpSycleMarket.com later if desired.
    this.userPool.addDomain("HostedUiDomain", {
      cognitoDomain: { domainPrefix: "upsycle-auth" },
    });

    new cdk.CfnOutput(this, "UserPoolId", { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: this.userPoolClient.userPoolClientId });
  }
}
