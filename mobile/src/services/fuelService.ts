import type { CreateFuelRecordInput, FuelRecord } from '../types/fuelRecord';
import { api } from './api';

export const fuelService = {
  async detail(vehicleId: string, recordId: string) {
    const response = await api.get<{ fuel_record: FuelRecord }>(`/vehicles/${vehicleId}/fuel-records/${recordId}`);
    return response.data.fuel_record;
  },

  async update(vehicleId: string, recordId: string, input: CreateFuelRecordInput) {
    const response = await api.put<{ fuel_record: FuelRecord }>(`/vehicles/${vehicleId}/fuel-records/${recordId}`, input);
    return response.data.fuel_record;
  },

  async remove(vehicleId: string, recordId: string) {
    await api.delete(`/vehicles/${vehicleId}/fuel-records/${recordId}`);
  },

  async list(vehicleId: string) {
    const response = await api.get<{ fuel_records: FuelRecord[] }>(`/vehicles/${vehicleId}/fuel-records`);
    return response.data.fuel_records;
  },

  async create(vehicleId: string, input: CreateFuelRecordInput) {
    const response = await api.post<{ fuel_record: FuelRecord }>(`/vehicles/${vehicleId}/fuel-records`, input);
    return response.data.fuel_record;
  },
};
