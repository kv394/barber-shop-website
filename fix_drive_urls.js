const fs = require('fs');

const files = [
  'lib/google-drive.ts',
  'app/api/shops/[shopId]/upload/route.ts',
  'app/api/siteadmin/templates/generate/route.ts',
  'app/api/siteadmin/templates/upload/route.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/https:\/\/drive\.google\.com\/uc\?export=view&id=/g, 'https://lh3.googleusercontent.com/d/');
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
