import Link from 'next/link';

export function ShopNav({ shopId, userRole, activeTab }: { shopId: string, userRole: string, activeTab: string }) {
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isShopAdmin = userRole === 'SHOP_ADMIN';
  const isStaff = userRole === 'STAFF';

  // Group definitions
  const staffTabs = ['staff', 'attendance', 'leave', 'team', 'portfolio'];
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

  // Sub-tab: pill style
  const subTabClass = (tabName: string) =>
    activeTab === tabName
      ? "px-3 py-1.5 text-xs sm:text-sm text-brand-gold bg-brand-gold/10 border border-brand-gold/30 rounded-lg font-semibold whitespace-nowrap"
      : "px-3 py-1.5 text-xs sm:text-sm text-gray-400 hover:text-white hover:bg-white/5 border border-transparent rounded-lg transition whitespace-nowrap";

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
            <Link href={`/shop/${shopId}/staff`} className={mainTabClass('staff', effectiveStaffTabs)}>
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
          <Link href={`/shop/${shopId}/portfolio`} className={subTabClass('portfolio')}>
            📸 Portfolio
          </Link>
          {isShopAdmin && (
            <Link href={`/shop/${shopId}/settings/team`} className={subTabClass('team')}>
              👥 Manage Team
            </Link>
          )}
          {isStaff && (
            <Link href={`/shop/${shopId}/reports/commissions`} className={subTabClass('commissions')}>
              💰 My Earnings
            </Link>
          )}
        </div>
      )}

      {/* ── Sub-nav: Reports section ── */}
      {isShopAdmin && isReportsSection && (
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
          <Link href={`/shop/${shopId}/reports/commissions`} className={subTabClass('commissions')}>
            💼 Commissions
          </Link>
        </div>
      )}

      {/* ── Sub-nav: Engagement section ── */}
      {isShopAdmin && isEngagementSection && (
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          <Link href={`/shop/${shopId}/engagement`} className={subTabClass('engagement')}>
            📈 Analytics
          </Link>
          <Link href={`/shop/${shopId}/loyalty`} className={subTabClass('loyalty')}>
            ⭐ Loyalty
          </Link>
          <Link href={`/shop/${shopId}/referrals`} className={subTabClass('referrals')}>
            🔗 Referrals
          </Link>
          <Link href={`/shop/${shopId}/campaigns`} className={subTabClass('campaigns')}>
            📣 Campaigns
          </Link>
          <Link href={`/shop/${shopId}/gift-cards`} className={subTabClass('gift-cards')}>
            🎁 Gift Cards
          </Link>
        </div>
      )}

      {/* ── Sub-nav: Settings section ── */}
      {isShopAdmin && isSettingsSection && (
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          <Link href={`/shop/${shopId}/settings`} className={subTabClass('settings')}>
            🎨 Appearance
          </Link>
          <Link href={`/shop/${shopId}/settings/booking`} className={subTabClass('settings-booking')}>
            📅 Booking & Hours
          </Link>
          <Link href={`/shop/${shopId}/settings/resources`} className={subTabClass('settings-resources')}>
            🪑 Resources
          </Link>
          <Link href={`/shop/${shopId}/settings/forms`} className={subTabClass('settings-forms')}>
            📝 Intake Forms
          </Link>
          <Link href={`/shop/${shopId}/settings/memberships`} className={subTabClass('settings-memberships')}>
            ⭐ Memberships
          </Link>
          <Link href={`/shop/${shopId}/settings/notifications`} className={subTabClass('settings-notifications')}>
            🔔 Notifications
          </Link>
          <Link href={`/shop/${shopId}/settings/commissions`} className={subTabClass('settings-commissions')}>
            💼 Commissions
          </Link>
          <Link href={`/shop/${shopId}/settings/kiosk`} className={subTabClass('settings-kiosk')}>
            📱 Kiosk
          </Link>
          <Link href={`/shop/${shopId}/config/services`} className={subTabClass('services')}>
            💇 Services
          </Link>
          <Link href={`/shop/${shopId}/config/products`} className={subTabClass('products')}>
            🛍️ Products
          </Link>
        </div>
      )}
    </div>
  );
}
