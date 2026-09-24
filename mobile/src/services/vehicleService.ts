import type { CreateVehicleInput, UpdateVehicleInput, Vehicle } from '../types/vehicle';
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

  async update(id: string, input: UpdateVehicleInput) {
    const response = await api.put<{ vehicle: Vehicle }>(`/vehicles/${id}`, input);
    return response.data.vehicle;
  },

  async remove(id: string) {
    await api.delete(`/vehicles/${id}`);
  },
};
