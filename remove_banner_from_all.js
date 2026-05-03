const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'public', 'html-sections');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove the HTML div
    const htmlRegex = /<div id="announcement-banner"[^>]*><\/div>\n?/g;
    content = content.replace(htmlRegex, '');
    
    // Remove the JS logic
    const jsRegex = /\s*\/\/\s*Update Announcement Banner[\s\S]*?(?=\/\/\s*Update Hero Image)/g;
    content = content.replace(jsRegex, '\n\n                ');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned ${filePath}`);
}

fs.readdirSync(directoryPath).forEach(file => {
    if (file.endsWith('.html')) {
        processFile(path.join(directoryPath, file));
    }
});
