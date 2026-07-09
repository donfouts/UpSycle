import * as cdk from "aws-cdk-lib";
import * as apprunner from "aws-cdk-lib/aws-apprunner";
import * as ecrAssets from "aws-cdk-lib/aws-ecr-assets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import * as path from "path";

export interface AppRunnerStackProps extends cdk.StackProps {
  dbSecret: secretsmanager.ISecret;
  userPoolId: string;
  userPoolClientId: string;
  userPoolArn: string;
  productPhotosBucket: s3.IBucket;
  sellerVettingPhotosBucket: s3.IBucket;
}

/**
 * AppRunnerStack
 *
 * Replaces HostingStack (AWS Amplify Hosting, removed) as the Next.js SSR
 * compute layer. Switched after extensive troubleshooting established that
 * Amplify's Web Compute runtime never reliably delivered environment
 * variables OR IAM role credentials to the running Next.js process — every
 * configuration tried failed the same way (see the deleted hosting-stack.ts
 * in git history for the full account: app-level vars, branch-level vars,
 * an IAM service role, a console-based edit + explicit redeploy, an IAM
 * "compute role" + Secrets Manager fetch at runtime — which hit
 * `CredentialsProviderError`, meaning that runtime doesn't expose IAM
 * credentials via the standard AWS SDK chain at all — and even a full fresh
 * recreation of the Amplify app).
 *
 * App Runner uses the same well-established credential/env-var mechanisms as
 * ECS/Fargate task roles — mature, standard, and (confirmed locally via
 * `docker run` against the real RDS instance before writing this stack)
 * actually works.
 *
 * Deploys a Docker image (see ../../../Dockerfile) built and pushed to an
 * auto-managed ECR repo during `cdk deploy` via DockerImageAsset.
 * `autoDeploymentsEnabled: false` — there's no GitHub-triggered CI/CD for
 * this yet (unlike Amplify's native GitHub integration); a follow-up GitHub
 * Actions workflow that runs `cdk deploy` on push is the natural next step
 * (tracked alongside issue #25).
 *
 * Cost: smallest valid instance size (0.25 vCPU / 0.5 GB) — App Runner has
 * no true scale-to-zero, so unlike Amplify's serverless-first design this
 * carries a modest always-on floor, roughly $12-15/mo at this size.
 */
export class AppRunnerStack extends cdk.Stack {
  public readonly service: apprunner.CfnService;
  public readonly serviceUrl: string;

  constructor(scope: Construct, id: string, props: AppRunnerStackProps) {
    super(scope, id, props);

    const image = new ecrAssets.DockerImageAsset(this, "AppImage", {
      directory: path.join(__dirname, "..", "..", ".."),
      file: "Dockerfile",
    });

    // Lets App Runner pull the built image from ECR.
    const accessRole = new iam.Role(this, "AppRunnerAccessRole", {
      assumedBy: new iam.ServicePrincipal("build.apprunner.amazonaws.com"),
    });
    image.repository.grantPull(accessRole);

    // The running container's actual runtime identity — grants the
    // permissions application code needs when it calls AWS APIs directly
    // (S3 presigned uploads via lib/s3.ts, Cognito via lib/cognito.ts).
    const instanceRole = new iam.Role(this, "AppRunnerInstanceRole", {
      assumedBy: new iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
    });
    props.productPhotosBucket.grantReadWrite(instanceRole);
    props.sellerVettingPhotosBucket.grantReadWrite(instanceRole);
    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "cognito-idp:SignUp",
          "cognito-idp:ConfirmSignUp",
          "cognito-idp:ResendConfirmationCode",
          "cognito-idp:InitiateAuth",
          "cognito-idp:ForgotPassword",
          "cognito-idp:ConfirmForgotPassword",
          "cognito-idp:AdminDeleteUser",
        ],
        resources: [props.userPoolArn],
      })
    );

    this.service = new apprunner.CfnService(this, "UpSycleAppRunnerService", {
      serviceName: "upsycle-web",
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
        autoDeploymentsEnabled: false,
        imageRepository: {
          imageIdentifier: image.imageUri,
          imageRepositoryType: "ECR",
          imageConfiguration: {
            port: "3000",
            runtimeEnvironmentVariables: [
              { name: "COGNITO_REGION", value: this.region },
              { name: "COGNITO_USER_POOL_ID", value: props.userPoolId },
              { name: "COGNITO_USER_POOL_CLIENT_ID", value: props.userPoolClientId },
              { name: "PHOTOS_BUCKET_NAME", value: props.productPhotosBucket.bucketName },
            ],
            // DATABASE_URL can't be handed over as one composed connection
            // string — Secrets Manager ARN references extract a single JSON
            // key, not a template. lib/prisma.ts composes the URL from
            // these decomposed fields when DATABASE_URL itself isn't set.
            runtimeEnvironmentSecrets: [
              { name: "DB_HOST", value: `${props.dbSecret.secretArn}:host::` },
              { name: "DB_PORT", value: `${props.dbSecret.secretArn}:port::` },
              { name: "DB_USERNAME", value: `${props.dbSecret.secretArn}:username::` },
              { name: "DB_PASSWORD", value: `${props.dbSecret.secretArn}:password::` },
              { name: "DB_NAME", value: `${props.dbSecret.secretArn}:dbname::` },
            ],
          },
        },
      },
      instanceConfiguration: {
        cpu: "0.25 vCPU",
        memory: "0.5 GB",
        instanceRoleArn: instanceRole.roleArn,
      },
      healthCheckConfiguration: {
        protocol: "HTTP",
        path: "/signup", // a static page — doesn't depend on the DB being reachable
        interval: 10,
        timeout: 5,
        healthyThreshold: 1,
        unhealthyThreshold: 5,
      },
    });

    this.serviceUrl = this.service.attrServiceUrl;
    new cdk.CfnOutput(this, "AppRunnerServiceUrl", { value: `https://${this.serviceUrl}` });
  }
}
