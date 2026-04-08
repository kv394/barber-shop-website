import { prisma } from './prisma';
import { logger } from './logger';
import { calculateUsageCostStrategy } from './cost-calculator';

export class UsageService {
  /**
   * Generates and stores an hourly usage report for all shops.
   */
  static async generateHourlyReports() {
    try {
      const shops = await prisma.shop.findMany({ select: { id: true } });
      const currentPeriod = new Date();
      currentPeriod.setMinutes(0, 0, 0); // truncate to current hour

      let reportsGenerated = 0;

      for (const shop of shops) {
        // Prevent duplicate reports for the same hour
        const existingReport = await prisma.shopUsageReport.findFirst({
          where: {
            shopId: shop.id,
            period: currentPeriod
          }
        });

        if (existingReport) {
          continue;
        }

        const [
          userCount,
          appointmentCount,
          productCount,
          serviceCount,
          formSubmissionCount,
          portfolioImageCount,
          clientHistoryImageCount,
          clientFormulaCount,
          reviewCount
        ] = await Promise.all([
          prisma.user.count({ where: { shopId: shop.id } }),
          prisma.appointment.count({ where: { shopId: shop.id } }),
          prisma.product.count({ where: { shopId: shop.id } }),
          prisma.service.count({ where: { shopId: shop.id } }),
          prisma.formSubmission.count({ where: { appointment: { shopId: shop.id } } }),
          prisma.portfolioImage.count({ where: { shopId: shop.id } }),
          prisma.clientHistoryImage.count({ where: { shopId: shop.id } }),
          prisma.clientFormula.count({ where: { shopId: shop.id } }),
          prisma.review.count({ where: { shopId: shop.id } })
        ]);

        const metrics = {
          userCount,
          appointmentCount,
          productCount,
          serviceCount,
          formSubmissionCount,
          portfolioImageCount,
          clientHistoryImageCount,
          clientFormulaCount,
          reviewCount
        };

        const analysis = calculateUsageCostStrategy(metrics);

        await prisma.shopUsageReport.create({
          data: {
            shopId: shop.id,
            period: currentPeriod,
            userCount,
            appointmentCount,
            productCount,
            serviceCount,
            formSubmissionCount,
            portfolioImageCount,
            clientHistoryImageCount,
            clientFormulaCount,
            reviewCount,
            estimatedStorageMB: analysis.estimatedStorageMB,
            suggestedMonthlyFeeUSD: analysis.suggestedMonthlyFeeUSD,
            pricingTierName: analysis.pricingTierName
          }
        });

        reportsGenerated++;
      }

      logger.info(`Generated ${reportsGenerated} hourly usage reports`);
      return reportsGenerated;
    } catch (error) {
      logger.error('Failed to generate hourly reports:', error);
      throw error;
    }
  }
}
