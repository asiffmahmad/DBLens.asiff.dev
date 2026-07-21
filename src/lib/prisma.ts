import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Next.js dev server might run this multiple times, so we use a singleton
let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  // Use better-sqlite3 adapter for Prisma 7 with explicitly hardcoded url
  // to avoid Next.js SWC string replacement bugs with process.env
  const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
  prisma = new PrismaClient({ adapter });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };
