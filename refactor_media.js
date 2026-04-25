const fs = require('fs');

function refactorFile(file, importPath, pattern, newContentGenerator) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('MediaPicker')) {
    const importRegex = /(import [^\n]+;\n)(?!import)/;
    content = content.replace(importRegex, `$1import MediaPicker from '${importPath}';\n`);
  }
  content = content.replace(pattern, newContentGenerator);
  fs.writeFileSync(file, content);
}

// 1. CustomizationForm.tsx
const custFile = 'components/shop-admin/CustomizationForm.tsx';
let custContent = fs.readFileSync(custFile, 'utf8');
if (!custContent.includes('MediaPicker')) {
    custContent = custContent.replace("import { EditorialCustomizationForm } from './EditorialCustomizationForm';", "import { EditorialCustomizationForm } from './EditorialCustomizationForm';\nimport MediaPicker from './MediaPicker';");
}

// Replace logoUrl section
const logoRegex = /<div className="flex items-center gap-4">[\s\S]*?<label className="cursor-pointer bg-crm-surface border border-crm-border hover:border-crm-primary transition-colors px-4 py-2 rounded-lg text-\[13px\] font-medium text-crm-text">[\s\S]*?<\/label>\s*(?:\{formData\.logoUrl && \([\s\S]*?<\/button>\s*\)\})?\s*<\/div>/g;
custContent = custContent.replace(logoRegex, (match) => {
    if(match.includes('logoUrl')) {
        return '<MediaPicker shopId={shopId} currentUrl={formData.logoUrl} onSelect={(url) => handleInputChange(\'logoUrl\', url)} label="Upload/Select Logo" />';
    }
    return match;
});

// Replace heroImageUrl section
const heroRegex = /<div className="flex items-center gap-4">[\s\S]*?<label className="cursor-pointer bg-crm-surface border border-crm-border hover:border-crm-primary transition-colors px-4 py-2 rounded-lg text-\[13px\] font-medium text-crm-text">[\s\S]*?<\/label>\s*(?:\{formData\.heroImageUrl && \([\s\S]*?<\/button>\s*\)\})?\s*<\/div>/g;
custContent = custContent.replace(heroRegex, (match) => {
    if(match.includes('heroImageUrl')) {
        return '<MediaPicker shopId={shopId} currentUrl={formData.heroImageUrl} onSelect={(url) => handleInputChange(\'heroImageUrl\', url)} label="Upload/Select Hero Image" />';
    }
    return match;
});

fs.writeFileSync(custFile, custContent);


// 2. EditorialCustomizationForm.tsx
const edFile = 'components/shop-admin/EditorialCustomizationForm.tsx';
let edContent = fs.readFileSync(edFile, 'utf8');
if (!edContent.includes('MediaPicker')) {
    edContent = edContent.replace("import { Customization } from '@/lib/templates';", "import { Customization } from '@/lib/templates';\nimport MediaPicker from './MediaPicker';");
}
const edHeroRegex = /<div className="flex items-center gap-4">[\s\S]*?<label className="cursor-pointer bg-crm-surface border border-crm-border hover:border-crm-primary transition-colors px-4 py-2 rounded-lg text-\[13px\] font-medium text-crm-text">[\s\S]*?<\/label>\s*(?:\{editorial\.heroImage && \([\s\S]*?<\/button>\s*\)\})?\s*<\/div>/g;
edContent = edContent.replace(edHeroRegex, '<MediaPicker shopId={shopId} currentUrl={editorial.heroImage} onSelect={(url) => handleChange(\'heroImage\', url)} label="Upload/Select Hero Image" />');
fs.writeFileSync(edFile, edContent);


// 3. ServiceManagement.tsx
const smFile = 'components/shop-admin/ServiceManagement.tsx';
let smContent = fs.readFileSync(smFile, 'utf8');
if (!smContent.includes('MediaPicker')) {
    smContent = smContent.replace("import { TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';", "import { TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';\nimport MediaPicker from './MediaPicker';");
}
const smImageRegex = /<div className="flex items-center gap-4">[\s\S]*?<label className="cursor-pointer bg-crm-surface border border-crm-border hover:border-crm-primary transition-colors px-4 py-2 rounded-lg text-\[13px\] font-medium text-crm-text">[\s\S]*?<\/label>\s*(?:\{newService\.imageUrl && \([\s\S]*?<\/button>\s*\)\})?\s*<\/div>/g;
smContent = smContent.replace(smImageRegex, '<MediaPicker shopId={shopId} currentUrl={newService.imageUrl} onSelect={(url) => setNewService({ ...newService, imageUrl: url })} label="Upload/Select Service Image" />');
fs.writeFileSync(smFile, smContent);


// 4. ProductManager.tsx
const pmFile = 'components/shop-admin/ProductManager.tsx';
let pmContent = fs.readFileSync(pmFile, 'utf8');
if (!pmContent.includes('MediaPicker')) {
    pmContent = pmContent.replace("import Barcode from 'react-barcode';", "import Barcode from 'react-barcode';\nimport MediaPicker from './MediaPicker';");
}
const pmImageRegex = /<div className="flex items-center gap-4">[\s\S]*?<label className="cursor-pointer bg-crm-surface border border-crm-border hover:border-crm-primary transition-colors px-4 py-2 rounded-lg text-\[13px\] font-medium text-crm-text">[\s\S]*?<\/label>\s*(?:\{formData\.imageUrl && \([\s\S]*?<\/button>\s*\)\})?\s*<\/div>/g;
pmContent = pmContent.replace(pmImageRegex, '<MediaPicker shopId={shopId} currentUrl={formData.imageUrl} onSelect={(url) => setFormData({ ...formData, imageUrl: url })} label="Upload/Select Product Image" />');
fs.writeFileSync(pmFile, pmContent);


// 5. PortfolioManager.tsx
const pfFile = 'components/shop-admin/PortfolioManager.tsx';
let pfContent = fs.readFileSync(pfFile, 'utf8');
if (!pfContent.includes('MediaPicker')) {
    pfContent = pfContent.replace("import { useRouter } from 'next/navigation';", "import { useRouter } from 'next/navigation';\nimport MediaPicker from './MediaPicker';");
}
const pfImageRegex = /<label className="cursor-pointer bg-brand-gold text-crm-bg font-bold px-6 py-2 rounded shadow hover:bg-brand-gold\/90 transition-colors inline-block">\s*\{saving \? 'Uploading\.\.\.' : 'Upload Image'\}\s*<input\s*type="file"\s*accept="image\/\*"\s*onChange=\{async \(e\) => \{[\s\S]*?\}\s*disabled=\{saving\}\s*className="hidden"\s*\/>\s*<\/label>/g;
pfContent = pfContent.replace(pfImageRegex, '<MediaPicker shopId={shopId} currentUrl={null} onSelect={(url) => { if(url) { setNewImage({ ...newImage, url }); handleAddImage(); } }} label="Upload/Select Portfolio Image" className="inline-block" />');
fs.writeFileSync(pfFile, pfContent);


console.log('Refactored all media uploads to use MediaPicker');
