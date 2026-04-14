const fs = require('fs');
const path = require('path');

const TARGET_DIRS = ['app', 'components'];

const REPLACEMENTS = [
  // Red
  { pattern: /bg-red-900\/[0-9]+/g, replacement: 'bg-status-cancelled/20' },
  { pattern: /text-red-[345]00/g, replacement: 'text-status-cancelled' },
  { pattern: /border-red-[45]00\/[0-9]+/g, replacement: 'border-status-cancelled/30' },

  // Purple
  { pattern: /bg-purple-[89]00\/[0-9]+/g, replacement: 'bg-botanical-accent/20' },
  { pattern: /bg-purple-500\/20/g, replacement: 'bg-botanical-accent/20' },
  { pattern: /bg-purple-500\/80/g, replacement: 'bg-botanical-accent/80' },
  { pattern: /text-purple-[345]00/g, replacement: 'text-botanical-accent' },
  { pattern: /border-purple-[45]00\/[0-9]+/g, replacement: 'border-botanical-accent/30' },

  // Orange
  { pattern: /bg-orange-[89]00\/[0-9]+/g, replacement: 'bg-status-pending/20' },
  { pattern: /text-orange-[345]00/g, replacement: 'text-status-pending' },
  { pattern: /border-orange-[45]00\/[0-9]+/g, replacement: 'border-status-pending/30' },

  // Yellow
  { pattern: /bg-yellow-[89]00\/[0-9]+/g, replacement: 'bg-status-pending/20' },
  { pattern: /text-yellow-[345]00/g, replacement: 'text-status-pending' },
  { pattern: /border-yellow-[45]00\/[0-9]+/g, replacement: 'border-status-pending/30' },

  // Blue
  { pattern: /bg-blue-[89]00\/[0-9]+/g, replacement: 'bg-status-info/20' },
  { pattern: /text-blue-[345]00/g, replacement: 'text-status-info' },
  { pattern: /border-blue-[45]00\/[0-9]+/g, replacement: 'border-status-info/30' },

  // Green
  { pattern: /bg-green-[89]00\/[0-9]+/g, replacement: 'bg-status-confirmed/20' },
  { pattern: /text-green-[345]00/g, replacement: 'text-status-confirmed' },
  { pattern: /border-green-[45]00\/[0-9]+/g, replacement: 'border-status-confirmed/30' },
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      results.push(filePath);
    }
  });
  return results;
}

function refactor() {
  let changedFilesCount = 0;
  
  TARGET_DIRS.forEach((dir) => {
    if (!fs.existsSync(dir)) return;
    
    const files = walk(dir);
    files.forEach((file) => {
      let content = fs.readFileSync(file, 'utf8');
      let originalContent = content;
      
      REPLACEMENTS.forEach(({ pattern, replacement }) => {
        content = content.replace(pattern, replacement);
      });
      
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        changedFilesCount++;
        console.log(`Updated: ${file}`);
      }
    });
  });
  
  console.log(`Refactoring complete. Changed ${changedFilesCount} files.`);
}

refactor();
