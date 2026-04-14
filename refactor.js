const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'app'),
  path.join(__dirname, 'components')
];

const replacements = [
  // Backgrounds
  { regex: /\b(?<![:\w])bg-white\b/g, replace: 'bg-botanical-surface' },
  { regex: /\bhover:bg-white\b/g, replace: 'hover:bg-botanical-surface' },
  { regex: /\bfocus:bg-white\b/g, replace: 'focus:bg-botanical-surface' },

  { regex: /\b(?<![:\w])bg-(gray|slate|zinc)-(800|900)\b/g, replace: 'bg-botanical-darkBase' },
  { regex: /\b(?<![:\w])bg-(gray|slate|zinc)-(50|100|200)\b/g, replace: 'bg-botanical-bg' },
  { regex: /\b(?<![:\w])bg-black\b/g, replace: 'bg-botanical-darkBase' },

  // Text colors
  { regex: /\b(?<![:\w])text-(gray|slate|zinc)-(800|900|700)\b/g, replace: 'text-botanical-text' },
  { regex: /\bhover:text-(gray|slate|zinc)-(800|900|700)\b/g, replace: 'hover:text-botanical-text' },
  { regex: /\b(?<![:\w])text-black\b/g, replace: 'text-botanical-text' },

  { regex: /\b(?<![:\w])text-(gray|slate|zinc)-(400|500|600)\b/g, replace: 'text-botanical-muted' },
  { regex: /\bhover:text-(gray|slate|zinc)-(400|500|600)\b/g, replace: 'hover:text-botanical-muted' },

  // Status colors - Text
  { regex: /\b(?<![:\w])text-(red)-(400|500|600)\b/g, replace: 'text-status-cancelled' },
  { regex: /\bhover:text-(red)-(400|500|600)\b/g, replace: 'hover:text-status-cancelled' },
  { regex: /\b(?<![:\w])text-(green)-(400|500|600)\b/g, replace: 'text-status-confirmed' },
  { regex: /\bhover:text-(green)-(400|500|600)\b/g, replace: 'hover:text-status-confirmed' },
  { regex: /\b(?<![:\w])text-(yellow|amber)-(400|500|600)\b/g, replace: 'text-status-pending' },
  { regex: /\bhover:text-(yellow|amber)-(400|500|600)\b/g, replace: 'hover:text-status-pending' },
  { regex: /\b(?<![:\w])text-(blue)-(400|500|600)\b/g, replace: 'text-status-info' },
  { regex: /\bhover:text-(blue)-(400|500|600)\b/g, replace: 'hover:text-status-info' },

  // Status colors - Backgrounds
  { regex: /\b(?<![:\w])bg-(red)-(400|500|600)\b/g, replace: 'bg-status-cancelled' },
  { regex: /\bhover:bg-(red)-(400|500|600)\b/g, replace: 'hover:bg-status-cancelled' },
  { regex: /\b(?<![:\w])bg-(green)-(400|500|600)\b/g, replace: 'bg-status-confirmed' },
  { regex: /\bhover:bg-(green)-(400|500|600)\b/g, replace: 'hover:bg-status-confirmed' },
  { regex: /\b(?<![:\w])bg-(yellow|amber)-(400|500|600)\b/g, replace: 'bg-status-pending' },
  { regex: /\bhover:bg-(yellow|amber)-(400|500|600)\b/g, replace: 'hover:bg-status-pending' },
  { regex: /\b(?<![:\w])bg-(blue)-(400|500|600)\b/g, replace: 'bg-status-info' },
  { regex: /\bhover:bg-(blue)-(400|500|600)\b/g, replace: 'hover:bg-status-info' },
  
  // Status colors - Borders
  { regex: /\b(?<![:\w])border-(red)-(400|500|600)\b/g, replace: 'border-status-cancelled' },
  { regex: /\b(?<![:\w])border-(green)-(400|500|600)\b/g, replace: 'border-status-confirmed' },
  { regex: /\b(?<![:\w])border-(yellow|amber)-(400|500|600)\b/g, replace: 'border-status-pending' },
  { regex: /\b(?<![:\w])border-(blue)-(400|500|600)\b/g, replace: 'border-status-info' },

  // Borders
  { regex: /\b(?<![:\w])border-(gray|slate|zinc)-(200|300|400)\b/g, replace: 'border-botanical-border' },
  { regex: /\bhover:border-(gray|slate|zinc)-(200|300|400)\b/g, replace: 'hover:border-botanical-border' },
  
  // Rings
  { regex: /\b(?<![:\w])ring-(gray|slate|zinc)-(200|300|400)\b/g, replace: 'ring-botanical-border' },
  { regex: /\b(?<![:\w])ring-(red)-(400|500|600)\b/g, replace: 'ring-status-cancelled' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Apply regex replacements
  replacements.forEach(r => {
    content = content.replace(r.regex, r.replace);
  });

  // Ensure text contrast on botanical-primary
  // If we find `bg-botanical-primary` but no text color is set, it might need `text-white`.
  // However, `text-white` is usually already there.
  // Add hover states for missing button hovers:
  // We'll look for className attributes and if they contain bg-botanical-primary without a hover state, add hover:opacity-90
  content = content.replace(/className=(["'])(.*?)\1|className=\{`([^`]*?)`\}/g, (match, q, p1, p2) => {
    let classes = p1 !== undefined ? p1 : p2;
    let modified = classes;

    if (modified.includes('bg-botanical-primary')) {
      if (!modified.includes('hover:bg-') && !modified.includes('hover:opacity-')) {
        modified += ' hover:opacity-90';
      }
      if (!modified.includes('text-')) {
          modified += ' text-white';
      }
    }

    if (modified !== classes) {
      if (p1 !== undefined) {
        return `className=${q}${modified}${q}`;
      } else {
        return `className={\`${modified}\`}`;
      }
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  }
});

console.log('Refactoring complete.');
