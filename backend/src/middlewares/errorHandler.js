import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(_request, _response, next) {
  next(new AppError('Rota não encontrada.', 404));
}

export function errorHandler(error, _request, response, _next) {
  if (error instanceof ZodError) {
    return response.status(422).json({
      message: 'Dados inválidos.',
      errors: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error?.code === '23505') {
    return response.status(409).json({ message: 'Registro já cadastrado.' });
  }

  if (error instanceof SyntaxError && error.status === 400) {
    return response.status(400).json({ message: 'JSON inválido.' });
  }

  console.error(error);
  return response.status(500).json({ message: 'Erro interno do servidor.' });
}

