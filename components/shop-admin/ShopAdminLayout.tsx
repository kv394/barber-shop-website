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

export default function ShopAdminLayout({
  children,
  pageTitle,
}: ShopAdminLayoutProps) {
  return (
    <div className="pb-20 sm:pb-0">
      {pageTitle && (
        <p className="text-crm-muted mb-6 sm:mb-8 px-3 sm:px-0 mt-2 sm:mt-0 sm:-mt-8 text-base md:text-lg">{pageTitle}</p>
      )}

      <div className="shadow-lg bg-transparent sm:bg-crm-surface p-3 sm:p-4 md:p-8 border-0 sm:border sm:rounded-xl border-crm-border">
        {children}
      </div>
    </div>
  );
}
