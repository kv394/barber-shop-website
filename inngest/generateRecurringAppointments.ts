import { inngest } from './client';
import { prisma, getTenantClient } from '@/lib/prisma';

/**
 * Calculate the next occurrence date based on a recurrence rule.
 * Supports: WEEKLY, BIWEEKLY, EVERY_3_WEEKS, MONTHLY.
 */
function getNextOccurrence(baseDate: Date, rule: string): Date {
  const next = new Date(baseDate);

  switch (rule) {
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'EVERY_3_WEEKS':
      next.setDate(next.getDate() + 21);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      // Fallback to weekly for unknown rules
      next.setDate(next.getDate() + 7);
      break;
  }

  return next;
}

/**
 * Daily cron job (6 AM UTC) that finds all recurring parent appointments
 * and generates the next occurrence if it doesn't already exist.
 */
export const generateRecurringAppointments = inngest.createFunction(
  { id: 'generate-recurring-appointments', triggers: [{ cron: '0 6 * * *' }] },
  async ({ step }) => {
    const result = await step.run('generate-recurring-children', async () => {
      // Find all recurring parent appointments that are active (SCHEDULED or COMPLETED)
      const recurringParents = await prisma.appointment.findMany({
        where: {
          isRecurringParent: true,
          recurrenceRule: { not: null },
          status: { in: ['SCHEDULED', 'COMPLETED'] },
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          serviceId: true,
          staffId: true,
          userId: true,
          shopId: true,
          recurrenceRule: true,
          recurringGroupId: true,
          serviceLocation: true,
          notes: true,
        },
      });

      let created = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const parent of recurringParents) {
        try {
          if (!parent.recurrenceRule || !parent.recurringGroupId) {
            skipped++;
            continue;
          }

          // Find the latest appointment in this recurring group to calculate the next date from
          const latestInGroup = await prisma.appointment.findFirst({
            where: {
              recurringGroupId: parent.recurringGroupId,
              status: { notIn: ['CANCELLED'] },
            },
            orderBy: { startTime: 'desc' },
            select: { startTime: true, endTime: true },
          });

          const baseStartTime = latestInGroup?.startTime ?? parent.startTime;
          const baseEndTime = latestInGroup?.endTime ?? parent.endTime;
          const duration = baseEndTime.getTime() - baseStartTime.getTime();

          const nextStartTime = getNextOccurrence(baseStartTime, parent.recurrenceRule);
          const nextEndTime = new Date(nextStartTime.getTime() + duration);

          // Only generate future appointments (don't backfill past dates)
          if (nextStartTime <= new Date()) {
            skipped++;
            continue;
          }

          // Deduplicate: check if an appointment already exists for this group on this date
          const startOfDay = new Date(nextStartTime);
          startOfDay.setUTCHours(0, 0, 0, 0);
          const endOfDay = new Date(nextStartTime);
          endOfDay.setUTCHours(23, 59, 59, 999);

          const tenantClient = getTenantClient(parent.shopId);

          const existingAppointment = await tenantClient.appointment.findFirst({
            where: {
              recurringGroupId: parent.recurringGroupId,
              startTime: { gte: startOfDay, lte: endOfDay },
            },
          });

          if (existingAppointment) {
            skipped++;
            continue;
          }

          // Create the child appointment via the tenant-scoped client
          await tenantClient.appointment.create({
            data: {
              shopId: parent.shopId,
              serviceId: parent.serviceId,
              staffId: parent.staffId,
              userId: parent.userId,
              startTime: nextStartTime,
              endTime: nextEndTime,
              status: 'SCHEDULED',
              isRecurringParent: false,
              recurrenceRule: parent.recurrenceRule,
              recurringGroupId: parent.recurringGroupId,
              serviceLocation: parent.serviceLocation,
              notes: parent.notes,
            },
          });

          created++;
        } catch (err: any) {
          errors.push(`Parent ${parent.id}: ${err.message}`);
        }
      }

      return {
        totalParents: recurringParents.length,
        created,
        skipped,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      };
    });

    return result;
  }
);
