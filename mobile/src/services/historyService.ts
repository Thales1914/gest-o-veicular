import { api } from './api';
import type { HistoryQuery, VehicleHistory } from '../types/history';

export const historyService = {
  async list(vehicleId: string, query: HistoryQuery, offset = 0) {
    const response = await api.get<{ history: VehicleHistory }>(`/vehicles/${vehicleId}/history`, {
      params: { ...query, limit: 30, offset },
    });
    return response.data.history;
  },
};
