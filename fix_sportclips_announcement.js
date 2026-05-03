const fs = require('fs');
const file = 'public/html-sections/SportClips.html';

let content = fs.readFileSync(file, 'utf8');

// The template currently checks announcement.url but the API returns announcement.linkUrl
content = content.replace(/if \(announcement\.url\)/g, 'if (announcement.linkUrl || announcement.url)');
content = content.replace(/announcement\.url/g, '(announcement.linkUrl || announcement.url)');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed SportClips linkUrl mapping');
