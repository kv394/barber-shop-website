import Image from 'next/image';
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

 const configTabs = [
 { id: 'services', label: 'Services', href: `/shop/${shopId}/config/services` },
 { id: 'products', label: 'Products', href: `/shop/${shopId}/config/products` },
 { id: 'settings-memberships', label: 'Memberships', href: `/shop/${shopId}/settings/memberships` },
 { id: 'settings-booking', label: 'Booking & Hours', href: `/shop/${shopId}/settings/booking` },
 { id: 'settings-resources', label: 'Resources', href: `/shop/${shopId}/settings/resources` },
 { id: 'settings-forms', label: 'Intake Forms', href: `/shop/${shopId}/settings/forms` }
 ];

 return (
 <ShopAdminLayout shopName={data.shop.name} shopSlug={data.shopSlug} pageTitle="Booking & Hours" shopId={shopId} userRole={data.userRole}>
 <div className="space-y-6">
 <BusinessHoursEditor shopId={shopId} />
 <BookingSettingsForm shopId={shopId} />
 <BlackoutDatesManager shopId={shopId} />
 </div>
 </ShopAdminLayout>
 );
}

