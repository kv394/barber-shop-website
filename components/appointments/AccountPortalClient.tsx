"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AccountPortalClient() {
  const [activeTab, setActiveTab] = useState('profile');
  
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['appointments', 'profile', 'loyalty', 'notifications', 'referrals'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-crm-bg overflow-hidden text-crm-text">
      <header className="bg-crm-surface backdrop-blur-md border-b border-crm-border shrink-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
          <div>
            <h1 className="font-bold text-crm-text text-2xl">Account Portal</h1>
            <p className="text-crm-muted text-[13px]">Manage your account & bookings</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={async () => {
                const { createClient } = await import('@/utils/supabase/client');
                await createClient().auth.signOut();
                if (window.parent) window.parent.location.reload();
                else window.location.href = '/';
              }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 font-bold px-4 py-2 rounded-lg text-[13px] hover:bg-red-500/20 transition-colors"
            >
              Sign Out
            </button>
            <Link
              href="/shops"
              className="bg-crm-primary text-white font-bold px-4 py-2 rounded-lg text-[13px] hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors"
            >
              Book New
            </Link>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-0 flex gap-6 overflow-x-auto scrollbar-none border-b border-crm-border">
          {[
            { id: 'appointments', label: '📅 Appointments' },
            { id: 'profile', label: '👤 Profile' },
            { id: 'loyalty', label: '⭐ Loyalty' },
            { id: 'notifications', label: '🔔 Notifications' },
            { id: 'referrals', label: '🔗 Referrals' },
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => {
                setActiveTab(t.id);
                window.location.hash = t.id;
              }}
              className={`text-[13px] px-1 pb-3 whitespace-nowrap transition-colors font-semibold border-b-2 relative top-[1px] ${activeTab === t.id ? 'text-crm-accent border-brand-gold' : 'text-crm-muted hover:text-crm-text border-transparent'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-4xl mx-auto">
        <iframe src={`/my-appointments/${activeTab === 'appointments' ? '' : activeTab}?embed=true`} className="w-full h-full min-h-[700px] border-none" />
      </div>
    </div>
  );
}
