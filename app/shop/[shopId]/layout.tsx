import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import Link from 'next/link';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import GlobalChatWidget from '@/components/shop-admin/GlobalChatWidget';

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
    // If data is null, they either don't belong to this shop or they are a CLIENT.
    // Let's check their actual role.
    const dbUser = await prisma.user.findFirst({
        where: { OR: [{ id: userId }, { email: user?.email || '' }] },
        select: { role: true, shop: { select: { name: true } } }
    });

    if (dbUser?.role === 'CLIENT') {
        const computedSlug = dbUser.shop?.name ? dbUser.shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : null;
        const targetSlug = computedSlug || shopSlug;
        if (targetSlug) {
            redirect(`/shops/${targetSlug}`);
        } else {
            redirect('/');
        }
    }

    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-botanical-muted">You do not have permission to view this page.</p>
          <Link href={fallbackRedirect} className="inline-block mt-8 text-botanical-accent hover:underline">Return to Shop</Link>
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
    <>
      {/* Mobile Header (All Roles except Super Admin) */}
      {!isSuperAdmin && (
        <header className="sm:hidden fixed top-0 left-0 right-0 z-[100] flex justify-between items-center bg-botanical-surface border-b border-botanical-border px-4 py-3 shadow-sm">
          <div className="flex flex-col min-w-0 pr-4">
             <span className="text-botanical-text font-black text-lg leading-tight truncate">{data.shop.name}</span>
             <span className="text-botanical-muted text-[10px] uppercase font-bold tracking-wider leading-tight mt-0.5">{data.userRole.replace('_', ' ')}</span>
          </div>
          <div className="shrink-0">
             <SupabaseAuthButton redirectUrl={fallbackRedirect} />
          </div>
        </header>
      )}

      <main className="flex h-[100dvh] overflow-y-auto overflow-x-hidden flex-col items-center bg-botanical-bg text-botanical-text px-0 sm:p-4 md:p-8 lg:p-12 pb-24 sm:pb-4 pt-[64px] sm:pt-4 md:pt-8 lg:pt-12 scroll-smooth">
        <div className="w-full max-w-7xl px-3 sm:px-0 pt-4 sm:pt-0">
        <header className="hidden sm:flex justify-between items-center mb-6 sm:mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">
            {isSuperAdmin ? (
              <Link href="/superadmin">
                <span className="text-botanical-text">Barber</span>
                <span className="text-botanical-accent">SaaS</span>
              </Link>
            ) : (
              <Link href={`/shop/${shopId}`}>
                <span className="text-botanical-text">{data.shop.name}</span>
                <span className="text-botanical-accent"> Portal</span>
              </Link>
            )}
          </h1>
          <SupabaseAuthButton redirectUrl={isSuperAdmin ? '/' : fallbackRedirect} />
        </header>

        {isSuperAdmin && (
            <header className="mb-8 sm:mb-12 flex flex-col sm:flex-row justify-between sm:items-end border-b border-botanical-border pb-4 sm:pb-6 gap-3 sm:gap-4">
            <div className="min-w-0">
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-botanical-accent mb-1 sm:mb-2 truncate">{data.shop.name}</h2>
            </div>
            </header>
        )}
        
        {!isSuperAdmin && (
            <header className="hidden sm:flex mb-8 sm:mb-12 flex-col sm:flex-row justify-between sm:items-end border-b border-botanical-border pb-4 sm:pb-6 gap-3 sm:gap-4">
            <div className="min-w-0">
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-botanical-accent mb-1 sm:mb-2 truncate">Management Dashboard</h2>
            </div>
            <div className="flex shrink-0">
                <Link
                href={`/shops/${data.shopSlug}`}
                target="_blank"
                className="bg-botanical-primary text-botanical-text hover:bg-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-xs sm:text-sm font-semibold whitespace-nowrap"
                >
                View Public Page ↗
                </Link>
            </div>
            </header>
        )}

        {children}
      </div>
      </main>
      <GlobalChatWidget shopId={shopId} currentUserId={userId} userRole={data.userRole} />
    </>
  );
}
