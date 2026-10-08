import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { periodSchema, recordIdSchema } from '../validators/recordSchemas.js';

export function createVehicleRecordRoutes({ service, schema, key, authenticate }) {
  const router = Router({ mergeParams: true });
  const vehicleId = (request) => recordIdSchema.parse(request.params.vehicleId);
  const recordId = (request) => recordIdSchema.parse(request.params.id);

  router.use(authenticate);
  router.get('/', asyncHandler(async (request, response) => {
    const records = await service.list(request.user.id, vehicleId(request), periodSchema.parse(request.query));
    response.json({ [`${key}s`]: records });
  }));
  router.post('/', asyncHandler(async (request, response) => {
    const record = await service.create(request.user.id, vehicleId(request), schema.parse(request.body));
    response.status(201).json({ [key]: record });
  }));
  router.get('/:id', asyncHandler(async (request, response) => {
    const record = await service.detail(request.user.id, vehicleId(request), recordId(request));
    response.json({ [key]: record });
  }));
  router.put('/:id', asyncHandler(async (request, response) => {
    const record = await service.update(request.user.id, vehicleId(request), recordId(request), schema.parse(request.body));
    response.json({ [key]: record });
  }));
  router.delete('/:id', asyncHandler(async (request, response) => {
    await service.remove(request.user.id, vehicleId(request), recordId(request));
    response.status(204).end();
  }));
  return router;
}
