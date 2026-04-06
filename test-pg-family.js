const { Pool } = require('pg');
async function test() {
  const pool = new Pool({ 
      connectionString: 'postgresql://postgres:gadJur-tydvoj-8wymza@db.yjavfwugdkpghszspnrw.supabase.co:5432/postgres',
      ssl: { rejectUnauthorized: false },
      family: 6
  });
  const client = await pool.connect();
  console.log('SUCCESS FAMILY 6');
  client.release();
  pool.end();
}
test();
