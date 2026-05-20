import { ShopNav } from './ShopNav';

interface ShopAdminLayoutProps {
  children: React.ReactNode;
  shopName: string;
  shopSlug: string;
  pageTitle: string;
  shopId: string;
  userRole: string;
  activeTab: string;
}

export default function ShopAdminLayout({
  children,
  pageTitle,
  shopId,
  userRole,
  activeTab,
}: ShopAdminLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 shrink-0">
        <ShopNav shopId={shopId} userRole={userRole} activeTab={activeTab} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {pageTitle && (
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 tracking-tight">{pageTitle}</h2>
        )}
        <div className="bg-slate-800/40 backdrop-blur-md p-4 sm:p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
