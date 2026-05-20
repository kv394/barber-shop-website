import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { NotificationService } from '@/lib/notifications';

/**
 * Rebooking Prompt Service
 *
 * Analyzes each client's appointment history to compute their average visit
 * interval, then auto-drafts a personalized reminder when they're overdue.
 *
 * Runs as part of the cron job (daily).
 */
export class RebookingService {
  /** Minimum completed appointments to compute a reliable interval */
  private static MIN_APPOINTMENTS = 3;

  /** Send a rebooking prompt if the client is this % overdue */
  private static OVERDUE_THRESHOLD = 1.1; // 10% past average

  /** Don't re-send a rebooking prompt within this many days */
  private static DEDUP_DAYS = 14;

  /**
   * Process all shops — find overdue clients and queue rebooking prompts.
   * Returns total number of prompts queued.
   */
  static async processAllShops(): Promise<number> {
    let totalQueued = 0;

    try {
      // Get all active shops
      const shops = await prisma.shop.findMany({
        select: { id: true, name: true, subdomain: true, customDomain: true },
      });

      for (const shop of shops) {
        try {
          const queued = await this.processShop(shop);
          totalQueued += queued;
        } catch (err) {
          logger.error(`Rebooking prompts failed for shop ${shop.id}:`, err);
        }
      }
    } catch (err) {
      logger.error('RebookingService.processAllShops failed:', err);
    }

    return totalQueued;
  }

  /**
   * Process a single shop — find overdue clients and send prompts.
   */
  private static async processShop(shop: {
    id: string;
    name: string;
    subdomain: string | null;
    customDomain: string | null;
  }): Promise<number> {
    let queued = 0;

    // Find all clients who have at least MIN_APPOINTMENTS completed visits
    const clients = await prisma.user.findMany({
      where: {
        shopId: shop.id,
        role: 'CLIENT',
        clientAppointments: {
          some: { status: 'COMPLETED' },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        clientAppointments: {
          where: { status: 'COMPLETED' },
          orderBy: { startTime: 'desc' },
          take: 10, // Last 10 visits for interval calculation
          select: {
            startTime: true,
            service: { select: { name: true } },
          },
        },
      },
    });

    const now = Date.now();
    const dedupCutoff = new Date(now - this.DEDUP_DAYS * 24 * 60 * 60 * 1000);

    for (const client of clients) {
      const appointments = client.clientAppointments;
      if (appointments.length < this.MIN_APPOINTMENTS) continue;

      // Compute average interval between visits (in days)
      const intervals: number[] = [];
      for (let i = 0; i < appointments.length - 1; i++) {
        const diff = appointments[i].startTime.getTime() - appointments[i + 1].startTime.getTime();
        intervals.push(diff / (1000 * 60 * 60 * 24)); // Convert to days
      }

      const avgInterval = intervals.reduce((sum, d) => sum + d, 0) / intervals.length;
      if (avgInterval <= 0 || avgInterval > 180) continue; // Skip unreasonable intervals

      // How long since their last visit?
      const lastVisit = appointments[0].startTime;
      const daysSinceLast = (now - lastVisit.getTime()) / (1000 * 60 * 60 * 24);

      // Check if they're overdue
      if (daysSinceLast < avgInterval * this.OVERDUE_THRESHOLD) continue;

      // Dedup: check if we already sent a REBOOKING_PROMPT recently
      const existingPrompt = await prisma.notification.findFirst({
        where: {
          shopId: shop.id,
          userId: client.id,
          type: 'REBOOKING_PROMPT',
          createdAt: { gte: dedupCutoff },
        },
      });
      if (existingPrompt) continue;

      // Build personalized message
      const lastService = appointments[0].service?.name || 'visit';
      const roundedDays = Math.round(daysSinceLast);
      const avgDaysRounded = Math.round(avgInterval);

      const bookingUrl = shop.customDomain
        ? `https://${shop.customDomain}`
        : shop.subdomain
        ? `https://${shop.subdomain}.barbersaas.com`
        : '';

      const message = `Hi ${client.name?.split(' ')[0] || 'there'}! It's been ${roundedDays} days since your last ${lastService} at ${shop.name}. You usually come in every ${avgDaysRounded} days — time for a fresh look? ${bookingUrl ? `Book now: ${bookingUrl}` : ''} 💈`;

      await NotificationService.send({
        shopId: shop.id,
        userId: client.id,
        type: 'REBOOKING_PROMPT',
        channel: 'SMS',
        title: `Time for a trim at ${shop.name}?`,
        message,
      });

      queued++;
    }

    return queued;
  }
}
