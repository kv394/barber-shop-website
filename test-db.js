const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("No connection string");

  console.log("Connecting to:", connectionString.split('@')[1]);
  const start = Date.now();
  
  const pool = new Pool({ connectionString, max: 1 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Querying database...");
  const users = await prisma.user.findFirst();
  
  console.log("Result in", Date.now() - start, "ms:", users ? "Found" : "Not found");
  process.exit(0);
}

main().catch(console.error);
