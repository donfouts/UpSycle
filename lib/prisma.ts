import { PrismaClient } from "@prisma/client";

// Standard Next.js/Prisma singleton — avoids exhausting DB connections from
// hot-reloaded module instances in dev. If another parallel branch also adds
// this file, de-dupe at merge time; the pattern is intentionally minimal.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
