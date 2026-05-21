import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import { DEFAULT_CUSTOMIZATION } from '@/lib/templates';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import TimezoneSelector from '@/components/shop-admin/TimezoneSelector';
import DepositSettings from '@/components/checkout/DepositSettings';
import { prisma } from '@/lib/prisma';
import DeleteLocationButton from '@/components/shop-admin/DeleteLocationButton';
import { ShopProfileForm } from '@/components/shop-admin/ShopProfileForm';
import { SettingsFormManager } from '@/components/shop-admin/SettingsFormManager';

export const dynamic = "force-dynamic";

export default async function ShopSettingsPage({ 
  params 
}: { 
  params: Promise<{ shopId: string }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) redirect('/');

  const { shopId } = await params;
  const data = await getShopLayoutData(userId, shopId);

  if (!data || (!data.isSiteAdmin && !data.isShopAdmin)) {
    notFound();
  }

  const shopDetails = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { depositRequired: true, depositAmount: true },
  });

  const dynamicTemplates = await prisma.dynamicTemplate.findMany({
    where: {
      OR: [
        { shopId: null },
        { shopId: shopId }
      ]
    },
    select: { name: true, description: true, variables: true }
  });

  const customization = data.shop.customization || DEFAULT_CUSTOMIZATION;

  const settingsTabs = [
    { id: 'settings', label: 'Appearance', href: `/shop/${shopId}/settings` },
    { id: 'settings-notifications', label: 'Notifications', href: `/shop/${shopId}/settings/notifications` },
    { id: 'settings-commissions', label: 'Commissions', href: `/shop/${shopId}/settings/commissions` },
    { id: 'settings-kiosk', label: 'Kiosk', href: `/shop/${shopId}/settings/kiosk` },
    { id: 'settings-billing', label: 'Billing', href: `/shop/${shopId}/settings/billing` }
  ];

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle="Appearance & Settings"
      shopId={shopId}
      userRole={data.userRole}
    >
      <TimezoneSelector shopId={shopId} currentTimezone={data.shop.timezone || 'America/New_York'} />

      <DepositSettings
        shopId={shopId}
        initialRequired={shopDetails?.depositRequired || false}
        initialAmount={shopDetails?.depositAmount || 0}
      />

      <ShopProfileForm
        shopId={shopId}
        initialName={data.shop.name}
        initialDescription={data.shop.description}
        initialSlogan={data.shop.slogan}
      />

      <SettingsFormManager
        shopId={shopId}
        customization={customization}
        isSiteAdmin={data.isSiteAdmin}
        currentTemplate={data.shop.template || 'modern'}
        dynamicTemplates={dynamicTemplates as any}
      />

      <div className="mt-12 pt-8 border-t border-crm-border">
        <h3 className="font-bold text-red-600 mb-2 text-lg">Danger Zone</h3>
        <p className="text-crm-muted text-[13px] mb-4">Permanently delete this location and all its associated data. This action cannot be undone.</p>
        <DeleteLocationButton shopId={shopId} shopName={data.shop.name} />
      </div>
    </ShopAdminLayout>
  );
}
