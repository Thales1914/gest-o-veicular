const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Quantos dias faltam até a data (negativo = já venceu), usando o calendário local.
export function daysUntil(isoDate: string, today = new Date()) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.UTC(year, month - 1, day) - start) / DAY_IN_MS);
}

export function dueLabel(days: number) {
  if (days < -1) return `Venceu há ${-days} dias`;
  if (days === -1) return 'Venceu ontem';
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  return `Vence em ${days} dias`;
}

export type DueStatus = 'vencido' | 'proximo' | 'em_dia';

export function dueStatus(days: number, warningDays = 30): DueStatus {
  if (days < 0) return 'vencido';
  if (days <= warningDays) return 'proximo';
  return 'em_dia';
}
