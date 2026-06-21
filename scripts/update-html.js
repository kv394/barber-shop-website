const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.yjavfwugdkpghszspnrw:gadJur-tydvoj-8wymza@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  });
  
  await client.connect();
  
  const html = fs.readFileSync('public/html-sections/heritage-haircuts.html', 'utf8');
  
  // Use parameterized query to avoid SQL injection issues
  const result = await client.query(
    `UPDATE "Shop" SET customization = jsonb_set(
      COALESCE(customization, '{}'::jsonb),
      '{customHtml}',
      to_jsonb($1::text)
    ) WHERE id = $2 RETURNING length(customization->>'customHtml') as html_len`,
    [html, 'cmpnbqh1r0000iu54k0qnj2sl']
  );
  
  console.log('✅ Updated! New HTML length:', result.rows[0]?.html_len);
  
  // Verify
  const check = await client.query(
    `SELECT position('DECK OF CARDS' in (customization->>'customHtml')) as deck_pos FROM "Shop" WHERE id = $1`,
    ['cmpnbqh1r0000iu54k0qnj2sl']
  );
  console.log('Contains DECK OF CARDS at position:', check.rows[0]?.deck_pos);
  
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
