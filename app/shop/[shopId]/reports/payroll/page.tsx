import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import PayrollReportClient from '@/components/reports/PayrollReportClient';

export const dynamic = 'force-dynamic';

export default async function PayrollReportsPage({ params }: { params: Promise<{ shopId: string }> }) {
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
          <h1 className="font-bold text-status-cancelled mb-4 text-2xl">Access Denied</h1>
          <p className="text-crm-muted text-[13px]">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const staffId = data.isStaff ? data.user.id : undefined;

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle={data.isStaff ? 'My Payroll' : 'Automated Payroll & Accounting'}
      shopId={shopId}
      userRole={data.userRole}
    >
      <PayrollReportClient shopId={shopId} staffId={staffId} isPersonalView={data.isStaff} currency={data.shop.currency} />
    </ShopAdminLayout>
  );
}
