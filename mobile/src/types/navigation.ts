export type AuthStackParamList = {
  Login: { successMessage?: string } | undefined;
  Register: undefined;
};

export type AppStackParamList = {
  VehicleList: undefined;
  AddVehicle: undefined;
  VehicleHome: { vehicleId: string };
};
