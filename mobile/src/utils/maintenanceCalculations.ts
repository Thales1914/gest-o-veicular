import type { MaintenanceType, OilType } from '../types/maintenanceRecord';

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
