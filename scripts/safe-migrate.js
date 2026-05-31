const { execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env if present (useful for local testing)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function getNonPoolingUrl() {
  const envVars = [
    'POSTGRES_URL_NON_POOLING',
    'DIRECT_URL',
    'SUPABASE_DATABASE_URL',
    'DATABASE_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL',
  ];

  for (const envVar of envVars) {
    if (process.env[envVar]) {
      let dbUrl = process.env[envVar];

      // Fix Supabase direct connection format for Vercel
      if (dbUrl.includes('db.mfzeljdiepffgdqioiqp.supabase.co')) {
        console.warn(`[Safe Migrate] ⚠️ Modifying ${envVar} to use Supabase Session pooler (port 5432) for Vercel IPv4 compatibility.`);
        dbUrl = dbUrl.replace('db.mfzeljdiepffgdqioiqp.supabase.co', 'aws-1-us-east-2.pooler.supabase.com');
        dbUrl = dbUrl.replace(/:\/\/(postgres|postgresql):/, '://postgres.mfzeljdiepffgdqioiqp:');
        dbUrl = dbUrl.replace(/:\/\/(postgres|postgresql)@/, '://postgres.mfzeljdiepffgdqioiqp@');
      }

      // If it's using the transaction pooler port (6543), change to session port (5432)
      if (dbUrl.includes(':6543')) {
        console.warn(`[Safe Migrate] ⚠️ Modifying ${envVar} from port 6543 to port 5432 (Session connection).`);
        dbUrl = dbUrl.replace(':6543', ':5432');
      }

      // Ensure connection limit is 1 for migrations
      if (!dbUrl.includes('connection_limit=')) {
        dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'connection_limit=1';
      }

      console.log(`[Safe Migrate] Using connection string derived from: ${envVar}`);
      return dbUrl;
    }
  }

  throw new Error('No valid Postgres connection string found in environment variables.');
}

function runMigration() {
  console.log('[Safe Migrate] Starting safe database migration...');
  
  try {
    const dbUrl = getNonPoolingUrl();
    
    // Execute prisma migrate deploy with the non-pooling URL
    console.log('[Safe Migrate] Running: prisma migrate deploy');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
      },
    });

    console.log('[Safe Migrate] Migration completed successfully.');
  } catch (error) {
    console.error('[Safe Migrate] Migration failed:', error.message);
    if (error.stdout) {
      console.error(error.stdout.toString());
    }
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    process.exit(1);
  }
}

runMigration();
