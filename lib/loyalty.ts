import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// ─── Tier Definitions ──────────────────────────────────────────────

export interface LoyaltyTier {
  name: string;
  minPoints: number;      // Lifetime points threshold to reach this tier
  earnMultiplier: number;  // Multiplier on base earn rate (1 = normal, 1.5 = 50% bonus)
  perks: string;           // Description of tier perks
}

const DEFAULT_TIERS: LoyaltyTier[] = [
  { name: 'Bronze',   minPoints: 0,    earnMultiplier: 1,   perks: 'Standard rewards' },
  { name: 'Silver',   minPoints: 200,  earnMultiplier: 1.25, perks: 'Priority booking, 5% extra discount' },
  { name: 'Gold',     minPoints: 500,  earnMultiplier: 1.5,  perks: 'Free product per visit, birthday bonus' },
  { name: 'Platinum', minPoints: 1000, earnMultiplier: 2,    perks: 'VIP treatment, double points, exclusive offers' },
];

// ─── Loyalty Service ───────────────────────────────────────────────

export class LoyaltyService {

  /**
   * Parse tiers from a loyalty program (JSON field) or return defaults
   */
  static getTiers(program: { tiers?: any } | null): LoyaltyTier[] {
    if (!program?.tiers) return DEFAULT_TIERS;
    try {
      const parsed = typeof program.tiers === 'string' ? JSON.parse(program.tiers) : program.tiers;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return DEFAULT_TIERS;
  }

  /**
   * Calculate which tier a member belongs to based on lifetime points
   */
  static calculateTier(lifetimePoints: number, tiers: LoyaltyTier[]): LoyaltyTier {
    const sorted = [...tiers].sort((a, b) => b.minPoints - a.minPoints);
    return sorted.find(t => lifetimePoints >= t.minPoints) || sorted[sorted.length - 1];
  }

  /**
   * Get or create loyalty account for a client at a shop
   */
  static async getOrCreateAccount(userId: string, shopId: string) {
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId_shopId: { userId, shopId } },
    });

    if (!account) {
      const program = await prisma.loyaltyProgram.findUnique({ where: { shopId } });
      if (!program?.isActive) return null;

      account = await prisma.loyaltyAccount.create({
        data: { userId, shopId, currentTier: 'Bronze' },
      });
    }

    return account;
  }

  /**
   * Award points after a completed appointment (visit + spend), applying tier multiplier
   */
  static async awardPointsForCheckout(
    userId: string,
    shopId: string,
    totalAmount: number,
    appointmentId: string
  ) {
    try {
      const program = await prisma.loyaltyProgram.findUnique({ where: { shopId } });
      if (!program?.isActive) return null;

      const account = await this.getOrCreateAccount(userId, shopId);
      if (!account) return null;

      const tiers = this.getTiers(program);
      const currentTier = this.calculateTier(account.lifetimePoints, tiers);

      // Apply tier earn multiplier
      const baseVisitPoints = program.pointsPerVisit;
      const baseSpendPoints = Math.floor(totalAmount * program.pointsPerDollar);
      const multiplier = currentTier.earnMultiplier;

      const visitPoints = Math.floor(baseVisitPoints * multiplier);
      const spendPoints = Math.floor(baseSpendPoints * multiplier);
      const totalPoints = visitPoints + spendPoints;

      // Calculate point expiry date
      const expiresAt = program.pointExpiryDays > 0
        ? new Date(Date.now() + program.pointExpiryDays * 24 * 60 * 60 * 1000)
        : null;

      const transactions: any[] = [
        prisma.loyaltyTransaction.create({
          data: {
            loyaltyAccountId: account.id,
            points: visitPoints,
            type: 'EARN_VISIT',
            description: `Visit bonus (${currentTier.name} ${multiplier}x)`,
            appointmentId,
            expiresAt,
          },
        }),
      ];

      if (spendPoints > 0) {
        transactions.push(
          prisma.loyaltyTransaction.create({
            data: {
              loyaltyAccountId: account.id,
              points: spendPoints,
              type: 'EARN_SPEND',
              description: `$${totalAmount.toFixed(2)} spent (${currentTier.name} ${multiplier}x)`,
              appointmentId,
              expiresAt,
            },
          })
        );
      }

      // Update account balance + lifetime points, then recalc tier
      const newLifetime = account.lifetimePoints + totalPoints;
      const newTier = this.calculateTier(newLifetime, tiers);

      transactions.push(
        prisma.loyaltyAccount.update({
          where: { id: account.id },
          data: {
            pointsBalance: { increment: totalPoints },
            totalEarned: { increment: totalPoints },
            lifetimePoints: { increment: totalPoints },
            currentTier: newTier.name,
          },
        })
      );

      await prisma.$transaction(transactions);

      return {
        pointsEarned: totalPoints,
        newBalance: account.pointsBalance + totalPoints,
        tier: newTier.name,
        tierUpgrade: newTier.name !== account.currentTier ? newTier.name : null,
        multiplier,
      };
    } catch (error) {
      logger.error('Failed to award loyalty points', error);
      return null;
    }
  }

  /**
   * Redeem points for a discount.
   * SECURITY: Uses a serializable transaction to prevent double-spend race conditions.
   */
  static async redeemPoints(userId: string, shopId: string) {
    const program = await prisma.loyaltyProgram.findUnique({ where: { shopId } });
    if (!program?.isActive) throw new Error('Loyalty program is not active');

    const pointsToRedeem = program.redeemThreshold;
    const discountValue = program.redeemValue;

    // Atomic check-and-deduct inside a serializable transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const account = await tx.loyaltyAccount.findUnique({
        where: { userId_shopId: { userId, shopId } },
      });
      if (!account) throw new Error('No loyalty account found');

      if (account.pointsBalance < pointsToRedeem) {
        throw new Error(
          `Need ${pointsToRedeem} points to redeem. Current balance: ${account.pointsBalance}`
        );
      }

      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          points: -pointsToRedeem,
          type: 'REDEEM',
          description: `Redeemed ${pointsToRedeem} pts for $${discountValue.toFixed(2)} off`,
        },
      });

      await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          pointsBalance: { decrement: pointsToRedeem },
          totalRedeemed: { increment: pointsToRedeem },
        },
      });

      return {
        pointsRedeemed: pointsToRedeem,
        discountValue,
        remainingBalance: account.pointsBalance - pointsToRedeem,
      };
    }, { isolationLevel: 'Serializable' });

    return result;
  }

  /**
   * Award referral bonus points
   */
  static async awardReferralBonus(userId: string, shopId: string, points: number) {
    const account = await this.getOrCreateAccount(userId, shopId);
    if (!account) return;

    const program = await prisma.loyaltyProgram.findUnique({ where: { shopId } });
    const expiresAt = program?.pointExpiryDays && program.pointExpiryDays > 0
      ? new Date(Date.now() + program.pointExpiryDays * 24 * 60 * 60 * 1000)
      : null;

    await prisma.$transaction([
      prisma.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          points,
          type: 'REFERRAL_BONUS',
          description: `Referral bonus: ${points} points`,
          expiresAt,
        },
      }),
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          pointsBalance: { increment: points },
          totalEarned: { increment: points },
          lifetimePoints: { increment: points },
        },
      }),
    ]);
  }

  /**
   * Process point expiry — deduct expired points from balances.
   * Called by the cron endpoint.
   */
  static async processPointExpiry(): Promise<number> {
    const now = new Date();

    // Find all un-expired earn transactions that have passed their expiresAt
    // and haven't already been matched with an EXPIRY deduction
    const expiredTransactions = await prisma.loyaltyTransaction.findMany({
      where: {
        expiresAt: { lte: now },
        points: { gt: 0 }, // Only earned (positive) points can expire
        type: { notIn: ['EXPIRY', 'REDEEM'] },
      },
      include: { loyaltyAccount: true },
      take: 100,
    });

    if (expiredTransactions.length === 0) return 0;

    let totalExpired = 0;

    for (const tx of expiredTransactions) {
      // Deduct from the account
      const deduction = tx.points;

      await prisma.$transaction([
        // Mark the original transaction as processed by setting expiresAt to past
        prisma.loyaltyTransaction.update({
          where: { id: tx.id },
          data: { expiresAt: null }, // null = processed
        }),
        // Create expiry deduction
        prisma.loyaltyTransaction.create({
          data: {
            loyaltyAccountId: tx.loyaltyAccountId,
            points: -deduction,
            type: 'EXPIRY',
            description: `${deduction} points expired`,
          },
        }),
        // Update balance (don't go below 0)
        prisma.loyaltyAccount.update({
          where: { id: tx.loyaltyAccountId },
          data: {
            pointsBalance: {
              decrement: Math.min(deduction, tx.loyaltyAccount.pointsBalance),
            },
          },
        }),
      ]);

      totalExpired += deduction;
    }

    return totalExpired;
  }

  /**
   * Get client analytics for a shop
   */
  static async getClientAnalytics(shopId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [totalClients, activeClients, newClients, atRiskClients] = await Promise.all([
      prisma.user.count({
        where: { role: 'CLIENT', clientAppointments: { some: { shopId, status: 'COMPLETED' } } },
      }),
      prisma.user.count({
        where: { role: 'CLIENT', clientAppointments: { some: { shopId, status: 'COMPLETED', startTime: { gte: thirtyDaysAgo } } } },
      }),
      prisma.user.count({
        where: { role: 'CLIENT', createdAt: { gte: thirtyDaysAgo }, clientAppointments: { some: { shopId } } },
      }),
      prisma.user.count({
        where: {
          role: 'CLIENT',
          clientAppointments: {
            some: { shopId, status: 'COMPLETED' },
            every: { OR: [{ shopId: { not: shopId } }, { startTime: { lt: sixtyDaysAgo } }] },
          },
        },
      }),
    ]);

    return { totalClients, activeClients, newClients, atRiskClients };
  }
}
