const { Pool } = require('pg');
async function test() {
  const pool = new Pool({ 
      connectionString: 'postgresql://postgres:gadJur-tydvoj-8wymza@db.yjavfwugdkpghszspnrw.supabase.co:5432/postgres',
      host: '2600:1f18:2e13:9d3d:86a1:ea01:fdc5:86f3',
  });
  const client = await pool.connect();
  const res = await client.query('SELECT NOW()');
  console.log('SUCCESS Override:', res.rows);
  client.release();
  pool.end();
}
test();
