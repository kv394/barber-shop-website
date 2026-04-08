import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import { prisma } from '@/lib/prisma';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import { calculateUsageCostStrategy, getSaaSTiers } from '@/lib/cost-calculator';

export const dynamic = 'force-dynamic';

export default async function ShopBillingPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  
  if (!userId) redirect('/');
  
  const { shopId } = await params;
  const layoutData = await getShopLayoutData(userId, shopId);
  
  if (!layoutData || (!layoutData.isSuperAdmin && !layoutData.isShopAdmin)) {
    notFound();
  }

  // Fetch billing data directly
  const latestReport = await prisma.shopUsageReport.findFirst({
    where: { shopId },
    orderBy: { period: 'desc' }
  });

  let metrics;
  let analysis;

  const tiers = await getSaaSTiers();

  if (latestReport) {
    metrics = {
      userCount: latestReport.userCount,
      appointmentCount: latestReport.appointmentCount,
      productCount: latestReport.productCount,
      serviceCount: latestReport.serviceCount,
      formSubmissionCount: latestReport.formSubmissionCount,
      portfolioImageCount: latestReport.portfolioImageCount,
      clientHistoryImageCount: latestReport.clientHistoryImageCount,
      clientFormulaCount: latestReport.clientFormulaCount,
      reviewCount: latestReport.reviewCount
    };
    analysis = calculateUsageCostStrategy(metrics, tiers);
    // Override the reasoning to include the hourly note
    analysis.strategyReasoning = `[Data aggregated hourly] ${analysis.strategyReasoning}`;
  } else {
    const [
      userCount, appointmentCount, productCount, serviceCount,
      formSubmissionCount, portfolioImageCount, clientHistoryImageCount,
      clientFormulaCount, reviewCount
    ] = await Promise.all([
      prisma.user.count({ where: { shopId } }),
      prisma.appointment.count({ where: { shopId } }),
      prisma.product.count({ where: { shopId } }),
      prisma.service.count({ where: { shopId } }),
      prisma.formSubmission.count({ where: { appointment: { shopId } } }),
      prisma.portfolioImage.count({ where: { shopId } }),
      prisma.clientHistoryImage.count({ where: { shopId } }),
      prisma.clientFormula.count({ where: { shopId } }),
      prisma.review.count({ where: { shopId } })
    ]);

    metrics = {
      userCount, appointmentCount, productCount, serviceCount,
      formSubmissionCount, portfolioImageCount, clientHistoryImageCount,
      clientFormulaCount, reviewCount
    };
    analysis = calculateUsageCostStrategy(metrics, tiers);
  }

  return (
    <ShopAdminLayout
      shopName={layoutData.shop.name}
      shopSlug={layoutData.shopSlug}
      pageTitle="Billing & Usage"
      shopId={shopId}
      userRole={layoutData.userRole}
      activeTab="settings-billing"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <span>💳</span> Usage & Billing Report
          </h2>
          <p className="text-gray-400 text-sm">Review your current usage and estimated monthly billing tier.</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Appointments', val: metrics.appointmentCount },
              { label: 'Users', val: metrics.userCount },
              { label: 'Intake Forms', val: metrics.formSubmissionCount },
              { label: 'Images', val: metrics.portfolioImageCount + metrics.clientHistoryImageCount },
            ].map(m => (
              <div key={m.label} className="bg-slate-800/50 p-4 rounded-xl border border-white/10 text-center">
                <p className="text-2xl font-bold text-white">{m.val}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-brand-gold/10 to-amber-900/10 border border-brand-gold/20 p-6 rounded-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
              <div>
                <p className="text-xs text-brand-gold uppercase font-bold tracking-widest mb-1">Current Tier</p>
                <h3 className="text-3xl font-bold text-white">{analysis.pricingTierName}</h3>
              </div>
              <div className="md:text-right">
                <p className="text-xs text-brand-gold uppercase font-bold tracking-widest mb-1">Estimated Monthly Fee</p>
                <p className="text-4xl font-black text-white">${analysis.suggestedMonthlyFeeUSD}<span className="text-sm text-gray-400 font-medium">/mo</span></p>
              </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-lg mt-4 border border-white/5">
              <p className="text-sm text-gray-300 leading-relaxed">
                {analysis.strategyReasoning}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-brand-gold/10 flex justify-between items-center text-xs">
              <span className="text-gray-400">Estimated Database Storage:</span>
              <span className="font-mono text-white bg-black/40 px-2 py-1 rounded">~{analysis.estimatedStorageMB} MB</span>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-xl border border-white/10 mt-6">
            <h3 className="text-lg font-bold text-white mb-4">Usage Limits & Overage</h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Your tier is automatically determined by your usage volume. 
              Storage over 500MB incurs a $1 fee per additional 100MB.
            </p>
            <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside ml-4">
              {tiers.map(t => (
                <li key={t.id}>
                  <strong className="text-white">{t.name} (${t.baseFeeUSD}/mo):</strong>{' '}
                  {t.maxAppointments < 999999 ? `Up to ${t.maxAppointments} appointments` : 'Unlimited appointments'},{' '}
                  {t.maxUsers < 999 ? `up to ${t.maxUsers} users` : 'unlimited users'},{' '}
                  {t.maxFormSubmissions < 999999 ? `up to ${t.maxFormSubmissions} intake forms` : 'unlimited forms'}.
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </ShopAdminLayout>
  );
}
