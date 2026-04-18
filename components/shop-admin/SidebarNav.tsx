'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarNav({ shopId, userRole, shopName, authButton }: { shopId: string, userRole: string, shopName: string, authButton?: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string, label: string) => {
    if (path === `/shop/${shopId}` && pathname === `/shop/${shopId}`) return true;
    
    if (label === 'Settings') {
      const settingsPrefix = `/shop/${shopId}/settings`;
      const configPaths = ['/booking', '/resources', '/forms', '/memberships'];
      const teamPaths = ['/team'];
      
      if (pathname.startsWith(settingsPrefix)) {
        const subPath = pathname.replace(settingsPrefix, '');
        if (configPaths.some(p => subPath.startsWith(p))) return false;
        if (teamPaths.some(p => subPath.startsWith(p))) return false;
        return true;
      }
      return false;
    }

    if (label === 'Configuration') {
      if (pathname.startsWith(`/shop/${shopId}/config`)) return true;
      const configPaths = ['/settings/booking', '/settings/resources', '/settings/forms', '/settings/memberships'];
      if (configPaths.some(p => pathname.startsWith(`/shop/${shopId}${p}`))) return true;
      return false;
    }

    if (label === 'Team') {
      if (pathname.startsWith(`/shop/${shopId}/settings/team`)) return true;
      if (pathname.startsWith(`/shop/${shopId}/portfolio`)) return true;
      return false;
    }

    if (label === 'Reports') {
      if (pathname.startsWith(`/shop/${shopId}/reports`)) return true;
      if (pathname.startsWith(`/shop/${shopId}/expenses`)) return true;
      return false;
    }

    if (label === 'Analytics' || label === 'Engagement') {
      const engagementPaths = ['/engagement', '/loyalty', '/referrals', '/campaigns', '/gift-cards', '/reviews'];
      if (engagementPaths.some(p => pathname.startsWith(`/shop/${shopId}${p}`))) return true;
      return false;
    }

    if (path !== `/shop/${shopId}` && pathname.startsWith(path)) return true;
    return false;
  };

  const navItem = (path: string, label: string, icon: React.ReactNode, badge?: string) => {
    const active = isActive(path, label);
    return (
      <Link href={path} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors mb-0.5 ${
        active ? 'bg-[#FFF5F2] text-[#ea580c] font-semibold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
      }`}>
        <div className={active ? 'text-[#ea580c]' : 'text-crm-muted'}>{icon}</div>
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
              {navItem(`/shop/${shopId}/config/services`, 'Configuration', dotIcon('bg-blue-500'))}
              {navItem(`/shop/${shopId}/settings`, 'Settings', dotIcon('bg-purple-500'))}
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