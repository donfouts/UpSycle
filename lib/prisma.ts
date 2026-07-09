import { PrismaClient } from "@prisma/client";

// App Runner's RuntimeEnvironmentSecrets injects individual JSON keys from
// the RDS-generated Secrets Manager secret as separate env vars (see
// infra/lib/stacks/apprunner-stack.ts) rather than one composed connection
// string — Secrets Manager ARNs support extracting a single JSON key, but
// not templating/concatenation, so there's no way to have AWS hand us a
// ready-made `postgresql://...` URL directly. Compose it here instead, once,
// before anything else in the app imports { prisma } from this module.
if (!process.env.DATABASE_URL && process.env.DB_HOST) {
  const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;
  process.env.DATABASE_URL = `postgresql://${encodeURIComponent(DB_USERNAME ?? "")}:${encodeURIComponent(DB_PASSWORD ?? "")}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public&sslmode=require`;
}

// Standard Next.js App Router singleton pattern: in dev, hot-reloading would
// otherwise create a brand-new PrismaClient (and DB connection pool) on every
// module reload, eventually exhausting available Postgres connections. We
// stash the client on `globalThis` so it survives reloads; in production each
// server instance gets exactly one client for its lifetime.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
