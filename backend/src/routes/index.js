import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { AuthService } from '../services/AuthService.js';
import { createAuthRoutes } from './authRoutes.js';

export function createRoutes({ db, jwtSecret, jwtExpiresIn }) {
  const router = Router();
  const userRepository = new UserRepository(db);
  const authService = new AuthService(userRepository, {
    secret: jwtSecret,
    expiresIn: jwtExpiresIn,
  });
  const authController = new AuthController(authService);

  router.get('/health', (_request, response) => response.json({ status: 'ok' }));
  router.use('/auth', createAuthRoutes(authController));

  return router;
}
