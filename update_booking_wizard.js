const fs = require('fs');
const file = 'components/booking/BookingWizard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update component signature
content = content.replace(
  'export default function BookingWizard({ shopId }: { shopId: string }) {',
  'export default function BookingWizard({ shopId, themeColor, templateType }: { shopId: string, themeColor?: string, templateType?: string }) {'
);

// 2. Read client-side search params if server didn't pass them
// Actually, `themeColor` and `templateType` are passed from server now. Let's just provide a fallback in useEffect if they are empty, but since they are passed from the iframe src, they will be there.

// 3. Find hardcoded colors and replace them with dynamic ones.
// Main areas:
// border-gray-800 bg-gray-50 -> style={{ borderColor: themeColor, backgroundColor: themeColor ? `${themeColor}10` : '' }}
// bg-gray-900 text-white -> style={{ backgroundColor: themeColor || '#111827', color: '#fff' }}
// focus:ring-gray-900 -> style={{ outlineColor: themeColor }}
// text-gray-900 -> style={{ color: themeColor }}
// border-gray-900 -> style={{ borderColor: themeColor }}

// Let's use a getThemeStyles approach like ClientPage to make the wizard match the template!
const styleHelper = `
  const getThemeStyles = () => {
    switch (templateType) {
      case 'sporty':
        return {
          cardActive: 'border-2 shadow-sm rounded-none font-bold',
          cardInactive: 'border-2 border-gray-200 hover:border-gray-800 rounded-none',
          btnPrimary: 'w-full text-white font-black py-4 uppercase tracking-widest rounded-none hover:opacity-90 transition-opacity',
          btnSecondary: 'w-full bg-gray-200 text-black font-black py-4 uppercase tracking-widest rounded-none hover:bg-gray-300 transition-colors',
          input: 'w-full border-2 border-gray-200 p-4 rounded-none focus:outline-none focus:border-black font-bold',
          title: 'text-xl font-black uppercase italic'
        };
      case 'corporate':
        return {
          cardActive: 'border shadow-md rounded-lg',
          cardInactive: 'border border-gray-200 hover:border-gray-300 hover:shadow-sm rounded-lg',
          btnPrimary: 'w-full text-white font-medium py-3 rounded-lg shadow-sm hover:opacity-90 transition-opacity',
          btnSecondary: 'w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors',
          input: 'w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent',
          title: 'text-lg font-bold text-gray-900'
        };
      case 'noir':
        return {
          cardActive: 'border border-black bg-black text-white rounded-none',
          cardInactive: 'border border-gray-300 hover:border-black rounded-none',
          btnPrimary: 'w-full bg-black text-white font-bold uppercase tracking-[0.2em] py-4 rounded-none hover:bg-gray-900 transition-colors',
          btnSecondary: 'w-full border border-black text-black font-bold uppercase tracking-[0.2em] py-4 rounded-none hover:bg-gray-100 transition-colors',
          input: 'w-full border-b-2 border-gray-300 p-3 rounded-none focus:outline-none focus:border-black bg-transparent',
          title: 'text-lg font-bold uppercase tracking-widest'
        };
      case 'sunset':
      case 'vibrant':
        return {
          cardActive: 'border-2 shadow-lg rounded-2xl',
          cardInactive: 'border-2 border-transparent bg-gray-50 hover:bg-gray-100 rounded-2xl',
          btnPrimary: 'w-full text-white font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-opacity',
          btnSecondary: 'w-full bg-gray-100 text-gray-800 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-colors',
          input: 'w-full bg-gray-50 border-2 border-transparent p-4 rounded-2xl focus:outline-none',
          title: 'text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500'
        };
      case 'editorial':
        return {
          cardActive: 'border border-[#d4af37] bg-[#fdfbf7] rounded-none',
          cardInactive: 'border border-gray-200 hover:border-[#d4af37] rounded-none',
          btnPrimary: 'w-full text-[#121412] font-semibold uppercase tracking-widest py-4 rounded-none hover:opacity-90 transition-opacity',
          btnSecondary: 'w-full border border-gray-300 text-gray-600 font-semibold uppercase tracking-widest py-4 rounded-none hover:bg-gray-50 transition-colors',
          input: 'w-full border-b border-gray-300 p-3 rounded-none focus:outline-none focus:border-[#d4af37] bg-transparent font-serif',
          title: 'text-xl font-serif italic text-gray-900'
        };
      case 'classic':
        return {
          cardActive: 'border border-[#2c1e16] bg-[#fdfbf7] rounded-sm',
          cardInactive: 'border border-[#e6d9c6] hover:border-[#2c1e16] bg-white rounded-sm',
          btnPrimary: 'w-full text-[#fdfbf7] font-medium uppercase tracking-wider py-3 rounded-sm hover:opacity-90 transition-opacity',
          btnSecondary: 'w-full border border-[#e6d9c6] text-[#5a4634] font-medium uppercase tracking-wider py-3 rounded-sm hover:bg-[#fdfbf7] transition-colors',
          input: 'w-full border border-[#e6d9c6] p-3 rounded-sm focus:outline-none focus:border-[#2c1e16] bg-white',
          title: 'text-lg font-serif font-bold text-[#2c1e16]'
        };
      case 'minimal':
        return {
          cardActive: 'border-b-2 border-black rounded-none pb-4',
          cardInactive: 'border-b border-gray-200 hover:border-black rounded-none pb-4',
          btnPrimary: 'w-full bg-black text-white font-medium py-3 rounded-none hover:bg-gray-800 transition-colors',
          btnSecondary: 'w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-none hover:bg-gray-50 transition-colors',
          input: 'w-full border-b border-gray-200 p-3 rounded-none focus:outline-none focus:border-black bg-transparent',
          title: 'text-lg font-light tracking-tight text-gray-900'
        };
      case 'modern':
      default:
        return {
          cardActive: 'border-2 shadow-sm rounded-xl',
          cardInactive: 'border-2 border-transparent bg-gray-50 hover:border-gray-200 rounded-xl',
          btnPrimary: 'w-full text-white font-bold py-4 rounded-xl shadow-md hover:opacity-90 transition-opacity',
          btnSecondary: 'w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors',
          input: 'w-full border border-gray-200 p-4 rounded-xl focus:outline-none focus:ring-2 bg-gray-50',
          title: 'text-lg font-bold text-gray-900'
        };
    }
  };

  const tStyles = getThemeStyles();
  const hexToRgba = (hex) => {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',0.1)';
    }
    return '';
  }
  const activeBg = themeColor ? hexToRgba(themeColor) : '#f9fafb';
`;

content = content.replace(
  'const handleNext = () => setStep(s => s + 1);',
  styleHelper + '\n  const handleNext = () => setStep(s => s + 1);'
);

// We need to replace the card styles
content = content.replace(
  /className=\{`p-4 border rounded-xl cursor-pointer transition-colors \$\{selectedService\?\.id === s\.id \? 'border-gray-800 bg-gray-50' : 'border-gray-200 hover:border-gray-800'\}`\}/g,
  "className={`p-4 cursor-pointer transition-all ${selectedService?.id === s.id ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedService?.id === s.id ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}"
);

content = content.replace(
  /className=\{`p-4 border rounded-xl cursor-pointer transition-colors \$\{selectedStaff === null \? 'border-gray-800 bg-gray-50' : 'border-gray-200 hover:border-gray-800'\}`\}/g,
  "className={`p-4 cursor-pointer transition-all ${selectedStaff === null ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedStaff === null ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}"
);

content = content.replace(
  /className=\{`p-4 border rounded-xl cursor-pointer transition-colors \$\{selectedStaff\?\.id === st\.id \? 'border-gray-800 bg-gray-50' : 'border-gray-200 hover:border-gray-800'\}`\}/g,
  "className={`p-4 cursor-pointer transition-all ${selectedStaff?.id === st.id ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedStaff?.id === st.id ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}"
);

// Buttons
content = content.replace(
  /className="w-full bg-gray-900 text-white px-6 py-3 rounded-xl font-medium text-lg hover:bg-black transition-colors"/g,
  "className={tStyles.btnPrimary} style={{ backgroundColor: themeColor || '#111827' }}"
);

content = content.replace(
  /className="w-full bg-gray-900 text-white p-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-colors"/g,
  "className={tStyles.btnPrimary} style={{ backgroundColor: themeColor || '#111827' }}"
);

// Time slot buttons
content = content.replace(
  /className=\{`p-3 border rounded-xl text-sm transition-colors font-medium \$\{selectedTime === time \? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-900 text-gray-700'\}`\}/g,
  "className={`p-3 text-sm transition-all font-medium ${selectedTime === time ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedTime === time ? { borderColor: themeColor || '#111827', backgroundColor: themeColor || '#111827', color: templateType === 'editorial' ? '#121412' : '#ffffff' } : {}}"
);

// Inputs
content = content.replace(
  /className="w-full border p-3 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 border-transparent transition-all"/g,
  "className={tStyles.input} style={{ '--tw-ring-color': themeColor } as any}"
);

content = content.replace(
  /className="flex-1 border p-4 text-lg rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 border-transparent transition-all cursor-pointer"/g,
  "className={tStyles.input + ' text-lg'} style={{ '--tw-ring-color': themeColor } as any}"
);

// Header title
content = content.replace(
  /<h2 className="text-lg font-semibold text-gray-800">/g,
  '<h2 className={tStyles.title}>'
);

fs.writeFileSync(file, content);
console.log('Successfully styled BookingWizard');
