const { Pool } = require('pg');
const dns = require('dns');

// Force IPv6 first!
dns.setDefaultResultOrder('ipv6first');

async function test() {
  const connectionString = 'postgresql://postgres:gadJur-tydvoj-8wymza@db.yjavfwugdkpghszspnrw.supabase.co:5432/postgres';
  try {
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('SUCCESS with pg adapter on IPv6:', res.rows);
    client.release();
    pool.end();
  } catch (err) {
    console.error('Failed:', err.message);
  }
}
test();
