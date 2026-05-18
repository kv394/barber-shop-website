import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: any;
}

// Force Node.js to use IPv6 first for Supabase database connections
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
  try {
    const dns = require('dns');
    if (dns && dns.setDefaultResultOrder) {
      dns.setDefaultResultOrder('ipv6first');
    }
  } catch (e) {
    // Ignore in edge environments where 'dns' might not exist
  }
}

function createPrismaClient() {
  // 1. Prioritize Vercel's Supabase Integration Prisma pooler URL (POSTGRES_PRISMA_URL) which is pre-configured for port 6543 with correct username
  // 2. Fall back to other URLs
  let connectionString = 
    process.env.POSTGRES_PRISMA_URL || 
    process.env.POSTGRES_URL || 
    process.env.SUPABASE_DATABASE_URL || 
    process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.warn("DATABASE_URL is missing. PrismaClient may fail to initialize.");
  } else {
    // Prisma's Rust engine requires explicit trust of self-signed certs from serverless databases like Vercel Postgres/Supabase
    if (process.env.NODE_ENV === 'production') {
      if (!connectionString.includes('sslaccept=')) {
        connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslaccept=accept_invalid_certs';
      }
    }
    // Set env var for Prisma
    process.env.DATABASE_URL = connectionString;
  }
  
  // For the `pg` driver adapter, we need a clean connection string without Prisma-specific params like ?pgbouncer=true
  let pgConnectionString = connectionString ? connectionString.replace(/[?&]pgbouncer=true/g, '') : undefined;
  
  if (process.env.NODE_ENV === 'production' && pgConnectionString) {
    // Vercel's POSTGRES_URL might contain `sslmode=require` which conflicts with `{ rejectUnauthorized: false }` 
    // in the pg driver, causing the SELF_SIGNED_CERT_IN_CHAIN error to persist.
    // We rewrite it to sslmode=no-verify for production serverless connections.
    pgConnectionString = pgConnectionString.replace(/sslmode=require/g, 'sslmode=no-verify');
    if (!pgConnectionString.includes('sslmode=')) {
      pgConnectionString += (pgConnectionString.includes('?') ? '&' : '?') + 'sslmode=no-verify';
    }
    
    // Force transaction mode for Supabase pooler (Supavisor) to avoid the 15 connection session mode limit
    if (pgConnectionString.includes('pooler.supabase.com') && !pgConnectionString.includes('pool_mode=')) {
      pgConnectionString += (pgConnectionString.includes('?') ? '&' : '?') + 'pool_mode=transaction';
    }
  }
  
  const pool = new Pool({ 
    connectionString: pgConnectionString,
    connectionTimeoutMillis: 10000,
    // Limit connections in serverless environment to prevent connection exhaustion
    // We use a small pool (5) rather than 1 to prevent "client is already executing a query" deprecation warnings in pg
    max: process.env.NODE_ENV === 'production' ? 5 : 10,
    // Fix "self-signed certificate in certificate chain" errors from Vercel Postgres / Supabase
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });
  const adapter = new PrismaPg(pool);
  
  const baseClient = new PrismaClient({
    adapter,
    log: ['error']
  });

  // Prisma Client Extension to automatically scope queries to a shopId if provided via context or async_hooks.
  // In a robust implementation, you would typically use AsyncLocalStorage to pass the tenant ID.
  // Here, we're providing a foundational extension structure. You'll need an 'rlsClient' wrapper
  // to pass the shopId for standard isolated queries.
  return baseClient.$extends({
    name: 'tenant-isolation',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // This is a placeholder for actual tenant isolation logic.
          // To fully implement this, you would:
          // 1. Retrieve the current shopId from AsyncLocalStorage (or pass it explicitly)
          // 2. Check if the model has a 'shopId' field.
          // 3. Mutate 'args.where' to inject `{ shopId: currentShopId }` if applicable.
          // Example:
          // if (currentShopId && Prisma.dmmf.datamodel.models.find(m => m.name === model)?.fields.some(f => f.name === 'shopId')) {
          //   args.where = { ...args.where, shopId: currentShopId };
          // }
          return query(args);
        },
      },
    },
  });
}

// Force Next.js hot reload to pick up latest Prisma client changes (Gen 2)
export const prisma = global.prismaGlobal || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}
