'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ShopMobileBottomNav({ shopId, userRole }: { shopId: string, userRole: string }) {
  const pathname = usePathname();
  const isAll = shopId === 'all';

  const navLink = (href: string, label: string, iconPath: React.ReactNode, isExact = false) => {
    const active = isExact ? pathname === href : pathname.startsWith(href);

    return (
      <Link 
        href={href} 
        className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${
          active 
            ? 'text-crm-primary' 
            : 'text-crm-muted hover:text-crm-text'
        }`}
      >
        <div className={`mb-1 ${active ? 'scale-110 transition-transform' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
            {iconPath}
          </svg>
        </div>
        <span className="text-[10px] font-medium tracking-tight truncate w-full text-center px-1">{label}</span>
      </Link>
    );
  };

  if (isAll) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-crm-surface border-t border-crm-border flex items-center justify-around z-[2000] pb-[env(safe-area-inset-bottom)]">
      {navLink(`/shop/${shopId}`, 'Home', <><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></>, true)}
      
      {userRole === 'SHOP_ADMIN' ? (
        <>
          {navLink(`/shop/${shopId}/bookings`, 'Bookings', <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></>)}
          {navLink(`/shop/${shopId}/clients`, 'Clients', <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></>)}
          {navLink(`/shop/${shopId}/settings`, 'Settings', <><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></>)}
        </>
      ) : (
        <>
          {navLink(`/shop/${shopId}/staff`, 'Schedule', <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></>)}
          {navLink(`/shop/${shopId}/clients`, 'Clients', <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></>)}
          {navLink(`/shop/${shopId}/profile`, 'Profile', <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></>)}
        </>
      )}
    </div>
  );
}