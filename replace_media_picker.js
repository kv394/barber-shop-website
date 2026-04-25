const fs = require('fs');

function processFile(file, importStmt, replacements) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('MediaPicker')) {
    content = content.replace(/(import .*?;\\n)(?!.*import )/s, '$1' + importStmt + '\\n');
  }
  for (const rep of replacements) {
    content = content.replace(rep.old, rep.new);
  }
  fs.writeFileSync(file, content);
}

// 1. CustomizationForm.tsx
processFile('components/shop-admin/CustomizationForm.tsx', "import MediaPicker from './MediaPicker';", [
  {
    old: /<input\s*type="file"\s*accept="image\/\*"\s*onChange=\{async \(e\) => \{[\s\S]*?setIsLoading\(false\);\s*\}\s*\}\s*disabled=\{isLoading\}\s*className="hidden"\s*\/>/g,
    new: ''
  },
  {
    old: /<label className="cursor-pointer bg-crm-surface border border-crm-border hover:border-crm-primary transition-colors px-4 py-2 rounded-lg text-\[13px\] font-medium text-crm-text">\s*\{isLoading \? 'Uploading\.\.\.' : 'Upload Image'\}\s*<\/label>/g,
    new: '<MediaPicker shopId={shopId} currentUrl={null} label="Choose Image" onSelect={(url) => handleInputChange(\'logoUrl\', url)} />' // wait, this logic is too broad. Let's do string replacement specifically
  }
]);

console.log("Replaced");
