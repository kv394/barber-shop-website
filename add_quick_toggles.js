const fs = require('fs');

// 1. Update ProductManager.tsx
const pmFile = 'components/shop-admin/ProductManager.tsx';
let pmContent = fs.readFileSync(pmFile, 'utf8');

const handleToggleSellable = `
  const handleToggleSellable = async (product: any) => {
    try {
      const res = await fetch(\`/api/shops/\${shopId}/products/\${product.id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, isSellable: !product.isSellable }),
      });
      if (!res.ok) throw new Error('Failed to toggle sellable status');
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };
`;

if (!pmContent.includes('handleToggleSellable')) {
  pmContent = pmContent.replace('const handleEditClick = (product: any) => {', handleToggleSellable + '\n  const handleEditClick = (product: any) => {');
}

pmContent = pmContent.replace(
  /<td className="px-6 py-4">\s*\{product\.isSellable \? \(\s*<span className="text-status-confirmed">Yes<\/span>\s*\) : \(\s*<span className="text-crm-muted">No<\/span>\s*\)\}\s*<\/td>/,
  `<td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleSellable(product)}
                    className={\`px-3 py-1 rounded-full text-[11px] font-medium transition-colors \${product.isSellable ? 'bg-status-confirmed/20 text-status-confirmed border border-status-confirmed/30' : 'bg-crm-surface text-crm-muted border border-crm-border hover:bg-crm-border'}\`}
                  >
                    {product.isSellable ? 'Yes' : 'No'}
                  </button>
                </td>`
);
fs.writeFileSync(pmFile, pmContent);


// 2. Update ServiceManagement.tsx
const smFile = 'components/shop-admin/ServiceManagement.tsx';
let smContent = fs.readFileSync(smFile, 'utf8');

const handleToggleBookable = `
  const handleToggleBookable = async (service: any) => {
    try {
      const res = await fetch(\`/api/shops/\${shopId}/services/\${service.id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...service, addonIds: service.addons?.map((a: any) => a.id) || [], isBookable: !service.isBookable }),
      });
      if (!res.ok) throw new Error('Failed to toggle bookable status');
      
      setServices(services.map(s => s.id === service.id ? { ...s, isBookable: !s.isBookable } : s));
    } catch (err: any) {
      alert(err.message);
    }
  };
`;

if (!smContent.includes('handleToggleBookable')) {
  smContent = smContent.replace('const handleToggleAddon = async (serviceId: string, addonId: string, currentAddonIds: string[]) => {', handleToggleBookable + '\n  const handleToggleAddon = async (serviceId: string, addonId: string, currentAddonIds: string[]) => {');
}

smContent = smContent.replace(
  /<div className=\{`text-\[13px\] sm:text-\[11px\] font-semibold px-2 py-0\.5 sm:py-1 rounded border \$\{service\.trackInventory \? 'bg-status-info\/20 text-status-info border-status-info\/30' : 'bg-crm-surface text-crm-muted border-crm-border'\}`\}>\s*Inventory: \{service\.trackInventory \? 'ON' : 'OFF'\}\s*<\/div>/,
  `<div className={\`text-[13px] sm:text-[11px] font-semibold px-2 py-0.5 sm:py-1 rounded border \${service.trackInventory ? 'bg-status-info/20 text-status-info border-status-info/30' : 'bg-crm-surface text-crm-muted border-crm-border'}\`}>
                              Inventory: {service.trackInventory ? 'ON' : 'OFF'}
                          </div>
                          <button
                            onClick={() => handleToggleBookable(service)}
                            className={\`text-[13px] sm:text-[11px] font-semibold px-2 py-0.5 sm:py-1 rounded border transition-colors \${service.isBookable ? 'bg-status-confirmed/20 text-status-confirmed border-status-confirmed/30 hover:opacity-80' : 'bg-status-cancelled/20 text-status-cancelled border-status-cancelled/30 hover:opacity-80'}\`}
                          >
                            Consumer: {service.isBookable ? 'ON' : 'OFF'}
                          </button>`
);
fs.writeFileSync(smFile, smContent);

console.log('Added quick toggles for sellable/bookable');
