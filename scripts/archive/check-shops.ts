import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../.env.local'), override: false });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const shops = await prisma.shop.findMany({ 
    include: { 
      commissionRules: true, 
      users: { select: { id: true, name: true, role: true, commissionRateService: true, commissionRateProduct: true } } 
    } 
  }); 
  console.log(JSON.stringify(shops, null, 2)); 
}

main().finally(() => prisma.$disconnect());