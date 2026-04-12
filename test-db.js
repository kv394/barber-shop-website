const { PrismaClient } = require('@prisma/client');

async function test(url) {
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log(`Success for ${url}:`, res);
    
    // If successful, try the ALTER
    await prisma.$executeRawUnsafe(`ALTER TYPE "UserRole" RENAME VALUE 'SUPER_ADMIN' TO 'SITE_ADMIN';`);
    console.log("ALTER TYPE SUCCESS!");
    return true;
  } catch (e) {
    console.log(`Failed for ${url}:`, e.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const urls = [
    "postgresql://postgres.yjavfwugdkpghszspnrw:gadJur-tydvoj-8wymza@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    "postgresql://postgres:gadJur-tydvoj-8wymza@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    "postgresql://postgres.yjavfwugdkpghszspnrw:gadJur-tydvoj-8wymza@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    "postgresql://postgres:gadJur-tydvoj-8wymza@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    "postgresql://postgres:gadJur-tydvoj-8wymza@db.yjavfwugdkpghszspnrw.supabase.co:5432/postgres"
  ];
  
  for (const url of urls) {
     const ok = await test(url);
     if (ok) break;
  }
}
run();
