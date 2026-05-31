import { getTenantClient } from '@/lib/prisma';

/** Generate a sales report for a date range */
export async function generateSalesReport(args: { startDate: string; endDate: string }, shopId: string) {
  const db = getTenantClient(shopId);
  const sales = await db.payment.findMany({
    where: {
      createdAt: { gte: new Date(args.startDate), lte: new Date(args.endDate) },
      status: 'COMPLETED',
    },
    select: { amount: true, createdAt: true },
  });
  const total = sales.reduce((sum: number, s: any) => sum + Number(s.amount), 0);
  return { total, count: sales.length, period: { start: args.startDate, end: args.endDate } };
}

/** Generate a staff performance report for a date range */
export async function generateStaffReport(args: { startDate: string; endDate: string }, shopId: string) {
  const db = await getTenantClient(shopId);
  const staffActivities = await db.appointment.groupBy({
    by: ['staffId'],
    where: { startTime: { gte: new Date(args.startDate), lte: new Date(args.endDate) }, shopId },
    _count: { _all: true },
  });
  return staffActivities;
}
