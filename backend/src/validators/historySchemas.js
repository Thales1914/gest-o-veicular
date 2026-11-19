import { z } from 'zod';
import { recordDateSchema } from './recordSchemas.js';

export const historyQuerySchema = z.object({
  start_date: recordDateSchema.optional(),
  end_date: recordDateSchema.optional(),
  category: z.enum(['all', 'fuel', 'maintenance']).default('all'),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(30),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(100000)).default(0),
}).strict().refine(
  ({ start_date, end_date }) => !start_date || !end_date || start_date <= end_date,
  { message: 'A data final deve ser igual ou posterior à inicial.', path: ['end_date'] },
);
