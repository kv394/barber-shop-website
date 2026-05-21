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
    { id: 'services', label: 'Services', href: `/shop/${shopId}/config/services`, category: 'Shop Setup' },
    { id: 'products', label: 'Products', href: `/shop/${shopId}/config/products`, category: 'Shop Setup' },
    { id: 'settings-booking', label: 'Booking & Hours', href: `/shop/${shopId}/settings/booking`, category: 'Shop Setup' },
    { id: 'settings-resources', label: 'Resources', href: `/shop/${shopId}/settings/resources`, category: 'Shop Setup' },
    
    { id: 'settings', label: 'Appearance', href: `/shop/${shopId}/settings`, category: 'Client Experience' },
    { id: 'settings-memberships', label: 'Memberships', href: `/shop/${shopId}/settings/memberships`, category: 'Client Experience' },
    { id: 'settings-forms', label: 'Intake Forms', href: `/shop/${shopId}/settings/forms`, category: 'Client Experience' },
    
    { id: 'settings-commissions', label: 'Commissions', href: `/shop/${shopId}/settings/commissions`, category: 'Business Operations' },
    { id: 'settings-notifications', label: 'Notifications', href: `/shop/${shopId}/settings/notifications`, category: 'Business Operations' },
    { id: 'settings-kiosk', label: 'Kiosk', href: `/shop/${shopId}/settings/kiosk`, category: 'Business Operations' },
    { id: 'settings-billing', label: 'Billing', href: `/shop/${shopId}/settings/billing`, category: 'Business Operations' }
  ];

  const isSettingsOrConfig = unifiedSettingsTabs.some(t => t.id === activeTab);
  const categories = ['Shop Setup', 'Client Experience', 'Business Operations'];

  return (
    <div className="pb-20 sm:pb-0 h-full flex flex-col">
      {/* Show horizontal tabs ONLY if we are NOT in Settings (e.g. Clients page with 'List' vs 'Segments' tabs) */}
      {!isSettingsOrConfig && tabs && tabs.length > 0 && (
        <div className="hidden sm:flex sm:flex-row sm:items-end justify-between relative z-10 w-full mt-2 sm:-mt-6 border-b sm:border-b-0 border-crm-border">
          <div className="flex items-end overflow-x-auto hide-scrollbar whitespace-nowrap">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const isPrevActive = index > 0 && tabs[index - 1].id === activeTab;
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

      {isSettingsOrConfig ? (
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 flex-1 h-full">
          {/* Settings Navigation Sidebar */}
          <div className="w-full md:w-56 lg:w-64 shrink-0 overflow-y-auto hidden sm:block h-full pr-2">
            <h2 className="font-serif text-2xl font-bold text-crm-text mb-6">Settings</h2>
            <div className="space-y-8 pb-10">
              {categories.map(category => (
                <div key={category}>
                  <h3 className="text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-3 px-3">{category}</h3>
                  <div className="space-y-1">
                    {unifiedSettingsTabs.filter(t => t.category === category).map(tab => {
                      const isActive = activeTab === tab.id;
                      return (
                        <Link
                          key={tab.id}
                          href={tab.href}
                          className={`flex items-center px-3 py-2 text-[14px] rounded-lg transition-colors ${
                            isActive 
                              ? 'bg-crm-primary/10 text-crm-primary font-semibold' 
                              : 'text-crm-text hover:bg-crm-surface hover:text-crm-primary'
                          }`}
                        >
                          {tab.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Settings Content Area */}
          <div className="flex-1 bg-crm-surface shadow-lg border border-crm-border rounded-xl sm:rounded-2xl p-4 md:p-8 min-w-0">
            {children}
          </div>
        </div>
      ) : (
        /* Regular Content Area (Non-Settings) */
        <div className={`shadow-lg bg-crm-surface p-4 md:p-8 border sm:border ${tabs && tabs.length > 0 && tabs[0].id === activeTab ? 'rounded-xl sm:rounded-2xl sm:rounded-tl-none' : 'rounded-xl sm:rounded-2xl'} border-crm-border relative z-0`}>
          {children}
        </div>
      )}

      {/* Global Quick Voice Note FAB */}
      <GlobalVoiceNoteFAB shopId={shopId} />
    </div>
  );
}
