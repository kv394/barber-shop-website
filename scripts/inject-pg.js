const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function main() {
  const client = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING });
  await client.connect();
  const res = await client.query("SELECT id, customization FROM \"Shop\" WHERE name ILIKE '%Heritage%'");
  if (res.rows.length === 0) throw new Error('Shop not found');
  const shop = res.rows[0];
  const customization = shop.customization || {};
  const html = fs.readFileSync('public/html-sections/heritage-haircuts.html', 'utf8');
  customization.customHtml = html;
  await client.query("UPDATE \"Shop\" SET customization = $1 WHERE id = $2", [customization, shop.id]);
  console.log('Successfully injected into', shop.id);
  await client.end();
}
main().catch(console.error);
