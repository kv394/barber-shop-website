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
      ? "px-5 py-2.5 text-sm sm:text-base text-whitebg-botanical-primary whitespace-nowrap font-black rounded-xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)] transform translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-botanical-primary"
      : "px-5 py-2.5 text-sm sm:text-base text-botanical-muted bg-botanical-surface hover:text-botanical-text hover:bg-botanical-surface transition-all duration-150 whitespace-nowrap font-bold rounded-xl border-b-[4px] border-slate-950 hover:border-b-[6px] hover:-translate-y-0.5 active:border-b-[0px] active:translate-y-1 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400";
  };

  // ── SUPER_ADMIN: only back link + team assignment ──
  if (isSuperAdmin) {
    return (
      <div className="mb-6 sm:mb-8">
        <div className="flex gap-1 sm:gap-4 border-b border-botanical-border pb-3 sm:pb-4 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          <Link href="/superadmin" className="px-4 py-2 text-botanical-muted hover:text-botanical-text transition whitespace-nowrap">
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
        <div className="flex gap-1 sm:gap-4 border-b border-botanical-border pb-3 sm:pb-4 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
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
        </div>
      </div>

      {/* ── Mobile App Bottom Navigation ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-botanical-surface backdrop-blur-xl border-t border-botanical-border z-[100] pb-safe shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.1)]">
        <nav aria-label="Mobile Bottom Navigation" className="flex justify-around items-center h-20 px-2 pb-2 pt-1">
          <Link href={`/shop/${shopId}`} aria-current={activeTab === 'dashboard' ? 'page' : undefined} className={`flex flex-col items-center justify-center w-full h-full mx-1 rounded-2xl space-y-1 ${activeTab === 'dashboard' ? 'text-botanical-text bg-white shadow-[0_4px_0_0_#cbd5e1] border border-botanical-border transform -translate-y-1' : 'text-botanical-muted hover:text-slate-700 hover:bg-gray-50 transition-colors'}`}>
            <span className="text-3xl" aria-hidden="true">🏠</span>
            <span className="text-xs sm:text-sm font-bold tracking-wide">Home</span>
          </Link>
          <Link href={`/shop/${shopId}/bookings`} aria-current={activeTab === 'bookings' ? 'page' : undefined} className={`flex flex-col items-center justify-center w-full h-full mx-1 rounded-2xl space-y-1 ${activeTab === 'bookings' ? 'text-botanical-text bg-white shadow-[0_4px_0_0_#cbd5e1] border border-botanical-border transform -translate-y-1' : 'text-botanical-muted hover:text-slate-700 hover:bg-gray-50 transition-colors'}`}>
            <span className="text-3xl" aria-hidden="true">📅</span>
            <span className="text-xs sm:text-sm font-bold tracking-wide">Bookings</span>
          </Link>
          {isStaff ? (
            <Link href={`/shop/${shopId}/staff`} aria-current={activeTab === 'staff' ? 'page' : undefined} className={`flex flex-col items-center justify-center w-full h-full mx-1 rounded-2xl space-y-1 ${activeTab === 'staff' ? 'text-botanical-text bg-white shadow-[0_4px_0_0_#cbd5e1] border border-botanical-border transform -translate-y-1' : 'text-botanical-muted hover:text-slate-700 hover:bg-gray-50 transition-colors'}`}>
              <span className="text-3xl" aria-hidden="true">🗓️</span>
              <span className="text-xs sm:text-sm font-bold tracking-wide">Schedule</span>
            </Link>
          ) : (
            <Link href={`/shop/${shopId}/settings/team`} aria-current={activeTab === 'team' || effectiveStaffTabs.includes(activeTab) ? 'page' : undefined} className={`flex flex-col items-center justify-center w-full h-full mx-1 rounded-2xl space-y-1 ${activeTab === 'team' || effectiveStaffTabs.includes(activeTab) ? 'text-botanical-text bg-white shadow-[0_4px_0_0_#cbd5e1] border border-botanical-border transform -translate-y-1' : 'text-botanical-muted hover:text-slate-700 hover:bg-gray-50 transition-colors'}`}>
              <span className="text-3xl" aria-hidden="true">👥</span>
              <span className="text-xs sm:text-sm font-bold tracking-wide">Team</span>
            </Link>
          )}
          {isStaff ? (
            <Link href={`/shop/${shopId}/clients`} aria-current={activeTab === 'clients' ? 'page' : undefined} className={`flex flex-col items-center justify-center w-full h-full mx-1 rounded-2xl space-y-1 ${activeTab === 'clients' ? 'text-botanical-text bg-white shadow-[0_4px_0_0_#cbd5e1] border border-botanical-border transform -translate-y-1' : 'text-botanical-muted hover:text-slate-700 hover:bg-gray-50 transition-colors'}`}>
              <span className="text-3xl" aria-hidden="true">👥</span>
              <span className="text-xs sm:text-sm font-bold tracking-wide">Clients</span>
            </Link>
          ) : (
            <Link href={`/shop/${shopId}/reports`} aria-current={isReportsSection ? 'page' : undefined} className={`flex flex-col items-center justify-center w-full h-full mx-1 rounded-2xl space-y-1 ${isReportsSection ? 'text-botanical-text bg-white shadow-[0_4px_0_0_#cbd5e1] border border-botanical-border transform -translate-y-1' : 'text-botanical-muted hover:text-slate-700 hover:bg-gray-50 transition-colors'}`}>
              <span className="text-3xl" aria-hidden="true">📊</span>
              <span className="text-xs sm:text-sm font-bold tracking-wide">Reports</span>
            </Link>
          )}
          {isStaff ? (
            <Link href={`/shop/${shopId}/profile`} aria-current={['profile', 'leave', 'portfolio', 'commissions'].includes(activeTab) ? 'page' : undefined} className={`flex flex-col items-center justify-center w-full h-full mx-1 rounded-2xl space-y-1 ${['profile', 'leave', 'portfolio', 'commissions'].includes(activeTab) ? 'text-botanical-text bg-white shadow-[0_4px_0_0_#cbd5e1] border border-botanical-border transform -translate-y-1' : 'text-botanical-muted hover:text-slate-700 hover:bg-gray-50 transition-colors'}`}>
              <span className="text-3xl" aria-hidden="true">👤</span>
              <span className="text-xs sm:text-sm font-bold tracking-wide">Profile</span>
            </Link>
          ) : (
            <Link href={`/shop/${shopId}/settings`} aria-current={isSettingsSection ? 'page' : undefined} className={`flex flex-col items-center justify-center w-full h-full mx-1 rounded-2xl space-y-1 ${isSettingsSection ? 'text-botanical-text bg-white shadow-[0_4px_0_0_#cbd5e1] border border-botanical-border transform -translate-y-1' : 'text-botanical-muted hover:text-slate-700 hover:bg-gray-50 transition-colors'}`}>
              <span className="text-3xl" aria-hidden="true">⚙️</span>
              <span className="text-xs sm:text-sm font-bold tracking-wide">Settings</span>
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}
