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
// service role for SSM access, and a console-based edit + explicit
// "Redeploy this version". Attaching an IAM "compute role" and fetching the
// secret directly from Secrets Manager at runtime didn't work either — that
// runtime doesn't expose IAM credentials via the standard AWS SDK chain at
// all (CredentialsProviderError: "Could not load credentials from any
// providers"). Root cause unconfirmed.
//
// Since build-time env vars DO work reliably, scripts/write-runtime-config.js
// (run as a buildSpec preBuild step, see infra/lib/stacks/hosting-stack.ts)
// overwrites lib/generated-runtime-config.json (a committed placeholder,
// `{"databaseUrl": null}`) with the resolved DATABASE_URL — a real source
// file Next.js's bundler traces and includes in the deployed artifact,
// unlike a repo-root .env file (the artifact only contains `.next/**/*`) or
// a runtime API call (doesn't work, per above).
//
// Local dev is unaffected: DATABASE_URL from `.env` short-circuits this, and
// the committed placeholder's null value is a no-op if it doesn't.
import generatedConfig from "@/lib/generated-runtime-config.json";

export async function register() {
  if (process.env.DATABASE_URL) return;
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (generatedConfig.databaseUrl) {
    process.env.DATABASE_URL = generatedConfig.databaseUrl;
  }
}
