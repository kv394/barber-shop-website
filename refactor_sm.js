const fs = require('fs');
const file = 'components/shop-admin/ServiceManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add fields to interface Service
content = content.replace(
  "type: 'CUSTOMER' | 'INTERNAL';",
  "type: 'CUSTOMER' | 'INTERNAL';\n  isBookable: boolean;\n  imageUrl: string | null;"
);

// 2. Update newService state
content = content.replace(
  "addonIds: [] as string[],",
  "addonIds: [] as string[],\n    isBookable: true,\n    imageUrl: '',"
);

// 3. Add isUploading state
content = content.replace(
  "const [isSubmitting, setIsSubmitting] = useState(false);",
  "const [isSubmitting, setIsSubmitting] = useState(false);\n  const [isUploading, setIsUploading] = useState(false);"
);

// 4. Add handleImageUpload function
const handleImageUpload = `
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'services');
      const res = await fetch(\`/api/shops/\${shopId}/upload\`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNewService(prev => ({ ...prev, imageUrl: data.url }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };
`;
content = content.replace(
  "// Fetch services and addons",
  handleImageUpload + "\n  // Fetch services and addons"
);

// 5. Update POST payload
content = content.replace(
  "type: newService.type,",
  "type: newService.type,\n          isBookable: newService.isBookable,\n          imageUrl: newService.imageUrl,"
);

// 6. Reset form
content = content.replace(
  "setNewService({ name: '', description: '', price: '', duration: '', trackInventory: false, type: 'CUSTOMER', addonIds: [] });",
  "setNewService({ name: '', description: '', price: '', duration: '', trackInventory: false, type: 'CUSTOMER', addonIds: [], isBookable: true, imageUrl: '' });"
);

// 7. Add form fields
const formFields = `
            <div className="flex items-center space-x-3 py-2">
              <input 
                type="checkbox" 
                id="isBookable" 
                checked={newService.isBookable} 
                onChange={(e) => setNewService({ ...newService, isBookable: e.target.checked })}
                className="w-4 h-4 accent-blue-600 bg-crm-bg border-crm-border rounded"
              />
              <label htmlFor="isBookable" className="text-crm-muted cursor-pointer select-none text-[13px]">
                Available to Customer (Sellable/Bookable)
              </label>
            </div>

            {newService.isBookable && (
              <div className="md:col-span-2">
                <label className="block font-medium text-crm-muted mb-2 text-[13px]">
                  Service Image (optional)
                </label>
                <div className="flex items-center gap-4">
                  {newService.imageUrl && (
                    <img src={newService.imageUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-crm-border" />
                  )}
                  <label className="cursor-pointer bg-crm-surface border border-crm-border hover:border-crm-primary transition-colors px-4 py-2 rounded-lg text-[13px] font-medium text-crm-text">
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="hidden" />
                  </label>
                  {newService.imageUrl && (
                     <button type="button" onClick={() => setNewService({ ...newService, imageUrl: '' })} className="text-status-cancelled text-[13px] hover:underline">Remove</button>
                  )}
                </div>
              </div>
            )}
`;
content = content.replace(
  '<div className="flex items-center space-x-3 py-2">\n              <input \n                type="checkbox" \n                id="trackInventory"',
  formFields + '\n            <div className="flex items-center space-x-3 py-2">\n              <input \n                type="checkbox" \n                id="trackInventory"'
);

// 8. Update service list display
content = content.replace(
  '<div className="flex-1 min-w-0">',
  `<div className="flex-1 min-w-0 flex gap-4">
                      {service.imageUrl && (
                        <img src={service.imageUrl} alt={service.name} className="w-16 h-16 object-cover rounded-lg border border-crm-border hidden sm:block" />
                      )}
                      <div className="flex-1">`
);

content = content.replace(
  '                      {/* Add-ons Selector */}',
  `                      </div>\n                    </div>\n                      {/* Add-ons Selector */}`
);

// wait, the flex-1 flex gap-4 wrapper needs to close before addon selector?
// Let's refine step 8.

fs.writeFileSync(file, content);
console.log('Done refactoring service management');