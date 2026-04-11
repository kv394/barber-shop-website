import { ShopNav } from '@/components/shop-admin/ShopNav';
import Link from 'next/link';

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

const STAFF_TABS = ['staff', 'team', 'leave', 'portfolio'];
const REPORTS_TABS = ['reports', 'staff-report', 'expenses', 'commissions'];
const ENGAGEMENT_TABS = ['engagement', 'loyalty', 'referrals', 'campaigns', 'gift-cards'];

function SectionSidebar({ activeTab, shopId, section, userRole }: { activeTab: string, shopId: string, section: string, userRole: string }) {
  let navLinks: { href: string, label: string, key: string }[] = [];

  const isStaff = userRole === 'STAFF';
  const isShopAdmin = userRole === 'SHOP_ADMIN';

  if (section === 'settings') {
    navLinks = [
      { href: `/shop/${shopId}/settings`, label: '🎨 Appearance', key: 'settings' },
      { href: `/shop/${shopId}/settings/booking`, label: '📅 Booking & Hours', key: 'settings-booking' },
      { href: `/shop/${shopId}/config/services`, label: '💇 Services', key: 'services' },
      { href: `/shop/${shopId}/config/products`, label: '🛍️ Products', key: 'products' },
      { href: `/shop/${shopId}/settings/resources`, label: '🪑 Resources', key: 'settings-resources' },
      { href: `/shop/${shopId}/settings/forms`, label: '📝 Intake Forms', key: 'settings-forms' },
      { href: `/shop/${shopId}/settings/memberships`, label: '⭐ Memberships', key: 'settings-memberships' },
      { href: `/shop/${shopId}/settings/notifications`, label: '🔔 Notifications', key: 'settings-notifications' },
      { href: `/shop/${shopId}/settings/commissions`, label: '💼 Commissions', key: 'settings-commissions' },
      { href: `/shop/${shopId}/settings/kiosk`, label: '📱 Kiosk', key: 'settings-kiosk' },
      { href: `/shop/${shopId}/settings/billing`, label: '💳 Billing', key: 'settings-billing' },
    ];
  } else if (section === 'staff') {
    if (isShopAdmin) {
      navLinks = [
        { href: `/shop/${shopId}/settings/team`, label: '👥 Team & Availability', key: 'team' },
        { href: `/shop/${shopId}/portfolio`, label: '📸 Portfolio', key: 'portfolio' },
      ];
    } else {
      navLinks = [
        { href: `/shop/${shopId}/staff`, label: '📅 My Schedule', key: 'staff' },
        { href: `/shop/${shopId}/leave`, label: '🏖️ My Leave', key: 'leave' },
        { href: `/shop/${shopId}/portfolio`, label: '📸 My Portfolio', key: 'portfolio' },
        { href: `/shop/${shopId}/reports/commissions`, label: '💰 My Earnings', key: 'commissions' },
      ];
    }
  } else if (section === 'reports') {
    navLinks = [
      { href: `/shop/${shopId}/reports`, label: '💰 Financial', key: 'reports' },
      { href: `/shop/${shopId}/reports/staff-working`, label: '📊 Staff Performance', key: 'staff-report' },
      { href: `/shop/${shopId}/expenses`, label: '💸 Expenses', key: 'expenses' },
      { href: `/shop/${shopId}/reports/commissions`, label: '💼 Commissions', key: 'commissions' },
    ];
  } else if (section === 'engagement') {
    navLinks = [
      { href: `/shop/${shopId}/engagement`, label: '📈 Analytics', key: 'engagement' },
      { href: `/shop/${shopId}/loyalty`, label: '⭐ Loyalty', key: 'loyalty' },
      { href: `/shop/${shopId}/referrals`, label: '🔗 Referrals', key: 'referrals' },
      { href: `/shop/${shopId}/campaigns`, label: '📣 Campaigns', key: 'campaigns' },
      { href: `/shop/${shopId}/gift-cards`, label: '🎁 Gift Cards', key: 'gift-cards' },
    ];
  }

  return (
    <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto scrollbar-none pb-2 md:pb-0">
      {navLinks.map((l) => {
        const isActive = activeTab === l.key || (l.key === 'settings' && activeTab === 'appearance');
        return (
          <Link
            key={l.key}
            href={l.href}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              isActive 
                ? 'bg-brand-gold text-brand-dark shadow-md' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

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
    <div className={isStaff ? 'pb-20 sm:pb-0' : ''}>
      {pageTitle && (
        <p className={`text-gray-400 text-sm sm:text-lg mb-6 sm:mb-8 ${isStaff ? 'px-3 sm:px-0 mt-2 sm:mt-0' : '-mt-6 sm:-mt-8'}`}>{pageTitle}</p>
      )}

      <ShopNav shopId={shopId} userRole={userRole} activeTab={activeTab} />

      {isSplitLayout ? (
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 bg-slate-800/50 rounded-xl border border-white/10 p-2 shadow-lg">
            <SectionSidebar activeTab={activeTab} shopId={shopId} section={activeSection} userRole={userRole} />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 w-full bg-slate-800/50 p-3 sm:p-4 md:p-8 rounded-xl border border-white/10 shadow-lg min-w-0">
            {children}
          </div>
        </div>
      ) : (
        <div className={`shadow-lg ${isStaff ? 'bg-transparent sm:bg-slate-800/50 p-3 sm:p-4 md:p-8 border-0 sm:border sm:rounded-xl border-white/10' : 'bg-slate-800/50 p-3 sm:p-4 md:p-8 rounded-xl border border-white/10'}`}>
          {children}
        </div>
      )}
    </div>
  );
}
