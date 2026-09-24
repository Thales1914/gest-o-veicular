export type AuthStackParamList = {
  Login: { successMessage?: string } | undefined;
  Register: undefined;
};

export type AppStackParamList = {
  VehicleList: undefined;
  AddVehicle: undefined;
  VehicleHome: { vehicleId: string };
  EditVehicle: { vehicleId: string };
  FuelRecords: { vehicleId: string };
  AddFuelRecord: { vehicleId: string };
  FuelRecordDetail: { vehicleId: string; recordId: string };
  MaintenanceRecords: { vehicleId: string };
  AddMaintenanceRecord: { vehicleId: string };
  MaintenanceRecordDetail: { vehicleId: string; recordId: string };
};
