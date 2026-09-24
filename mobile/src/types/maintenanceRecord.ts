export type MaintenanceType = 'oleo' | 'revisao' | 'pneus' | 'bateria' | 'outro';

export type OilType = 'mineral' | 'semissintetico' | 'sintetico';

export type MaintenanceRecord = {
  id: string;
  vehicle_id: string;
  type: MaintenanceType;
  date: string;
  mileage: number;
  description: string;
  cost?: number;
  oil_type?: OilType;
  next_service_mileage?: number;
  service_notes?: string;
  brand?: string;
  warranty_months?: number;
  created_at: string;
  updated_at: string;
};

export type CreateMaintenanceInput = {
  type: MaintenanceType;
  date: string;
  mileage: number;
  description: string;
  cost?: number;
  oil_type?: OilType;
  next_service_mileage?: number;
  service_notes?: string;
  brand?: string;
  warranty_months?: number;
};
