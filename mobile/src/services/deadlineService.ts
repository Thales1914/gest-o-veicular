import type { DeadlineSummary } from '../types/deadline';
import { api } from './api';

export const deadlineService = {
  async summary(vehicleId: string, days = 30) {
    const response = await api.get<{ deadlines: DeadlineSummary }>(`/vehicles/${vehicleId}/deadlines`, { params: { days } });
    return response.data.deadlines;
  },
};
