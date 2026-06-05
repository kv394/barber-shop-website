import { z } from 'zod';

export const AuthCallbackSchema = z.object({
  code: z.string().optional(),
  redirect_to: z.string().optional(),
});
