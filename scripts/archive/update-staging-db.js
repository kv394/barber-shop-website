const { Pool } = require('pg');
const fs = require('fs');

async function main() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres.yjavfwugdkpghszspnrw:gadJur-tydvoj-8wymza@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=no-verify',
    ssl: { rejectUnauthorized: false }
  });

  try {
    const html = fs.readFileSync('/Users/rajaveerappan/kutzapp/barber-shop-website/public/html-sections/SportClips.html', 'utf8');
    
    // 1. Force update the database directly to ensure it works
    const res = await pool.query(`SELECT customization FROM "Shop" WHERE id = 'cmn9kj24n0000lqzc7kcsmpst'`);
    if (res.rows.length > 0) {
      const customization = res.rows[0].customization || {};
      customization.customHtml = html;
      
      await pool.query(
        `UPDATE "Shop" SET customization = $1::jsonb WHERE id = 'cmn9kj24n0000lqzc7kcsmpst'`,
        [JSON.stringify(customization)]
      );
      console.log('✅ Successfully updated database directly via pg!');
      
      // 2. Hit the API with a dummy payload just to trigger cache invalidation
      console.log('Pushing to staging API to clear caches...');
      const apiRes = await fetch('https://barber-shop-website-ashy.vercel.app/api/shops/cmn9kj24n0000lqzc7kcsmpst/customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customization: { lastUpdated: new Date().toISOString() } })
      });
      if (apiRes.ok) console.log('✅ Caches invalidated!');
    } else {
      console.log('❌ Shop not found.');
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}
main();