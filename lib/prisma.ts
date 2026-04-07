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
  const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL is missing. PrismaClient may fail to initialize.");
  }

  const pool = new Pool({ 
    connectionString
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = global.prismaGlobal || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}
