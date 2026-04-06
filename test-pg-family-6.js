const { Pool } = require('pg');
async function test() {
  const connectionString = 'postgresql://postgres:gadJur-tydvoj-8wymza@db.yjavfwugdkpghszspnrw.supabase.co:5432/postgres';
  try {
    const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000, host: 'db.yjavfwugdkpghszspnrw.supabase.co' });
    // Try to intercept dns internally or just pass it? No, wait, if we override lookup?
  } catch (err) {
  }
}
test();
