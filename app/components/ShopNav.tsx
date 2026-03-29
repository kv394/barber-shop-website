import Link from 'next/link';

export function ShopNav({ shopId, userRole, activeTab }: { shopId: string, userRole: string, activeTab: string }) {
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isShopAdmin = userRole === 'SHOP_ADMIN';
  const isStaff = userRole === 'STAFF';

  // Group definitions
  const staffTabs = ['staff', 'attendance', 'leave', 'team'];
  const reportsTabs = ['reports', 'staff-report', 'expenses'];

  const isStaffSection = staffTabs.includes(activeTab);
  const isReportsSection = reportsTabs.includes(activeTab);

  // Main tab: active if exact match OR if activeTab is in the group
  const mainTabClass = (tabName: string, groupTabs?: string[]) => {
    const isActive = activeTab === tabName || (groupTabs && groupTabs.includes(activeTab));
    return isActive
      ? "px-3 py-2 text-sm sm:text-base text-brand-gold border-b-2 border-brand-gold whitespace-nowrap font-semibold"
      : "px-3 py-2 text-sm sm:text-base text-gray-400 hover:text-white transition whitespace-nowrap";
  };

  // Sub-tab: pill style
  const subTabClass = (tabName: string) =>
    activeTab === tabName
      ? "px-3 py-1.5 text-xs sm:text-sm text-brand-gold bg-brand-gold/10 border border-brand-gold/30 rounded-lg font-semibold whitespace-nowrap"
      : "px-3 py-1.5 text-xs sm:text-sm text-gray-400 hover:text-white hover:bg-white/5 border border-transparent rounded-lg transition whitespace-nowrap";

  return (
    <div className="mb-6 sm:mb-8">
      {/* ── Main Navigation ── */}
      <div className="flex gap-1 sm:gap-4 border-b border-white/10 pb-3 sm:pb-4 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
        {isSuperAdmin && (
          <Link href="/" className="px-4 py-2 text-gray-400 hover:text-white transition whitespace-nowrap">
            ← Super Admin
          </Link>
        )}

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
            <Link href={`/shop/${shopId}/staff`} className={mainTabClass('staff', staffTabs)}>
              Staff
            </Link>
          </>
        )}

        {isSuperAdmin && (
          <>
            <Link href={`/shop/${shopId}/config`} className={mainTabClass('setup')}>
              Setup & Templates
            </Link>
            <Link href={`/shop/${shopId}/settings`} className={mainTabClass('appearance')}>
              Appearance & Settings
            </Link>
            <Link href={`/shop/${shopId}/settings/team`} className={mainTabClass('team')}>
              Team
            </Link>
          </>
        )}

        {isShopAdmin && !isSuperAdmin && (
          <>
            <Link href={`/shop/${shopId}/reports`} className={mainTabClass('reports', reportsTabs)}>
              Reports
            </Link>
            <Link href={`/shop/${shopId}/settings`} className={mainTabClass('appearance')}>
              Settings
            </Link>
          </>
        )}
      </div>

      {/* ── Sub-nav: Staff section ── */}
      {(isShopAdmin || isStaff) && isStaffSection && (
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          <Link href={`/shop/${shopId}/staff`} className={subTabClass('staff')}>
            📅 Availability
          </Link>
          <Link href={`/shop/${shopId}/attendance`} className={subTabClass('attendance')}>
            🕐 Attendance
          </Link>
          <Link href={`/shop/${shopId}/leave`} className={subTabClass('leave')}>
            🏖️ Leave
          </Link>
          {isShopAdmin && (
            <Link href={`/shop/${shopId}/settings/team`} className={subTabClass('team')}>
              👥 Manage Team
            </Link>
          )}
        </div>
      )}

      {/* ── Sub-nav: Reports section ── */}
      {isShopAdmin && !isSuperAdmin && isReportsSection && (
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          <Link href={`/shop/${shopId}/reports`} className={subTabClass('reports')}>
            💰 Financial
          </Link>
          <Link href={`/shop/${shopId}/reports/staff-working`} className={subTabClass('staff-report')}>
            📊 Staff Performance
          </Link>
          <Link href={`/shop/${shopId}/expenses`} className={subTabClass('expenses')}>
            💸 Expenses
          </Link>
        </div>
      )}
    </div>
  );
}
