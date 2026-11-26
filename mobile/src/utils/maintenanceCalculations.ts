import type { MaintenanceRecord, MaintenanceType, OilType } from '../types/maintenanceRecord';

export const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  oleo: 'Troca de óleo',
  revisao: 'Revisão',
  pneus: 'Pneus',
  bateria: 'Bateria',
  outro: 'Outro',
};

export const oilTypeLabels: Record<OilType, string> = {
  mineral: 'Mineral',
  semissintetico: 'Semissintético',
  sintetico: 'Sintético',
};

export type MaintenanceHistorySummary = {
  totalSpent: number;
  recordCount: number;
  lastServiceDate: string | null;
};

export function summarizeMaintenanceHistory(records: MaintenanceRecord[]): MaintenanceHistorySummary {
  const totalSpent = records.reduce((total, record) => total + (record.cost ?? 0), 0);
  const lastServiceDate = records.reduce<string | null>(
    (latest, record) => (!latest || record.date > latest ? record.date : latest),
    null,
  );

  return { totalSpent, recordCount: records.length, lastServiceDate };
}
