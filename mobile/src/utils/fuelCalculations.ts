import type { FuelRecord, FuelType } from '../types/fuelRecord';

export const fuelTypeLabels: Record<FuelType, string> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  diesel: 'Diesel',
  flex: 'Flex',
};

export function pricePerLiter(record: FuelRecord) {
  return record.liters > 0 ? record.total_price / record.liters : 0;
}

/**
 * Calcula o consumo (km/l) de um abastecimento com tanque cheio, usando a
 * distância percorrida desde o abastecimento anterior também com tanque
 * cheio e o total de litros colocados nesse intervalo (incluindo
 * abastecimentos parciais no meio do caminho).
 *
 * Retorna null quando não há um abastecimento anterior com tanque cheio
 * para comparar, ou quando o registro atual não é de tanque cheio.
 */
export function calculateConsumption(records: FuelRecord[], recordId: string): number | null {
  const sorted = [...records].sort((a, b) => (
    a.date === b.date ? a.mileage - b.mileage : a.date.localeCompare(b.date)
  ));
  const index = sorted.findIndex((record) => record.id === recordId);
  if (index === -1) return null;

  const current = sorted[index];
  if (!current.full_tank) return null;

  for (let previousIndex = index - 1; previousIndex >= 0; previousIndex -= 1) {
    if (!sorted[previousIndex].full_tank) continue;

    const distance = current.mileage - sorted[previousIndex].mileage;
    if (distance <= 0) return null;

    const litersSincePrevious = sorted
      .slice(previousIndex + 1, index + 1)
      .reduce((total, record) => total + record.liters, 0);
    if (litersSincePrevious <= 0) return null;

    return distance / litersSincePrevious;
  }

  return null;
}
