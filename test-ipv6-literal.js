const { Pool } = require('pg');
async function test() {
  const connectionString = 'postgresql://postgres:gadJur-tydvoj-8wymza@[2600:1f18:2e13:9d3d:86a1:ea01:fdc5:86f3]:5432/postgres';
  try {
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('SUCCESS Literal IPv6:', res.rows);
    client.release();
    pool.end();
  } catch (err) {
    console.error('Failed Literal IPv6:', err.message);
  }
}
test();
