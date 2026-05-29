const { Client } = require('pg');

const run = async () => {
  const url = 'postgresql://postgres:gadJur-tydvoj-8wymza@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
  const client = new Client({ connectionString: url });
  
  try {
    await client.connect();
    console.log("Connected successfully!");
    
    // Add the column
    await client.query('ALTER TABLE "DynamicTemplate" ADD COLUMN IF NOT EXISTS "variables" JSONB;');
    console.log("Column added successfully.");
    
  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    await client.end();
  }
};

run();
