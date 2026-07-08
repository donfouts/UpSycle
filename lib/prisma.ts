import { PrismaClient } from "@prisma/client";

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
