export function formatMileage(value: number) {
  return `${new Intl.NumberFormat('pt-BR').format(value)} km`;
}

export function normalizePlate(value: string) {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatLiters(value: number) {
  return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(value)} L`;
}

export function formatDateBR(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export function toIsoDate(brDate: string) {
  const [day, month, year] = brDate.split('/');
  return `${year}-${month}-${day}`;
}

export function parseDecimal(value: string) {
  return Number(value.replace(',', '.'));
}
