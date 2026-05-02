'use client';

import Link from 'next/link';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';

export default function MobileHeader() {
  return (
    <header className="md:hidden sticky top-0 z-[100] flex justify-between items-center bg-crm-surface border-b border-crm-border px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 flex-1 min-w-0 pr-4">
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
  );
}
