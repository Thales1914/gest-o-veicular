import { createVehicleSchema, vehicleIdSchema } from '../validators/vehicleSchemas.js';

export class VehicleController {
  constructor(vehicleService) {
    this.vehicleService = vehicleService;
  }

  create = async (request, response) => {
    const input = createVehicleSchema.parse(request.body);
    const vehicle = await this.vehicleService.create(request.user.id, input);

    return response.status(201).json({ vehicle });
  };

  list = async (request, response) => {
    const vehicles = await this.vehicleService.list(request.user.id);

    return response.json({ vehicles });
  };

  detail = async (request, response) => {
    const vehicleId = vehicleIdSchema.parse(request.params.id);
    const vehicle = await this.vehicleService.detail(request.user.id, vehicleId);

    return response.json({ vehicle });
  };
}

