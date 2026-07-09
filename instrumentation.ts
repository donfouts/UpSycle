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
export async function register() {
  if (process.env.DATABASE_URL) return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { SecretsManagerClient, GetSecretValueCommand } = await import(
    "@aws-sdk/client-secrets-manager"
  );

  const region = process.env.COGNITO_REGION ?? "us-west-2";
  const client = new SecretsManagerClient({ region });

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
}
