import type { CreateMaintenanceInput, MaintenanceRecord } from '../types/maintenanceRecord';
import { api } from './api';

export const maintenanceService = {
  async list(vehicleId: string) {
    const response = await api.get<{ maintenance_records: MaintenanceRecord[] }>(`/vehicles/${vehicleId}/maintenance-records`);
    return response.data.maintenance_records;
  },

  async create(vehicleId: string, input: CreateMaintenanceInput) {
    const response = await api.post<{ maintenance_record: MaintenanceRecord }>(`/vehicles/${vehicleId}/maintenance-records`, input);
    return response.data.maintenance_record;
  },
};
