const { Pool } = require('pg');
async function test() {
  const connectionString = 'postgresql://postgres:gadJur-tydvoj-8wymza@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';
  try {
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
    await pool.query('SELECT NOW()');
    console.log('SUCCESS');
    process.exit(0);
  } catch (err) {
    console.log('Failed:', err.message);
    process.exit(1);
  }
}
test();
