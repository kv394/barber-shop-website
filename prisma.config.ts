import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { loadEnvConfig } from '@next/env';

// Load .env and .env.local manually so Prisma CLI can read them
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
  },
});
