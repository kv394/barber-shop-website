import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import { CustomizationForm } from '@/components/shop-admin/CustomizationForm';
import { CustomPagesForm } from '@/components/shop-admin/CustomPagesForm';
import { TemplateSelector } from '@/components/shop-admin/TemplateSelector';
import { DEFAULT_CUSTOMIZATION } from '@/lib/templates';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import TimezoneSelector from '@/components/shop-admin/TimezoneSelector';
import DepositSettings from '@/components/checkout/DepositSettings';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

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

  return (
    <ShopAdminLayout
      shopName={data.shop.name}
      shopSlug={data.shopSlug}
      pageTitle="Appearance & Settings"
      shopId={shopId}
      userRole={data.userRole}
      activeTab="settings"
    >
      <TimezoneSelector shopId={shopId} currentTimezone={data.shop.timezone || 'America/New_York'} />

      <DepositSettings
        shopId={shopId}
        initialRequired={shopDetails?.depositRequired || false}
        initialAmount={shopDetails?.depositAmount || 0}
      />

      {data.isSiteAdmin && (
        <div className="bg-botanical-bg/50 p-6 rounded-xl border border-botanical-border shadow-sm mb-6">
          <h2 className="font-bold text-botanical-text mb-2 text-3xl md:text-4xl">Booking Portal Template</h2>
          <p className="text-botanical-muted mb-6 text-base md:text-lg">Choose the layout and style for your public booking portal.</p>
          <TemplateSelector
            currentTemplate={data.shop.template || 'modern'}
            shopId={shopId}
            dynamicTemplates={dynamicTemplates as any}
          />
        </div>
      )}

      <CustomizationForm
        shopId={shopId}
        customization={customization}
        isSiteAdmin={data.isSiteAdmin}
        currentTemplate={data.shop.template || 'modern'}
        dynamicTemplates={dynamicTemplates as any}
      />

      <CustomPagesForm
        shopId={shopId}
        customization={customization}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href={`/shop/${shopId}/config/services`} className="group">
          <div className="bg-botanical-bg/50 p-6 rounded-lg border border-botanical-border shadow-sm group-hover:border-brand-gold/50 transition-colors">
            <h3 className="font-bold text-botanical-text mb-2 group-hover:text-botanical-accent text-2xl md:text-3xl">💇‍♀️ Services</h3>
            <p className="text-botanical-muted text-base md:text-lg">Manage your service menu, pricing, and duration.</p>
          </div>
        </Link>

        <Link href={`/shop/${shopId}/config/products`} className="group">
          <div className="bg-botanical-bg/50 p-6 rounded-lg border border-botanical-border shadow-sm group-hover:border-brand-gold/50 transition-colors">
            <h3 className="font-bold text-botanical-text mb-2 group-hover:text-botanical-accent text-2xl md:text-3xl">🛍️ Products</h3>
            <p className="text-botanical-muted text-base md:text-lg">Manage retail and backbar inventory, SKUs, and pricing.</p>
          </div>
        </Link>

        {data.isShopAdmin && !data.isSiteAdmin && (
          <>
            <Link href={`/shop/${shopId}/settings/booking`} className="group">
              <div className="bg-botanical-bg/50 p-6 rounded-lg border border-botanical-border shadow-sm group-hover:border-brand-gold/50 transition-colors">
                <h3 className="font-bold text-botanical-text mb-2 group-hover:text-botanical-accent text-2xl md:text-3xl">📅 Booking & Hours</h3>
                <p className="text-botanical-muted text-base md:text-lg">Business hours, online booking rules, buffer times, blackout dates.</p>
              </div>
            </Link>
            <Link href={`/shop/${shopId}/settings/notifications`} className="group">
              <div className="bg-botanical-bg/50 p-6 rounded-lg border border-botanical-border shadow-sm group-hover:border-brand-gold/50 transition-colors">
                <h3 className="font-bold text-botanical-text mb-2 group-hover:text-botanical-accent text-2xl md:text-3xl">🔔 Notifications</h3>
                <p className="text-botanical-muted text-base md:text-lg">Configure automated reminders, review requests, and admin alerts.</p>
              </div>
            </Link>
            <Link href={`/shop/${shopId}/settings/commissions`} className="group">
              <div className="bg-botanical-bg/50 p-6 rounded-lg border border-botanical-border shadow-sm group-hover:border-brand-gold/50 transition-colors">
                <h3 className="font-bold text-botanical-text mb-2 group-hover:text-botanical-accent text-2xl md:text-3xl">💼 Commissions</h3>
                <p className="text-botanical-muted text-base md:text-lg">Set service and product commission rates per staff member.</p>
              </div>
            </Link>
            <Link href={`/shop/${shopId}/settings/kiosk`} className="group">
              <div className="bg-botanical-bg/50 p-6 rounded-lg border border-botanical-border shadow-sm group-hover:border-brand-gold/50 transition-colors">
                <h3 className="font-bold text-botanical-text mb-2 group-hover:text-botanical-accent text-2xl md:text-3xl">📱 Kiosk Setup</h3>
                <p className="text-botanical-muted text-base md:text-lg">Configure attendance kiosk URL and PIN for staff check-in.</p>
              </div>
            </Link>
          </>
        )}
      </div>
    </ShopAdminLayout>
  );
}
