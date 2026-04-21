import { prisma } from './prisma';

export type UsageMetrics = {
  userCount: number;
  appointmentCount: number;
  productCount: number;
  serviceCount: number;
  formSubmissionCount: number;
  portfolioImageCount: number;
  clientHistoryImageCount: number;
  clientFormulaCount: number;
  reviewCount: number;
};

export type CostAnalysis = {
  estimatedStorageMB: number;
  suggestedMonthlyFeeUSD: number;
  pricingTierName: string;
  strategyReasoning: string;
  tierId?: string;
};

export type SaaSTierInput = {
  id: string;
  name: string;
  baseFeeUSD: number;
  maxAppointments: number;
  maxUsers: number;
  maxFormSubmissions: number;
  storageLimitMB: number;
  overageFeePer100MB: number;
  description: string | null;
};

export async function getSaaSTiers(): Promise<SaaSTierInput[]> {
  let tiers = await prisma.saaSTier.findMany({
    orderBy: { baseFeeUSD: 'asc' }
  });

  if (tiers.length === 0) {
    const defaultTiers = [
      {
        name: 'Free Trial',
        baseFeeUSD: 0,
        maxAppointments: 50,
        maxUsers: 2,
        maxFormSubmissions: 20,
        storageLimitMB: 100,
        overageFeePer100MB: 2,
        description: 'For small shops just getting started.'
      },
      {
        name: 'Starter',
        baseFeeUSD: 29,
        maxAppointments: 200,
        maxUsers: 5,
        maxFormSubmissions: 50,
        storageLimitMB: 500,
        overageFeePer100MB: 1,
        description: 'For growing independent barbers and small parlors.'
      },
      {
        name: 'Growth',
        baseFeeUSD: 79,
        maxAppointments: 1000,
        maxUsers: 10,
        maxFormSubmissions: 200,
        storageLimitMB: 1000,
        overageFeePer100MB: 1,
        description: 'For busy shops with a full team.'
      },
      {
        name: 'Enterprise Spa',
        baseFeeUSD: 199,
        maxAppointments: 5000,
        maxUsers: 25,
        maxFormSubmissions: 1000,
        storageLimitMB: 5000,
        overageFeePer100MB: 1,
        description: 'For large spas and multi-chair operations.'
      },
      {
        name: 'Unlimited Platform',
        baseFeeUSD: 399,
        maxAppointments: 999999,
        maxUsers: 999,
        maxFormSubmissions: 999999,
        storageLimitMB: 20000,
        overageFeePer100MB: 1,
        description: 'For franchise-level volume with unlimited core usage.'
      }
    ];

    for (const t of defaultTiers) {
      await prisma.saaSTier.create({ data: t });
    }

    tiers = await prisma.saaSTier.findMany({
      orderBy: { baseFeeUSD: 'asc' }
    });
  }

  return tiers;
}

/**
 * Deterministic cost calculation strategy matching usage to dynamic database tiers.
 */
export function calculateUsageCostStrategy(metrics: UsageMetrics, tiers: SaaSTierInput[]): CostAnalysis {
  // Storage logic
  const bytesPerImage = 2.5 * 1024 * 1024; // 2.5MB per photo
  const bytesPerUser = 200 * 1024; // 200KB per user record
  const bytesPerBooking = 50 * 1024; // 50KB per appointment
  const bytesPerProduct = 100 * 1024; // 100KB per product
  const bytesPerService = 100 * 1024; // 100KB per service
  const bytesPerForm = 150 * 1024; // 150KB per form
  const bytesPerFormula = 50 * 1024; // 50KB per formula
  const bytesPerReview = 20 * 1024; // 20KB per review

  const totalBytes =
    (metrics.portfolioImageCount + metrics.clientHistoryImageCount) * bytesPerImage +
    metrics.userCount * bytesPerUser +
    metrics.appointmentCount * bytesPerBooking +
    metrics.productCount * bytesPerProduct +
    metrics.serviceCount * bytesPerService +
    metrics.formSubmissionCount * bytesPerForm +
    metrics.clientFormulaCount * bytesPerFormula +
    metrics.reviewCount * bytesPerReview;

  const estimatedStorageMB = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;

  // Find the appropriate tier based on usage limits. Tiers are ordered by baseFeeUSD ascending.
  let selectedTier = tiers[0];

  for (const tier of tiers) {
    if (
      metrics.appointmentCount <= tier.maxAppointments &&
      metrics.userCount <= tier.maxUsers &&
      metrics.formSubmissionCount <= tier.maxFormSubmissions
    ) {
      selectedTier = tier;
      break;
    }
    // if it exceeds this tier's limits, it checks the next tier, eventually settling on the highest required
    selectedTier = tier; // ensures it at least bumps up to the highest one if all are exceeded
  }

  // Storage overage calculation based on the selected tier's settings
  let storageFee = 0;
  if (estimatedStorageMB > selectedTier.storageLimitMB) {
    storageFee = Math.ceil((estimatedStorageMB - selectedTier.storageLimitMB) / 100) * selectedTier.overageFeePer100MB;
  }

  // AI Token fee calculation ($0.01 per 1000 tokens)
  const aiTokenFee = (metrics.aiTokenCount / 1000) * 0.01;

  const suggestedMonthlyFeeUSD = selectedTier.baseFeeUSD + storageFee + aiTokenFee;

  const strategyReasoning = `Based on a usage volume of ${metrics.appointmentCount} appointments and ${metrics.userCount} users, the '${selectedTier.name}' tier is recommended. Storage utilizes ${estimatedStorageMB} MB against a ${selectedTier.storageLimitMB} MB limit. AI Token Usage: ${metrics.aiTokenCount} tokens ($${aiTokenFee.toFixed(2)}).`;

  return {
    estimatedStorageMB,
    suggestedMonthlyFeeUSD,
    pricingTierName: selectedTier.name,
    tierId: selectedTier.id,
    strategyReasoning
  };
}
