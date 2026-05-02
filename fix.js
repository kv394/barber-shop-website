const fs = require('fs');
let code = fs.readFileSync('components/shop-admin/CustomizationForm.tsx', 'utf8');
const searchStr = `        {currentTemplate === 'editorial' && (
          <EditorialCustomizationForm customization={formData} onUpdate={handleInputChange} shopId={shopId} />
        )}

        <div>
          <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Advanced UI & Theme Overrides</h3>`;
const replaceStr = `        {currentTemplate === 'editorial' && (
          <EditorialCustomizationForm customization={formData} onUpdate={handleInputChange} shopId={shopId} />
        )}

        <div>
          <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Advanced UI & Theme Overrides</h3>`;
code = code.replace(searchStr, replaceStr);
fs.writeFileSync('components/shop-admin/CustomizationForm.tsx', code);
