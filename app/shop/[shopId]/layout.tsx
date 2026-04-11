import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import Link from 'next/link';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';

export const dynamic = 'force-dynamic';

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  
  // Need to get the shop slug for redirects
  const basicShop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true }
  });
  
  const shopSlug = basicShop ? basicShop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : '';
  const fallbackRedirect = shopSlug ? `/shops/${shopSlug}` : '/';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  
  if (!userId) {
      return redirect(`/sign-in?redirect_url=${encodeURIComponent(`/shop/${shopId}`)}`);
  }

  const data = await getShopLayoutData(userId, shopId);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-400">You do not have permission to view this page.</p>
          <Link href={fallbackRedirect} className="inline-block mt-8 text-brand-gold hover:underline">Return to Shop</Link>
        </div>
      </div>
    );
  }

  const isSuperAdmin = data.isSuperAdmin;
  const isStaff = data.userRole === 'STAFF';

  // SUPER_ADMIN is a site admin — only allowed on the team assignment page
  if (isSuperAdmin) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';
    if (pathname && !pathname.includes('/settings/team')) {
      return redirect(`/shop/${shopId}/settings/team`);
    }
  }

  return (
    <main className={`flex min-h-screen flex-col items-center bg-slate-900 text-white ${isStaff ? 'px-0 py-0 sm:p-4 md:p-8 lg:p-12 pb-24 sm:pb-4' : 'px-3 py-4 sm:p-4 md:p-8 lg:p-12'}`}>
      <div className={`w-full max-w-7xl ${isStaff ? 'px-3 sm:px-0 pt-4 sm:pt-0' : ''}`}>
        <header className={`flex justify-between items-center mb-6 sm:mb-8 ${isStaff ? 'hidden sm:flex' : ''}`}>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">
            {isSuperAdmin ? (
              <Link href="/superadmin">
                <span className="text-white">Barber</span>
                <span className="text-brand-gold">SaaS</span>
              </Link>
            ) : (
              <Link href={`/shop/${shopId}`}>
                <span className="text-white">{data.shop.name}</span>
                <span className="text-brand-gold"> Portal</span>
              </Link>
            )}
          </h1>
          <SupabaseAuthButton redirectUrl={isSuperAdmin ? '/' : fallbackRedirect} />
        </header>

        {isSuperAdmin && (
            <header className="mb-8 sm:mb-12 flex flex-col sm:flex-row justify-between sm:items-end border-b border-white/10 pb-4 sm:pb-6 gap-3 sm:gap-4">
            <div className="min-w-0">
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-brand-gold mb-1 sm:mb-2 truncate">{data.shop.name}</h2>
            </div>
            </header>
        )}
        
        {!isSuperAdmin && (
            <header className={`mb-8 sm:mb-12 flex flex-col sm:flex-row justify-between sm:items-end border-b border-white/10 pb-4 sm:pb-6 gap-3 sm:gap-4 ${isStaff ? 'hidden sm:flex' : ''}`}>
            <div className="min-w-0">
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-brand-gold mb-1 sm:mb-2 truncate">Management Dashboard</h2>
            </div>
            <div className="flex shrink-0">
                <Link
                href={`/shops/${data.shopSlug}`}
                target="_blank"
                className="bg-brand-gold text-brand-dark hover:bg-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-xs sm:text-sm font-semibold whitespace-nowrap"
                >
                View Public Page ↗
                </Link>
            </div>
            </header>
        )}

        {children}
      </div>
    </main>
  );
}
