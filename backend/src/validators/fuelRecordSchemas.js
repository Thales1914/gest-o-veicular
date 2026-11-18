import { z } from 'zod';
import { mileageSchema, moneySchema, recordDateSchema } from './recordSchemas.js';

export const fuelRecordSchema = z.object({
  date: recordDateSchema,
  mileage: mileageSchema,
  liters: z.number().positive().max(999999999.999).multipleOf(0.001),
  total_price: moneySchema.refine((value) => value > 0, 'O valor deve ser positivo'),
  fuel_type: z.enum(['gasolina', 'etanol', 'diesel', 'flex']),
  full_tank: z.boolean(),
  gas_station: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(2000).optional(),
}).strict();
