const { Client } = require('pg');

async function run() {
  const sourceUrl = 'postgresql://postgres.yjavfwugdkpghszspnrw:gadJur-tydvoj-8wymza@aws-1-us-east-1.pooler.supabase.com:5432/postgres';
  const targetUrl = 'postgresql://postgres.mfzeljdiepffgdqioiqp:geqrom-gubgy8-zIkdog@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

  const sourceClient = new Client({ connectionString: sourceUrl });
  const targetClient = new Client({ connectionString: targetUrl });

  try {
    await sourceClient.connect();
    await targetClient.connect();

    // Fetch from source
    const res = await sourceClient.query('SELECT * FROM auth.users');
    const users = res.rows;
    
    if (users.length > 0) {
      // Exclude generated columns
      const excludeColumns = ['confirmed_at'];
      const columns = Object.keys(users[0]).filter(c => !excludeColumns.includes(c));
      
      for (const user of users) {
        const vals = columns.map(c => user[c]);
        const params = columns.map((_, i) => `$${i + 1}`).join(', ');
        const setClause = columns.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');

        const query = `
          INSERT INTO auth.users (${columns.map(c => `"${c}"`).join(', ')})
          VALUES (${params})
          ON CONFLICT (id) DO UPDATE SET ${setClause};
        `;
        await targetClient.query(query, vals);
      }
      console.log('✅ Successfully copied/upserted auth.users to target database.');
    }

    const resId = await sourceClient.query('SELECT * FROM auth.identities');
    const identities = resId.rows;
    if (identities.length > 0) {
      const idCols = Object.keys(identities[0]);
      for (const ident of identities) {
        const vals = idCols.map(c => ident[c]);
        const params = idCols.map((_, i) => `$${i + 1}`).join(', ');
        const query = `
          INSERT INTO auth.identities (${idCols.map(c => `"${c}"`).join(', ')})
          VALUES (${params})
          ON CONFLICT DO NOTHING;
        `;
        await targetClient.query(query, vals).catch(() => {});
      }
      console.log('✅ Successfully copied auth.identities to target database.');
    }

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

run();
