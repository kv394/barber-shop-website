import Image from 'next/image';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import NotificationSettingsForm from '@/components/marketing/NotificationSettingsForm';
import SmtpSettingsForm from '@/components/shop-admin/SmtpSettingsForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';


export default async function NotificationsSettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 
 const userId = user?.id;
 if (!userId) redirect('/');
 const { shopId } = await params;
 const data = await getShopLayoutData(userId, shopId);
 if (!data || (!data.isSiteAdmin && !data.isShopAdmin)) notFound();

 const settingsTabs = [
 { id: 'settings', label: 'Appearance', href: `/shop/${shopId}/settings` },
 { id: 'settings-notifications', label: 'Notifications', href: `/shop/${shopId}/settings/notifications` },
 { id: 'settings-commissions', label: 'Commissions', href: `/shop/${shopId}/settings/commissions` },
 { id: 'settings-kiosk', label: 'Kiosk', href: `/shop/${shopId}/settings/kiosk` },
 { id: 'settings-billing', label: 'Billing', href: `/shop/${shopId}/settings/billing` }
 ];

 return (
 <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="Notification Settings" shopId={shopId} userRole={data.userRole}>
 <NotificationSettingsForm shopId={shopId} />
 <div className="mt-6" />
 <SmtpSettingsForm shopId={shopId} />
 </ShopAdminLayout>
 );
}
