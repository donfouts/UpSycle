import * as cdk from "aws-cdk-lib";
import * as amplify from "aws-cdk-lib/aws-amplify";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export interface HostingStackProps extends cdk.StackProps {
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
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

    // KNOWN UNRESOLVED ISSUE — DATABASE_URL has no working delivery path to
    // the deployed SSR compute. Amplify Hosting's app/branch-level
    // "environment variables" are confirmed present at build time (verified
    // via a build-log echo) but never reach the deployed compute at request
    // time, across every configuration tried: app-level vars, branch-level
    // vars, an IAM service role for SSM access, a console-based edit +
    // explicit "Redeploy this version", an IAM "compute role" granted
    // Secrets Manager read access (fails with CredentialsProviderError — this
    // runtime doesn't expose IAM credentials via the standard AWS SDK chain
    // at all), a full fresh recreation of the Amplify app, and baking values
    // into a generated file for instrumentation.ts to read (the deployed
    // runtime's cwd doesn't contain anything placed loosely in `.next/` at
    // build time — Amplify's SSR packaging only preserves recognized Next.js
    // build outputs). One more idea — baking DATABASE_URL into
    // next.config.ts's `env` the same way Cognito/S3 are handled — was
    // caught and abandoned before being committed: that mechanism inlines
    // values into BOTH server and CLIENT bundles, which would have shipped
    // the live RDS password to every visitor's browser. Do not attempt that
    // again. Non-sensitive config (Cognito, S3) IS safely baked in via
    // next.config.ts's `env`, confirmed reasonable since those values are
    // normally client-exposed anyway (User Pool/Client IDs, a bucket name).
    // Root cause of the DATABASE_URL issue is unconfirmed — likely worth an
    // AWS Support case.
    const amplifyServiceRole = new iam.Role(this, "AmplifyServiceRole", {
      assumedBy: new iam.ServicePrincipal("amplify.amazonaws.com"),
    });

    this.app = new amplify.CfnApp(this, "UpSycleAmplifyApp", {
      iamServiceRole: amplifyServiceRole.roleArn,
      name: "upsycle-web",
      repository: `https://github.com/${props.githubOwner}/${props.githubRepo}`,
      accessToken: githubToken.secretValue.unsafeUnwrap(),
      platform: "WEB_COMPUTE", // Next.js SSR support (per tech-stack-recommendation.md)
      environmentVariables: [{ name: "AMPLIFY_DIFF_DEPLOY", value: "false" }],
      buildSpec: [
        "version: 1",
        "frontend:",
        "  phases:",
        "    preBuild:",
        "      commands:",
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
