const fs = require('fs');
let code = fs.readFileSync('app/api/apply-heritage/route.ts', 'utf8');

code = code.replace(/https:\/\/drive\.google\.com\/uc\?export=view&id=[a-zA-Z0-9_-]+/g, (match) => {
  if (match.includes('1IinGTDVkupC7HwONCYZpXZZxGU3-NpeY')) return '/templates/heritage/hero.jpg';
  if (match.includes('1MBtJSfFxBCwdG6lPUeQywW-gRcN6rOof')) return '/templates/heritage/detail.jpg';
  if (match.includes('1ZkPgbMSphJlUKT5jR_TpgtWU3B5Xlojv')) return '/templates/heritage/elena.jpg';
  if (match.includes('17d5dQPskN9Ug8DmdeKuLpfGAxthOUttb')) return '/templates/heritage/jasmine.jpg';
  if (match.includes('1bKTnbQViH1bhPixO0w0bsu6jHMfY_j4q')) return '/templates/heritage/marcus.jpg';
  if (match.includes('170WZ_MHWPq3WxoU7bikwpTOEBGy34bws')) return '/templates/heritage/nape.jpg';
  return match;
});

fs.writeFileSync('app/api/apply-heritage/route.ts', code);
console.log('URLs updated to local public assets!');
