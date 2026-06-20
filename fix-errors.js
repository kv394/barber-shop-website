const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const apiDir = path.join(__dirname, 'app', 'api');
const files = walk(apiDir);

let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace { error: error.message } with { error: 'Internal Server Error' }
  content = content.replace(/\{ error: (error\.message|e\.message|err\.message)( \|\| [^}]+)? \}/g, "{ error: 'Internal Server Error' }");
  
  // Replace { error: error.message } if it's across multiple lines? No, regex is good enough for simple cases.
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
    count++;
  }
});
console.log(`Fixed ${count} files.`);
