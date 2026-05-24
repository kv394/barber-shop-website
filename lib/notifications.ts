import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getEmailProvider, getSMSProvider } from '@/lib/messaging-providers';

/**
 * Notification Service — Provider-agnostic delivery engine
 *
 * Email: auto-detects Resend → SendGrid → console (env-based)
 * SMS:   auto-detects Twilio → console (env-based)
 *
 * Set explicit provider with EMAIL_PROVIDER=resend|sendgrid  SMS_PROVIDER=twilio
 */
export class NotificationService {
  // ─── Public API ──────────────────────────────────────────────

  /**
   * Send a notification to a user (records it in DB and dispatches if providers configured)
   */
  static async send({
    shopId,
    userId,
    type,
    channel = 'EMAIL',
    title,
    message,
    scheduledAt,
  }: {
    shopId: string;
    userId: string;
    type: string;
    channel?: string;
    title: string;
    message: string;
    scheduledAt?: Date;
  }) {
    try {
      // Check user notification preferences
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId },
      });
      if (prefs) {
        const shouldSkip =
          (type === 'APPOINTMENT_REMINDER' && !prefs.appointmentReminders) ||
          (type === 'REVIEW_REQUEST' && !prefs.reviewRequests) ||
          (type === 'CAMPAIGN' && !prefs.promotions) ||
          (type === 'REBOOKING_PROMPT' && !prefs.promotions) ||
          (type === 'BIRTHDAY' && !prefs.birthdayMessages) ||
          (type === 'LOYALTY_EARNED' && !prefs.loyaltyUpdates);
        if (shouldSkip) return null;

        // Override channel with user preference if set
        if (prefs.preferredChannel !== 'EMAIL') {
          channel = prefs.preferredChannel; // SMS or BOTH
        }
      }

      const notification = await prisma.notification.create({
        data: {
          shopId,
          userId,
          type,
          channel,
          title,
          message,
          status: scheduledAt ? 'PENDING' : 'PENDING',
          scheduledAt,
        },
      });

      // If not scheduled for later, dispatch immediately
      if (!scheduledAt) {
        await this.dispatch(notification.id, channel, title, message, userId);
      }

      return notification;
    } catch (error) {
      logger.error('Failed to send notification', error);
      return null;
    }
  }

  /**
   * Process all pending scheduled notifications that are due.
   * Also retries failed notifications up to maxRetries.
   */
  static async processScheduled() {
    const now = new Date();

    // 1. Dispatch due scheduled notifications
    const due = await prisma.notification.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: now },
      },
      take: 50,
    });

    let processed = 0;
    for (const n of due) {
      await this.dispatch(n.id, n.channel, n.title, n.message, n.userId);
      processed++;
    }

    // 2. Retry failed notifications (exponential backoff: wait 2^retryCount minutes)
    const retryable = await prisma.notification.findMany({
      where: {
        status: 'FAILED',
        retryCount: { lt: 3 }, // maxRetries
      },
      take: 20,
    });

    for (const n of retryable) {
      const backoffMinutes = Math.pow(2, n.retryCount); // 1, 2, 4 minutes
      const retryAfter = new Date(n.createdAt.getTime() + backoffMinutes * 60 * 1000);
      if (now >= retryAfter) {
        await prisma.notification.update({
          where: { id: n.id },
          data: { status: 'RETRYING', retryCount: { increment: 1 } },
        });
        await this.dispatch(n.id, n.channel, n.title, n.message, n.userId);
        processed++;
      }
    }

    return processed;
  }

  // ─── Scheduling Helpers ──────────────────────────────────────

  /**
   * Schedule appointment reminder (24h before)
   */
  static async scheduleAppointmentReminder(
    shopId: string,
    userId: string,
    appointmentTime: Date,
    serviceName: string,
    shopName: string
  ) {
    const reminderTime = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
    if (reminderTime <= new Date()) return;

    return this.send({
      shopId,
      userId,
      type: 'APPOINTMENT_REMINDER',
      title: `Reminder: Your appointment at ${shopName}`,
      message: `Hi! Just a reminder that you have a ${serviceName} appointment at ${shopName} tomorrow at ${appointmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. See you there! 💈`,
      scheduledAt: reminderTime,
    });
  }

  /**
   * Schedule appointment reminder (1h before)
   */
  static async scheduleAppointmentReminder1Hour(
    shopId: string,
    userId: string,
    appointmentTime: Date,
    serviceName: string,
    shopName: string
  ) {
    const reminderTime = new Date(appointmentTime.getTime() - 60 * 60 * 1000);
    if (reminderTime <= new Date()) return;

    return this.send({
      shopId,
      userId,
      type: 'APPOINTMENT_REMINDER',
      title: `Coming up: ${serviceName} at ${shopName}`,
      message: `Heads up! Your ${serviceName} appointment at ${shopName} is in 1 hour (${appointmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). See you soon! ✂️`,
      scheduledAt: reminderTime,
    });
  }

  /**
   * Send review request after checkout
   */
  static async sendReviewRequest(
    shopId: string,
    userId: string,
    shopName: string,
    _appointmentId: string
  ) {
    return this.send({
      shopId,
      userId,
      type: 'REVIEW_REQUEST',
      title: `How was your visit to ${shopName}?`,
      message: `Thanks for visiting ${shopName}! We'd love to hear about your experience. Leave a quick review to help us improve. ⭐`,
    });
  }

  /**
   * Send booking confirmation email immediately (C8)
   */
  static async sendBookingConfirmation({
    shopId,
    userId,
    shopName,
    serviceName,
    staffName,
    dateTime,
    duration,
    price,
    timezone,
    appointmentId,
  }: {
    shopId: string;
    userId: string;
    shopName: string;
    serviceName: string;
    staffName: string;
    dateTime: Date;
    duration: number;
    price: number;
    timezone: string;
    appointmentId?: string;
  }) {
    const { bookingConfirmationEmail } = await import('@/lib/email-templates');
    const { formatDateTimeInShopTz } = await import('@/lib/timezone');

    const formattedTime = formatDateTimeInShopTz(dateTime, timezone);
    
    // Build the "Add to Calendar" URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://barbersaas.com';
    const calendarUrl = appointmentId ? `${baseUrl}/api/shops/${shopId}/appointments/${appointmentId}/calendar` : undefined;

    const html = bookingConfirmationEmail({
      shopName,
      serviceName,
      staffName,
      dateTime: formattedTime,
      duration,
      price,
      calendarUrl,
    });

    return this.send({
      shopId,
      userId,
      type: 'BOOKING_CONFIRMATION',
      title: `Booking confirmed at ${shopName}`,
      message: html,
    });
  }

  /**
   * Send reschedule confirmation email (C3)
   */
  static async sendRescheduleConfirmation({
    shopId,
    userId,
    shopName,
    serviceName,
    staffName,
    oldDateTime,
    newDateTime,
    duration,
    timezone,
  }: {
    shopId: string;
    userId: string;
    shopName: string;
    serviceName: string;
    staffName: string;
    oldDateTime: Date;
    newDateTime: Date;
    duration: number;
    timezone: string;
  }) {
    const { rescheduleConfirmationEmail } = await import('@/lib/email-templates');
    const { formatDateTimeInShopTz } = await import('@/lib/timezone');

    const html = rescheduleConfirmationEmail({
      shopName,
      serviceName,
      staffName,
      oldDateTime: formatDateTimeInShopTz(oldDateTime, timezone),
      newDateTime: formatDateTimeInShopTz(newDateTime, timezone),
      duration,
    });

    return this.send({
      shopId,
      userId,
      type: 'RESCHEDULE_CONFIRMATION',
      title: `Appointment rescheduled at ${shopName}`,
      message: html,
    });
  }

  // ─── Segmentation Queries ────────────────────────────────────

  /**
   * Find clients who haven't visited in X days
   */
  static async getInactiveClients(shopId: string, inactiveDays: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - inactiveDays);

    const clients = await prisma.user.findMany({
      where: {
        shopId,
        role: 'CLIENT',
        clientAppointments: {
          every: { startTime: { lt: cutoff } },
          some: {},
        },
      },
      select: {
        id: true, name: true, email: true, phone: true,
        clientAppointments: { orderBy: { startTime: 'desc' }, take: 1, select: { startTime: true } },
      },
    });

    return clients.map((c: any) => ({
      ...c,
      lastVisit: c.clientAppointments[0]?.startTime || null,
      daysSinceVisit: c.clientAppointments[0]
        ? Math.floor((Date.now() - c.clientAppointments[0].startTime.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));
  }

  /**
   * Find clients with birthdays this month
   */
  static async getBirthdayClients(shopId: string) {
    const month = new Date().getMonth() + 1;
    const clients = await prisma.user.findMany({
      where: { shopId, role: 'CLIENT', birthday: { not: null } },
      select: { id: true, name: true, email: true, phone: true, birthday: true },
    });
    return clients.filter((c: any) => c.birthday && (c.birthday.getMonth() + 1) === month);
  }

  // ─── Private Dispatch Engine ─────────────────────────────────

  private static async dispatch(
    notificationId: string,
    channel: string,
    title: string,
    message: string,
    userId: string
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true, name: true },
      });
      if (!user) return;

      const results: { channel: string; success: boolean; error?: string }[] = [];

      if (channel === 'EMAIL' || channel === 'BOTH') {
        const provider = getEmailProvider();
        const result = await provider.send(user.email, title, message);
        results.push({ channel: 'EMAIL', ...result });
      }

      if (channel === 'SMS' || channel === 'BOTH') {
        if (user.phone) {
          const provider = getSMSProvider();
          const result = await provider.send(user.phone, message);
          results.push({ channel: 'SMS', ...result });
        }
      }

      const allSucceeded = results.every(r => r.success);
      const anySucceeded = results.some(r => r.success);

      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: allSucceeded ? 'SENT' : anySucceeded ? 'SENT' : 'FAILED',
          sentAt: anySucceeded ? new Date() : undefined,
        },
      });

      // Log failures
      for (const r of results) {
        if (!r.success) {
          logger.error(`Notification ${notificationId} ${r.channel} delivery failed: ${r.error}`);
        }
      }
    } catch (error) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED' },
      }).catch(() => {});
      logger.error('Failed to dispatch notification', error);
    }
  }
}
