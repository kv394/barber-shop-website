import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import MyBookingLinkClient from '@/components/shop-admin/MyBookingLinkClient';
import MyServicesClient from '@/components/shop-admin/MyServicesClient';

export const dynamic = 'force-dynamic';

export default async function MyBookingLinkPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/');

  const data = await getShopLayoutData(user.id, shopId);
  if (!data || data.userRole !== 'BOOTH_RENTER') return redirect(`/shop/${shopId}`);

  const { shop, shopSlug } = data;
  const dbUser = data.user;
  const resolvedSlug = shopSlug || shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const bookingUrl = `${appUrl}/book/${dbUser.id}`;
  const stripeConnected = dbUser.stripeConnectOnboarded === true;
  const connectStatus = dbUser.stripeConnectAccountId
    ? 'connected'
    : 'not_connected';

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={resolvedSlug}
      pageTitle="My Booking Link"
      shopId={shopId}
      userRole={data.userRole}
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Stripe Connect Card */}
        <div className="bg-crm-surface border border-crm-border rounded-2xl overflow-hidden">
          <div className={`h-1 ${stripeConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-bold text-crm-text text-lg mb-1">Stripe Payments</h2>
                <p className="text-crm-muted text-[13px]">
                  {stripeConnected
                    ? 'Your Stripe account is connected. Clients can pay you directly.'
                    : 'Connect your Stripe account to accept online payments from clients.'}
                </p>
              </div>
              {stripeConnected ? (
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-[12px] font-bold">
                  <span>✓</span> Connected
                </span>
              ) : (
                <a
                  href="/api/stripe/connect"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#635BFF] text-white rounded-xl text-[13px] font-bold hover:bg-[#5145e5] transition-colors shadow-md shadow-[#635BFF]/30"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.86 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/></svg>
                  Connect with Stripe
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Booking Link + QR */}
        <MyBookingLinkClient
          bookingUrl={bookingUrl}
          renterId={dbUser.id}
          isConnected={stripeConnected}
        />

        {/* Services CRUD */}
        <MyServicesClient renterId={dbUser.id} />
      </div>
    </ShopAdminLayout>
  );
}
