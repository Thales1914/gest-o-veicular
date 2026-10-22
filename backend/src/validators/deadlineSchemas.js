import { z } from 'zod';

export const deadlineQuerySchema = z.object({
  days: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(365)).default(30),
}).strict();
