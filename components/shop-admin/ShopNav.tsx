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
    <div className="mb-6 sm:mb-8">
      {/* ── Main Navigation ── */}
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
            <Link href={`/shop/${shopId}/${isShopAdmin ? 'settings/team' : 'staff'}`} className={mainTabClass('staff', effectiveStaffTabs)}>
              Staff
            </Link>
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
  );
}
