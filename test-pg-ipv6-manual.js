const { Pool } = require('pg');
async function test() {
  try {
    const pool = new Pool({ 
      user: 'postgres',
      password: 'gadJur-tydvoj-8wymza',
      host: '2600:1f18:2e13:9d3d:86a1:ea01:fdc5:86f3',
      port: 5432,
      database: 'postgres',
      connectionTimeoutMillis: 5000 
    });
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log('SUCCESS Literal Host IPv6:', res.rows);
    client.release();
    pool.end();
  } catch (err) {
    console.error('Failed Literal IPv6:', err.message);
  }
}
test();
