import type { CreateIpvaInput, IpvaRecord } from '../types/ipva';
import { api } from './api';

export const ipvaService = {
  async list(vehicleId: string) {
    const response = await api.get<{ ipva_records: IpvaRecord[] }>(`/vehicles/${vehicleId}/ipva`);
    return response.data.ipva_records;
  },

  async create(vehicleId: string, input: CreateIpvaInput) {
    const response = await api.post<{ ipva_record: IpvaRecord }>(`/vehicles/${vehicleId}/ipva`, input);
    return response.data.ipva_record;
  },

  async update(vehicleId: string, ipvaId: string, input: CreateIpvaInput) {
    const response = await api.put<{ ipva_record: IpvaRecord }>(`/vehicles/${vehicleId}/ipva/${ipvaId}`, input);
    return response.data.ipva_record;
  },

  async remove(vehicleId: string, ipvaId: string) {
    await api.delete(`/vehicles/${vehicleId}/ipva/${ipvaId}`);
  },
};
