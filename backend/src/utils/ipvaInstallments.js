export function buildInstallments(input) {
  const cents = Math.round(input.total_value * 100);
  const base = Math.floor(cents / input.installments);
  const remainder = cents % input.installments;
  const [year, month, day] = input.due_date.split('-').map(Number);
  return Array.from({ length: input.installments }, (_, index) => {
    const monthIndex = month - 1 + index;
    const targetYear = year + Math.floor(monthIndex / 12);
    const targetMonth = monthIndex % 12;
    const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    return {
      number: index + 1,
      amount: (base + (index < remainder ? 1 : 0)) / 100,
      due_date: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`,
      status: input.status,
    };
  });
}
