'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export function ShopNav({ shopId, userRole, activeTab }: { shopId: string, userRole: string, activeTab: string }) {
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isShopAdmin = userRole === 'SHOP_ADMIN';
  const isStaff = userRole === 'STAFF';

  // Group definitions
  const staffTabs = ['staff', 'team', 'portfolio'];
  const reportsTabs = ['reports', 'staff-report', 'expenses', 'commissions'];
  const engagementTabs = ['engagement', 'loyalty', 'referrals', 'campaigns', 'gift-cards'];
  const settingsTabs = ['settings', 'appearance', 'contact-settings', 'settings-booking', 'settings-resources', 'settings-forms', 'settings-memberships', 'settings-notifications', 'settings-commissions', 'settings-kiosk', 'setup', 'products', 'services'];

  // For STAFF, commissions page ("My Earnings") lives under the Staff section
  const effectiveStaffTabs = isStaff ? [...staffTabs, 'commissions'] : staffTabs;

  const isStaffSection = effectiveStaffTabs.includes(activeTab);
  const isReportsSection = reportsTabs.includes(activeTab);
  const isEngagementSection = engagementTabs.includes(activeTab);
  const isSettingsSection = settingsTabs.includes(activeTab);

  const scrollRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  // Center the active tab on mount or when activeTab changes
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('[aria-current="page"]');
      if (activeEl) {
        // Smoothly scroll the active element into the center of the viewport
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
    const timer = setTimeout(checkScroll, 150); // check scroll slightly after animation
    return () => clearTimeout(timer);
  }, [activeTab]);

  const scrollBy = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Main tab: active if exact match OR if activeTab is in the group
  const mainTabClass = (tabName: string, groupTabs?: string[]) => {
    const isActive = activeTab === tabName || (groupTabs && groupTabs.includes(activeTab));
    return `flex-1 min-w-max px-4 py-3 text-base md:text-lg font-bold whitespace-nowrap transition-colors border-r border-botanical-border last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-botanical-primary relative flex items-center justify-center ${
      isActive 
        ? "bg-botanical-primary/5 text-botanical-primary shadow-[inset_0_-3px_0_0_#3A5A40]" 
        : "bg-transparent text-botanical-muted hover:bg-gray-50 hover:text-botanical-text"
    }`;
  };

  // ── SUPER_ADMIN: only back link + team assignment ──
  if (isSuperAdmin) {
    return (
      <div className="mb-6 sm:mb-8">
        <nav className="flex w-full overflow-x-auto scrollbar-none bg-white rounded-2xl border border-botanical-border shadow-sm">
          <Link href="/superadmin" className="flex-1 min-w-max px-4 py-3 text-base md:text-lg font-bold text-botanical-muted hover:text-botanical-text hover:bg-gray-50 transition-colors whitespace-nowrap border-r border-botanical-border flex items-center justify-center">
            ← Super Admin
          </Link>
          <Link href={`/shop/${shopId}/settings/team`} className={mainTabClass('team')}>
            👥 Assign Team
          </Link>
        </nav>
      </div>
    );
  }

  // ── SHOP_ADMIN & STAFF navigation ──
  return (
    <>
      {/* Desktop/Tablet Navigation */}
      <div className={`mb-6 sm:mb-8 hidden sm:block`}>
        <nav className="flex w-full overflow-x-auto scrollbar-none bg-white rounded-2xl border border-botanical-border shadow-sm">
          {(isShopAdmin || isStaff) && (
            <>
              <Link href={`/shop/${shopId}`} aria-current={activeTab === 'dashboard' ? 'page' : undefined} className={mainTabClass('dashboard')}>
                Dashboard
              </Link>
              <Link href={`/shop/${shopId}/bookings`} aria-current={activeTab === 'bookings' ? 'page' : undefined} className={mainTabClass('bookings')}>
                Bookings
              </Link>
              <Link href={`/shop/${shopId}/waitlist`} aria-current={activeTab === 'waitlist' ? 'page' : undefined} className={mainTabClass('waitlist')}>
                Waitlist
              </Link>
              <Link href={`/shop/${shopId}/clients`} aria-current={activeTab === 'clients' ? 'page' : undefined} className={mainTabClass('clients')}>
                Clients
              </Link>
              {isShopAdmin ? (
                <Link href={`/shop/${shopId}/settings/team`} aria-current={effectiveStaffTabs.includes(activeTab) || activeTab === 'team' ? 'page' : undefined} className={mainTabClass('staff', effectiveStaffTabs)}>
                  Team
                </Link>
              ) : (
                <>
                  <Link href={`/shop/${shopId}/staff`} aria-current={activeTab === 'staff' ? 'page' : undefined} className={mainTabClass('staff', ['staff'])}>
                    Schedule
                  </Link>
                  <Link href={`/shop/${shopId}/profile`} aria-current={['profile', 'leave', 'portfolio', 'commissions'].includes(activeTab) ? 'page' : undefined} className={mainTabClass('profile', ['profile', 'leave', 'portfolio', 'commissions'])}>
                    Profile
                  </Link>
                </>
              )}
            </>
          )}

          {isShopAdmin && (
            <>
              <Link href={`/shop/${shopId}/engagement`} aria-current={engagementTabs.includes(activeTab) ? 'page' : undefined} className={mainTabClass('engagement', engagementTabs)}>
                Engage
              </Link>
              <Link href={`/shop/${shopId}/reports`} aria-current={reportsTabs.includes(activeTab) ? 'page' : undefined} className={mainTabClass('reports', reportsTabs)}>
                Reports
              </Link>
              <Link href={`/shop/${shopId}/reviews`} aria-current={activeTab === 'reviews' ? 'page' : undefined} className={mainTabClass('reviews')}>
                Reviews
              </Link>
              <Link href={`/shop/${shopId}/settings`} aria-current={settingsTabs.includes(activeTab) ? 'page' : undefined} className={mainTabClass('settings', settingsTabs)}>
                Settings
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* ── Mobile App Bottom Navigation ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-botanical-surface backdrop-blur-xl border-t border-botanical-border z-[100] pb-safe shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.1)]">
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-botanical-surface/90 to-transparent flex items-center justify-start pointer-events-none z-10 pb-safe">
            <button 
              onClick={() => scrollBy(-150)} 
              className="w-6 h-10 flex items-center justify-center text-botanical-primary pointer-events-auto bg-botanical-surface backdrop-blur-md rounded-r-lg border border-l-0 border-botanical-border shadow-md active:bg-gray-100 transition-colors"
              aria-label="Scroll left"
            >
              <span className="text-xl font-black leading-none -mt-0.5">‹</span>
            </button>
          </div>
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-botanical-surface/90 to-transparent flex items-center justify-end pointer-events-none z-10 pb-safe">
            <button 
              onClick={() => scrollBy(150)} 
              className="w-6 h-10 flex items-center justify-center text-botanical-primary pointer-events-auto bg-botanical-surface backdrop-blur-md rounded-l-lg border border-r-0 border-botanical-border shadow-md active:bg-gray-100 transition-colors"
              aria-label="Scroll right"
            >
              <span className="text-xl font-black leading-none -mt-0.5">›</span>
            </button>
          </div>
        )}
        <nav 
          ref={scrollRef as any} 
          onScroll={checkScroll} 
          aria-label="Mobile Bottom Navigation" 
          className="flex items-center h-[5.5rem] px-2 py-2 overflow-x-auto scrollbar-none gap-1 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {(() => {
            const mobileLink = (href: string, tabId: string, icon: string, label: string, isGroupMatch = false) => {
              const isActive = activeTab === tabId || isGroupMatch;
              return (
                <Link href={href} aria-current={isActive ? 'page' : undefined} className={`flex-shrink-0 flex flex-col items-center justify-center w-[72px] h-full rounded-2xl space-y-1 ${isActive ? 'text-botanical-text shadow-sm bg-gray-100 border border-botanical-border' : 'text-botanical-muted hover:text-slate-700 hover:bg-gray-50 transition-colors'}`}>
                  <span className="text-[1.35rem]" aria-hidden="true">{icon}</span>
                  <span className="text-[10px] font-bold tracking-wide text-center leading-tight">{label}</span>
                </Link>
              );
            };

            return (
              <>
                {(isShopAdmin || isStaff) && (
                  <>
                    {mobileLink(`/shop/${shopId}`, 'dashboard', '🏠', 'Home')}
                    {mobileLink(`/shop/${shopId}/bookings`, 'bookings', '📅', 'Bookings')}
                    {mobileLink(`/shop/${shopId}/waitlist`, 'waitlist', '⏳', 'Waitlist')}
                    {mobileLink(`/shop/${shopId}/clients`, 'clients', '👥', 'Clients')}
                    
                    {isShopAdmin ? (
                      mobileLink(`/shop/${shopId}/settings/team`, 'team', '👨‍👩‍👧‍👦', 'Team', effectiveStaffTabs.includes(activeTab) || activeTab === 'team')
                    ) : (
                      <>
                        {mobileLink(`/shop/${shopId}/staff`, 'staff', '🗓️', 'Schedule')}
                        {mobileLink(`/shop/${shopId}/profile`, 'profile', '👤', 'Profile', ['profile', 'leave', 'portfolio', 'commissions'].includes(activeTab))}
                      </>
                    )}
                  </>
                )}

                {isShopAdmin && (
                  <>
                    {mobileLink(`/shop/${shopId}/engagement`, 'engagement', '📢', 'Engage', engagementTabs.includes(activeTab))}
                    {mobileLink(`/shop/${shopId}/reports`, 'reports', '📊', 'Reports', reportsTabs.includes(activeTab))}
                    {mobileLink(`/shop/${shopId}/reviews`, 'reviews', '⭐', 'Reviews')}
                    {mobileLink(`/shop/${shopId}/settings`, 'settings', '⚙️', 'Settings', settingsTabs.includes(activeTab))}
                  </>
                )}
              </>
            );
          })()}
        </nav>
      </div>
    </>
  );
}
