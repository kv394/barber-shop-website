const fs = require('fs');
const path = './scripts/deploy.sh';
let sh = fs.readFileSync(path, 'utf8');

sh = sh.replace('node scripts/safe-migrate.js', 'npx prisma migrate resolve --rolled-back 20260602000000_optimize_indexes || true\n  node scripts/safe-migrate.js');

fs.writeFileSync(path, sh);
