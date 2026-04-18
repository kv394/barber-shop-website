'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarNav({ shopId, userRole, shopName, authButton }: { shopId: string, userRole: string, shopName: string, authButton?: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === `/shop/${shopId}` && pathname === `/shop/${shopId}`) return true;
    if (path !== `/shop/${shopId}` && pathname.startsWith(path)) return true;
    return false;
  };

  const navItem = (path: string, label: string, icon: React.ReactNode, badge?: string) => {
    const active = isActive(path);
    return (
      <Link href={path} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors mb-0.5 ${
        active ? 'bg-crm-surface text-crm-text' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
      }`}>
        <div className={active ? 'text-crm-text' : 'text-crm-muted'}>{icon}</div>
        <span className="flex-1">{label}</span>
        {badge && (
          <span className="bg-crm-surface text-crm-muted px-1.5 py-0.5 rounded text-[10px] font-bold">{badge}</span>
        )}
      </Link>
    );
  };

  const sectionHeader = (label: string, iconRight: React.ReactNode) => (
    <div className="flex items-center justify-between px-3 mt-6 mb-2 cursor-pointer group">
      <div className="flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-crm-muted group-hover:text-crm-muted transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        <h3 className="text-[11px] font-semibold text-crm-muted uppercase tracking-wider">{label}</h3>
      </div>
      {iconRight && <div className="text-crm-muted hover:text-crm-muted">{iconRight}</div>}
    </div>
  );

  const plusIcon = <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
  
  const iconDashboard = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const iconBookings = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  const iconWaitlist = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>;
  const iconClients = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
  const iconMessages = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;

  const dotIcon = (color: string) => <div className={`w-2.5 h-2.5 rounded-sm ${color}`}></div>;

  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-crm-border flex-shrink-0 z-10 font-sans">
      {/* Header Logo Area */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-900 rounded-[10px] text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
          C
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-bold text-[14px] text-crm-text leading-tight truncate">{shopName}</span>
          <span className="text-[12px] text-crm-muted leading-tight">Free Workflow</span>
        </div>
        <div className="text-gray-300 ml-auto cursor-pointer hover:text-crm-muted">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-2">
        <div className="relative group">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-crm-muted group-focus-within:text-crm-muted transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full pl-9 pr-8 py-2 bg-[#F9FAFB] border border-transparent rounded-[10px] text-[13px] text-crm-text placeholder-gray-400 focus:bg-white focus:border-crm-border focus:ring-2 focus:ring-gray-100 outline-none transition-all" 
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-crm-muted text-[10px] font-mono bg-white px-1.5 py-0.5 rounded shadow-sm border border-crm-border">/</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 pb-20 scrollbar-none">
        
        {sectionHeader('SALES OPERATIONS', null)}
        <div className="space-y-0.5">
          {navItem(`/shop/${shopId}`, 'Dashboard', iconDashboard)}
          {navItem(`/shop/${shopId}/bookings`, 'Leads', iconBookings)}
          {navItem(`/shop/${shopId}/waitlist`, 'Orders', iconWaitlist)}
          {navItem(`/shop/${shopId}/clients`, 'Customers', iconClients)}
          {navItem(`/shop/${shopId}/messages`, 'Messages', iconMessages, '4')}
        </div>

        {userRole === 'SHOP_ADMIN' ? (
          <>
            {sectionHeader('INSIGHTS & MANAGEMENT', null)}
            <div className="space-y-0.5">
              {navItem(`/shop/${shopId}/settings/team`, 'Team', dotIcon('bg-orange-500'))}
              {navItem(`/shop/${shopId}/reports`, 'Reports', dotIcon('bg-green-500'))}
            </div>

            {sectionHeader('WORKSPACES', plusIcon)}
            <div className="space-y-0.5">
              {navItem(`/shop/${shopId}/engagement`, 'Analytics', dotIcon('bg-orange-500'))}
              {navItem(`/shop/${shopId}/loyalty`, 'Loyalty', dotIcon('bg-yellow-400'))}
              {navItem(`/shop/${shopId}/referrals`, 'Referrals', dotIcon('bg-green-500'))}
              {navItem(`/shop/${shopId}/campaigns`, 'Campaigns', dotIcon('bg-blue-500'))}
              {navItem(`/shop/${shopId}/gift-cards`, 'Gift Cards', dotIcon('bg-purple-500'))}
              {navItem(`/shop/${shopId}/reviews`, 'Reviews', dotIcon('bg-pink-500'))}
            </div>

            {sectionHeader('SUPPORT & SETTINGS', null)}
            <div className="space-y-0.5">
              {navItem(`/shop/${shopId}/settings`, 'Appearance', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>)}
              {navItem(`/shop/${shopId}/settings/booking`, 'Booking & Hours', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>)}
              {navItem(`/shop/${shopId}/config/services`, 'Services', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>)}
              {navItem(`/shop/${shopId}/config/products`, 'Products', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>)}
              {navItem(`/shop/${shopId}/settings/resources`, 'Resources', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>)}
              {navItem(`/shop/${shopId}/settings/forms`, 'Intake Forms', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>)}
              {navItem(`/shop/${shopId}/settings/memberships`, 'Memberships', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>)}
              {navItem(`/shop/${shopId}/settings/notifications`, 'Notifications', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>)}
              {navItem(`/shop/${shopId}/settings/commissions`, 'Commissions', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>)}
              {navItem(`/shop/${shopId}/settings/kiosk`, 'Kiosk', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>)}
              {navItem(`/shop/${shopId}/settings/billing`, 'Billing', <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>)}
            </div>
          </>
        ) : (
          <>
            {sectionHeader('MY AREA', null)}
            <div className="space-y-0.5">
              {navItem(`/shop/${shopId}/staff`, 'My Schedule', dotIcon('bg-orange-500'))}
              {navItem(`/shop/${shopId}/leave`, 'My Leave', dotIcon('bg-yellow-400'))}
              {navItem(`/shop/${shopId}/portfolio`, 'My Portfolio', dotIcon('bg-green-500'))}
              {navItem(`/shop/${shopId}/reports/commissions`, 'My Earnings', dotIcon('bg-blue-500'))}
              {navItem(`/shop/${shopId}/profile`, 'Profile', dotIcon('bg-purple-500'))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}