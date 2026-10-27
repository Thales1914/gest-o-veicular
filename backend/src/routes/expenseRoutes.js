import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { periodSchema, recordIdSchema } from '../validators/recordSchemas.js';

export function createExpenseRoutes(service, authenticate) {
  const router = Router({ mergeParams: true });
  router.use(authenticate);
  router.get('/', asyncHandler(async (request, response) => {
    const vehicleId = recordIdSchema.parse(request.params.vehicleId);
    const period = periodSchema.parse(request.query);
    const expenses = await service.summarize(request.user.id, vehicleId, period);
    return response.json({ expenses });
  }));
  return router;
}
