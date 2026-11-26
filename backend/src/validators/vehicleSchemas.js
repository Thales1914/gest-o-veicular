import { z } from 'zod';

const maximumYear = new Date().getFullYear() + 1;

const plateSchema = z.string()
  .trim()
  .transform((plate) => plate.replace(/[\s-]/g, '').toUpperCase())
  .refine(
    (plate) => /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(plate),
    'Placa deve seguir o formato ABC1234 ou ABC1D23',
  );

export const createVehicleSchema = z.object({
  brand: z.string().trim().min(1, 'Marca é obrigatória').max(80),
  model: z.string().trim().min(1, 'Modelo é obrigatório').max(80),
  year: z.number().int().min(1886).max(maximumYear),
  plate: plateSchema,
  current_mileage: z.number().int().nonnegative('Quilometragem não pode ser negativa').max(2147483647),
}).strict();

export const vehicleIdSchema = z.string().regex(/^[1-9]\d*$/, 'ID do veículo inválido')
  .refine((value) => /^[1-9]\d*$/.test(value) && value.length <= 19
    && BigInt(value) <= 9223372036854775807n, 'ID do veículo inválido');

export const updateVehicleSchema = createVehicleSchema;
