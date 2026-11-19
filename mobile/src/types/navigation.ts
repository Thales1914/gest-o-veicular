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
  AddFuelRecord: { vehicleId: string; recordId?: string };
  FuelRecordDetail: { vehicleId: string; recordId: string };
  MaintenanceRecords: { vehicleId: string };
  AddMaintenanceRecord: { vehicleId: string; recordId?: string };
  MaintenanceRecordDetail: { vehicleId: string; recordId: string };
  Expenses: { vehicleId: string };
  Documents: { vehicleId: string };
  AddDocument: { vehicleId: string; documentId?: string };
  DocumentDetail: { vehicleId: string; documentId: string };
  Ipva: { vehicleId: string };
  AddIpva: { vehicleId: string; ipvaId?: string };
  Deadlines: { vehicleId: string };
  VehicleHistory: { vehicleId: string };
};
