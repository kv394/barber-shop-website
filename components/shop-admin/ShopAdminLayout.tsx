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

function SettingsSidebar({ activeTab, shopId }: { activeTab: string, shopId: string }) {
  const navLinks = [
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
  // We only show the split layout if the user is SHOP_ADMIN, because STAFF 
  // might not have permission to view everything and shouldn't get the full sidebar.
  const isSettingsView = SETTINGS_TABS.includes(activeTab) && userRole === 'SHOP_ADMIN';

  return (
    <>
      {pageTitle && (
        <p className="text-gray-400 text-sm sm:text-lg -mt-6 sm:-mt-8 mb-6 sm:mb-8">{pageTitle}</p>
      )}

      <ShopNav shopId={shopId} userRole={userRole} activeTab={activeTab} />

      {isSettingsView ? (
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 bg-slate-800/50 rounded-xl border border-white/10 p-2 shadow-lg">
            <SettingsSidebar activeTab={activeTab} shopId={shopId} />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 w-full bg-slate-800/50 p-3 sm:p-4 md:p-8 rounded-xl border border-white/10 shadow-lg min-w-0">
            {children}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/50 p-3 sm:p-4 md:p-8 rounded-xl border border-white/10 shadow-lg">
          {children}
        </div>
      )}
    </>
  );
}
