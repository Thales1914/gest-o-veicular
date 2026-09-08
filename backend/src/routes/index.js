import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { VehicleController } from '../controllers/VehicleController.js';
import { createAuthenticate } from '../middlewares/authenticate.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { VehicleRepository } from '../repositories/VehicleRepository.js';
import { AuthService } from '../services/AuthService.js';
import { VehicleService } from '../services/VehicleService.js';
import { createAuthRoutes } from './authRoutes.js';
import { createVehicleRoutes } from './vehicleRoutes.js';

export function createRoutes({ db, jwtSecret, jwtExpiresIn }) {
  const router = Router();

  const userRepository = new UserRepository(db);
  const vehicleRepository = new VehicleRepository(db);
  const authService = new AuthService(userRepository, {
    secret: jwtSecret,
    expiresIn: jwtExpiresIn,
  });
  const vehicleService = new VehicleService(vehicleRepository);
  const authController = new AuthController(authService);
  const vehicleController = new VehicleController(vehicleService);
  const authenticate = createAuthenticate(jwtSecret);

  router.get('/health', (_request, response) => response.json({ status: 'ok' }));
  router.use('/auth', createAuthRoutes(authController));
  router.use('/vehicles', createVehicleRoutes(vehicleController, authenticate));

  return router;
}

