export type FuelRecord = {
  id: string;
  vehicle_id: string;
  date: string;
  mileage: number;
  liters: number;
  total_price: number;
  created_at: string;
  updated_at: string;
};

export type CreateFuelRecordInput = {
  date: string;
  mileage: number;
  liters: number;
  total_price: number;
};
