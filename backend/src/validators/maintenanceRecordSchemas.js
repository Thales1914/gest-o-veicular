import { z } from 'zod';
import { mileageSchema, moneySchema, recordDateSchema } from './recordSchemas.js';

export const maintenanceRecordSchema = z.object({
  type: z.enum(['oleo', 'revisao', 'pneus', 'bateria', 'outro']),
  date: recordDateSchema,
  mileage: mileageSchema,
  description: z.string().trim().min(1).max(2000),
  cost: moneySchema.optional(),
  oil_type: z.enum(['mineral', 'semissintetico', 'sintetico']).optional(),
  next_service_mileage: mileageSchema.optional(),
  service_notes: z.string().trim().max(2000).optional(),
  brand: z.string().trim().max(160).optional(),
  warranty_months: z.number().int().min(0).max(2147483647).optional(),
}).strict();
