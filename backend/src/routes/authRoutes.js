import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

export function createAuthRoutes(authController) {
  const router = Router();

  router.post('/register', asyncHandler(authController.register));
  router.post('/login', asyncHandler(authController.login));

  return router;
}

