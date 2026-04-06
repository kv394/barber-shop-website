import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // In some build environments, DATABASE_URL might be omitted. We provide a dummy adapter if needed,
    // or just let it fail gracefully during build type-checks if possible.
    // However, Prisma 7 *requires* a valid options object.
    console.warn("DATABASE_URL is missing. PrismaClient may fail to initialize.");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
