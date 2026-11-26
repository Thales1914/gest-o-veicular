import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

export function createAuthenticate(jwtSecret) {
  return (request, _response, next) => {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      return next(new AppError('Token de autenticação não informado.', 401));
    }

    const token = authorization.slice(7).trim();

    try {
      const payload = jwt.verify(token, jwtSecret);
      request.user = { id: payload.sub };
      return next();
    } catch {
      return next(new AppError('Token inválido ou expirado.', 401));
    }
  };
}

