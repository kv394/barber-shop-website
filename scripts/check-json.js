const { Client } = require('pg');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING });
  await client.connect();
  const res = await client.query("SELECT customization FROM \"Shop\" WHERE name ILIKE '%Heritage%'");
  const cust = res.rows[0].customization;
  console.log('Keys in customization:', Object.keys(cust));
  console.log('customHtml type:', typeof cust.customHtml);
  if (typeof cust.customHtml === 'string') {
    console.log('customHtml length:', cust.customHtml.length);
    console.log('First 50 chars:', cust.customHtml.slice(0, 50));
  }
  await client.end();
}
main().catch(console.error);
