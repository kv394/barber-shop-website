const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function run() {
  const targetUrl = 'postgresql://postgres.mfzeljdiepffgdqioiqp:geqrom-gubgy8-zIkdog@aws-1-us-east-2.pooler.supabase.com:5432/postgres';
  const client = new Client({ connectionString: targetUrl });
  
  try {
    await client.connect();
    
    // Supabase GoTrue requires exactly a bcrypt hash
    const hash = await bcrypt.hash('password123', 10);
    
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
