export type HistoryCategory = 'all' | 'fuel' | 'maintenance';
export type HistoryQuery = { category: HistoryCategory; start_date?: string; end_date?: string };
export type HistoryEntry = {
  id: string;
  category: 'fuel' | 'maintenance';
  date: string;
  mileage: number;
  description: string;
  amount: number | null;
};
export type VehicleHistory = {
  vehicle_id: string;
  entries: HistoryEntry[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
};
