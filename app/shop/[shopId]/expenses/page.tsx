import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import ExpensesClient from '@/components/reports/ExpensesClient';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return redirect('/');

  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSuperAdmin && !data.isShopAdmin)) {
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-botanical-muted">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle="Expense Tracking"
      shopId={shopId}
      userRole={data.userRole}
      activeTab="expenses"
    >
      <ExpensesClient shopId={shopId} />
    </ShopAdminLayout>
  );
}

