import { z } from 'zod';

export const recordIdSchema = z.string().regex(/^[1-9]\d*$/, 'ID inválido')
  .refine((value) => /^[1-9]\d*$/.test(value) && value.length <= 19
    && BigInt(value) <= 9223372036854775807n, 'ID inválido');

export const recordDateSchema = z.iso.date('Informe uma data válida no formato AAAA-MM-DD')
  .refine((value) => value >= '1900-01-01', 'A data deve ser a partir de 1900');

export const mileageSchema = z.number().int().min(0).max(2147483647);
export const moneySchema = z.number().min(0).max(9999999999.99).multipleOf(0.01);

export const periodSchema = z.object({
  start_date: recordDateSchema.optional(),
  end_date: recordDateSchema.optional(),
}).strict().refine(
  ({ start_date, end_date }) => !start_date || !end_date || start_date <= end_date,
  { message: 'A data final deve ser igual ou posterior à inicial.', path: ['end_date'] },
);
