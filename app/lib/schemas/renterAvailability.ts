import { z } from 'zod';

export const RenterAvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  duration: z.coerce.number().int().positive().default(30),
});
