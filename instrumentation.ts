// Next.js instrumentation hook — runs once when the server starts, before
// any request handling. Used here to populate DATABASE_URL from a
// build-time-generated config file when it isn't already set via a plain
// env var.
//
// Why: Amplify Hosting's app/branch-level environment variables are
// confirmed present in build logs (build-time process.env has them) but
// never reach the deployed SSR compute at request time — every DB-touching
// route 500'd with "Environment variable not found: DATABASE_URL" across
// every configuration tried: app-level vars, branch-level vars, an IAM
// service role for SSM access, a console-based edit + explicit "Redeploy
// this version", and even a fresh recreation of the entire Amplify app.
// An IAM "compute role" + fetching the secret directly from Secrets Manager
// at runtime didn't work either — that runtime doesn't expose IAM
// credentials via the standard AWS SDK chain at all
// (CredentialsProviderError: "Could not load credentials from any
// providers"). Root cause unconfirmed.
//
// Since build-time env vars DO work reliably, scripts/write-runtime-config.js
// (a buildSpec build-phase step run AFTER `next build`, see
// infra/lib/stacks/hosting-stack.ts) writes the resolved DATABASE_URL into
// `.next/generated-runtime-config.json` — inside `.next` specifically
// because Amplify's deployment artifact only includes `.next/**/*`. Read
// here via plain `fs`, not a static import: a static import of this exact
// kind of generated file caused a hard 502 crash on a prior attempt (likely
// a bundling/module-resolution issue with generated files outside the
// normal source tree). `fs.readFileSync` avoids that entirely and is
// wrapped in try/catch so a missing file (expected locally) or any other
// failure can only ever leave DATABASE_URL unset, never crash the app.
import fs from "node:fs";
import path from "node:path";

export async function register() {
  if (process.env.DATABASE_URL) return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const configPath = path.join(process.cwd(), "generated-runtime-config.json");
    const raw = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(raw) as { databaseUrl: string | null };
    if (config.databaseUrl) {
      process.env.DATABASE_URL = config.databaseUrl;
    }
  } catch (err) {
    // Expected locally, where this generated file never exists.
    console.error("instrumentation.ts: could not read generated-runtime-config.json", err);
  }
}
