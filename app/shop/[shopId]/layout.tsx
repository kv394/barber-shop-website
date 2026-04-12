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

    // For any other unauthorized user (STAFF/ADMIN of wrong shop), redirect to base URL
    redirect('/');
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
        <header className="sm:hidden fixed top-0 left-0 right-0 z-[100] flex flex-wrap justify-between gap-x-2 gap-y-2 items-center bg-botanical-surface border-b border-botanical-border px-4 py-3 shadow-sm">
          <div className="flex flex-col min-w-0 pr-4">
             <span className="text-botanical-text font-black text-xl leading-tight truncate">{data.shop.name}</span>
             <span className="text-botanical-muted text-xs uppercase font-bold tracking-wider leading-tight mt-0.5">{data.userRole.replace('_', ' ')}</span>
          </div>
          <div className="shrink-0">
             <SupabaseAuthButton redirectUrl={fallbackRedirect} />
          </div>
        </header>
      )}

      <main className="flex h-[100dvh] overflow-y-auto overflow-x-hidden flex-col items-center bg-botanical-bg text-botanical-text px-0 sm:p-4 md:p-8 lg:p-12 pb-24 sm:pb-4 pt-[64px] sm:pt-4 md:pt-8 lg:pt-12 scroll-smooth">
        <div className="w-full max-w-7xl px-3 sm:px-0 pt-4 sm:pt-0">
        <header className="hidden sm:flex flex-wrap justify-between gap-x-2 gap-y-2 items-center border-b border-botanical-border mb-6 sm:mb-8 pb-4 sm:pb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold flex items-center flex-wrap gap-2">
              {isSuperAdmin ? (
                <>
                  <Link href="/superadmin" className="hover:opacity-80 transition-opacity">
                    <span className="text-botanical-text">Barber</span>
                    <span className="text-botanical-accent">SaaS</span>
                  </Link>
                  <span className="text-botanical-border mx-1 font-sans font-light">/</span>
                  <span className="text-botanical-muted font-medium">{data.shop.name}</span>
                </>
              ) : (
                <>
                  <Link href={`/shop/${shopId}`} className="text-botanical-text hover:text-botanical-accent transition-colors truncate max-w-[300px] md:max-w-md lg:max-w-lg">
                    {data.shop.name}
                  </Link>
                  <span className="text-botanical-border mx-1 font-sans font-light">/</span>
                  <span className="text-botanical-muted font-medium text-xl sm:text-2xl md:text-3xl">Dashboard</span>
                </>
              )}
            </h1>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            {!isSuperAdmin && (
              <Link
                href={`/shops/${data.shopSlug}`}
                target="_blank"
                className="bg-botanical-primary text-white hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 px-4 sm:px-6 py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                View Public Page ↗
              </Link>
            )}
            <SupabaseAuthButton redirectUrl={isSuperAdmin ? '/' : fallbackRedirect} />
          </div>
        </header>

        {children}
      </div>
      </main>
      <GlobalChatWidget shopId={shopId} currentUserId={userId} userRole={data.userRole} />
    </>
  );
}
