const fs = require('fs');

const file = 'components/shop-admin/CustomizationForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the Advanced UI block and replace everything EXCEPT the Favicon URL.
// The Advanced UI block starts around line 199 with <div><h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Advanced UI & Theme Overrides</h3>
// and goes all the way down to the closing of that div before {activeVariables.length > 0 && (

const advancedUiStart = content.indexOf('<div>\\n          <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Advanced UI & Theme Overrides</h3>');

if (advancedUiStart === -1) {
  // Let's use a regex to match it more robustly
  const match = content.match(/<h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Advanced UI & Theme Overrides<\\/h3>[\\s\\S]*?(?={activeVariables\\.length > 0 && \\()/);
  if (match) {
    const toReplace = match[0];
    const newContent = `<h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Advanced UI & Theme Overrides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Favicon URL</label>
              <div className="flex gap-2 items-center">
                <input type="url" value={formData.faviconUrl || ''} onChange={(e) => handleInputChange('faviconUrl', e.target.value)} placeholder="https://example.com/favicon.ico" className="flex-1 w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500" />
                <MediaPicker shopId={shopId} currentUrl={formData.faviconUrl} onSelect={(url) => handleInputChange('faviconUrl', url)} label="Upload" />
              </div>
            </div>
          </div>
        </div>

        `;
    content = content.replace(toReplace, newContent);
    fs.writeFileSync(file, content);
    console.log("Successfully replaced Advanced UI settings.");
  } else {
    console.log("Could not find the block via regex either.");
  }
}

