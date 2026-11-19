import type { MaintenanceType } from './maintenanceRecord';

export type CareItem = {
  type: Exclude<MaintenanceType, 'outro'>;
  record_id: string | null;
  next_service_mileage: number | null;
  remaining_km: number | null;
  status: 'unscheduled' | 'overdue' | 'soon' | 'upcoming';
};

export type CareSummary = {
  vehicle_id: string;
  current_mileage: number;
  warning_threshold_km: number;
  items: CareItem[];
};
