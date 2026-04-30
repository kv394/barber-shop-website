"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MyAppointmentsLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const handleSignOut = async () => {
    const { createClient } = await import('@/utils/supabase/client');
    await createClient().auth.signOut();
    if (window.parent && window.parent !== window) {
      window.parent.location.reload();
    } else {
      window.location.href = '/';
    }
  };

  const tabs = [
    { id: '/my-appointments', label: '📅 Appointments' },
    { id: '/my-appointments/profile', label: '👤 Profile' },
    { id: '/my-appointments/loyalty', label: '⭐ Loyalty' },
    { id: '/my-appointments/notifications', label: '🔔 Notifications' },
    { id: '/my-appointments/referrals', label: '🔗 Referrals' },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-crm-bg overflow-hidden text-crm-text">
      {/* Persistent Header */}
      <header className="bg-crm-surface backdrop-blur-md border-b border-crm-border shrink-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
          <div>
            <h1 className="font-bold text-crm-text text-2xl">Account Portal</h1>
            <p className="text-crm-muted text-[13px]">Manage your account & bookings</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleSignOut}
              className="bg-red-500/10 border border-red-500/20 text-red-500 font-bold px-4 py-2 rounded-lg text-[13px] hover:bg-red-500/20 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-0 flex gap-6 overflow-x-auto scrollbar-none border-b border-crm-border">
          {tabs.map(t => {
            const isActive = pathname === t.id;
            return (
              <Link 
                key={t.id} 
                href={t.id}
                className={`text-[13px] px-1 pb-3 whitespace-nowrap transition-colors font-semibold border-b-2 relative top-[1px] ${isActive ? 'text-crm-accent border-brand-gold' : 'text-crm-muted hover:text-crm-text border-transparent'}`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Dynamic Content */}
      <main className="flex-1 w-full bg-crm-bg overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
