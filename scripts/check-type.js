const { Client } = require('pg');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING });
  await client.connect();
  const res = await client.query("SELECT customization FROM \"Shop\" WHERE name ILIKE '%Heritage%'");
  for (const row of res.rows) {
    console.log(typeof row.customization);
    if (typeof row.customization === 'string') {
        console.log(row.customization.slice(0, 100));
    } else if (row.customization) {
        console.log(typeof row.customization.customHtml);
    }
  }
  await client.end();
}
main().catch(console.error);
