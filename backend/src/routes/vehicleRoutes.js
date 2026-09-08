import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

export function createVehicleRoutes(vehicleController, authenticate) {
  const router = Router();

  router.use(authenticate);
  router.post('/', asyncHandler(vehicleController.create));
  router.get('/', asyncHandler(vehicleController.list));
  router.get('/:id', asyncHandler(vehicleController.detail));

  return router;
}

