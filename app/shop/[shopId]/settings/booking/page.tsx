import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import BusinessHoursEditor from '@/components/shop-admin/BusinessHoursEditor';
import BookingSettingsForm from '@/components/appointments/BookingSettingsForm';
import BlackoutDatesManager from '@/components/shop-admin/BlackoutDatesManager';
import Link from 'next/link';

export const dynamic = 'force-dynamic';


export default async function BookingSettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) redirect('/');
  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);
  if (!data || (!data.isSiteAdmin && !data.isShopAdmin)) notFound();
  return (
    <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="Booking & Hours" shopId={shopId} userRole={data.userRole} activeTab="settings-booking">
      <div className="space-y-6">
        <BusinessHoursEditor shopId={shopId} />
        <BookingSettingsForm shopId={shopId} />
        <BlackoutDatesManager shopId={shopId} />
      </div>
    </ShopAdminLayout>
  );
}

