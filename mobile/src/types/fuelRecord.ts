export type FuelType = 'gasolina' | 'etanol' | 'diesel' | 'flex';

export type FuelRecord = {
  id: string;
  vehicle_id: string;
  date: string;
  mileage: number;
  liters: number;
  total_price: number;
  fuel_type: FuelType;
  full_tank: boolean;
  gas_station?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type CreateFuelRecordInput = {
  date: string;
  mileage: number;
  liters: number;
  total_price: number;
  fuel_type: FuelType;
  full_tank: boolean;
  gas_station?: string;
  notes?: string;
};
