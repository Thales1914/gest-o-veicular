export class HistoryService {
  constructor(vehicleService, fuelRepository, maintenanceRepository) {
    this.vehicleService = vehicleService;
    this.fuelRepository = fuelRepository;
    this.maintenanceRepository = maintenanceRepository;
  }

  async list(userId, vehicleId, query) {
    await this.vehicleService.detail(userId, vehicleId);
    const [fuel, maintenance] = await Promise.all([
      query.category === 'maintenance' ? [] : this.fuelRepository.list(vehicleId, query),
      query.category === 'fuel' ? [] : this.maintenanceRepository.list(vehicleId, query),
    ]);
    const entries = [
      ...fuel.map((record) => ({
        id: record.id, category: 'fuel', date: record.date, mileage: record.mileage,
        description: 'Abastecimento', amount: record.total_price,
      })),
      ...maintenance.map((record) => ({
        id: record.id, category: 'maintenance', date: record.date, mileage: record.mileage,
        description: record.description, amount: record.cost ?? null, maintenance_type: record.type,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date) || b.mileage - a.mileage
      || a.category.localeCompare(b.category)
      || (BigInt(a.id) === BigInt(b.id) ? 0 : BigInt(a.id) > BigInt(b.id) ? -1 : 1));
    return {
      vehicle_id: vehicleId,
      entries: entries.slice(query.offset, query.offset + query.limit),
      total: entries.length, limit: query.limit, offset: query.offset,
      has_more: query.offset + query.limit < entries.length,
    };
  }
}
