import Link from 'next/link';

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

  // Main tab: active if exact match OR if activeTab is in the group
  const mainTabClass = (tabName: string, groupTabs?: string[]) => {
    const isActive = activeTab === tabName || (groupTabs && groupTabs.includes(activeTab));
    return isActive
      ? "px-3 py-2 text-sm sm:text-base text-brand-gold border-b-2 border-brand-gold whitespace-nowrap font-semibold"
      : "px-3 py-2 text-sm sm:text-base text-gray-400 hover:text-white transition whitespace-nowrap";
  };

  // ── SUPER_ADMIN: only back link + team assignment ──
  if (isSuperAdmin) {
    return (
      <div className="mb-6 sm:mb-8">
        <div className="flex gap-1 sm:gap-4 border-b border-white/10 pb-3 sm:pb-4 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          <Link href="/superadmin" className="px-4 py-2 text-gray-400 hover:text-white transition whitespace-nowrap">
            ← Super Admin
          </Link>
          <Link href={`/shop/${shopId}/settings/team`} className={mainTabClass('team')}>
            👥 Assign Team
          </Link>
        </div>
      </div>
    );
  }

  // ── SHOP_ADMIN & STAFF navigation ──
  return (
    <>
      {/* Desktop/Tablet Navigation */}
      <div className={`mb-6 sm:mb-8 hidden sm:block`}>
        <div className="flex gap-1 sm:gap-4 border-b border-white/10 pb-3 sm:pb-4 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          {(isShopAdmin || isStaff) && (
            <>
              <Link href={`/shop/${shopId}`} className={mainTabClass('dashboard')}>
                Dashboard
              </Link>
              <Link href={`/shop/${shopId}/bookings`} className={mainTabClass('bookings')}>
                Bookings
              </Link>
              <Link href={`/shop/${shopId}/waitlist`} className={mainTabClass('waitlist')}>
                Waitlist
              </Link>
              <Link href={`/shop/${shopId}/clients`} className={mainTabClass('clients')}>
                Clients
              </Link>
              {isShopAdmin ? (
                <Link href={`/shop/${shopId}/settings/team`} className={mainTabClass('staff', effectiveStaffTabs)}>
                  Team
                </Link>
              ) : (
                <>
                  <Link href={`/shop/${shopId}/staff`} className={mainTabClass('staff', ['staff'])}>
                    Schedule
                  </Link>
                  <Link href={`/shop/${shopId}/profile`} className={mainTabClass('profile', ['profile', 'leave', 'portfolio', 'commissions'])}>
                    Profile
                  </Link>
                </>
              )}
            </>
          )}

          {isShopAdmin && (
            <>
              <Link href={`/shop/${shopId}/engagement`} className={mainTabClass('engagement', engagementTabs)}>
                Engage
              </Link>
              <Link href={`/shop/${shopId}/reports`} className={mainTabClass('reports', reportsTabs)}>
                Reports
              </Link>
              <Link href={`/shop/${shopId}/reviews`} className={mainTabClass('reviews')}>
                Reviews
              </Link>
              <Link href={`/shop/${shopId}/settings`} className={mainTabClass('settings', settingsTabs)}>
                Settings
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile App Bottom Navigation ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-xl border-t border-white/20 z-50 pb-safe shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center h-20 px-2 pb-2">
          <Link href={`/shop/${shopId}`} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'dashboard' ? 'text-brand-gold drop-shadow-md' : 'text-gray-400 hover:text-white'}`}>
            <span className="text-2xl">🏠</span>
            <span className="text-[11px] sm:text-xs font-bold tracking-wide">Home</span>
          </Link>
          <Link href={`/shop/${shopId}/bookings`} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'bookings' ? 'text-brand-gold drop-shadow-md' : 'text-gray-400 hover:text-white'}`}>
            <span className="text-2xl">📅</span>
            <span className="text-[11px] sm:text-xs font-bold tracking-wide">Bookings</span>
          </Link>
          {isStaff ? (
            <Link href={`/shop/${shopId}/staff`} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'staff' ? 'text-brand-gold drop-shadow-md' : 'text-gray-400 hover:text-white'}`}>
              <span className="text-2xl">🗓️</span>
              <span className="text-[11px] sm:text-xs font-bold tracking-wide">Schedule</span>
            </Link>
          ) : (
            <Link href={`/shop/${shopId}/settings/team`} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'team' || effectiveStaffTabs.includes(activeTab) ? 'text-brand-gold drop-shadow-md' : 'text-gray-400 hover:text-white'}`}>
              <span className="text-2xl">👥</span>
              <span className="text-[11px] sm:text-xs font-bold tracking-wide">Team</span>
            </Link>
          )}
          {isStaff ? (
            <Link href={`/shop/${shopId}/clients`} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'clients' ? 'text-brand-gold drop-shadow-md' : 'text-gray-400 hover:text-white'}`}>
              <span className="text-2xl">👥</span>
              <span className="text-[11px] sm:text-xs font-bold tracking-wide">Clients</span>
            </Link>
          ) : (
            <Link href={`/shop/${shopId}/reports`} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isReportsSection ? 'text-brand-gold drop-shadow-md' : 'text-gray-400 hover:text-white'}`}>
              <span className="text-2xl">📊</span>
              <span className="text-[11px] sm:text-xs font-bold tracking-wide">Reports</span>
            </Link>
          )}
          {isStaff ? (
            <Link href={`/shop/${shopId}/profile`} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${['profile', 'leave', 'portfolio', 'commissions'].includes(activeTab) ? 'text-brand-gold drop-shadow-md' : 'text-gray-400 hover:text-white'}`}>
              <span className="text-2xl">👤</span>
              <span className="text-[11px] sm:text-xs font-bold tracking-wide">Profile</span>
            </Link>
          ) : (
            <Link href={`/shop/${shopId}/settings`} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isSettingsSection ? 'text-brand-gold drop-shadow-md' : 'text-gray-400 hover:text-white'}`}>
              <span className="text-2xl">⚙️</span>
              <span className="text-[11px] sm:text-xs font-bold tracking-wide">Settings</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
