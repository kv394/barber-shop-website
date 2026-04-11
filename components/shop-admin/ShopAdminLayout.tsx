import { ShopNav } from '@/components/shop-admin/ShopNav';
import Link from 'next/link';
import SectionSidebar from '@/components/shop-admin/SectionSidebar';

interface ShopAdminLayoutProps {
  children: React.ReactNode;
  shopName: string;
  shopSlug: string;
  pageTitle: string;
  shopId: string;
  userRole: string;
  activeTab: string;
}

const SETTINGS_TABS = [
  'settings', 'appearance', 'contact-settings', 'settings-booking', 
  'settings-resources', 'settings-forms', 'settings-memberships', 
  'settings-notifications', 'settings-commissions', 'settings-kiosk', 
  'setup', 'products', 'services', 'settings-billing'
];

const STAFF_TABS = ['staff', 'team', 'leave', 'portfolio', 'profile', 'chat'];
const REPORTS_TABS = ['reports', 'staff-report', 'expenses', 'commissions'];
const ENGAGEMENT_TABS = ['engagement', 'loyalty', 'referrals', 'campaigns', 'gift-cards'];

export default function ShopAdminLayout({
  children,
  pageTitle,
  shopId,
  userRole,
  activeTab,
}: ShopAdminLayoutProps) {
  
  const isSettingsView = SETTINGS_TABS.includes(activeTab) && userRole === 'SHOP_ADMIN';
  
  const effectiveStaffTabs = userRole === 'STAFF' ? [...STAFF_TABS, 'commissions'] : STAFF_TABS;
  const isStaffView = effectiveStaffTabs.includes(activeTab) && (userRole === 'SHOP_ADMIN' || userRole === 'STAFF');
  const isReportsView = REPORTS_TABS.includes(activeTab) && userRole === 'SHOP_ADMIN';
  const isEngagementView = ENGAGEMENT_TABS.includes(activeTab) && userRole === 'SHOP_ADMIN';

  // Completely removed the sidebar for the Staff section since everything is on one page now
  const isSplitLayout = isSettingsView || isReportsView || isEngagementView;

  let activeSection = '';
  if (isSettingsView) activeSection = 'settings';
  else if (isStaffView) activeSection = 'staff';
  else if (isReportsView) activeSection = 'reports';
  else if (isEngagementView) activeSection = 'engagement';

  const isStaff = userRole === 'STAFF';

  return (
    <div className="pb-20 sm:pb-0">
      {pageTitle && (
        <p className="text-botanical-muted text-sm sm:text-lg mb-6 sm:mb-8 px-3 sm:px-0 mt-2 sm:mt-0 sm:-mt-8">{pageTitle}</p>
      )}

      <ShopNav shopId={shopId} userRole={userRole} activeTab={activeTab} />

      {isSplitLayout ? (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 bg-white rounded-xl border-2 border-b-[6px] border-botanical-border p-2 md:p-0 shadow-lg md:shadow-sm relative overflow-hidden">
            <SectionSidebar activeTab={activeTab} shopId={shopId} section={activeSection} userRole={userRole} />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 w-full bg-botanical-surface p-3 sm:p-4 md:p-8 rounded-xl border-2 border-b-[6px] border-botanical-border shadow-lg min-w-0">
            {children}
          </div>
        </div>
      ) : (
        <div className="shadow-lg bg-transparent sm:bg-botanical-surface p-3 sm:p-4 md:p-8 border-0 sm:border sm:rounded-xl border-botanical-border">
          {children}
        </div>
      )}
    </div>
  );
}
