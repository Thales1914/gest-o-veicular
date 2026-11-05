const types = ['oleo', 'revisao', 'pneus', 'bateria'];

export class CareService {
  constructor(vehicleService, fuelRepository, maintenanceRepository) {
    this.vehicleService = vehicleService;
    this.fuelRepository = fuelRepository;
    this.maintenanceRepository = maintenanceRepository;
  }

  async summary(userId, vehicleId) {
    const vehicle = await this.vehicleService.detail(userId, vehicleId);
    const [fuel, maintenance] = await Promise.all([
      this.fuelRepository.list(vehicleId, {}), this.maintenanceRepository.list(vehicleId, {}),
    ]);
    let currentMileage = vehicle.current_mileage;
    for (const record of [...fuel, ...maintenance]) currentMileage = Math.max(currentMileage, record.mileage);
    const items = types.map((type) => {
      const latest = maintenance.find((record) => record.type === type);
      const next = latest?.next_service_mileage ?? null;
      const remaining = next == null ? null : next - currentMileage;
      return {
        type, record_id: latest?.id ?? null,
        next_service_mileage: next, remaining_km: remaining,
        status: remaining == null ? 'unscheduled' : remaining <= 0 ? 'overdue' : remaining <= 1000 ? 'soon' : 'upcoming',
      };
    });
    return { vehicle_id: vehicleId, current_mileage: currentMileage, warning_threshold_km: 1000, items };
  }
}
