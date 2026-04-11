import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import CommissionReportClient, { CommissionReportClientProps as _CommissionReportClientProps } from '@/components/reports/CommissionReportClient';

export const dynamic = 'force-dynamic';

export default async function CommissionReportsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return redirect('/');

  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);

  if (!data) {
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-botanical-muted">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // STAFF sees only their own earnings; admins see all staff
  const staffId = data.isStaff ? data.user.id : undefined;

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle={data.isStaff ? 'My Earnings' : 'Commission & Payroll Reports'}
      shopId={shopId}
      userRole={data.userRole}
      activeTab="commissions"
    >
      <CommissionReportClient shopId={shopId} staffId={staffId} isPersonalView={data.isStaff} />
    </ShopAdminLayout>
  );
}

