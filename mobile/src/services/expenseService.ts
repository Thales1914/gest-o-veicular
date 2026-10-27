import type { ExpensePeriod, ExpenseSummary } from '../types/expense';
import { api } from './api';

export const expenseService = {
  async summary(vehicleId: string, period: ExpensePeriod) {
    const response = await api.get<{ expenses: ExpenseSummary }>(`/vehicles/${vehicleId}/expenses`, {
      params: period,
    });
    return response.data.expenses;
  },
};
