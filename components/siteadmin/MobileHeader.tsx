'use client';

import { useState } from 'react';
import Link from 'next/link';
import SiteAdminSidebarLinks from './SiteAdminSidebarLinks';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';

export default function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="md:hidden sticky top-0 z-[100] flex justify-between items-center bg-crm-surface border-b border-crm-border px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-4">
          <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-crm-text">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div className="flex-1 min-w-0">
             <Link href="/siteadmin" className="font-bold text-xl tracking-tight flex items-center gap-2">
               <span className="text-crm-text">Barber</span><span className="text-crm-primary">SaaS</span>
             </Link>
          </div>
        </div>
        <div className="shrink-0">
           <SupabaseAuthButton redirectUrl="/" />
        </div>
      </header>

      {/* Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex bg-black/50 md:hidden" onClick={() => setIsOpen(false)}>
          <aside className="w-64 bg-crm-surface h-full flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="h-16 flex items-center justify-between px-4 border-b border-crm-border">
              <span className="font-bold text-lg">Admin Menu</span>
              <button onClick={() => setIsOpen(false)} className="p-2 text-crm-text">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3" onClick={() => setIsOpen(false)}>
              <SiteAdminSidebarLinks />
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
