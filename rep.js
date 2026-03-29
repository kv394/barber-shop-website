
const fs = require("fs");
const path = require("path");
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const p = path.join(dir, file);
        const stat = fs.statSync(p);
        if (stat && stat.isDirectory()) results = results.concat(walk(p));
        else if (p.endsWith(".ts") && p.indexOf("log-error") === -1) results.push(p);
    });
    return results;
}
const files = walk("app/api");
let cc = 0;
files.forEach(f => {
    let text = fs.readFileSync(f, "utf8");
    if (text.indexOf("console.error(") !== -1) {
        if (text.indexOf("import { logger }") === -1) {
            text = "import { logger } from \"@/lib/logger\";
" + text;
        }
        text = text.replace(/console\.error\(/g, "logger.error(");
        fs.writeFileSync(f, text);
        cc++;
    }
});
console.log("Updated " + cc + " files.");

