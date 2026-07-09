// Next.js instrumentation hook — runs once when the server starts, before
// any request handling. Used here to populate DATABASE_URL from Secrets
// Manager when it isn't already set via a plain env var.
//
// Why: Amplify Hosting's app/branch-level environment variables are
// confirmed present in the build logs (build-time process.env has them) but
// never reach the deployed SSR compute at request time — every DB-touching
// route 500'd with "Environment variable not found: DATABASE_URL" despite
// multiple confirmed-correct configurations (app-level, branch-level, an
// added IAM service role, and a console-based edit + explicit redeploy).
// Rather than depend on that (still-unexplained) Amplify behavior, this
// fetches the DB secret directly via the AWS SDK, using the "compute role"
// IAM permissions granted in infra/lib/stacks/hosting-stack.ts. Local dev
// is unaffected — DATABASE_URL from `.env` short-circuits this entirely.
//
// Static (not dynamic) import: instrumentation.ts gets special bundling
// treatment by Next.js, and a dynamic `import()` here previously crashed the
// ENTIRE deployed app (even static pages 500'd) — most likely the AWS SDK
// package wasn't captured by Next.js's dependency tracing for the
// serverless function bundle. A static top-level import is traced reliably.
// This whole function is also wrapped in try/catch so that if the fetch
// ever fails for any reason, only DB-touching routes fail (as before) —
// this hook must never be able to take down the whole app again.
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export async function register() {
  if (process.env.DATABASE_URL) return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const client = new SecretsManagerClient({ region: "us-west-2" });
    const result = await client.send(
      new GetSecretValueCommand({ SecretId: "upsycle/rds/postgres-admin" }),
    );
    if (!result.SecretString) {
      throw new Error("DB secret has no SecretString");
    }

    const { username, password } = JSON.parse(result.SecretString) as {
      username: string;
      password: string;
    };
    const host = "upsycle-db.c52sq6oeazzl.us-west-2.rds.amazonaws.com";
    process.env.DATABASE_URL = `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:5432/upsycle?schema=public&sslmode=require`;
  } catch (err) {
    console.error("instrumentation.ts: failed to fetch DATABASE_URL from Secrets Manager", err);
    // TEMP diagnostic — safe to keep briefly: error name/message only, never
    // a stack trace or credential. Reported by app/api/debug-db (also temp).
    process.env.DEBUG_SECRET_FETCH_ERROR =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }
}
