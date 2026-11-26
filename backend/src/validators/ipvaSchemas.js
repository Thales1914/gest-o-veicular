import { z } from 'zod';
import { moneySchema, recordDateSchema } from './recordSchemas.js';
import { buildInstallments } from '../utils/ipvaInstallments.js';

const installmentSchema = z.object({
  number: z.number().int().min(1).max(12),
  amount: moneySchema.refine(value => value > 0, 'O valor da parcela deve ser positivo'),
  due_date: recordDateSchema,
  status: z.enum(['pendente', 'pago']),
}).strict();

export const ipvaSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  total_value: moneySchema.refine((value) => value > 0, 'O valor deve ser positivo'),
  installments: z.number().int().min(1).max(12),
  due_date: recordDateSchema,
  status: z.enum(['pendente', 'pago']),
  notes: z.string().trim().max(2000).optional(),
  installment_details: z.array(installmentSchema).min(1).max(12).optional(),
}).strict().superRefine((input, context) => {
  if (!Number.isInteger(input.installments) || input.installments < 1 || input.installments > 12
    || !Number.isFinite(input.total_value) || !recordDateSchema.safeParse(input.due_date).success) return;
  const installments = input.installment_details ?? buildInstallments(input);
  const issue = message => context.addIssue({ code: 'custom', path: ['installment_details'], message });
  if (installments.length !== input.installments) issue('Informe os dados de todas as parcelas.');
  if (installments.some((item, index) => item.number !== index + 1)) issue('As parcelas devem estar numeradas em sequência.');
  if (installments.some(item => item.amount <= 0 || !recordDateSchema.safeParse(item.due_date).success)) issue('Informe valor e vencimento válidos para cada parcela.');
  if (installments.reduce((total, item) => total + Math.round(item.amount * 100), 0) !== Math.round(input.total_value * 100)) issue('A soma das parcelas deve ser igual ao valor total.');
  if (installments[0]?.due_date !== input.due_date) issue('O vencimento inicial deve ser o da primeira parcela.');
  if (installments.some((item, index) => index > 0 && item.due_date < installments[index - 1].due_date)) issue('Os vencimentos devem estar em ordem.');
  if ((installments.every(item => item.status === 'pago') ? 'pago' : 'pendente') !== input.status) issue('O status geral deve refletir o pagamento das parcelas.');
}).transform(input => ({ ...input, installment_details: input.installment_details ?? buildInstallments(input) }));
