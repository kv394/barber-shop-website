import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
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
  // Use Vercel integration variable first if available, then fallback to manual URL
  let connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.warn("DATABASE_URL is missing. PrismaClient may fail to initialize.");
  } else {
    // Prevent Vercel IPv4 failure: if URL is the direct IPv6 db.*.supabase.co, convert it to the pooler URL
    if (connectionString.includes('db.mfzeljdiepffgdqioiqp.supabase.co')) {
      connectionString = connectionString.replace('db.mfzeljdiepffgdqioiqp.supabase.co', 'aws-1-us-east-2.pooler.supabase.com');
      connectionString = connectionString.replace(/:\/\/(postgres|postgresql):/, '://postgres.mfzeljdiepffgdqioiqp:');
      connectionString = connectionString.replace(/:\/\/(postgres|postgresql)@/, '://postgres.mfzeljdiepffgdqioiqp@');
    }
    
    // In serverless environments, we MUST use the Transaction pooler (port 6543) instead of Session pooler (port 5432)
    // to prevent MaxClientsInSessionMode errors
    if (process.env.NODE_ENV === 'production' && connectionString.includes('pooler.supabase.com') && connectionString.includes(':5432')) {
      connectionString = connectionString.replace(':5432', ':6543');
      
      // Also ensure pgbouncer parameter is set for Transaction mode
      if (!connectionString.includes('pgbouncer=true')) {
        connectionString += (connectionString.includes('?') ? '&' : '?') + 'pgbouncer=true';
      }
    }
    
    // Set it back to the env var for Prisma client initialization
    process.env.DATABASE_URL = connectionString;
  }
  
  const pool = new Pool({ 
    connectionString,
    connectionTimeoutMillis: 5000,
    // Limit connections in serverless environment to prevent MaxClientsInSessionMode errors
    max: process.env.NODE_ENV === 'production' ? 1 : 10,
  });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({
    adapter,
    log: ['error']
  });
}

// Force Next.js hot reload to pick up latest Prisma client changes (Gen 2)
export const prisma = global.prismaGlobal || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}
