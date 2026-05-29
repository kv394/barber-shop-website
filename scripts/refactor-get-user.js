const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedCount = 0;

walkDir('./app/api', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Pattern 1: user: authUserSession
    const pattern1 = /const\s*{\s*data:\s*{\s*user:\s*authUserSession\s*}\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\);/g;
    const replace1 = `const { data: { session } } = await supabase.auth.getSession();\n  const authUserSession = session?.user;`;
    
    // Pattern 2: user
    const pattern2 = /const\s*{\s*data:\s*{\s*user\s*}\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\);/g;
    const replace2 = `const { data: { session } } = await supabase.auth.getSession();\n  const user = session?.user;`;
    
    // Pattern 3: user: authUser
    const pattern3 = /const\s*{\s*data:\s*{\s*user:\s*authUser\s*}\s*}\s*=\s*await\s+supabase\.auth\.getUser\(\);/g;
    const replace3 = `const { data: { session } } = await supabase.auth.getSession();\n  const authUser = session?.user;`;

    let originalContent = content;
    content = content.replace(pattern1, replace1);
    content = content.replace(pattern2, replace2);
    content = content.replace(pattern3, replace3);
    
    // We explicitly skip the init route because it's responsible for strict auth syncing
    if (filePath.includes('users/init/route.ts')) {
      content = originalContent; // Revert
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedCount++;
      console.log(`Refactored: ${filePath}`);
    }
  }
});

console.log(`Done. Modified ${modifiedCount} files.`);
