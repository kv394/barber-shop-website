const fs = require('fs');
const path = require('path');

// Recursively find all TypeScript/TSX files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.next')) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

const allFiles = findFiles('./app').concat(findFiles('./components'), findFiles('./lib'));

let updatedCount = 0;

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Replace Clerk server auth imports
  content = content.replace(
    /import\s+\{\s*auth\s*(?:,\s*clerkClient\s*)?\}\s+from\s+['"]@clerk\/nextjs\/server['"];?/g,
    `import { createClient } from '@/utils/supabase/server';`
  );

  // 2. Replace Clerk client auth imports
  content = content.replace(
    /import\s+\{\s*useAuth,\s*UserButton,\s*SignInButton,\s*useClerk\s*\}\s+from\s+['"]@clerk\/nextjs['"];?/g,
    `import SupabaseAuthButton from '@/components/SupabaseAuthButton';`
  );
  content = content.replace(
    /import\s+\{\s*useAuth,\s*UserButton,\s*SignInButton\s*\}\s+from\s+['"]@clerk\/nextjs['"];?/g,
    `import SupabaseAuthButton from '@/components/SupabaseAuthButton';`
  );
  content = content.replace(
    /import\s+\{\s*useUser,\s*useClerk\s*\}\s+from\s+['"]@clerk\/nextjs['"];?/g,
    `// Using Supabase Auth`
  );
  content = content.replace(
    /import\s+\{\s*useUser,\s*SignInButton,\s*UserButton\s*\}\s+from\s+['"]@clerk\/nextjs['"];?/g,
    `import SupabaseAuthButton from '@/components/SupabaseAuthButton';`
  );

  // 3. Replace async auth() calls in server components/APIs
  // from: const { userId } = await auth();
  // to:   const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); const userId = user?.id;
  content = content.replace(
    /const\s+\{\s*userId\s*\}\s*=\s*await\s+auth\(\)\s*;/g,
    `const supabase = createClient();\n  const { data: { user } } = await supabase.auth.getUser();\n  const userId = user?.id;`
  );

  // Replace sync auth() calls (deprecated but might exist)
  content = content.replace(
    /const\s+\{\s*userId\s*\}\s*=\s*auth\(\)\s*;/g,
    `const supabase = createClient();\n  const { data: { user } } = await supabase.auth.getUser();\n  const userId = user?.id;`
  );

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`\nMigration complete. Updated ${updatedCount} files.`);
console.log('NOTE: You must manually replace any <UserButton /> or <SignInButton /> JSX tags with <SupabaseAuthButton /> in your components.');
