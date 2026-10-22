import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { deadlineQuerySchema } from '../validators/deadlineSchemas.js';
import { recordIdSchema } from '../validators/recordSchemas.js';

export function createDeadlineRoutes(service, authenticate) {
  const router = Router({ mergeParams: true });
  router.use(authenticate);
  router.get('/', asyncHandler(async (request, response) => {
    const vehicleId = recordIdSchema.parse(request.params.vehicleId);
    const query = deadlineQuerySchema.parse(request.query);
    const deadlines = await service.summarize(request.user.id, vehicleId, query);
    return response.json({ deadlines });
  }));
  return router;
}
