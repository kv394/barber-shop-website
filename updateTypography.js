const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components']; // relative to barbersaas/
const sizeRegex = /\b(?:sm:|md:|lg:|xl:|2xl:)?text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g;

const tagMap = {
  'h1': 'text-4xl md:text-5xl lg:text-6xl',
  'h2': 'text-3xl md:text-4xl',
  'h3': 'text-2xl md:text-3xl',
  'h4': 'text-xl md:text-2xl',
  'p': 'text-base md:text-lg',
  'small': 'text-sm',
  'label': 'text-sm'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  const tags = Object.keys(tagMap);
  
  for (const tag of tags) {
    // We match the opening tag <tag ... > taking care of nested structures (not perfect but mostly works for standard formatting)
    // RegExp to find <tag> or <tag ...>
    const openingTagRegex = new RegExp(`<${tag}(\\s+[^>]*?)?>`, 'g');
    
    content = content.replace(openingTagRegex, (match) => {
      // If it has no className attribute, add one
      if (!match.includes('className=')) {
        const newClasses = tagMap[tag];
        if (match.endsWith('/>')) {
           return match.replace(/\/>$/, ` className="${newClasses}" />`);
        } else {
           return match.replace(/>$/, ` className="${newClasses}">`);
        }
      } else {
        // Replace inside className
        return match.replace(/className=(?:(["'])(.*?)\1|{([^}]*)})/, (clsMatch, quote, strLiteral, expr) => {
          if (strLiteral !== undefined) {
             let cleaned = strLiteral.replace(sizeRegex, '').replace(/\s+/g, ' ').trim();
             return `className=${quote}${cleaned ? cleaned + ' ' : ''}${tagMap[tag]}${quote}`;
          } else if (expr !== undefined) {
             let newExpr = expr.replace(sizeRegex, '').replace(/\s+/g, ' ').trim();
             
             if (newExpr.startsWith('`') && newExpr.endsWith('`')) {
                let inner = newExpr.slice(1, -1).trim();
                return `className={\`${inner ? inner + ' ' : ''}${tagMap[tag]}\`}`;
             } else if (newExpr.startsWith("cn(") && newExpr.endsWith(")")) {
                let inner = newExpr.slice(3, -1);
                return `className={cn("${tagMap[tag]}", ${inner})}`;
             } else if ((newExpr.startsWith('"') && newExpr.endsWith('"')) || (newExpr.startsWith("'") && newExpr.endsWith("'"))) {
                let q = newExpr[0];
                let inner = newExpr.slice(1, -1).trim();
                return `className={${q}${inner ? inner + ' ' : ''}${tagMap[tag]}${q}}`;
             } else {
                // For variables or ternary operators, inject using template literal
                // e.g. isActive ? "font-bold" : "" -> `${isActive ? "font-bold" : ""} text-4xl...`
                // But wait, what if it's already an object? e.g. styles.h1
                return `className={\`\${${newExpr}} ${tagMap[tag]}\`}`;
             }
          }
          return clsMatch;
        });
      }
    });
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
         results.push(file);
      }
    }
  });
  return results;
}

targetDirs.forEach(dir => {
  const fullPath = path.resolve(__dirname, dir);
  if (fs.existsSync(fullPath)) {
     const files = walk(fullPath);
     files.forEach(processFile);
  } else {
     console.error(`Directory not found: ${fullPath}`);
  }
});
