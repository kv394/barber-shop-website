import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { loadEnvConfig } from '@next/env';

// Load .env and .env.local manually so Prisma CLI can read them
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    // Vercel integration sets SUPABASE_DATABASE_URL automatically, fallback to manual DATABASE_URL
    url: (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING) as string,
  },
});
