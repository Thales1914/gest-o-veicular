import { AppError } from '../utils/AppError.js';

export class VehicleService {
  constructor(vehicleRepository) {
    this.vehicleRepository = vehicleRepository;
  }

  async create(userId, input) {
    if (await this.vehicleRepository.findByPlateAndUserId(input.plate, userId)) {
      throw new AppError('Você já cadastrou um veículo com essa placa.', 409);
    }
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
    const duplicate = await this.vehicleRepository.findByPlateAndUserId(input.plate, userId);
    if (duplicate && String(duplicate.id) !== String(vehicleId)) {
      throw new AppError('Você já cadastrou um veículo com essa placa.', 409);
    }
    const vehicle = await this.vehicleRepository.update(vehicleId, userId, input);
    if (!vehicle) throw new AppError('Veículo não encontrado.', 404);
    return vehicle;
  }

  raiseMileage(vehicleId, mileage) {
    return this.vehicleRepository.raiseMileage(vehicleId, mileage);
  }

  async remove(userId, vehicleId) {
    if (!await this.vehicleRepository.remove(vehicleId, userId)) {
      throw new AppError('Veículo não encontrado.', 404);
    }
  }
}

