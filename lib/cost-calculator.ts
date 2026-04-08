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
};

/**
 * Deterministic cost calculation strategy instead of AI on-the-fly.
 */
export function calculateUsageCostStrategy(metrics: UsageMetrics): CostAnalysis {
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

  // Monthly Tier logic
  let pricingTierName = 'Starter';
  let baseFeeUSD = 29;
  
  if (metrics.appointmentCount >= 500 || metrics.userCount >= 25 || metrics.formSubmissionCount >= 100) {
    pricingTierName = 'Enterprise Spa';
    baseFeeUSD = 199;
  } else if (metrics.appointmentCount >= 100 || metrics.userCount >= 10) {
    pricingTierName = 'Growth';
    baseFeeUSD = 79;
  }

  // Storage overage fee ($1 per 100MB over 500MB)
  let storageFee = 0;
  if (estimatedStorageMB > 500) {
    storageFee = Math.ceil((estimatedStorageMB - 500) / 100) * 1;
  }

  const suggestedMonthlyFeeUSD = baseFeeUSD + storageFee;

  const strategyReasoning = `Based on a usage volume of ${metrics.appointmentCount} appointments and ${metrics.userCount} users, the '${pricingTierName}' tier is recommended. Storage is efficiently utilized at ${estimatedStorageMB} MB, keeping infrastructure overhead balanced and minimizing extra costs.`;

  return {
    estimatedStorageMB,
    suggestedMonthlyFeeUSD,
    pricingTierName,
    strategyReasoning
  };
}
