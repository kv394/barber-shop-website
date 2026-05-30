import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import PremiumFeatureGate from '@/components/ui/PremiumFeatureGate';

export const dynamic = 'force-dynamic';

export default async function FrontDeskKioskPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) redirect('/');
  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSiteAdmin && !data.isShopAdmin)) notFound();

  return (
    <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="Front Desk Kiosk" shopId={shopId} userRole={data.userRole}>
      <PremiumFeatureGate 
        shopId={shopId} 
        featureId="kiosk" 
        title="Front Desk Kiosk" 
        description="Provide a seamless self-service check-in and waitlist experience for your walk-in clients." 
        price="$15/mo"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-brand-indigo/10 rounded-full flex items-center justify-center mx-auto text-4xl">
            🖥️
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-crm-text mb-2">Front Desk Client Kiosk</h2>
            <p className="text-crm-muted text-[15px] max-w-lg mx-auto">
              Launch the self-service kiosk on an iPad or tablet at your front desk. 
              Clients can check-in for their appointments or join the walk-in waitlist automatically.
            </p>
          </div>

          <div className="p-4 bg-status-pending/10 border border-status-pending/20 rounded-xl text-left max-w-xl mx-auto">
            <h4 className="font-bold text-status-pending mb-2 text-sm">⚠️ Important Instructions</h4>
            <ul className="list-disc pl-5 space-y-2 text-[13px] text-crm-muted">
              <li>Launch this on a dedicated device (like an iPad) kept at your front desk.</li>
              <li>Once launched, the Kiosk will remain in full-screen mode.</li>
              <li>We recommend using "Guided Access" on iOS or "App Pinning" on Android to prevent clients from exiting the browser.</li>
            </ul>
          </div>

          <div className="pt-4">
            <a 
              href={`/shop/${shopId}/kiosk/client`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-crm-primary text-white rounded-xl font-bold hover:bg-crm-primary/90 transition-all shadow-lg shadow-crm-primary/30"
            >
              Launch Kiosk Mode
              <span className="text-xl">🚀</span>
            </a>
          </div>
        </div>
      </div>
      </PremiumFeatureGate>
    </ShopAdminLayout>
  );
}
