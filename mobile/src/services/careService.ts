import { api } from './api';
import type { CareSummary } from '../types/care';

export const careService = {
  async summary(vehicleId: string) {
    const response = await api.get<{ care: CareSummary }>(`/vehicles/${vehicleId}/care`);
    return response.data.care;
  },
};
