const fs = require('fs');
const path = './scripts/safe-migrate.js';
let js = fs.readFileSync(path, 'utf8');

js = js.replace("execSync('npx prisma migrate deploy'", "try { execSync('npx prisma migrate resolve --rolled-back 20260602000000_optimize_indexes', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: dbUrl }}); } catch (e) { console.log('Resolve skipped or failed', e.message); }\n    execSync('npx prisma migrate deploy'");

fs.writeFileSync(path, js);
