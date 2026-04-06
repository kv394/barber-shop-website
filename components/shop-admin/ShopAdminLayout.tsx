import { ShopNav } from '@/components/shop-admin/ShopNav';

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
    <>
      {pageTitle && (
        <p className="text-gray-400 text-sm sm:text-lg -mt-6 sm:-mt-8 mb-6 sm:mb-8">{pageTitle}</p>
      )}

      <ShopNav shopId={shopId} userRole={userRole} activeTab={activeTab} />

      <div className="bg-slate-800/50 p-3 sm:p-4 md:p-8 rounded-xl border border-white/10 shadow-lg">
        {children}
      </div>
    </>
  );
}
