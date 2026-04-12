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
  
  if (!layoutData || (!layoutData.isSiteAdmin && !layoutData.isShopAdmin)) {
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
          <h2 className="text-2xl font-bold text-botanical-text mb-2 flex items-center gap-2">
            <span>💳</span> Usage & Billing Report
          </h2>
          <p className="text-botanical-muted text-sm">Review your current usage and estimated monthly billing tier.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-botanical-bg/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-botanical-border shadow-sm flex flex-col md:flex-row md:flex-wrap lg:flex-nowrap divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-20 overflow-hidden transform sm:-translate-y-6 sm:-mx-2 mb-2 sm:mb-6 mt-6 sm:mt-10">
            {[
              { label: 'Appointments', val: metrics.appointmentCount, colorClass: 'text-blue-500', bgClass: 'bg-blue-500/80', icon: '📅' },
              { label: 'Users', val: metrics.userCount, colorClass: 'text-green-500', bgClass: 'bg-green-500/80', icon: '👥' },
              { label: 'Intake Forms', val: metrics.formSubmissionCount, colorClass: 'text-purple-500', bgClass: 'bg-purple-500/80', icon: '📝' },
              { label: 'Images', val: metrics.portfolioImageCount + metrics.clientHistoryImageCount, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/80', icon: '📸' },
            ].map(m => (
              <div key={m.label} className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0 border-t md:border-t-0 md:border-l border-botanical-border first:border-0">
                <div className={`absolute top-0 left-0 w-full h-1 ${m.bgClass}`}></div>
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-2 sm:mb-3">
                  <h3 className="text-botanical-muted text-sm sm:text-xs uppercase tracking-widest font-semibold truncate">{m.label}</h3>
                  <span className={`${m.colorClass} text-sm`}>{m.icon}</span>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-botanical-text break-words leading-tight">{m.val}</p>
              </div>
            ))}
          </div>

          <div className="bg-botanical-bg/50 p-6 rounded-xl border border-botanical-border shadow-sm shadow-lg relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-botanical-primary/80"></div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
              <div>
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-2">
                   <p className="text-xs text-botanical-accent uppercase tracking-widest font-semibold">Current Tier</p>
                </div>
                <h3 className="text-3xl font-black text-botanical-text leading-tight">{analysis.pricingTierName}</h3>
              </div>
              <div className="md:text-right">
                <p className="text-xs text-botanical-accent uppercase tracking-widest font-semibold mb-2">Estimated Monthly Fee</p>
                <p className="text-4xl font-black text-botanical-text leading-tight">${analysis.suggestedMonthlyFeeUSD}<span className="text-sm text-botanical-muted font-medium">/mo</span></p>
              </div>
            </div>

            <div className="bg-botanical-surface p-4 rounded-lg mt-4 border border-botanical-border shadow-sm">
              <p className="text-sm text-botanical-muted leading-relaxed">
                {analysis.strategyReasoning}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-brand-gold/10 flex flex-wrap justify-between gap-x-2 gap-y-2 items-center text-xs">
              <span className="text-botanical-muted">Estimated Database Storage:</span>
              <span className="font-mono text-botanical-text bg-botanical-surface px-2 py-1 rounded">~{analysis.estimatedStorageMB} MB</span>
            </div>
          </div>

          <div className="bg-botanical-surface p-6 rounded-xl border border-botanical-border shadow-sm mt-6">
            <h3 className="text-lg font-bold text-botanical-text mb-4">Usage Limits & Overage</h3>
            <p className="text-sm text-botanical-muted mb-4 leading-relaxed">
              Your tier is automatically determined by your usage volume. 
              Storage over 500MB incurs a $1 fee per additional 100MB.
            </p>
            <ul className="text-sm text-botanical-muted space-y-2 list-disc list-inside ml-4">
              {tiers.map(t => (
                <li key={t.id}>
                  <strong className="text-botanical-text">{t.name} (${t.baseFeeUSD}/mo):</strong>{' '}
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
