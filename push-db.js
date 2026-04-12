const { execSync } = require('child_process');

async function run() {
  const urls = [
    "postgresql://postgres:gadJur-tydvoj-8wymza@db.yjavfwugdkpghszspnrw.supabase.co:5432/postgres",
    "postgresql://postgres.yjavfwugdkpghszspnrw:gadJur-tydvoj-8wymza@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    "postgresql://postgres:gadJur-tydvoj-8wymza@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    "postgresql://postgres.yjavfwugdkpghszspnrw:gadJur-tydvoj-8wymza@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    "postgresql://postgres:gadJur-tydvoj-8wymza@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
  ];
  
  for (const url of urls) {
     console.log('Trying URL:', url);
     process.env.DATABASE_URL = url;
     try {
       execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
       console.log('SUCCESS with', url);
       break;
     } catch (e) {
       console.log('FAILED with', url);
     }
  }
}
run();
