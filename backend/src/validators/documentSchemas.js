import { z } from 'zod';
import { recordDateSchema } from './recordSchemas.js';

export const documentSchema = z.object({
  type: z.enum(['crlv', 'seguro', 'licenciamento', 'cnh', 'outro']),
  title: z.string().trim().min(1).max(160),
  number: z.string().trim().max(80).optional(),
  issue_date: recordDateSchema.optional(),
  expiry_date: recordDateSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
}).strict().refine(
  ({ issue_date, expiry_date }) => !issue_date || !expiry_date || issue_date <= expiry_date,
  { message: 'O vencimento deve ser igual ou posterior à emissão.', path: ['expiry_date'] },
);
