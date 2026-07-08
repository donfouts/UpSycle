import * as cdk from "aws-cdk-lib";
import * as amplify from "aws-cdk-lib/aws-amplify";
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
const GITHUB_TOKEN_SECRET_NAME = "upsycle/amplify/github-access-token";

/**
 * HostingStack
 *
 * AWS Amplify Hosting app connected directly to GitHub (donfouts/UpSycle,
 * `main` branch). This is the CI/CD wiring for issue #3: Amplify's native
 * GitHub integration auto-builds and deploys on every push to `main` — no
 * separate GitHub Actions workflow needed.
 *
 * Root directory is `Web/UpSycle` inside the monorepo-style GitHub repo,
 * matching CLAUDE.md's "save code in ./Web/UpSycle/" convention.
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

    this.app = new amplify.CfnApp(this, "UpSycleAmplifyApp", {
      name: "upsycle-web",
      repository: `https://github.com/${props.githubOwner}/${props.githubRepo}`,
      accessToken: githubToken.secretValue.unsafeUnwrap(),
      platform: "WEB_COMPUTE", // Next.js SSR support (per tech-stack-recommendation.md)
      environmentVariables: [
        { name: "AMPLIFY_MONOREPO_APP_ROOT", value: "Web/UpSycle" },
        { name: "AMPLIFY_DIFF_DEPLOY", value: "false" },
        // DATABASE_URL / Cognito / S3 / SES app-runtime config are wired as
        // Amplify env vars pointing at the other stacks' outputs once this
        // app has deployed once (manual/console step, or a follow-up CDK
        // custom resource) — deliberately not hardcoded here.
      ],
      buildSpec: [
        "version: 1",
        "applications:",
        "  - appRoot: Web/UpSycle",
        "    frontend:",
        "      phases:",
        "        preBuild:",
        "          commands:",
        "            - npm ci",
        "            - npx prisma generate",
        "        build:",
        "          commands:",
        "            - npm run build",
        "      artifacts:",
        "        baseDirectory: .next",
        "        files:",
        "          - '**/*'",
        "      cache:",
        "        paths:",
        "          - node_modules/**/*",
        "          - .next/cache/**/*",
      ].join("\n"),
      customRules: [
        {
          source: "/<*>",
          target: "/index.html",
          status: "404-200",
        },
      ],
    });

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
