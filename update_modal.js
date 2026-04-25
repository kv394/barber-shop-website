const fs = require('fs');

// 1. BookingModal.tsx
let modalContent = fs.readFileSync('components/appointments/BookingModal.tsx', 'utf8');

// Props
modalContent = modalContent.replace(
  'shopHours: Record<string, { open: string; close: string } | null>;\n}',
  'shopHours: Record<string, { open: string; close: string } | null>;\n  themeColor?: string;\n  templateType?: string;\n}'
);

// Signature
modalContent = modalContent.replace(
  'export default function BookingModal({ shopId, service, onClose, shopHours }: BookingModalProps) {',
  'export default function BookingModal({ shopId, service, onClose, shopHours, themeColor, templateType }: BookingModalProps) {'
);

// add getThemeStyles inside BookingModal
const styleHelper = `
  const getThemeStyles = () => {
    switch (templateType) {
      case 'sporty':
        return {
          cardActive: 'border-2 border-black shadow-sm rounded-none',
          cardInactive: 'border-2 border-gray-200 hover:border-black rounded-none',
          btnPrimary: 'w-full bg-black text-white font-black py-4 uppercase tracking-widest rounded-none hover:opacity-90',
          input: 'w-full border-2 border-gray-200 p-4 rounded-none focus:outline-none focus:border-black font-bold'
        };
      case 'corporate':
        return {
          cardActive: 'border border-blue-600 shadow-md rounded-lg',
          cardInactive: 'border border-gray-200 hover:border-blue-600 rounded-lg',
          btnPrimary: 'w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 shadow-sm',
          input: 'w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'
        };
      case 'noir':
        return {
          cardActive: 'border border-black bg-black text-white rounded-none',
          cardInactive: 'border border-gray-300 hover:border-black rounded-none',
          btnPrimary: 'w-full bg-black text-white font-bold uppercase tracking-[0.2em] py-4 rounded-none hover:bg-gray-900',
          input: 'w-full border-b-2 border-gray-300 p-3 rounded-none focus:outline-none focus:border-black bg-transparent'
        };
      case 'sunset':
        return {
          cardActive: 'border-2 border-orange-500 shadow-lg rounded-2xl',
          cardInactive: 'border-2 border-transparent bg-gray-50 hover:bg-gray-100 rounded-2xl',
          btnPrimary: 'w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-4 rounded-full shadow-lg hover:shadow-orange-500/30 hover:opacity-90',
          input: 'w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl focus:outline-none focus:border-orange-500'
        };
      case 'editorial':
        return {
          cardActive: 'border border-[#d4af37] bg-[#fdfbf7] rounded-none',
          cardInactive: 'border border-gray-200 hover:border-[#d4af37] rounded-none',
          btnPrimary: 'w-full bg-[#d4af37] text-[#121412] font-semibold uppercase tracking-widest py-4 rounded-none hover:opacity-90',
          input: 'w-full border-b border-gray-300 p-3 rounded-none focus:outline-none focus:border-[#d4af37] bg-transparent font-serif'
        };
      case 'classic':
        return {
          cardActive: 'border border-[#2c1e16] bg-[#fdfbf7] rounded-sm',
          cardInactive: 'border border-[#e6d9c6] hover:border-[#2c1e16] bg-white rounded-sm',
          btnPrimary: 'w-full bg-[#2c1e16] text-[#fdfbf7] font-medium uppercase tracking-wider py-3 rounded-sm hover:bg-[#1a120d]',
          input: 'w-full border border-[#e6d9c6] p-3 rounded-sm focus:outline-none focus:border-[#2c1e16] bg-white'
        };
      case 'minimal':
        return {
          cardActive: 'border-b-2 border-black rounded-none pb-4',
          cardInactive: 'border-b border-gray-200 hover:border-black rounded-none pb-4',
          btnPrimary: 'w-full bg-black text-white font-medium py-3 rounded-none hover:bg-gray-800',
          input: 'w-full border-b border-gray-200 p-3 rounded-none focus:outline-none focus:border-black bg-transparent'
        };
      case 'modern':
      default:
        return {
          cardActive: 'border-2 border-gray-800 shadow-sm rounded-xl',
          cardInactive: 'border-2 border-transparent bg-gray-50 hover:border-gray-200 rounded-xl',
          btnPrimary: 'w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-md hover:bg-black',
          input: 'w-full border border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50'
        };
    }
  };

  const tStyles = getThemeStyles();
  const hexToRgba = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3 || cleanHex.length === 6) {
      const isShort = cleanHex.length === 3;
      const r = parseInt(isShort ? cleanHex[0] + cleanHex[0] : cleanHex.substring(0, 2), 16);
      const g = parseInt(isShort ? cleanHex[1] + cleanHex[1] : cleanHex.substring(2, 4), 16);
      const b = parseInt(isShort ? cleanHex[2] + cleanHex[2] : cleanHex.substring(4, 6), 16);
      return \`rgba(\${r}, \${g}, \${b}, 0.1)\`;
    }
    return '';
  }
  const activeBg = themeColor ? hexToRgba(themeColor) : '#f9fafb';
`;

modalContent = modalContent.replace(
  'const [isLoaded, setIsLoaded] = useState(false);',
  'const [isLoaded, setIsLoaded] = useState(false);\n' + styleHelper
);

// Card active/inactive logic
modalContent = modalContent.replace(
  /className=\{`p-4 border rounded-xl cursor-pointer transition-colors \$\{selectedStaff\?\.id === st\.id \? 'border-gray-800 bg-gray-50' : 'border-gray-200 hover:border-gray-800'\}`\}/g,
  "className={`p-4 cursor-pointer transition-all ${selectedStaff?.id === st.id ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedStaff?.id === st.id ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}"
);

modalContent = modalContent.replace(
  /className=\{`p-4 border rounded-xl cursor-pointer transition-colors \$\{selectedStaff === null \? 'border-gray-800 bg-gray-50' : 'border-gray-200 hover:border-gray-800'\}`\}/g,
  "className={`p-4 cursor-pointer transition-all ${selectedStaff === null ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedStaff === null ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}"
);

// Buttons
modalContent = modalContent.replace(
  /className="w-full bg-gray-900 text-white p-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-colors"/g,
  "className={`${tStyles.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`} style={{ backgroundColor: themeColor || '#111827' }}"
);
modalContent = modalContent.replace(
  /className="w-full bg-gray-900 text-white px-6 py-4 rounded-xl font-medium text-lg hover:bg-black transition-colors"/g,
  "className={tStyles.btnPrimary} style={{ backgroundColor: themeColor || '#111827' }}"
);

// Time slot buttons
modalContent = modalContent.replace(
  /className=\{`p-3 border rounded-xl text-sm transition-colors font-medium \$\{selectedTime === time \? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-900 text-gray-700'\}`\}/g,
  "className={`p-3 text-sm transition-all font-medium ${selectedTime === time ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedTime === time ? { borderColor: themeColor || '#111827', backgroundColor: themeColor || '#111827', color: templateType === 'editorial' || templateType === 'classic' ? '#121412' : '#ffffff' } : {}}"
);

// Inputs
modalContent = modalContent.replace(
  /className="w-full border p-3 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 border-transparent transition-all"/g,
  "className={tStyles.input} style={{ '--tw-ring-color': themeColor } as any}"
);

modalContent = modalContent.replace(
  /className="flex-1 border p-4 text-lg rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 border-transparent transition-all cursor-pointer"/g,
  "className={tStyles.input + ' text-lg'} style={{ '--tw-ring-color': themeColor } as any}"
);

// Close button modal
modalContent = modalContent.replace(
  /<button onClick=\{onClose\} className="absolute top-3 right-4 text-crm-primary bg-white hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-\[13px\]">✕<\/button>/g,
  '<button onClick={onClose} className="absolute top-3 right-4 bg-white hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]" style={{ color: themeColor || "#111827" }}>✕</button>'
);

fs.writeFileSync('components/appointments/BookingModal.tsx', modalContent);

// 2. ClientPage.tsx
let clientContent = fs.readFileSync('app/shops/[slug]/ClientPage.tsx', 'utf8');

clientContent = clientContent.replace(
  /<BookingModal\s*shopId=\{shop\.id\}\s*service=\{selectedService\}\s*onClose=\{\(\) => setSelectedService\(null\)\}\s*shopHours=\{c\.businessHours \|\| \{\}\}\s*\/>/g,
  '<BookingModal shopId={shop.id} service={selectedService} onClose={() => setSelectedService(null)} shopHours={c.businessHours || {}} themeColor={primaryColor} templateType={templateType} />'
);

fs.writeFileSync('app/shops/[slug]/ClientPage.tsx', clientContent);
console.log('Successfully styled BookingModal');