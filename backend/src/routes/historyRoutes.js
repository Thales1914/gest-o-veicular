import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { historyQuerySchema } from '../validators/historySchemas.js';
import { recordIdSchema } from '../validators/recordSchemas.js';

export function createHistoryRoutes(service, authenticate) {
  const router = Router({ mergeParams: true });
  router.use(authenticate);
  router.get('/', asyncHandler(async (request, response) => {
    const history = await service.list(request.user.id,
      recordIdSchema.parse(request.params.vehicleId), historyQuerySchema.parse(request.query));
    response.json({ history });
  }));
  return router;
}
