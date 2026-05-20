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
      ? "block px-4 py-3 text-sm font-semibold text-brand-gold bg-brand-gold/10 rounded-xl transition-all shadow-sm border border-brand-gold/20"
      : "block px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent";
  };

  // Sub-tab: pill style -> vertical list style
  const subTabClass = (tabName: string) =>
    activeTab === tabName
      ? "block px-4 py-2 text-xs font-semibold text-brand-gold bg-brand-gold/5 border-l-2 border-brand-gold ml-2 transition-all rounded-r-lg"
      : "block px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 border-l-2 border-transparent ml-2 transition-all rounded-r-lg";

  return (
    <nav className="flex flex-col gap-2">
      {/* Super Admin back link */}
      {isSuperAdmin && (
        <Link href="/" className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-white mb-4 transition-colors">
          ← Back to Super Admin
        </Link>
      )}

      {/* Shop Admin & Staff Links */}
      {(isShopAdmin || isStaff) && (
        <div className="space-y-1">
          <div className="px-4 text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-2 mt-2">Overview</div>
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
          
          <div className="px-4 text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-2 mt-6">Team</div>
          <Link href={`/shop/${shopId}/staff`} className={mainTabClass('staff', staffTabs)}>
            Staff Area
          </Link>
          
          {isStaffSection && (
            <div className="flex flex-col gap-1 mt-1 mb-2">
              <Link href={`/shop/${shopId}/staff`} className={subTabClass('staff')}>
                Availability
              </Link>
              <Link href={`/shop/${shopId}/attendance`} className={subTabClass('attendance')}>
                Attendance
              </Link>
              <Link href={`/shop/${shopId}/leave`} className={subTabClass('leave')}>
                Leave
              </Link>
              {isShopAdmin && (
                <Link href={`/shop/${shopId}/settings/team`} className={subTabClass('team')}>
                  Manage Team
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reports & Settings (Shop Admin only) */}
      {isShopAdmin && !isSuperAdmin && (
        <div className="space-y-1 mt-4">
          <div className="px-4 text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-2 mt-4">Management</div>
          <Link href={`/shop/${shopId}/reports`} className={mainTabClass('reports', reportsTabs)}>
            Reports
          </Link>
          
          {isReportsSection && (
             <div className="flex flex-col gap-1 mt-1 mb-2">
               <Link href={`/shop/${shopId}/reports`} className={subTabClass('reports')}>Financial</Link>
               <Link href={`/shop/${shopId}/reports/staff-working`} className={subTabClass('staff-report')}>Staff Performance</Link>
               <Link href={`/shop/${shopId}/expenses`} className={subTabClass('expenses')}>Expenses</Link>
             </div>
          )}

          <Link href={`/shop/${shopId}/settings`} className={mainTabClass('appearance')}>
            Settings
          </Link>
        </div>
      )}

      {/* Super Admin Links */}
      {isSuperAdmin && (
        <div className="space-y-1 mt-4">
          <div className="px-4 text-[10px] font-bold tracking-widest text-gray-600 uppercase mb-2 mt-4">Super Admin</div>
          <Link href={`/shop/${shopId}/config`} className={mainTabClass('setup')}>
            Setup & Templates
          </Link>
          <Link href={`/shop/${shopId}/settings`} className={mainTabClass('appearance')}>
            Appearance & Settings
          </Link>
          <Link href={`/shop/${shopId}/settings/team`} className={mainTabClass('team')}>
            Team
          </Link>
        </div>
      )}
    </nav>
  );
}
