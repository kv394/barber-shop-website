import Link from 'next/link';
import GlobalVoiceNoteFAB from './GlobalVoiceNoteFAB';

interface ShopAdminLayoutProps {
  children: React.ReactNode;
  shopName: string;
  shopSlug: string;
  pageTitle?: string;
  shopId: string;
  userRole: string;
  activeTab: string;
  tabs?: { id: string; label: string; href: string }[];
}

export default function ShopAdminLayout({
  children,
  pageTitle,
  shopId,
  userRole,
  tabs,
  activeTab,
}: ShopAdminLayoutProps) {
  
  const unifiedSettingsTabs = [
    { id: 'services', label: 'Services', href: `/shop/${shopId}/config/services` },
    { id: 'products', label: 'Products', href: `/shop/${shopId}/config/products` },
    { id: 'settings-memberships', label: 'Memberships', href: `/shop/${shopId}/settings/memberships` },
    { id: 'settings-booking', label: 'Booking & Hours', href: `/shop/${shopId}/settings/booking` },
    { id: 'settings-resources', label: 'Resources', href: `/shop/${shopId}/settings/resources` },
    { id: 'settings-forms', label: 'Intake Forms', href: `/shop/${shopId}/settings/forms` },
    { id: 'settings', label: 'Appearance', href: `/shop/${shopId}/settings` },
    { id: 'settings-notifications', label: 'Notifications', href: `/shop/${shopId}/settings/notifications` },
    { id: 'settings-commissions', label: 'Commissions', href: `/shop/${shopId}/settings/commissions` },
    { id: 'settings-kiosk', label: 'Kiosk', href: `/shop/${shopId}/settings/kiosk` },
    { id: 'settings-billing', label: 'Billing', href: `/shop/${shopId}/settings/billing` }
  ];

  const isSettingsOrConfig = unifiedSettingsTabs.some(t => t.id === activeTab);
  const finalTabs = isSettingsOrConfig ? unifiedSettingsTabs : tabs;

  const isFirstTabActive = finalTabs && finalTabs.length > 0 && finalTabs[0].id === activeTab;

  return (
    <div className="pb-20 sm:pb-0">
      {finalTabs && finalTabs.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between relative z-10 w-full mt-2 sm:-mt-6 border-b sm:border-b-0 border-crm-border">
          <div className="flex items-end overflow-x-auto hide-scrollbar whitespace-nowrap">
            {finalTabs.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const isPrevActive = index > 0 && finalTabs[index - 1].id === activeTab;
              const showSeparator = index > 0 && !isActive && !isPrevActive;

              return (
                <div key={tab.id} className="flex items-center h-full relative">
                  {showSeparator && (
                    <div className="h-3 w-px bg-gray-300 mx-2 mb-3"></div>
                  )}
                  <Link
                    href={tab.href}
                    className={`text-[13px] transition-colors px-6 py-3 relative ${
                      isActive
                        ? "bg-crm-surface text-crm-text font-semibold rounded-t-2xl translate-y-[1px] z-20 shadow-[0_-2px_4px_-1px_rgba(0,0,0,0.05)] pb-4 sm:border-x sm:border-t sm:border-crm-border before:content-[''] before:absolute before:bottom-0 before:-right-4 before:w-4 before:h-4 before:bg-[radial-gradient(circle_at_top_right,transparent_16px,#FFFFFF_16px)]"
                        : "text-crm-muted hover:text-crm-text mb-1 pb-3"
                    } ${isActive && index !== 0 ? "after:content-[''] after:absolute after:bottom-0 after:-left-4 after:w-4 after:h-4 after:bg-[radial-gradient(circle_at_top_left,transparent_16px,#FFFFFF_16px)]" : ""}`}
                  >
                    {tab.label}
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      )}

      <div className={`shadow-lg bg-transparent sm:bg-crm-surface p-3 sm:p-4 md:p-8 border-0 sm:border ${finalTabs && finalTabs.length > 0 ? (isFirstTabActive ? 'sm:rounded-2xl sm:rounded-tl-none' : 'sm:rounded-2xl') : 'sm:rounded-xl'} border-crm-border relative z-0`}>
        {children}
      </div>

      {/* Global Quick Voice Note FAB */}
      <GlobalVoiceNoteFAB shopId={shopId} />
    </div>
  );
}
