const fs = require('fs');

const pages = [
  'app/my-appointments/page.tsx',
  'app/my-appointments/profile/page.tsx',
  'app/my-appointments/loyalty/page.tsx',
  'app/my-appointments/notifications/page.tsx',
  'app/my-appointments/referrals/page.tsx',
  'app/my-appointments/review/[appointmentId]/page.tsx'
];

for (const p of pages) {
  let content = fs.readFileSync(p, 'utf8');
  
  // Find <header>...</header>
  const startIdx = content.indexOf('<header');
  if (startIdx !== -1) {
    const endIdx = content.indexOf('</header>', startIdx);
    if (endIdx !== -1) {
      content = content.substring(0, startIdx) + content.substring(endIdx + 9);
      fs.writeFileSync(p, content);
      console.log(`Deleted <header> in ${p}`);
    }
  }
}
