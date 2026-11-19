import type { IpvaInstallment, IpvaStatus } from '../types/ipva';

export function makeIpvaSchedule(
  total: number,
  count: number,
  firstDate: string,
  status: IpvaStatus,
): IpvaInstallment[] {
  if (
    !Number.isFinite(total)
    || total <= 0
    || total > 9999999999.99
    || !Number.isInteger(count)
    || count < 1
    || count > 12
    || !/^\d{4}-\d{2}-\d{2}$/.test(firstDate)
    || Math.round(total * 100) < count
  ) return [];

  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const remainder = cents % count;
  const [year, month, day] = firstDate.split('-').map(Number);

  return Array.from({ length: count }, (_, index) => {
    const monthIndex = month - 1 + index;
    const nextYear = year + Math.floor(monthIndex / 12);
    const nextMonth = monthIndex % 12;
    const lastDay = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate();

    return {
      number: index + 1,
      amount: (base + (index < remainder ? 1 : 0)) / 100,
      due_date: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`,
      status,
    };
  });
}
