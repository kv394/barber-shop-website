'use client';

import { useState } from 'react';
import ShopSidebarLinks from './ShopSidebarLinks';
import ShopSwitcher from './ShopSwitcher';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';

export default function MobileHeader({ shopId, currentShopName, accessibleShops, userRole, fallbackRedirect }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="md:hidden sticky top-0 z-[100] flex justify-between items-center bg-crm-surface border-b border-crm-border px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-4">
          <button onClick={() => setIsOpen(true)} className="p-3 -ml-3 text-crm-text hover:opacity-70 active:scale-95 transition-all">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div className="flex-1 min-w-0">
             <ShopSwitcher currentShopId={shopId} currentShopName={currentShopName} shops={accessibleShops} userRole={userRole} />
          </div>
        </div>
        <div className="shrink-0">
           <SupabaseAuthButton redirectUrl={fallbackRedirect} />
        </div>
      </header>

      {/* Drawer */}
      <div className={`fixed inset-0 z-[200] flex md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
        <aside 
          className={`relative w-[280px] max-w-[85vw] bg-crm-surface h-full flex flex-col shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} 
          onClick={e => e.stopPropagation()}
        >
          <div className="h-16 flex items-center justify-between px-5 border-b border-crm-border">
            <span className="font-bold text-lg tracking-tight text-crm-text">Menu</span>
            <button onClick={() => setIsOpen(false)} className="p-3 -mr-3 text-crm-muted hover:text-crm-text bg-transparent hover:bg-crm-bg rounded-full transition-colors active:scale-95">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-3" onClick={() => setIsOpen(false)}>
            <ShopSidebarLinks shopId={shopId} userRole={userRole} />
          </nav>
        </aside>
      </div>
    </>
  );
}
