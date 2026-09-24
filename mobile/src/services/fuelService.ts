import type { CreateFuelRecordInput, FuelRecord } from '../types/fuelRecord';
import { api } from './api';

export const fuelService = {
  async list(vehicleId: string) {
    const response = await api.get<{ fuel_records: FuelRecord[] }>(`/vehicles/${vehicleId}/fuel-records`);
    return response.data.fuel_records;
  },

  async create(vehicleId: string, input: CreateFuelRecordInput) {
    const response = await api.post<{ fuel_record: FuelRecord }>(`/vehicles/${vehicleId}/fuel-records`, input);
    return response.data.fuel_record;
  },
};
