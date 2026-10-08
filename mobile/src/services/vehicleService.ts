import type { CreateVehicleInput, Vehicle } from '../types/vehicle';
import { api } from './api';

export const vehicleService = {
  async list() {
    const response = await api.get<{ vehicles: Vehicle[] }>('/vehicles');
    return response.data.vehicles;
  },

  async create(input: CreateVehicleInput) {
    const response = await api.post<{ vehicle: Vehicle }>('/vehicles', input);
    return response.data.vehicle;
  },

  async detail(id: string) {
    const response = await api.get<{ vehicle: Vehicle }>(`/vehicles/${id}`);
    return response.data.vehicle;
  },
};
