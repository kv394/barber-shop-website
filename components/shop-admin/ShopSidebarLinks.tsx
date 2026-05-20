'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ShopSidebarLinks({ shopId, userRole }: { shopId: string, userRole: string }) {
  const pathname = usePathname();
  const isAll = shopId === 'all';

  const isActive = (path: string, label: string) => {
    if (path === `/shop/${shopId}` && pathname === `/shop/${shopId}`) return true;
    
    if (label === 'Settings & Config') {
      const settingsPrefix = `/shop/${shopId}/settings`;
      const configPrefix = `/shop/${shopId}/config`;
      const configPaths = ['/booking', '/resources', '/forms', '/memberships'];
      const teamPaths = ['/team'];
      
      if (pathname.startsWith(settingsPrefix)) {
        const subPath = pathname.replace(settingsPrefix, '');
        if (teamPaths.some(p => subPath.startsWith(p))) return false;
        return true;
      }
      if (pathname.startsWith(configPrefix)) return true;
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

    if (label === 'Engagement') {
      const engagementPaths = ['/engagement', '/loyalty', '/referrals', '/campaigns', '/gift-cards', '/reviews'];
      if (engagementPaths.some(p => pathname.startsWith(`/shop/${shopId}${p}`))) return true;
      return false;
    }

    if (path !== `/shop/${shopId}` && pathname.startsWith(path)) return true;
    return false;
  };

  const navLink = (href: string, label: string) => {
    const active = isActive(href, label);
    return (
      <Link 
        href={href} 
        className={`block px-3 py-2 rounded-lg text-[14px] font-medium transition-colors ${
          active 
            ? 'bg-[#FFF5F2] text-[#ea580c] font-semibold' 
            : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <div className="mb-6 space-y-1">
        {navLink(`/shop/${shopId}`, 'Dashboard')}
        {!isAll && navLink(`/shop/${shopId}/bookings`, 'Bookings')}
        {!isAll && navLink(`/shop/${shopId}/waitlist`, 'Waitlist')}
        {!isAll && navLink(`/shop/${shopId}/clients`, 'Clients')}
        {userRole === 'SHOP_ADMIN' && !isAll && (
          <>
            {navLink(`/shop/${shopId}/settings/team`, 'Team')}
            {navLink(`/shop/${shopId}/engagement`, 'Engagement')}
            {navLink(`/shop/${shopId}/reports`, 'Reports')}
            {navLink(`/shop/${shopId}/config/services`, 'Settings & Config')}
            {navLink(`/shop/${shopId}/sdk`, 'SDK Docs')}
          </>
        )}
      </div>
      
      {userRole !== 'SHOP_ADMIN' && !isAll && (
        <div className="mb-6 space-y-1">
          <h3 className="px-3 text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-2">My Area</h3>
          {navLink(`/shop/${shopId}/staff`, 'My Schedule')}
          {navLink(`/shop/${shopId}/leave`, 'My Leave')}
          {navLink(`/shop/${shopId}/portfolio`, 'My Portfolio')}
          {navLink(`/shop/${shopId}/reports/commissions`, 'My Earnings')}
          {navLink(`/shop/${shopId}/profile`, 'Profile')}
        </div>
      )}
    </>
  );
}
