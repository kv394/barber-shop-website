const { Pool } = require('pg');

async function test() {
  const connectionString = 'postgresql://postgres:gadJur-tydvoj-8wymza@db.yjavfwugdkpghszspnrw.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1';
  
  console.log('Connecting...');
  try {
    const pool = new Pool({ connectionString });
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('Success:', res.rows);
    client.release();
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
