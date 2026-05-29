const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function run() {
  const targetUrl = 'postgresql://postgres.mfzeljdiepffgdqioiqp:geqrom-gubgy8-zIkdog@aws-1-us-east-2.pooler.supabase.com:5432/postgres';
  const client = new Client({ connectionString: targetUrl });
  
  try {
    await client.connect();
    // Supabase usually uses bcrypt cost factor of 10 or 6. We can use 10.
    const hash = await bcrypt.hash('password123', 10);
    
    // Also we need to make sure email_confirmed_at is set so they don't get "Email not confirmed"
    const query = `
      UPDATE auth.users 
      SET encrypted_password = $1, email_confirmed_at = NOW() 
      WHERE email IN ('admin@heritagehaircuts.com', 'admin@luxurynails.com')
      RETURNING email;
    `;
    const res = await client.query(query, [hash]);
    console.log('Updated passwords to password123 for:', res.rows.map(r => r.email).join(', '));
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
