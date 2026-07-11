const fs = require('fs');
const files = [
  'app/api/shops/[shopId]/campaigns/generate/route.ts',
  'app/api/shops/[shopId]/clients/[clientId]/voice-notes/route.ts',
  'app/api/shops/[shopId]/marketing/social/generate/route.ts',
  'app/api/shops/[shopId]/products/forecast/route.ts',
  'app/api/shops/[shopId]/reports/ai-insights/route.ts',
  'app/api/shops/[shopId]/reviews/summary/route.ts',
  'app/api/shops/[shopId]/style-discovery/route.ts',
  'app/api/shops/[shopId]/voice-notes/global/route.ts'
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('maxDuration')) {
    // find the last import and add it after
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        lastImportIdx = i;
      }
    }
    lines.splice(lastImportIdx + 1, 0, '\nexport const maxDuration = 60;\n');
    fs.writeFileSync(f, lines.join('\n'));
    console.log('Fixed', f);
  }
}
