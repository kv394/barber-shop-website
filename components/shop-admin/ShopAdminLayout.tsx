import Link from 'next/link';

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
  tabs,
  activeTab,
}: ShopAdminLayoutProps) {
  const isFirstTabActive = tabs && tabs.length > 0 && tabs[0].id === activeTab;

  return (
    <div className="pb-20 sm:pb-0">
      {pageTitle && (!tabs || tabs.length === 0) && (
        <p className="text-crm-muted mb-6 sm:mb-8 px-3 sm:px-0 mt-2 sm:mt-0 sm:-mt-8 text-[13px]">{pageTitle}</p>
      )}

      {tabs && tabs.length > 0 && (
        <div className="flex items-end justify-between relative z-10 w-full pl-2 mt-2 sm:-mt-6">
          <div className="flex items-end">
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
                        ? "bg-crm-surface text-crm-text font-semibold rounded-t-2xl translate-y-[1px] z-20 shadow-[0_-2px_4px_-1px_rgba(0,0,0,0.05)] pb-4 before:content-[''] before:absolute before:bottom-0 before:-right-4 before:w-4 before:h-4 before:bg-[radial-gradient(circle_at_top_right,transparent_16px,#FFFFFF_16px)]"
                        : "text-crm-muted hover:text-crm-text mb-1 pb-3"
                    } ${isActive && index !== 0 ? "after:content-[''] after:absolute after:bottom-0 after:-left-4 after:w-4 after:h-4 after:bg-[radial-gradient(circle_at_top_left,transparent_16px,#FFFFFF_16px)]" : ""}`}
                  >
                    {tab.label}
                  </Link>
                </div>
              );
            })}
          </div>
          <div className="pb-3 pr-2 flex gap-4 text-crm-muted hover:text-crm-text cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          </div>
        </div>
      )}

      <div className={`shadow-lg bg-transparent sm:bg-crm-surface p-3 sm:p-4 md:p-8 border-0 sm:border ${tabs && tabs.length > 0 ? (isFirstTabActive ? 'sm:rounded-2xl sm:rounded-tl-none' : 'sm:rounded-2xl') : 'sm:rounded-xl'} border-crm-border relative z-0`}>
        {children}
      </div>
    </div>
  );
}
