"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

function LayoutContent({ children }: { children: React.ReactNode }) {
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const themeColor = searchParams.get('themeColor') || undefined;
 
 const handleSignOut = async () => {
 window.location.href = '/logout';
 };

 const tabs = [
 { id: '/my-appointments', label: 'Appointments', icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></> },
 { id: '/my-appointments/profile', label: 'Profile', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></> },
 { id: '/my-appointments/loyalty', label: 'Loyalty', icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></> },
 { id: '/my-appointments/notifications', label: 'Alerts', icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></> },
 { id: '/my-appointments/referrals', label: 'Refer', icon: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></> },
 ];

 return (
 <div className="flex flex-col h-[100dvh] bg-crm-bg overflow-hidden text-crm-text" style={themeColor ? { '--crm-primary': themeColor } as any : {}}>
 {/* Persistent Header */}
 <header className="bg-crm-surface backdrop-blur-md border-b border-crm-border shrink-0 z-20 relative">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center pr-12 sm:pr-16">
 <div>
 <h1 className="font-bold text-crm-text text-xl md:text-2xl">Account Portal</h1>
 <p className="text-crm-muted text-[12px] md:text-[13px]">Manage your account & bookings</p>
 </div>
 <div className="flex gap-2 items-center">
 <button
 onClick={handleSignOut}
 className="bg-red-500/10 border border-red-500/20 text-red-500 font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[12px] md:text-[13px] hover:bg-red-500/20 transition-colors"
 >
 Sign Out
 </button>
 </div>
 </div>
 
 {/* Desktop Tabs */}
 <div className="hidden md:flex max-w-4xl mx-auto px-4 sm:px-6 pb-0 gap-6 overflow-x-auto scrollbar-none border-b border-crm-border">
 {tabs.map(t => {
 const isActive = pathname === t.id;
 return (
 <Link 
 key={t.id} 
 href={t.id + (themeColor ? `?themeColor=${encodeURIComponent(themeColor)}` : '')}
 className={`flex items-center gap-2 text-[13px] px-1 pb-3 whitespace-nowrap transition-colors font-semibold border-b-2 relative top-[1px] ${isActive ? 'text-crm-text' : 'text-crm-muted hover:text-crm-text border-transparent'}`}
 style={isActive ? { borderColor: themeColor || '#eab308', color: themeColor || '#eab308' } : {}}
 >
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 {t.icon}
 </svg>
 {t.label}
 </Link>
 );
 })}
 </div>
 </header>

 {/* Dynamic Content */}
 <main className="flex-1 w-full bg-crm-bg overflow-y-auto pb-24 md:pb-0">
 {children}
 </main>

 {/* Mobile Bottom Navigation */}
 <div className="md:hidden fixed bottom-0 left-0 right-0 bg-crm-surface border-t border-crm-border flex items-center justify-around overflow-x-auto hide-scrollbar scrollbar-none z-[2000] pb-[env(safe-area-inset-bottom)]">
 {tabs.map(t => {
 const isActive = pathname === t.id;
 return (
 <Link 
 key={t.id} 
 href={t.id + (themeColor ? `?themeColor=${encodeURIComponent(themeColor)}` : '')}
 className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${
 isActive 
 ? 'text-crm-primary' 
 : 'text-crm-muted hover:text-crm-text'
 }`}
 style={isActive && themeColor ? { color: themeColor } : {}}
 >
 <div className={`mb-1 ${isActive ? 'scale-110 transition-transform' : ''}`}>
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
 {t.icon}
 </svg>
 </div>
 <span className="text-[10px] font-medium tracking-tight truncate w-full text-center px-1">{t.label}</span>
 </Link>
 );
 })}
 </div>
 </div>
 );
}

export default function MyAppointmentsLayoutClient({ children }: { children: React.ReactNode }) {
 return (
 <Suspense fallback={<div className="h-[100dvh] bg-crm-bg flex justify-center items-center">Loading...</div>}>
 <LayoutContent>{children}</LayoutContent>
 </Suspense>
 );
}
