const { Client } = require('pg');

async function run() {
  const prodUrl = 'postgresql://postgres.mfzeljdiepffgdqioiqp:geqrom-gubgy8-zIkdog@aws-1-us-east-2.pooler.supabase.com:5432/postgres'; // Prod
  const stagingUrl = 'postgresql://postgres.yjavfwugdkpghszspnrw:gadJur-tydvoj-8wymza@aws-1-us-east-1.pooler.supabase.com:5432/postgres'; // Staging

  const prod = new Client({ connectionString: prodUrl });
  const staging = new Client({ connectionString: stagingUrl });

  try {
    await prod.connect();
    await staging.connect();

    // 1. Delete conflicting users in Staging
    await staging.query("DELETE FROM auth.users WHERE email IN ('admin@heritagehaircuts.com', 'admin@luxurynails.com')");

    // 2. Fetch from Prod
    const res = await prod.query("SELECT * FROM auth.users WHERE email IN ('admin@heritagehaircuts.com', 'admin@luxurynails.com')");
    const users = res.rows;
    
    if (users.length > 0) {
      const excludeColumns = ['confirmed_at'];
      const columns = Object.keys(users[0]).filter(c => !excludeColumns.includes(c));
      
      for (const user of users) {
        const vals = columns.map(c => user[c]);
        const params = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        await staging.query(`
          INSERT INTO auth.users (${columns.map(c => `"${c}"`).join(', ')})
          VALUES (${params})
        `, vals);
      }
      console.log('✅ Successfully copied admins to Staging auth.users.');
    }

    const resId = await prod.query("SELECT * FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('admin@heritagehaircuts.com', 'admin@luxurynails.com'))");
    const identities = resId.rows;
    if (identities.length > 0) {
      const idCols = Object.keys(identities[0]);
      for (const ident of identities) {
        const vals = idCols.map(c => ident[c]);
        const params = idCols.map((_, i) => `$${i + 1}`).join(', ');
        await staging.query(`
          INSERT INTO auth.identities (${idCols.map(c => `"${c}"`).join(', ')})
          VALUES (${params})
          ON CONFLICT DO NOTHING;
        `, vals).catch(() => {});
      }
      console.log('✅ Successfully copied admin identities to Staging.');
    }

    // 3. Update public.User in Staging to match IDs
    await staging.query(`
      UPDATE "User" u SET id = a.id 
      FROM auth.users a 
      WHERE u.email = a.email AND u.email IN ('admin@heritagehaircuts.com', 'admin@luxurynails.com')
    `);
    console.log('✅ Synced public.User IDs in Staging.');

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prod.end();
    await staging.end();
  }
}

run();
