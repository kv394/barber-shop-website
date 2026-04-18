'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ShopSidebarLinks({ shopId, userRole }: { shopId: string, userRole: string }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === `/shop/${shopId}` && pathname === `/shop/${shopId}`) return true;
    if (path !== `/shop/${shopId}` && pathname.startsWith(path)) return true;
    return false;
  };

  const navLink = (href: string, label: string) => {
    const active = isActive(href);
    return (
      <Link 
        href={href} 
        className={`block px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
          active 
            ? 'bg-orange-50 text-orange-600' 
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
        {navLink(`/shop/${shopId}/bookings`, 'Bookings')}
        {navLink(`/shop/${shopId}/waitlist`, 'Waitlist')}
        {navLink(`/shop/${shopId}/clients`, 'Clients')}
        {userRole === 'SHOP_ADMIN' && (
          <>
            {navLink(`/shop/${shopId}/settings/team`, 'Team')}
            {navLink(`/shop/${shopId}/engagement`, 'Engagement')}
            {navLink(`/shop/${shopId}/reports`, 'Reports')}
            {navLink(`/shop/${shopId}/config/services`, 'Configuration')}
            {navLink(`/shop/${shopId}/settings`, 'Settings')}
          </>
        )}
      </div>
      
      {userRole !== 'SHOP_ADMIN' && (
        <div className="mb-6 space-y-1">
          <h3 className="px-3 text-[10px] font-bold text-crm-muted uppercase tracking-wider mb-2">My Area</h3>
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
