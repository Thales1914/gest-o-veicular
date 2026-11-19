import { AppError } from '../utils/AppError.js';

export class VehicleRecordService {
  constructor(repository, vehicleService) {
    this.repository = repository;
    this.vehicleService = vehicleService;
  }

  // Abastecimentos e manutenções trazem a quilometragem do momento;
  // se ela for maior que a do veículo, a do veículo é atualizada.
  async updateVehicleMileage(vehicleId, input) {
    if (typeof input.mileage === 'number') await this.vehicleService.raiseMileage(vehicleId, input.mileage);
  }

  async create(userId, vehicleId, input) {
    await this.vehicleService.detail(userId, vehicleId);
    const record = await this.repository.create(vehicleId, input);
    await this.updateVehicleMileage(vehicleId, input);
    return record;
  }

  async list(userId, vehicleId, period) {
    await this.vehicleService.detail(userId, vehicleId);
    return this.repository.list(vehicleId, period);
  }

  async detail(userId, vehicleId, id) {
    await this.vehicleService.detail(userId, vehicleId);
    const record = await this.repository.detail(vehicleId, id);
    if (!record) throw new AppError('Registro não encontrado.', 404);
    return record;
  }

  async update(userId, vehicleId, id, input) {
    await this.vehicleService.detail(userId, vehicleId);
    const record = await this.repository.update(vehicleId, id, input);
    if (!record) throw new AppError('Registro não encontrado.', 404);
    await this.updateVehicleMileage(vehicleId, input);
    return record;
  }

  async remove(userId, vehicleId, id) {
    await this.vehicleService.detail(userId, vehicleId);
    if (!await this.repository.remove(vehicleId, id)) {
      throw new AppError('Registro não encontrado.', 404);
    }
  }
}
