import type { MaintenanceType } from '../types/maintenanceRecord';

export const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  oleo: 'Troca de óleo',
  revisao: 'Revisão',
  pneus: 'Pneus',
  bateria: 'Bateria',
  outro: 'Outro',
};
