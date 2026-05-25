import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import BoothRentManager from '@/components/shop-admin/BoothRentManager';

export const dynamic = 'force-dynamic';

export default async function BoothRentPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect('/');

  const data = await getShopLayoutData(user.id, shopId);
  if (!data) return redirect('/');

  const { userRole, shop, shopSlug } = data;
  const isAdmin = userRole === 'SHOP_ADMIN' || userRole === 'SITE_ADMIN';
  const isBoothRenter = userRole === 'BOOTH_RENTER';

  if (!isAdmin && !isBoothRenter) return redirect(`/shop/${shopId}`);

  const resolvedSlug = shopSlug || shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  // Fetch booth renters for admin view
  let renters: any[] = [];
  if (isAdmin) {
    renters = await prisma.user.findMany({
      where: { shopId: shop.id, role: 'BOOTH_RENTER' },
      select: {
        id: true,
        name: true,
        email: true,
        boothRentAmount: true,
        boothRentInterval: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  const title = isBoothRenter ? 'My Rent' : 'Booth Rent';
  const subtitle = isBoothRenter
    ? 'Your booth rent history and outstanding balance'
    : `Manage rent payments for ${renters.length} booth renter${renters.length !== 1 ? 's' : ''}`;

  const reportTabs = [
    { id: 'reports', label: 'Financial', href: `/shop/${shopId}/reports` },
    { id: 'staff-report', label: 'Staff Performance', href: `/shop/${shopId}/reports/staff-working` },
    { id: 'expenses', label: 'Expenses', href: `/shop/${shopId}/expenses` },
    { id: 'commissions', label: 'Commissions', href: `/shop/${shopId}/reports/commissions` },
    { id: 'booth-rent', label: 'Booth Rent', href: `/shop/${shopId}/booth-rent` }
  ];

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={resolvedSlug}
      pageTitle={title}
      shopId={shopId}
      userRole={userRole}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-crm-text">{title}</h1>
            <p className="text-crm-muted text-[13px] mt-1">{subtitle}</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 text-[11px] text-crm-muted bg-crm-surface border border-crm-border px-3 py-2 rounded-lg">
              <span>💡</span>
              <span>Invoices auto-use each renter's configured rate and next billing period.</span>
            </div>
          )}
        </div>

        {/* Summary stats (admin only) */}
        {isAdmin && renters.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-crm-surface border border-crm-border rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-amber-600">{renters.length}</p>
              <p className="text-[11px] font-bold text-crm-muted uppercase tracking-wider mt-1">Booth Renters</p>
            </div>
            <div className="bg-crm-surface border border-crm-border rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-crm-primary">
                ${renters.filter(r => r.boothRentInterval === 'WEEKLY').reduce((s: number, r: any) => s + (r.boothRentAmount || 0), 0).toFixed(0)}
              </p>
              <p className="text-[11px] font-bold text-crm-muted uppercase tracking-wider mt-1">Weekly Rent</p>
            </div>
            <div className="bg-crm-surface border border-crm-border rounded-xl p-4 text-center col-span-2 sm:col-span-1">
              <p className="text-2xl font-black text-crm-primary">
                ${renters.filter(r => r.boothRentInterval === 'MONTHLY').reduce((s: number, r: any) => s + (r.boothRentAmount || 0), 0).toFixed(0)}
              </p>
              <p className="text-[11px] font-bold text-crm-muted uppercase tracking-wider mt-1">Monthly Rent</p>
            </div>
          </div>
        )}

        {/* Main Manager Component */}
        <BoothRentManager
          shopId={shop.id}
          renters={renters}
          isRenterView={isBoothRenter}
          currentUserId={user.id}
        />
      </div>
    </ShopAdminLayout>
  );
}
