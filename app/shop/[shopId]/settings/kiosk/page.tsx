import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import { prisma } from '@/lib/prisma';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import KioskSetupClient from '@/components/shop-admin/KioskSetupClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';


export default async function KioskSettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 
 const userId = user?.id;
 if (!userId) redirect('/');
 const { shopId } = await params;
 const data = await getShopLayoutData(userId, shopId);
 if (!data || (!data.isSiteAdmin && !data.isShopAdmin)) notFound();

 const kioskUser = await prisma.user.findFirst({
 where: { shopId, role: 'ATTENDANCE_KIOSK' }
 });

 const settingsTabs = [
 { id: 'settings', label: 'Appearance', href: `/shop/${shopId}/settings` },
 { id: 'settings-notifications', label: 'Notifications', href: `/shop/${shopId}/settings/notifications` },
 { id: 'settings-commissions', label: 'Commissions', href: `/shop/${shopId}/settings/commissions` },
 { id: 'settings-kiosk', label: 'Kiosk', href: `/shop/${shopId}/settings/kiosk` },
 { id: 'settings-billing', label: 'Billing', href: `/shop/${shopId}/settings/billing` }
 ];

 return (
 <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="Kiosk Setup" shopId={shopId} userRole={data.userRole}>
 <KioskSetupClient shopId={shopId} shopName={data.shop.name} kioskEmail={kioskUser?.email || ''} />
 </ShopAdminLayout>
 );
}

