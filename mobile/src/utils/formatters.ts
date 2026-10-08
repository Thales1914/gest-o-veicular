export function formatMileage(value: number) {
  return `${new Intl.NumberFormat('pt-BR').format(value)} km`;
}

export function normalizePlate(value: string) {
  return value.replace(/[\s-]/g, '').toUpperCase();
}
