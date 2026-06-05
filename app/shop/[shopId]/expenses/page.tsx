import Image from 'next/image';
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
 if (!data || (!data.isSiteAdmin && !data.isShopAdmin)) {
 return (
 <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
 <div className="text-center">
 <h1 className="font-bold text-status-cancelled mb-4 text-2xl font-bold">Access Denied</h1>
 <p className="text-crm-muted text-[13px]">You do not have permission to view this page.</p>
 </div>
 </div>
 );
 }

 const reportTabs = [
 { id: 'reports', label: 'Financial', href: `/shop/${shopId}/reports` },
 { id: 'staff-report', label: 'Staff Performance', href: `/shop/${shopId}/reports/staff-working` },
 { id: 'expenses', label: 'Expenses', href: `/shop/${shopId}/expenses` },
 { id: 'commissions', label: 'Commissions', href: `/shop/${shopId}/reports/commissions` },
 { id: 'booth-rent', label: 'Booth Rent', href: `/shop/${shopId}/booth-rent` }
 ];

 return (
 <ShopAdminLayout
 shopName={data.shop.name}
 shopSlug={data.shopSlug}
 pageTitle="Expense Tracking"
 shopId={shopId}
 userRole={data.userRole}
 >
 <ExpensesClient shopId={shopId} currency={data.shop.currency} />
 </ShopAdminLayout>
 );
}

