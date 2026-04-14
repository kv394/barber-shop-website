const fs = require('fs');
const path = require('path');

const dirsToScan = [
    path.join(__dirname, 'components', 'marketing'),
    path.join(__dirname, 'components', 'reports'),
    path.join(__dirname, 'components', 'appointments'),
];

function scanDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(scanDir(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

let files = [];
dirsToScan.forEach(dir => {
    if (fs.existsSync(dir)) {
        files = files.concat(scanDir(dir));
    }
});

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Fix Labels
    // Look for tags containing `uppercase` and `tracking-widest` (or `tracking-wider`)
    // We will parse the className string, remove all size classes, and add text-xs
    content = content.replace(/className="([^"]*uppercase[^"]*tracking-widest[^"]*)"/g, (match, classesStr) => {
        let classes = classesStr.split(/\s+/);
        // Remove existing sizes
        const sizeRegex = /^(?:sm:|md:|lg:|xl:)?text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|\[10px\])$/;
        classes = classes.filter(c => !sizeRegex.test(c));
        // Add text-xs
        if (!classes.includes('text-xs')) {
            classes.push('text-xs');
        }
        return `className="${classes.join(' ')}"`;
    });

    // 2. Fix Values
    // Look for <p> or other tags containing font-black or font-bold and some size classes like text-base md:text-lg
    // The prompt says "Look for <p> tags containing the actual metric value (often font-black or font-bold)... remove text-base md:text-lg"
    // We'll replace className="[^"]*(font-black|font-bold)[^"]*" inside <p> tags
    content = content.replace(/<p\s+[^>]*className="([^"]*(?:font-black|font-bold)[^"]*)"[^>]*>/g, (match, classesStr) => {
        // Only apply if it's a metric value. Usually these have "break-words leading-tight" or "text-base md:text-lg"
        if (!classesStr.includes('text-base') && !classesStr.includes('md:text-lg') && !classesStr.includes('break-words')) {
            return match; // skip, maybe a normal bold text
        }

        let classes = classesStr.split(/\s+/);
        const sizeRegex = /^(?:sm:|md:|lg:|xl:)?text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|\[10px\])$/;
        classes = classes.filter(c => !sizeRegex.test(c));
        
        // Add text-3xl md:text-4xl
        if (!classes.includes('text-3xl')) classes.push('text-3xl');
        if (!classes.includes('sm:text-4xl') && !classes.includes('md:text-4xl')) {
            classes.push('md:text-4xl'); // Standardizing on md:text-4xl
        }

        // Reconstruct the match
        return match.replace(`className="${classesStr}"`, `className="${classes.join(' ')}"`);
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});

console.log('Done fixing KPI boxes.');
