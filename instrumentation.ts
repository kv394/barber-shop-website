/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts — used to warm the Prisma DB connection
 * so the first real page load is fast.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Eagerly connect Prisma so first request doesn't pay the cold-start cost
    const { prisma } = await import('./lib/prisma');
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection warmed up');
    } catch (e) {
      console.error('⚠️ Database warmup failed:', e);
    }
  }
}
