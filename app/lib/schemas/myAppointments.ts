import { z } from 'zod';

export const MyAppointmentsSchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(15),
  upcomingCursor: z.string().optional(),
  pastCursor: z.string().optional(),
});
