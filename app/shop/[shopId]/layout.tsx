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

  const isSiteAdmin = data.isSiteAdmin;
  const isStaff = data.userRole === 'STAFF';

  // SITE_ADMIN is a site admin — only allowed on the team assignment page
  if (isSiteAdmin) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';
    if (pathname && !pathname.includes('/settings/team')) {
      return redirect(`/shop/${shopId}/settings/team`);
    }
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-crm-bg text-crm-text">
      {/* Persistent Left Sidebar */}
      {!isSiteAdmin && (
        <aside className="hidden md:flex flex-col w-64 bg-crm-surface border-r border-crm-border flex-shrink-0 z-10 shadow-sm">
          <div className="h-16 flex items-center px-6 border-b border-crm-border">
             <span className="font-bold text-xl truncate tracking-tight text-crm-text">{data.shop.name}</span>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="mb-6 space-y-1">
              <Link href={`/shop/${shopId}`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-text hover:bg-crm-bg transition-colors">
                Dashboard
              </Link>
              <Link href={`/shop/${shopId}/bookings`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                Bookings
              </Link>
              <Link href={`/shop/${shopId}/waitlist`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                Waitlist
              </Link>
              <Link href={`/shop/${shopId}/clients`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                Clients
              </Link>
              {data.userRole === 'SHOP_ADMIN' && (
                <Link href={`/shop/${shopId}/settings/team`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                  Team
                </Link>
              )}
            </div>
            
            {data.userRole === 'SHOP_ADMIN' ? (
              <>
                <div className="mb-6 space-y-1">
                  <h3 className="px-3 text-[10px] font-bold text-crm-muted uppercase tracking-wider mb-2">Engagement</h3>
                  <Link href={`/shop/${shopId}/engagement`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Analytics
                  </Link>
                  <Link href={`/shop/${shopId}/loyalty`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Loyalty
                  </Link>
                  <Link href={`/shop/${shopId}/referrals`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Referrals
                  </Link>
                  <Link href={`/shop/${shopId}/campaigns`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Campaigns
                  </Link>
                  <Link href={`/shop/${shopId}/gift-cards`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Gift Cards
                  </Link>
                  <Link href={`/shop/${shopId}/reviews`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Reviews
                  </Link>
                </div>
                
                <div className="mb-6 space-y-1">
                  <h3 className="px-3 text-[10px] font-bold text-crm-muted uppercase tracking-wider mb-2">Reports</h3>
                  <Link href={`/shop/${shopId}/reports`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Financial
                  </Link>
                  <Link href={`/shop/${shopId}/reports/staff-working`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Staff Performance
                  </Link>
                  <Link href={`/shop/${shopId}/expenses`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Expenses
                  </Link>
                  <Link href={`/shop/${shopId}/reports/commissions`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Commissions
                  </Link>
                </div>
                
                <div className="mb-6 space-y-1">
                  <h3 className="px-3 text-[10px] font-bold text-crm-muted uppercase tracking-wider mb-2">Settings</h3>
                  <Link href={`/shop/${shopId}/settings`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Appearance
                  </Link>
                  <Link href={`/shop/${shopId}/settings/booking`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Booking & Hours
                  </Link>
                  <Link href={`/shop/${shopId}/config/services`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Services
                  </Link>
                  <Link href={`/shop/${shopId}/config/products`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Products
                  </Link>
                  <Link href={`/shop/${shopId}/settings/resources`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Resources
                  </Link>
                  <Link href={`/shop/${shopId}/settings/forms`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Intake Forms
                  </Link>
                  <Link href={`/shop/${shopId}/settings/memberships`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Memberships
                  </Link>
                  <Link href={`/shop/${shopId}/settings/notifications`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Notifications
                  </Link>
                  <Link href={`/shop/${shopId}/settings/commissions`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Commissions
                  </Link>
                  <Link href={`/shop/${shopId}/settings/kiosk`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Kiosk
                  </Link>
                  <Link href={`/shop/${shopId}/settings/billing`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                    Billing
                  </Link>
                </div>
              </>
            ) : (
              <div className="mb-6 space-y-1">
                <h3 className="px-3 text-[10px] font-bold text-crm-muted uppercase tracking-wider mb-2">My Area</h3>
                <Link href={`/shop/${shopId}/staff`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                  My Schedule
                </Link>
                <Link href={`/shop/${shopId}/leave`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                  My Leave
                </Link>
                <Link href={`/shop/${shopId}/portfolio`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                  My Portfolio
                </Link>
                <Link href={`/shop/${shopId}/reports/commissions`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                  My Earnings
                </Link>
                <Link href={`/shop/${shopId}/profile`} className="block px-3 py-2 rounded-lg text-[13px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                  Profile
                </Link>              </div>
            )}
          </nav>
          <div className="p-4 border-t border-crm-border flex items-center justify-between">
            <div>
               <span className="block text-[11px] font-semibold text-crm-muted uppercase tracking-wider mb-2">{data.userRole.replace('_', ' ')}</span>
               <SupabaseAuthButton redirectUrl={fallbackRedirect} />
            </div>
            {!isSiteAdmin && (
              <Link
                href={`/shops/${data.shopSlug}?preview=true`}
                target="_blank"
                className="text-crm-muted hover:text-crm-text transition-colors p-2"
                title="View Public Page"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </Link>
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header (All Roles except Site Admin) */}
        {!isSiteAdmin && (
          <header className="md:hidden sticky top-0 z-[100] flex justify-between items-center bg-crm-surface border-b border-crm-border px-4 py-3 shadow-sm">
            <div className="flex flex-col min-w-0 pr-4">
               <span className="text-crm-text font-black text-lg truncate leading-tight">{data.shop.name}</span>
            </div>
            <div className="shrink-0">
               <SupabaseAuthButton redirectUrl={fallbackRedirect} />
            </div>
          </header>
        )}

        {/* Main Scrolling Area */}
        <main className="flex-1 overflow-y-auto bg-crm-bg p-4 md:p-8 pt-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      <GlobalChatWidget shopId={shopId} currentUserId={userId} userRole={data.userRole} />
    </div>
  );
}
