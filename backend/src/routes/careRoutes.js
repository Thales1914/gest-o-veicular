import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordIdSchema } from '../validators/recordSchemas.js';
import { z } from 'zod';

export function createCareRoutes(service, authenticate) {
  const router = Router({ mergeParams: true });
  router.use(authenticate);
  router.get('/', asyncHandler(async (request, response) => {
    z.object({}).strict().parse(request.query);
    const care = await service.summary(request.user.id, recordIdSchema.parse(request.params.vehicleId));
    response.json({ care });
  }));
  return router;
}
