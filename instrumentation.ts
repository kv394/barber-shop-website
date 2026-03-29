/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts — used to warm the Prisma DB connection
 * so the first real page load is fast.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // DB Warmup disabled to prevent issues during Next.js static build phase on Netlify.
    // Serverless functions will lazy-connect to the database when first requested.
  }
}
