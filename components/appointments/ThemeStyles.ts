export function getThemeStyles(templateType?: string) {
  switch (templateType) {
    case 'sporty':
      return {
        cardActive: 'border-2 border-black shadow-sm rounded-none',
        cardInactive: 'border-2 border-crm-border hover:border-black rounded-none',
        btnPrimary: 'w-full bg-black text-white font-black py-4 uppercase tracking-widest rounded-none hover:opacity-90',
        input: 'w-full border-2 border-crm-border p-4 rounded-none focus:outline-none focus:border-black font-bold'
      };
    case 'corporate':
      return {
        cardActive: 'border border-blue-600 shadow-md rounded-lg',
        cardInactive: 'border border-crm-border hover:border-blue-600 rounded-lg',
        btnPrimary: 'w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 shadow-sm',
        input: 'w-full border border-crm-border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'
      };
    case 'noir':
      return {
        cardActive: 'border border-black bg-black text-white rounded-none',
        cardInactive: 'border border-crm-border hover:border-black rounded-none',
        btnPrimary: 'w-full bg-black text-white font-bold uppercase tracking-[0.2em] py-4 rounded-none hover:bg-gray-900',
        input: 'w-full border-b-2 border-crm-border p-3 rounded-none focus:outline-none focus:border-black bg-transparent'
      };
    case 'sunset':
      return {
        cardActive: 'border-2 border-orange-500 shadow-lg rounded-2xl',
        cardInactive: 'border-2 border-transparent bg-crm-bg hover:bg-gray-100 rounded-2xl',
        btnPrimary: 'w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-4 rounded-full shadow-lg hover:shadow-orange-500/30 hover:opacity-90',
        input: 'w-full bg-crm-bg border-2 border-transparent p-4 rounded-2xl focus:outline-none focus:border-orange-500'
      };
    case 'editorial':
      return {
        cardActive: 'border border-[#d4af37] bg-[#fdfbf7] rounded-none',
        cardInactive: 'border border-crm-border hover:border-[#d4af37] rounded-none',
        btnPrimary: 'w-full bg-[#d4af37] text-[#121412] font-semibold uppercase tracking-widest py-4 rounded-none hover:opacity-90',
        input: 'w-full border-b border-crm-border p-3 rounded-none focus:outline-none focus:border-[#d4af37] bg-transparent font-serif'
      };
    case 'classic':
      return {
        cardActive: 'border border-[#2c1e16] bg-[#fdfbf7] rounded-sm',
        cardInactive: 'border border-[#e6d9c6] hover:border-[#2c1e16] bg-crm-surface rounded-sm',
        btnPrimary: 'w-full bg-[#2c1e16] text-[#fdfbf7] font-medium uppercase tracking-wider py-3 rounded-sm hover:bg-[#1a120d]',
        input: 'w-full border border-[#e6d9c6] p-3 rounded-sm focus:outline-none focus:border-[#2c1e16] bg-crm-surface'
      };
    case 'minimal':
      return {
        cardActive: 'border-b-2 border-black rounded-none pb-4',
        cardInactive: 'border-b border-crm-border hover:border-black rounded-none pb-4',
        btnPrimary: 'w-full bg-black text-white font-medium py-3 rounded-none hover:bg-gray-800',
        input: 'w-full border-b border-crm-border p-3 rounded-none focus:outline-none focus:border-black bg-transparent'
      };
    case 'modern':
    default:
      return {
        cardActive: 'border-2 border-gray-800 shadow-sm rounded-xl',
        cardInactive: 'border-2 border-transparent bg-crm-bg hover:border-crm-border rounded-xl',
        btnPrimary: 'w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-md hover:bg-black',
        input: 'w-full border border-crm-border p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 bg-crm-bg'
      };
  }
}

export function hexToRgba(hex: string) {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3 || cleanHex.length === 6) {
    const isShort = cleanHex.length === 3;
    const r = parseInt(isShort ? cleanHex[0] + cleanHex[0] : cleanHex.substring(0, 2), 16);
    const g = parseInt(isShort ? cleanHex[1] + cleanHex[1] : cleanHex.substring(2, 4), 16);
    const b = parseInt(isShort ? cleanHex[2] + cleanHex[2] : cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  }
  return '';
}
