import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import * as path from "path";

export interface PlacementStackProps extends cdk.StackProps {
  dbSecret: secretsmanager.ISecret;
}

/**
 * PlacementStack
 *
 * Runs the weekly Home/Category/Sub-Category featured-placement lottery
 * (see lib/placement-jobs.ts in the main app for the full business rules).
 * One Lambda, invoked by two EventBridge `Rule`s on a fixed weekly cadence:
 *
 *   - Saturday (any time during the day — `cron` below picks 02:00 UTC):
 *     `{"action":"draw"}` draws that week's lottery winners into a new
 *     PENDING PlacementPeriod. This is also the moment the seller purchase
 *     window for paid slots opens (handled by a separate API route, not
 *     this stack).
 *   - Sunday 00:00 UTC: `{"action":"finalize"}` locks in purchased paid
 *     slots, random-fills unsold ones, runs the cross-placement product
 *     cascade, and flips that period PENDING -> ACTIVE (archiving whichever
 *     period was previously ACTIVE).
 *
 * Lambda-bundling approach: NodejsFunction's `entry` points directly at
 * infra/lambda/placement/handler.ts, which pulls in the main app's
 * lib/placement-jobs.ts via a relative `require()` (see that handler's file
 * header for exactly why `require()` and not a static `import`) rather than
 * duplicating any of its logic here — this repo isn't a true monorepo, but
 * infra/ nests inside the app directory, so esbuild's module resolution
 * walks up from the handler and finds the app's own root `node_modules`
 * (where `@prisma/client`, this stack's one non-aws-sdk runtime dependency,
 * already lives) the same way plain Node `require` resolution would.
 *
 * `@prisma/client` is kept out of the esbuild bundle entirely
 * (`externalModules`) and copied into the bundle's `node_modules` by hand
 * instead (`commandHooks.afterBundling` -> ../../lambda/placement/copy-prisma-engine.js):
 * `@prisma/client`'s own runtime code resolves the actual generated client
 * (model types + native query engine) via a non-statically-analyzable
 * `require()` that esbuild can't follow, and that generated client
 * (node_modules/.prisma) is produced locally by `prisma generate` and was
 * never an npm dependency esbuild could resolve in the first place. See
 * handler.ts's file header for the resulting known deployment caveat
 * (schema.prisma's `binaryTargets = ["native"]` bakes in whatever platform
 * last ran `prisma generate`, which needs to be Lambda-compatible before any
 * real `cdk deploy` of this stack).
 */
export class PlacementStack extends cdk.Stack {
  public readonly placementFn: nodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: PlacementStackProps) {
    super(scope, id, props);

    const appRoot = path.join(__dirname, "..", "..", "..");

    this.placementFn = new nodejs.NodejsFunction(this, "PlacementJobsFunction", {
      functionName: "upsycle-placement-jobs",
      entry: path.join(__dirname, "..", "..", "lambda", "placement", "handler.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      // Without these, NodejsFunction's auto-detected lock file is
      // infra/package-lock.json (nearest to `entry`), which makes
      // `infra/` the Docker bundling projectRoot/mount -- but the
      // bundling `tsconfig` below and the handler's `require("../../../lib/placement-jobs")`
      // both reach outside infra/ into the app root. Pointing depsLockFilePath/projectRoot
      // at the app root instead mounts the whole app into the bundling
      // container so both resolve. See handler.ts's file header.
      depsLockFilePath: path.join(appRoot, "package-lock.json"),
      projectRoot: appRoot,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        DB_SECRET_ARN: props.dbSecret.secretArn,
      },
      bundling: {
        // Default externals for a Node 18+ runtime are already `["@aws-sdk/*"]`
        // (provided by the Lambda managed runtime) -- explicitly setting
        // `externalModules` overrides that default rather than extending it,
        // so `@aws-sdk/*` has to be re-added alongside `@prisma/client`.
        externalModules: ["@aws-sdk/*", "@prisma/client"],
        tsconfig: path.join(appRoot, "tsconfig.json"),
        commandHooks: {
          beforeInstall: () => [],
          beforeBundling: () => [],
          // `inputDir` is the *container* path for the bundling mount (now
          // projectRoot/appRoot — see above), not a host path, so the script
          // must be addressed relative to that mount rather than via
          // `__dirname` (a host path the container never has mounted).
          afterBundling: (inputDir: string, outputDir: string): string[] => {
            const scriptRelPath = path
              .relative(appRoot, path.join(__dirname, "..", "..", "lambda", "placement", "copy-prisma-engine.js"))
              .split(path.sep)
              .join("/");
            return [`node "${inputDir}/${scriptRelPath}" "${outputDir}"`];
          },
        },
      },
    });

    // Lambda has no built-in equivalent to App Runner's `runtimeEnvironmentSecrets`
    // (apprunner-stack.ts) resolving secret fields straight into env vars via
    // the instance role -- the handler fetches this secret itself at cold
    // start (handler.ts's ensureDatabaseUrl), so the function's own execution
    // role just needs read access to it.
    props.dbSecret.grantRead(this.placementFn);

    new events.Rule(this, "LotteryDrawRule", {
      ruleName: "upsycle-placement-draw-saturday",
      description: "UpSycle: Saturday weekly placement lottery draw (opens the paid-slot purchase window)",
      schedule: events.Schedule.cron({ weekDay: "SAT", hour: "2", minute: "0" }),
      targets: [new targets.LambdaFunction(this.placementFn, { event: events.RuleTargetInput.fromObject({ action: "draw" }) })],
    });

    new events.Rule(this, "PlacementFinalizeRule", {
      ruleName: "upsycle-placement-finalize-sunday",
      description: "UpSycle: Sunday 00:00 UTC weekly placement finalize (random-fill + cascade + go live)",
      schedule: events.Schedule.cron({ weekDay: "SUN", hour: "0", minute: "0" }),
      targets: [new targets.LambdaFunction(this.placementFn, { event: events.RuleTargetInput.fromObject({ action: "finalize" }) })],
    });
  }
}
