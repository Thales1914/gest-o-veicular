import { AppError } from '../utils/AppError.js';

export class VehicleService {
  constructor(vehicleRepository) {
    this.vehicleRepository = vehicleRepository;
  }

  create(userId, input) {
    return this.vehicleRepository.create(userId, input);
  }

  list(userId) {
    return this.vehicleRepository.findAllByUserId(userId);
  }

  async detail(userId, vehicleId) {
    const vehicle = await this.vehicleRepository.findByIdAndUserId(vehicleId, userId);

    if (!vehicle) {
      throw new AppError('Veículo não encontrado.', 404);
    }

    return vehicle;
  }

  async update(userId, vehicleId, input) {
    const vehicle = await this.vehicleRepository.update(vehicleId, userId, input);
    if (!vehicle) throw new AppError('Veículo não encontrado.', 404);
    return vehicle;
  }

  async remove(userId, vehicleId) {
    if (!await this.vehicleRepository.remove(vehicleId, userId)) {
      throw new AppError('Veículo não encontrado.', 404);
    }
  }
}

