export type ExpensePeriod = {
  start_date: string;
  end_date: string;
};

export type ExpenseSummary = {
  vehicle_id: string;
  start_date: string | null;
  end_date: string | null;
  fuel_total: number;
  maintenance_total: number;
  total: number;
  fuel_count: number;
  maintenance_count: number;
  maintenance_without_cost: number;
};
