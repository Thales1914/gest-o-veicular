export type MaintenanceType = 'oleo' | 'revisao' | 'pneus' | 'bateria' | 'outro';

export type MaintenanceRecord = {
  id: string;
  vehicle_id: string;
  type: MaintenanceType;
  date: string;
  mileage: number;
  description: string;
  cost?: number;
  created_at: string;
  updated_at: string;
};

export type CreateMaintenanceInput = {
  type: MaintenanceType;
  date: string;
  mileage: number;
  description: string;
  cost?: number;
};
