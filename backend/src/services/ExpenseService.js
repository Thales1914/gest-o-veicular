export class ExpenseService {
  constructor(repository, vehicleService) {
    this.repository = repository;
    this.vehicleService = vehicleService;
  }

  async summarize(userId, vehicleId, period) {
    await this.vehicleService.detail(userId, vehicleId);
    const { fuel, maintenance } = await this.repository.summarize(vehicleId, period);
    return {
      vehicle_id: String(vehicleId),
      start_date: period.start_date ?? null,
      end_date: period.end_date ?? null,
      fuel_total: fuel.total,
      maintenance_total: maintenance.total,
      total: (Math.round(fuel.total * 100) + Math.round(maintenance.total * 100)) / 100,
      fuel_count: fuel.record_count,
      maintenance_count: maintenance.record_count,
      maintenance_without_cost: maintenance.unpriced_count,
    };
  }
}
