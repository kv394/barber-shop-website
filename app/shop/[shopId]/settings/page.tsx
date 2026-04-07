import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import { CustomizationForm } from '@/components/shop-admin/CustomizationForm';
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

  if (!data || (!data.isSuperAdmin && !data.isShopAdmin)) {
    notFound();
  }

  const shopDetails = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { depositRequired: true, depositAmount: true },
  });

  const dynamicTemplates = await prisma.dynamicTemplate.findMany({
    select: { name: true, description: true }
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
      {/* Settings sub-nav — only for shop admins */}
      {data.isShopAdmin && !data.isSuperAdmin && (
        <div className="flex gap-2 flex-wrap mb-6 pb-4 border-b border-white/10 overflow-x-auto">
          {[
            { href: `/shop/${shopId}/settings`, label: '🎨 Appearance', active: true },
            { href: `/shop/${shopId}/settings/templates`, label: '✨ AI Templates' },
            { href: `/shop/${shopId}/settings/booking`, label: '📅 Booking & Hours' },
            { href: `/shop/${shopId}/settings/notifications`, label: '🔔 Notifications' },
            { href: `/shop/${shopId}/settings/commissions`, label: '💼 Commissions' },
            { href: `/shop/${shopId}/settings/kiosk`, label: '📱 Kiosk' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${l.active ? 'bg-brand-gold text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
              {l.label}
            </Link>
          ))}
        </div>
      )}

      <TimezoneSelector shopId={shopId} currentTimezone={data.shop.timezone || 'America/New_York'} />

      <DepositSettings
        shopId={shopId}
        initialRequired={shopDetails?.depositRequired || false}
        initialAmount={shopDetails?.depositAmount || 0}
      />

      <div className="bg-slate-900/50 p-6 rounded-xl border border-white/10 mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Booking Portal Template</h2>
        <p className="text-sm text-gray-400 mb-6">Choose the layout and style for your public booking portal.</p>
        <TemplateSelector
          currentTemplate={data.shop.template || 'modern'}
          shopId={shopId}
          dynamicTemplates={dynamicTemplates}
        />
      </div>

      <CustomizationForm
        shopId={shopId}
        customization={customization}
        isSuperAdmin={data.isSuperAdmin}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href={`/shop/${shopId}/config/services`} className="group">
          <div className="bg-slate-900/50 p-6 rounded-lg border border-white/5 group-hover:border-brand-gold/50 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-gold">💇‍♀️ Services</h3>
            <p className="text-gray-400 text-sm">Manage your service menu, pricing, and duration.</p>
          </div>
        </Link>

        <Link href={`/shop/${shopId}/config/products`} className="group">
          <div className="bg-slate-900/50 p-6 rounded-lg border border-white/5 group-hover:border-brand-gold/50 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-gold">🛍️ Products</h3>
            <p className="text-gray-400 text-sm">Manage retail and backbar inventory, SKUs, and pricing.</p>
          </div>
        </Link>

        {data.isShopAdmin && !data.isSuperAdmin && (
          <>
            <Link href={`/shop/${shopId}/settings/booking`} className="group">
              <div className="bg-slate-900/50 p-6 rounded-lg border border-white/5 group-hover:border-brand-gold/50 transition-colors">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-gold">📅 Booking & Hours</h3>
                <p className="text-gray-400 text-sm">Business hours, online booking rules, buffer times, blackout dates.</p>
              </div>
            </Link>
            <Link href={`/shop/${shopId}/settings/notifications`} className="group">
              <div className="bg-slate-900/50 p-6 rounded-lg border border-white/5 group-hover:border-brand-gold/50 transition-colors">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-gold">🔔 Notifications</h3>
                <p className="text-gray-400 text-sm">Configure automated reminders, review requests, and admin alerts.</p>
              </div>
            </Link>
            <Link href={`/shop/${shopId}/settings/commissions`} className="group">
              <div className="bg-slate-900/50 p-6 rounded-lg border border-white/5 group-hover:border-brand-gold/50 transition-colors">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-gold">💼 Commissions</h3>
                <p className="text-gray-400 text-sm">Set service and product commission rates per staff member.</p>
              </div>
            </Link>
            <Link href={`/shop/${shopId}/settings/kiosk`} className="group">
              <div className="bg-slate-900/50 p-6 rounded-lg border border-white/5 group-hover:border-brand-gold/50 transition-colors">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-gold">📱 Kiosk Setup</h3>
                <p className="text-gray-400 text-sm">Configure attendance kiosk URL and PIN for staff check-in.</p>
              </div>
            </Link>
          </>
        )}
      </div>
    </ShopAdminLayout>
  );
}
