import type { ExpensePeriod } from '../types/expense';

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function monthPeriod(previous = false, today = new Date()): ExpensePeriod {
  const month = today.getMonth() - (previous ? 1 : 0);
  return {
    start_date: isoDate(new Date(today.getFullYear(), month, 1)),
    end_date: isoDate(previous ? new Date(today.getFullYear(), month + 1, 0) : today),
  };
}

export function parseExpenseDate(value: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
  const [day, month, year] = value.split('/').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (year < 1900 || parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
  return isoDate(parsed);
}
