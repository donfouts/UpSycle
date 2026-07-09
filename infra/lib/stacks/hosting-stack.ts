import * as cdk from "aws-cdk-lib";
import * as amplify from "aws-cdk-lib/aws-amplify";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export interface HostingStackProps extends cdk.StackProps {
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  userPoolId: string;
  userPoolClientId: string;
  photosBucketName: string;
}

// Name of the Secrets Manager secret a human must create manually (see
// infra/README.md) containing a GitHub personal access token with `repo` +
// `admin:repo_hook` scopes, used once by Amplify to authorize its GitHub App
// connection to donfouts/UpSycle. Never committed to source.
//
// Must be a classic PAT, not a fine-grained one — fine-grained tokens use a
// different per-repo permission model that doesn't grant the webhook-creation
// access Amplify's CloudFormation resource needs (`admin:repo_hook`), which
// fails with "Resource not accessible by personal access token" otherwise.
const GITHUB_TOKEN_SECRET_NAME = "upsycle/amplify/github-aws-classic2";

/**
 * HostingStack
 *
 * AWS Amplify Hosting app connected directly to GitHub (donfouts/UpSycle,
 * `main` branch). This is the CI/CD wiring for issue #3: Amplify's native
 * GitHub integration auto-builds and deploys on every push to `main` — no
 * separate GitHub Actions workflow needed.
 *
 * NOTE: `Web/UpSycle` in CLAUDE.md refers only to the *local* disk layout
 * (this checkout lives at that path on the dev machine) — the GitHub repo
 * `donfouts/UpSycle` itself has the Next.js app at its root (confirmed via
 * `gh api repos/donfouts/UpSycle/contents`), not nested under a `Web/UpSycle`
 * subdirectory. An earlier version of this stack wrongly treated it as a
 * monorepo (`appRoot: Web/UpSycle`), which failed every build with "Build
 * path does not exist" since that path doesn't exist in the actual repo.
 *
 * Cost per infra plan: $0-8/mo, likely $0 at MVP volume (free tier covers
 * 1,000 build-min, 5GB storage, 15GB transfer/mo).
 */
export class HostingStack extends cdk.Stack {
  public readonly app: amplify.CfnApp;
  public readonly mainBranch: amplify.CfnBranch;
  public readonly defaultDomain: string;

  constructor(scope: Construct, id: string, props: HostingStackProps) {
    super(scope, id, props);

    // Looked up by name at deploy time via a CloudFormation dynamic reference
    // — the actual token value never appears in this code or in the
    // synthesized template.
    const githubToken = secretsmanager.Secret.fromSecretNameV2(
      this,
      "GitHubAccessTokenSecret",
      GITHUB_TOKEN_SECRET_NAME
    );

    // Amplify Hosting doesn't store app-level "environment variables" as
    // literal Lambda env vars — it writes each one to SSM Parameter Store
    // under /amplify/<appId>/<branch>/ and reads them back into process.env
    // at build AND runtime via this service role. Without it, that read
    // fails silently (build log: "Failed to set up process.env.secrets", a
    // WARNING not an error) and every custom env var — Cognito, S3, and
    // DATABASE_URL alike — is simply absent from process.env, causing every
    // DB-touching route to 500 with no build-time signal at all. There's no
    // way to scope the SSM path to this specific app before the app exists
    // (the appId is only known after CfnApp is created), so the policy is
    // attached after construction, referencing `this.app.attrAppId`.
    const amplifyServiceRole = new iam.Role(this, "AmplifyServiceRole", {
      assumedBy: new iam.ServicePrincipal("amplify.amazonaws.com"),
    });

    this.app = new amplify.CfnApp(this, "UpSycleAmplifyApp", {
      iamServiceRole: amplifyServiceRole.roleArn,
      name: "upsycle-web",
      repository: `https://github.com/${props.githubOwner}/${props.githubRepo}`,
      accessToken: githubToken.secretValue.unsafeUnwrap(),
      platform: "WEB_COMPUTE", // Next.js SSR support (per tech-stack-recommendation.md)
      environmentVariables: [
        { name: "AMPLIFY_DIFF_DEPLOY", value: "false" },
        { name: "COGNITO_REGION", value: this.region },
        { name: "COGNITO_USER_POOL_ID", value: props.userPoolId },
        { name: "COGNITO_USER_POOL_CLIENT_ID", value: props.userPoolClientId },
        { name: "PHOTOS_BUCKET_NAME", value: props.photosBucketName },
        // AWS_REGION is a reserved-prefix name Amplify rejects; the app code
        // already falls back to COGNITO_REGION when it's unset (see lib/s3.ts).
        // STRIPE_* keys are deliberately not set here — no real Stripe
        // account exists yet; checkout will error until those are added.
        //
        // DATABASE_URL is deliberately NOT declared here. It contains the RDS
        // admin password, and composing it from DataStack's secret (username
        // + password + host interpolated into one connection-string token)
        // would require unsafeUnwrap()-ing the raw secret value into this
        // array, which `cdk synth` would then write into the synthesized
        // CloudFormation template on disk in plaintext — an unwanted, hard-to-
        // walk-back credential exposure, unlike the GitHub token above (whose
        // single-field SecretValue resolves to a proper CloudFormation
        // dynamic reference, never a literal value in the template).
        // DATABASE_URL must instead be set out-of-band via
        // `aws amplify update-app --environment-variables ...` after every
        // deploy that touches this CfnApp — CloudFormation fully owns
        // AWS::Amplify::App's environmentVariables, so it silently resets to
        // exactly this array (i.e. drops DATABASE_URL) on every stack update.
        // See infra/README.md for the exact command.
      ],
      buildSpec: [
        "version: 1",
        "frontend:",
        "  phases:",
        "    preBuild:",
        "      commands:",
        "        - 'echo DEBUG_ENV_CHECK DATABASE_URL_SET=${DATABASE_URL:+yes} COGNITO_REGION_SET=${COGNITO_REGION:+yes}'",
        "        - npm ci",
        "        - npx prisma generate",
        "    build:",
        "      commands:",
        "        - npm run build",
        "  artifacts:",
        "    baseDirectory: .next",
        "    files:",
        "      - '**/*'",
        "  cache:",
        "    paths:",
        "      - node_modules/**/*",
        "      - .next/cache/**/*",
      ].join("\n"),
      customRules: [
        {
          source: "/<*>",
          target: "/index.html",
          status: "404-200",
        },
      ],
    });

    amplifyServiceRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParametersByPath", "ssm:GetParameters", "ssm:GetParameter"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/amplify/${this.app.attrAppId}/*`,
        ],
      })
    );

    this.mainBranch = new amplify.CfnBranch(this, "MainBranch", {
      appId: this.app.attrAppId,
      branchName: props.githubBranch,
      enableAutoBuild: true,
      stage: "PRODUCTION",
    });

    // Amplify's default generated domain, e.g. <branch>.<appId>.amplifyapp.com
    this.defaultDomain = `${props.githubBranch}.${this.app.attrAppId}.amplifyapp.com`;

    new cdk.CfnOutput(this, "AmplifyAppId", { value: this.app.attrAppId });
    new cdk.CfnOutput(this, "AmplifyDefaultDomain", { value: this.defaultDomain });
  }
}
