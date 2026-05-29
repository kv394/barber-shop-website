export function getWizardThemeStyles(templateType?: string) {
  switch (templateType) {
    case 'sporty':
      return {
        cardActive: 'border-2 shadow-sm rounded-none font-bold',
        cardInactive: 'border-2 border-crm-border hover:border-gray-800 rounded-none',
        btnPrimary: 'w-full text-white font-black py-4 uppercase tracking-widest rounded-none hover:opacity-90 transition-opacity',
        btnSecondary: 'w-full bg-gray-200 text-crm-text font-black py-4 uppercase tracking-widest rounded-none hover:bg-gray-300 transition-colors',
        input: 'w-full border-2 border-crm-border p-4 rounded-none focus:outline-none focus:border-black font-bold',
        title: 'text-xl font-black uppercase italic'
      };
    case 'corporate':
      return {
        cardActive: 'border shadow-md rounded-lg',
        cardInactive: 'border border-crm-border hover:border-crm-border hover:shadow-sm rounded-lg',
        btnPrimary: 'w-full text-white font-medium py-3 rounded-lg shadow-sm hover:opacity-90 transition-opacity',
        btnSecondary: 'w-full bg-gray-100 text-crm-muted font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors',
        input: 'w-full border border-crm-border p-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent',
        title: 'text-lg font-bold text-crm-text'
      };
    case 'noir':
      return {
        cardActive: 'border border-black bg-black text-white rounded-none',
        cardInactive: 'border border-crm-border hover:border-black rounded-none',
        btnPrimary: 'w-full bg-black text-white font-bold uppercase tracking-[0.2em] py-4 rounded-none hover:bg-gray-900 transition-colors',
        btnSecondary: 'w-full border border-black text-crm-text font-bold uppercase tracking-[0.2em] py-4 rounded-none hover:bg-gray-100 transition-colors',
        input: 'w-full border-b-2 border-crm-border p-3 rounded-none focus:outline-none focus:border-black bg-transparent',
        title: 'text-lg font-bold uppercase tracking-widest'
      };
    case 'sunset':
    case 'vibrant':
      return {
        cardActive: 'border-2 shadow-lg rounded-2xl',
        cardInactive: 'border-2 border-transparent bg-crm-bg hover:bg-gray-100 rounded-2xl',
        btnPrimary: 'w-full text-white font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-opacity',
        btnSecondary: 'w-full bg-gray-100 text-crm-text font-bold py-4 rounded-2xl hover:bg-gray-200 transition-colors',
        input: 'w-full bg-crm-bg border-2 border-transparent p-4 rounded-2xl focus:outline-none',
        title: 'text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500'
      };
    case 'editorial':
      return {
        cardActive: 'border border-[#d4af37] bg-[#fdfbf7] rounded-none',
        cardInactive: 'border border-crm-border hover:border-[#d4af37] rounded-none',
        btnPrimary: 'w-full text-[#121412] font-semibold uppercase tracking-widest py-4 rounded-none hover:opacity-90 transition-opacity',
        btnSecondary: 'w-full border border-crm-border text-crm-muted font-semibold uppercase tracking-widest py-4 rounded-none hover:bg-crm-bg transition-colors',
        input: 'w-full border-b border-crm-border p-3 rounded-none focus:outline-none focus:border-[#d4af37] bg-transparent font-serif',
        title: 'text-xl font-serif italic text-crm-text'
      };
    case 'classic':
      return {
        cardActive: 'border border-[#2c1e16] bg-[#fdfbf7] rounded-sm',
        cardInactive: 'border border-[#e6d9c6] hover:border-[#2c1e16] bg-crm-surface rounded-sm',
        btnPrimary: 'w-full text-[#fdfbf7] font-medium uppercase tracking-wider py-3 rounded-sm hover:opacity-90 transition-opacity',
        btnSecondary: 'w-full border border-[#e6d9c6] text-[#5a4634] font-medium uppercase tracking-wider py-3 rounded-sm hover:bg-[#fdfbf7] transition-colors',
        input: 'w-full border border-[#e6d9c6] p-3 rounded-sm focus:outline-none focus:border-[#2c1e16] bg-crm-surface',
        title: 'text-lg font-serif font-bold text-[#2c1e16]'
      };
    case 'minimal':
      return {
        cardActive: 'border-b-2 border-black rounded-none pb-4',
        cardInactive: 'border-b border-crm-border hover:border-black rounded-none pb-4',
        btnPrimary: 'w-full bg-black text-white font-medium py-3 rounded-none hover:bg-gray-800 transition-colors',
        btnSecondary: 'w-full border border-crm-border text-crm-muted font-medium py-3 rounded-none hover:bg-crm-bg transition-colors',
        input: 'w-full border-b border-crm-border p-3 rounded-none focus:outline-none focus:border-black bg-transparent',
        title: 'text-lg font-light tracking-tight text-crm-text'
      };
    case 'modern':
    default:
      return {
        cardActive: 'border-2 shadow-sm rounded-xl',
        cardInactive: 'border-2 border-transparent bg-crm-bg hover:border-crm-border rounded-xl',
        btnPrimary: 'w-full text-white font-bold py-4 rounded-xl shadow-md hover:opacity-90 transition-opacity',
        btnSecondary: 'w-full bg-gray-100 text-crm-muted font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors',
        input: 'w-full border border-crm-border p-4 rounded-xl focus:outline-none focus:ring-2 bg-crm-bg',
        title: 'text-lg font-bold text-crm-text'
      };
  }
}
