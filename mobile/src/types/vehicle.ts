export type Vehicle = {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  current_mileage: number;
  created_at: string;
  updated_at: string;
};

export type CreateVehicleInput = {
  brand: string;
  model: string;
  year: number;
  plate: string;
  current_mileage: number;
};
