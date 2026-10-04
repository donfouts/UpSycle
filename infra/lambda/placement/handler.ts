// Thin Lambda entry point for the weekly placement draw/finalize jobs (see
// ../../lib/stacks/placement-stack.ts for the two EventBridge schedules that
// invoke this with {"action":"draw"} on Saturday and {"action":"finalize"}
// at Sunday 00:00 UTC).
//
// The real business logic deliberately lives in a single place -- the main
// Next.js app's lib/placement-jobs.ts -- not duplicated here, so the draw
// job, the seller purchase flow, the admin override UI, and the page
// templates can never drift from each other on the lottery/paid-slot rules.
// This repo isn't a true monorepo (infra/ has its own package.json,
// tsconfig.json, node_modules), but infra/ *nests inside* the app directory,
// so standard Node module resolution walking up from this file reaches the
// app's root node_modules and finds @prisma/client + the app's own modules
// there -- no separate install needed.
//
// That cross-project module is pulled in with a runtime `require(...)`
// rather than a static `import` on purpose: infra/tsconfig.json pins
// `rootDir: "."`, and a static `import` would pull lib/placement-jobs.ts
// (which lives outside infra/) into the TypeScript program, which `tsc`
// then rejects with "File is not under 'rootDir'". infra/tsconfig.json is
// out of this change's scope to edit, so a plain `require()` -- which
// `tsc` treats as returning `any` and never tries to load/typecheck -- sidesteps
// that check entirely. esbuild (which is what actually bundles this handler
// for deployment, via NodejsFunction) resolves and bundles a `require(...)`
// exactly the way it would a static import, so nothing is lost at runtime.
//
// KNOWN DEPLOYMENT CAVEAT (not fixable from this change's file scope):
// prisma/schema.prisma's generator block pins `binaryTargets = ["native"]`,
// which bakes in whatever platform ran `prisma generate` last (this repo's
// checked-in node_modules/.prisma/client currently holds a Windows engine
// binary from local dev). AWS Lambda runs Amazon Linux, so a real `cdk
// deploy` of this stack needs `prisma generate` to have run on a
// Lambda-compatible platform first (ideally schema.prisma's binaryTargets
// gains an explicit "rhel-openssl-3.0.x" entry) -- flagging this rather than
// editing prisma/schema.prisma, which is outside this task's file scope.

interface PlacementEvent {
  action: "draw" | "finalize";
}

interface PlacementJobs {
  runLotteryDraw: () => Promise<void>;
  runPlacementFinalize: () => Promise<void>;
}

interface RdsSecret {
  host: string;
  port: number;
  username: string;
  password: string;
  dbname: string;
}

// Minimal hand-written shape of the one SDK client/command this handler
// uses -- `@aws-sdk/client-secrets-manager` isn't installed in either this
// project's or the app's node_modules (it's provided by the Lambda Node.js
// managed runtime itself at actual runtime instead, see the `require()`
// below and placement-stack.ts's bundling.externalModules), so there are no
// installed type declarations to import either; this stands in for them.
interface SecretsManagerModule {
  SecretsManagerClient: new (config: Record<string, unknown>) => {
    send: (command: unknown) => Promise<{ SecretString?: string }>;
  };
  GetSecretValueCommand: new (input: { SecretId: string }) => unknown;
}

let databaseUrlReady = false;

/**
 * App Runner's `runtimeEnvironmentSecrets` resolves individual Secrets
 * Manager JSON keys directly into env vars via the *instance* role
 * (apprunner-stack.ts) -- Lambda has no equivalent built-in wiring, so this
 * fetches the same RDS-generated secret itself at cold start and composes
 * DATABASE_URL the same way lib/prisma.ts does, before that module (pulled
 * in transitively below) ever reads `process.env.DATABASE_URL`.
 */
async function ensureDatabaseUrl(): Promise<void> {
  if (databaseUrlReady || process.env.DATABASE_URL) {
    databaseUrlReady = true;
    return;
  }

  const secretArn = process.env.DB_SECRET_ARN;
  if (!secretArn) {
    throw new Error("placement handler: DB_SECRET_ARN env var is required to resolve the database connection");
  }

  // `@aws-sdk/*` is provided by the Lambda Node.js managed runtime itself
  // (and is excluded from this bundle -- see placement-stack.ts's
  // bundling.externalModules), so this resolves at runtime even though the
  // package isn't installed anywhere in this repo's own node_modules. A
  // `require()` rather than a static `import` for the same reason as
  // lib/placement-jobs below: there's no installed copy for `tsc` to
  // resolve types against here.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager") as SecretsManagerModule;
  const client = new SecretsManagerClient({});
  const result = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
  if (!result.SecretString) {
    throw new Error("placement handler: Secrets Manager returned no SecretString for DB_SECRET_ARN");
  }

  const secret = JSON.parse(result.SecretString) as RdsSecret;
  process.env.DATABASE_URL = `postgresql://${encodeURIComponent(secret.username)}:${encodeURIComponent(secret.password)}@${secret.host}:${secret.port}/${secret.dbname}?schema=public&sslmode=require`;
  databaseUrlReady = true;
}

export async function handler(event: PlacementEvent): Promise<void> {
  await ensureDatabaseUrl();

  // See file header: deliberate `require()`, not a static `import`, plus
  // loaded only after DATABASE_URL is set since lib/prisma.ts reads it at
  // module-load time.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const jobs = require("../../../lib/placement-jobs") as PlacementJobs;

  if (event.action === "draw") {
    await jobs.runLotteryDraw();
  } else if (event.action === "finalize") {
    await jobs.runPlacementFinalize();
  } else {
    throw new Error(`placement handler: unknown action "${String((event as { action: unknown }).action)}"`);
  }
}
