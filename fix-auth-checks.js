const fs = require('fs');
const path = require('fs');
const { execSync } = require('child_process');

const files = execSync('grep -rl "shopId !== shopId" app/api').toString().trim().split('\n');

for (const file of files) {
  if (!file) continue;
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/([a-zA-Z0-9_]+)\.shopId\s*!==\s*shopId/g, (match, userVar) => {
    return `(${userVar}.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: ${userVar}.id, shopId } })))`;
  });

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
