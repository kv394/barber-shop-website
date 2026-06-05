import { z } from 'zod';

export const BlackoutCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  reason: z.string().optional(),
});

export const BlackoutDeleteSchema = z.object({
  id: z.string(),
});
