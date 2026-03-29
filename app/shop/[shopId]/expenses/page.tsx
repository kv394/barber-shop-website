import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';
import ExpensesClient from '@/components/ExpensesClient';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage({ params }: { params: { shopId: string } }) {
  const { userId } = auth();
  if (!userId) return redirect('/');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = user?.role === 'SUPER_ADMIN' || (user?.role === 'SHOP_ADMIN' && user?.shopId === params.shopId);

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-400">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const shop = await prisma.shop.findUnique({ where: { id: params.shopId } });
  if (!shop) return redirect('/');

  const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle="Expense Tracking"
      shopId={params.shopId}
      userRole={user!.role}
      activeTab="expenses"
    >
      <ExpensesClient shopId={params.shopId} />
    </ShopAdminLayout>
  );
}

