import { getTenantClient } from '@/lib/prisma';

/** Create a new invoice */
export async function createInvoice(args: { appointmentId: string; amount: number; description: string }, shopId: string) {
  const db = await getTenantClient(shopId);
  const invoice = await db.payment.create({
    data: {
      appointmentId: args.appointmentId,
      amount: args.amount,
      method: 'OTHER',
      status: 'PENDING',
    },
  });
  return invoice;
}

/** Refund a payment */
export async function refundPayment(args: { transactionId: string }, shopId: string) {
  const db = await getTenantClient(shopId);
  const payment = await db.payment.update({
    where: { id: args.transactionId },
    data: { status: 'REFUNDED' },
  });
  return payment;
}

/** List transactions */
export async function listTransactions(args: { startDate?: string; endDate?: string }, shopId: string) {
  const db = await getTenantClient(shopId);
  const where: any = {};
  if (args.startDate) where.createdAt = { gte: new Date(args.startDate) };
  if (args.endDate) {
    where.createdAt = where.createdAt ? { ...where.createdAt, lte: new Date(args.endDate) } : { lte: new Date(args.endDate) };
  }
  const transactions = await db.payment.findMany({ where });
  return transactions;
}
