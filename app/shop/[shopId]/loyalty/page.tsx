import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import LoyaltyDashboard from '@/components/marketing/LoyaltyDashboard';
import PremiumFeatureGate from '@/components/ui/PremiumFeatureGate';

export const dynamic = "force-dynamic";

export default async function LoyaltyPage({ params }: { params: Promise<{ shopId: string }> }) {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 
 const userId = user?.id;
 if (!userId) return redirect('/');

 const { shopId } = await params;
 const data = await getShopLayoutData(userId, shopId);
 if (!data || (!data.isSiteAdmin && !data.isShopAdmin)) return redirect('/');

 const engagementTabs = [
 { id: 'engagement', label: 'Analytics', href: `/shop/${shopId}/engagement` },
 { id: 'loyalty', label: 'Loyalty', href: `/shop/${shopId}/loyalty` },
 { id: 'referrals', label: 'Referrals', href: `/shop/${shopId}/referrals` },
 { id: 'campaigns', label: 'Campaigns', href: `/shop/${shopId}/campaigns` },
 { id: 'gift-cards', label: 'Gift Cards', href: `/shop/${shopId}/gift-cards` },
 { id: 'reviews', label: 'Reviews', href: `/shop/${shopId}/reviews` }
 ];

 return (
 <ShopAdminLayout
 shopName={data.shop.name}
 shopSlug={data.shopSlug}
 pageTitle={undefined}
 shopId={shopId}
 userRole={data.userRole}
 >
 <PremiumFeatureGate
   shopId={shopId}
   featureId="loyalty"
   title="Loyalty Program"
   description="Reward your repeat clients with an automated point-based loyalty system and increase retention."
   price="$15/mo"
 >
   <LoyaltyDashboard shopId={shopId} currency={data.shop.currency} />
 </PremiumFeatureGate>
 </ShopAdminLayout>
 );
}
