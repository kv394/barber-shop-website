import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// This file creates a single, reusable instance of the Prisma Client.
// This is the recommended approach for using Prisma with Next.js to prevent
// connection pool exhaustion in a serverless environment.

// 1. Declare a global variable to hold the PrismaClient instance.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 2. Create a driver adapter pointing at DATABASE_URL and initialise PrismaClient.
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const adapter = new PrismaPg({
    connectionString,
    max: 50, // Increased connection pool size
  });
  return new PrismaClient({
    adapter,
  });
}

export const prisma = global.prisma || createPrismaClient();

// 3. Attach the instance to the global object in development mode.
// This ensures that hot-reloading doesn't create new connections.
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
