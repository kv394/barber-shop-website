'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ShopSwitcher from './ShopSwitcher';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';

export default function PrimarySidebar({ 
  shopId, 
  userRole, 
  shopName, 
  accessibleShops, 
  fallbackRedirect,
  shopSlug 
}: any) {
  const pathname = usePathname();
  const isSiteAdmin = userRole === 'SITE_ADMIN';
  const isShopAdmin = userRole === 'SHOP_ADMIN';
  const isBoothRenter = userRole === 'BOOTH_RENTER';

  // Common Icons reused
  const icons = {
    home: <><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></>,
    settings: <><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></>,
    heart: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></>,
    clock: <><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></>,
    badge: <><path d="M3 7v4a1 1 0 0 0 1 1h3"></path><path d="M7 7v10"></path><path d="M10 9L12 7l2 2"></path><path d="M12 7v10"></path><path d="M15 11l2-2 2 2"></path><path d="M17 9v8"></path></>,
    idCard: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><circle cx="9" cy="11" r="3"></circle><line x1="14" y1="11" x2="18" y2="11"></line><line x1="14" y1="15" x2="18" y2="15"></line></>
  };

  const navLink = (href: string, label: string, iconPath: React.ReactNode, isActiveCheck: () => boolean) => {
    const active = isActiveCheck();
    return (
      <Link 
        href={href} 
        title={label}
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
          active 
            ? 'bg-crm-primary text-white shadow-md' 
            : 'text-crm-muted hover:text-crm-primary hover:bg-[#FFF5F2]'
        }`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
          {iconPath}
        </svg>
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-16 bg-white/40 backdrop-blur-xl border-r border-white/40 flex-shrink-0 z-20">
      <div className="h-16 flex items-center justify-center border-b border-white/40 relative z-50">
        <ShopSwitcher 
          currentShopId={shopId} 
          currentShopName={shopName} 
          shops={accessibleShops} 
          userRole={userRole} 
          isCollapsed={true} 
        />
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col items-center gap-3 hide-scrollbar">
        {navLink(`/shop/${shopId}`, 'Dashboard', icons.home, () => pathname === `/shop/${shopId}`)}
        
        {isShopAdmin ? (
          <>
            {navLink(`/shop/${shopId}/bookings`, 'Bookings', icons.calendar, () => pathname.startsWith(`/shop/${shopId}/bookings`))}
            {navLink(`/shop/${shopId}/waitlist`, 'Waitlist', icons.clock, () => pathname.startsWith(`/shop/${shopId}/waitlist`))}
            {navLink(`/shop/${shopId}/clients`, 'Clients', icons.users, () => pathname.startsWith(`/shop/${shopId}/clients`))}
            {navLink(`/shop/${shopId}/settings/team`, 'Team', icons.idCard, () => pathname.startsWith(`/shop/${shopId}/settings/team`) || pathname.startsWith(`/shop/${shopId}/portfolio`))}
            {navLink(`/shop/${shopId}/engagement`, 'Engagement', icons.heart, () => ['/engagement', '/loyalty', '/referrals', '/campaigns', '/gift-cards', '/reviews'].some(p => pathname.startsWith(`/shop/${shopId}${p}`)))}
            {navLink(`/shop/${shopId}/reports`, 'Reports', icons.chart, () => ['/reports', '/expenses'].some(p => pathname.startsWith(`/shop/${shopId}${p}`)))}
            {navLink(`/shop/${shopId}/settings`, 'Settings', icons.settings, () => (pathname.startsWith(`/shop/${shopId}/settings`) || pathname.startsWith(`/shop/${shopId}/config`)) && !pathname.startsWith(`/shop/${shopId}/settings/team`))}
          </>
        ) : (
          <>
            {navLink(`/shop/${shopId}/staff`, 'My Schedule', icons.calendar, () => pathname.startsWith(`/shop/${shopId}/staff`))}
            {navLink(`/shop/${shopId}/clients`, 'Clients', icons.users, () => pathname.startsWith(`/shop/${shopId}/clients`))}
            {isBoothRenter && navLink(`/shop/${shopId}/booth-rent`, 'My Rent', icons.badge, () => pathname.startsWith(`/shop/${shopId}/booth-rent`))}
            {isBoothRenter && navLink(`/shop/${shopId}/my-booking-link`, 'My Booking Link', icons.idCard, () => pathname.startsWith(`/shop/${shopId}/my-booking-link`))}
            {navLink(`/shop/${shopId}/profile`, 'Profile', icons.user, () => pathname.startsWith(`/shop/${shopId}/profile`))}
          </>
        )}
      </nav>

      <div className="py-4 flex flex-col items-center border-t border-crm-border relative z-10 group">
        <SupabaseAuthButton redirectUrl={fallbackRedirect} isIconOnly={true} />
        {!isSiteAdmin && (
          <Link
            href={`/shops/${shopSlug}?preview=true`}
            target="_blank"
            className="mt-3 text-crm-muted hover:text-crm-text transition-colors w-10 h-10 flex items-center justify-center rounded-xl hover:bg-crm-surface"
            title="View Public Page"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </Link>
        )}
      </div>
    </aside>
  );
}
