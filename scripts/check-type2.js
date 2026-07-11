const { Client } = require('pg');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING });
  await client.connect();
  const res = await client.query("SELECT id, name, customization FROM \"Shop\" WHERE name ILIKE '%Heritage%'");
  for (const row of res.rows) {
    console.log(`Shop: ${row.id} - ${row.name}, type: ${typeof row.customization}`);
  }
  await client.end();
}
main().catch(console.error);
