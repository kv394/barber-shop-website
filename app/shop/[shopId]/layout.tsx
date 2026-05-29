import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import Link from 'next/link';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import GlobalChatWidget from '@/components/shop-admin/GlobalChatWidget';
import PrimarySidebar from '@/components/shop-admin/PrimarySidebar';
import SecondarySidebar from '@/components/shop-admin/SecondarySidebar';
import ShopSwitcher from '@/components/shop-admin/ShopSwitcher';
import ShopMobileBottomNav from '@/components/shop-admin/ShopMobileBottomNav';

export const dynamic = 'force-dynamic';

export default async function ShopLayout({
 children,
 params,
}: {
 children: React.ReactNode;
 params: Promise<{ shopId: string }>;
}) {
 const { shopId } = await params;
 
 let basicShop = null;
 if (shopId !== 'all') {
 // Need to get the shop slug for redirects
 basicShop = await prisma.shop.findUnique({
 where: { id: shopId },
 select: { name: true }
 });
 }
 
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
 const isStaff = data.userRole === 'STAFF' || data.userRole === 'BOOTH_RENTER';

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
 {/* Persistent Left Sidebar (Dual Sidebar Layout) */}
 {!isSiteAdmin && (
 <div className="hidden md:flex h-full shadow-sm">
 <PrimarySidebar 
 shopId={shopId} 
 userRole={data.userRole} 
 shopName={data.shop.name} 
 accessibleShops={(data as any).accessibleShops} 
 fallbackRedirect={fallbackRedirect}
 shopSlug={data.shopSlug}
 />
 <SecondarySidebar 
 shopId={shopId} 
 userRole={data.userRole} 
 shopType={(data.shop as any).shopType}
 />
 </div>
 )}

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
 {/* Main Scrolling Area */}
 <main className="flex-1 overflow-y-auto bg-crm-bg relative p-4 md:p-8 pt-4 md:pt-8 pb-24 md:pb-8">
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-indigo/5 via-crm-bg/20 to-crm-bg pointer-events-none"></div>
 {/* Premium Radial Glows (Global) */}
 <div className="absolute top-0 left-1/4 w-96 h-96 bg-crm-primary/10 rounded-full blur-[100px] pointer-events-none z-0 fixed"></div>
 <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-brand-indigo/10 rounded-full blur-[120px] pointer-events-none z-0 fixed"></div>
 
 <div className="mx-auto max-w-7xl relative z-10">
 {children}
 </div>
 </main>
 </div>

 {!isSiteAdmin && (
 <ShopMobileBottomNav 
 shopId={shopId} 
 userRole={data.userRole} 
 currentShopName={data.shop.name}
 accessibleShops={(data as any).accessibleShops}
 fallbackRedirect={fallbackRedirect}
 />
 )}
 
 <GlobalChatWidget shopId={shopId} currentUserId={userId} userRole={data.userRole} />
 </div>
 );
}
