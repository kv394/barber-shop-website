import { z } from 'zod';

export const boothRentSchema = z.object({
  amount: z.coerce.number().min(0, "Amount must be positive"),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  renterId: z.string().min(1, "Renter ID is required"),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).default('PENDING'),
});
