import { PrismaClient } from '@prisma/client';

// This file creates a single, reusable instance of the Prisma Client.
// This is the recommended approach for using Prisma with Next.js to prevent
// connection pool exhaustion in a serverless environment.

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Eagerly connect to DB on startup so the first request isn't slow
prisma.$connect().catch((e) => {
  console.error('⚠️ Prisma failed to connect eagerly:', e);
});
