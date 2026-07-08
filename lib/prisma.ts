// Prisma client singleton.
//
// Next.js dev mode reloads route modules on every change, which would create a
// new PrismaClient (and a new DB connection pool) per reload without this
// global-cache guard. Production only ever creates one instance anyway, but
// the guard is harmless there.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
