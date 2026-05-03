const fs = require('fs');
const glob = require('glob');

const files = glob.sync('public/html-sections/*.html');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // The template currently checks announcement.url but the API returns announcement.linkUrl
    content = content.replace(/const link = announcement\.url \|\| announcement\.linkUrl;/g, 'const link = announcement.linkUrl || announcement.url;');
    content = content.replace(/if \(announcement\.url\)/g, 'if (announcement.linkUrl || announcement.url)');
    content = content.replace(/announcement\.url \|\| announcement\.linkUrl/g, 'announcement.linkUrl || announcement.url');
    
    fs.writeFileSync(file, content, 'utf8');
});

console.log('Fixed linkUrl mapping across all html files');
