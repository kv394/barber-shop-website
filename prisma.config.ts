import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { loadEnvConfig } from '@next/env';

// Load .env and .env.local manually so Prisma CLI can read them
loadEnvConfig(process.cwd());

// For migrations and 'db push' on Vercel, we need a direct/session connection (port 5432 on pooler).
// We prioritize Vercel's POSTGRES_URL_NON_POOLING if available.
let dbUrl = (
  process.env.POSTGRES_URL_NON_POOLING || 
  process.env.DIRECT_URL || 
  process.env.SUPABASE_DATABASE_URL || 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_PRISMA_URL || 
  process.env.POSTGRES_URL
) as string;

// Prevent Vercel IPv4 failure: if URL is the direct IPv6 db.*.supabase.co, try to convert it to the Session pooler URL if we can,
// or at least warn. Vercel doesn't support IPv6 connections to db.*.supabase.co.
if (dbUrl && dbUrl.includes('db.mfzeljdiepffgdqioiqp.supabase.co')) {
  console.warn("⚠️ WARNING: Using db.*.supabase.co on Vercel will fail because Vercel doesn't support IPv6. Replacing with your Supabase pooler URL...");
  // Fallback to the known pooler host from previous logs
  dbUrl = dbUrl.replace('db.mfzeljdiepffgdqioiqp.supabase.co', 'aws-1-us-east-2.pooler.supabase.com');
  // Supabase pooler requires the project reference in the username (e.g., postgres -> postgres.mfzeljdiepffgdqioiqp)
  dbUrl = dbUrl.replace(/:\/\/(postgres|postgresql):/, '://postgres.mfzeljdiepffgdqioiqp:');
  dbUrl = dbUrl.replace(/:\/\/(postgres|postgresql)@/, '://postgres.mfzeljdiepffgdqioiqp@');
}

if (dbUrl && dbUrl.includes(':6543')) {
  // Convert Transaction pooler to Session pooler for CLI actions
  dbUrl = dbUrl.replace(':6543', ':5432');
}

// Add connection limit to prevent hanging
if (dbUrl && !dbUrl.includes('connection_limit=')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connection_limit=1';
}

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: dbUrl,
  },
});
